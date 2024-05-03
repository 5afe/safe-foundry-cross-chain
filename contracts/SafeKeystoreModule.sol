// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "hardhat/console.sol";

library Enum {
    enum Operation {
        Call,
        DelegateCall
    }
}

interface ISafe {
    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures
    ) external payable returns (bool success);

    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success);

    function getStorageAt(
        uint256 offset,
        uint256 length
    ) external view returns (bytes memory);

    function isModuleEnabled(address module) external view returns (bool);

    function enableModule(address module) external;

    function getOwners() external view returns (address[] memory);

    function getThreshold() external view returns (uint256);

    function nonce() external view returns (uint256);

    function getChainId() external view returns (uint256);
}

/**
 * @title SafeKeystoreModule - An extension to the Safe contract that derive its security policy from a Safe on another network
 * @author Greg Jeanmart - @gjeanmart
 */
contract SafeKeystoreModule {
    //// Constants
    uint256 internal constant SAFE_OWNERS_SLOT_IDX = 2;
    uint256 internal constant SAFE_THRESHOLD_SLOT_IDX = 4;
    address internal constant SENTINEL_OWNERS = address(0x1);

    //// States
    // Safe -> Safe L1 address
    mapping(address => address) public keystores;
    // Safe -> Module Nonce
    mapping(address => uint16) public nonces;

    //// Errors
    error InvalidKeystoreAddress();
    error NoKeyStoreFound();
    error InvalidSignatureCount();
    error InvalidSignature();
    error ExecutionFailed();

    /**
     * @dev return the associated keystore Safe(L1) for a given Safe(L2)
     * @param safe Address of the Safe
     */
    function getKeystore(address safe) public view returns (address) {
        return keystores[safe];
    }

    /**
     * @dev return the module nonce associated to a safe
     * @param safe Address of the Safe
     */
    function getNonce(address safe) public view returns (uint16) {
        return nonces[safe];
    }

    /**
     * @dev returns the transaction hash to sign for a given tuple (to, value, data, operation) and nonce
     * @param safe Address of the Safe
     * @param to To
     * @param value Value
     * @param data Data
     * @param operation Operation
     */
    function getTxHash(
        address safe,
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) public view returns (bytes32) {
        uint16 nonce = nonces[safe];
        bytes32 msgHash = keccak256(
            abi.encodePacked(to, value, data, operation, nonce)
        );
        return msgHash;
    }

    /**
     * @dev Register a keystore Safe(L1) for a given Safe(L2)
     * @param keystoreAddress Address of the keystore Safe(L1)
     */
    function registerKeystore(address keystoreAddress) public {
        if (keystoreAddress == address(0)) {
            revert InvalidKeystoreAddress();
        }
        keystores[msg.sender] = keystoreAddress;
    }

    /**
     * @dev Execute a transaction through the SafeKeystoreModule verifying signatures against owners/threshold from another Safe
     * @param safe Safe to execute the transaction
     * @param to Recipient of the transaction
     * @param value Value
     * @param data Data
     * @param operation Operation
     * @param signatures Signatures
     */
    function executeTransaction(
        address safe,
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        bytes memory signatures
    ) public {
        address keystore = keystores[safe];
        if (keystore == address(0)) {
            revert NoKeyStoreFound();
        }

        // Read keystore state on L1
        // @TODO: Use l1sload to load owners (https://scrollzkp.notion.site/L1SLOAD-spec-a12ae185503946da9e660869345ef7dc)
        ISafe safeL1 = ISafe(keystore);
        address[] memory ownersL1;
        ownersL1 = getOwners_sload(safeL1, SENTINEL_OWNERS, ownersL1);
        uint256 thresholdL1 = getThreshold_sload(safeL1);

        // Calculate the message hash
        bytes32 msgHash = getTxHash(safe, to, value, data, operation);

        // Check signatures
        checkSignatures(msgHash, signatures, thresholdL1, ownersL1);

        // Execute the transaction
        if (
            !ISafe(safe).execTransactionFromModule({
                to: to,
                value: value,
                data: data,
                operation: Enum.Operation.Call
            })
        ) {
            revert ExecutionFailed();
        }

        // Increment nonce after successful execution
        nonces[address(safe)]++;
    }

    /**
     * @dev Check signatures
     * TODO: Review this to handle multiple owners (simplified version)
     * @param dataHash Hash of the data
     * @param signatures Signature data that should be verified (ECDSA signature)
     * @param requiredSignatures Threshold
     * @param owners List of owners
     */
    function checkSignatures(
        bytes32 dataHash,
        bytes memory signatures,
        uint256 requiredSignatures,
        address[] memory owners
    ) internal pure {
        // Check that the provided signature data is not too short
        if (signatures.length < requiredSignatures * 65)
            revert InvalidSignatureCount();

        address currentOwner;
        uint256 v; // Implicit conversion from uint8 to uint256 will be done for v received from signatureSplit(...).
        bytes32 r;
        bytes32 s;
        uint256 i;
        for (i = 0; i < requiredSignatures; i++) {
            (v, r, s) = signatureSplit(signatures, i);
            currentOwner = ecrecover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        dataHash
                    )
                ),
                uint8(v), //uint8(v - 4),
                r,
                s
            );

            bool found = false;
            for (uint256 j = 0; j < owners.length; j++) {
                if (currentOwner == owners[j]) {
                    found = true;
                }
            }

            if (!found) {
                revert InvalidSignature();
            }
        }
    }

    /**
     * @dev returns a Safe threshold from storage layout
     * @param safe Safe contract
     */
    function getThreshold_sload(ISafe safe) internal view returns (uint256) {
        bytes memory st = safe.getStorageAt(SAFE_THRESHOLD_SLOT_IDX, 1);
        return uint256(bytes32(st));
    }

    /**
     * @dev Recursive funcion to get the Safe owners list from storage layout
     * @param safe  Safe contract
     * @param key Mapping key of OwnerManager.owners
     * @param owners Owners's array used a accumulator
     */
    function getOwners_sload(
        ISafe safe,
        address key,
        address[] memory owners
    ) internal view returns (address[] memory) {
        bytes32 mappingSlot = keccak256(abi.encode(key, SAFE_OWNERS_SLOT_IDX));
        bytes memory _storage = safe.getStorageAt(uint256(mappingSlot), 1); // 1 => 32 bytes
        address owner = abi.decode(_storage, (address));

        // End of the linked list
        if (owner == SENTINEL_OWNERS) {
            return owners;
        }

        address[] memory newOwners = new address[](owners.length + 1);
        for (uint256 i = 0; i < owners.length; i++) {
            newOwners[i] = owners[i];
        }
        newOwners[owners.length] = owner;

        return getOwners_sload(safe, owner, newOwners);
    }

    /**
     * @dev divides bytes signature into `uint8 v, bytes32 r, bytes32 s`.
     * @param signatures concatenated rsv signatures
     * @param pos which signature to read. A prior bounds check of this parameter should be performed, to avoid out of bounds access
     */
    function signatureSplit(
        bytes memory signatures,
        uint256 pos
    ) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            let signaturePos := mul(0x41, pos)
            r := mload(add(signatures, add(signaturePos, 0x20)))
            s := mload(add(signatures, add(signaturePos, 0x40)))
            v := byte(0, mload(add(signatures, add(signaturePos, 0x60))))
        }
        /* solhint-enable no-inline-assembly */
    }
}
