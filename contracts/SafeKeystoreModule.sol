// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./ISafe.sol";
import "hardhat/console.sol";

/**
 * @title SafeKeystoreModule
 * @dev An extension to the Safe contract that derives its security policy from a Safe on another network (L1)
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
     * @dev returns the associated keystore for a safe
     * @param safe Address of the Safe
     */
    function getKeystore(address safe) public view returns (address) {
        return keystores[safe];
    }

    /**
     * @dev returns the module nonce associated to a safe
     * @param safe Address of the Safe
     */
    function getNonce(address safe) public view returns (uint16) {
        return nonces[safe];
    }

    /**
     * @dev returns the unique tx hash (msg) to sign for a given tuple (to, value, data, operation) and nonce
     * @dev msg = keccak256(to, value, data, operation, nonce)
     * @param safe Address of the Safe
     * @param to Recipient address for the transaction
     * @param value Value (ETH) to send
     * @param data Data (bytes) to execute
     * @param operation Operation (CALL/DELEGATE_CALL)
     */
    function getTxHash(
        address safe,
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(to, value, data, operation, nonces[safe])
            );
    }

    /**
     * @dev Registers a keystore for a given safe
     * @param keystoreAddress Address of the keystore Safe(L1)
     */
    function registerKeystore(address keystoreAddress) public {
        if (keystoreAddress == address(0)) revert InvalidKeystoreAddress();
        //TODO Check if keystore is a Safe
        keystores[msg.sender] = keystoreAddress;
    }

    /**
     * @dev Execute a transaction through the SafeKeystoreModule verifying signatures against owners/threshold of the keystore
     * @param safe Address of the Safe to execute the transaction
     * @param to Recipient address for the transaction
     * @param value Value (ETH) to send
     * @param data Data (bytes) to execute
     * @param operation Operation (CALL/DELEGATE_CALL)
     * @param signatures Signatures from Keystore owners
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
        if (keystore == address(0)) revert NoKeyStoreFound();

        // Read keystore state
        ISafe safeL1 = ISafe(keystore);
        address[] memory ownersL1;
        ownersL1 = getOwners_sload(safeL1, SENTINEL_OWNERS, ownersL1);
        uint256 thresholdL1 = getThreshold_sload(safeL1);

        // Calculate the message hash
        bytes32 txHash = getTxHash(safe, to, value, data, operation);

        // Check signatures
        checkSignatures(txHash, signatures, thresholdL1, ownersL1);

        // Execute the transaction
        if (
            !ISafe(safe).execTransactionFromModule({
                to: to,
                value: value,
                data: data,
                operation: operation
            })
        ) revert ExecutionFailed();

        // Increment nonce after successful execution
        nonces[safe]++;
    }

    /**
     * @dev returns a Safe threshold from storage layout
     * @param safe Address of a Safe
     *
     * TODO: Use l1sload to load threshold (https://scrollzkp.notion.site/L1SLOAD-spec-a12ae185503946da9e660869345ef7dc)
     */
    function getThreshold_sload(ISafe safe) internal view returns (uint256) {
        bytes memory _storage = safe.getStorageAt(SAFE_THRESHOLD_SLOT_IDX, 1);
        return uint256(bytes32(_storage));
    }

    /**
     * @dev Recursive funcion to get the Safe owners list from storage layout
     * @param safe Address of a Safe
     * @param key Mapping key of OwnerManager.owners
     * @param owners Owners's array used as accumulator
     *
     * TODO: Use l1sload to load owners (https://scrollzkp.notion.site/L1SLOAD-spec-a12ae185503946da9e660869345ef7dc)
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

        // Copy to new array
        address[] memory newOwners = new address[](owners.length + 1);
        for (uint256 i = 0; i < owners.length; i++) {
            newOwners[i] = owners[i];
        }

        // Add new owner found
        newOwners[owners.length] = owner;

        return getOwners_sload(safe, owner, newOwners);
    }

    /**
     * @dev Check signatures against msg hash and owners/threshold of the keystore
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
                uint8(v),
                r,
                s
            );

            bool found = false;
            for (uint256 j = 0; j < owners.length; j++) {
                if (currentOwner == owners[j]) found = true;
            }

            if (!found) revert InvalidSignature();
        }
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
