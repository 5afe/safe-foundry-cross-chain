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
    function getTransactionHash(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address refundReceiver,
        uint256 _nonce
    ) external view returns (bytes32);

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

    function nonce() external view returns (uint256);

    function getOwners() external view returns (address[] memory);

    function enableModule(address module) external;

    function getThreshold() external view returns (uint256);

    function getChainId() external view returns (uint256);

    function isOwner(address owner) external view returns (bool);

    function isModuleEnabled(address module) external view returns (bool);

    function addOwnerWithThreshold(address owner, uint256 _threshold) external;
}

/**
 * @title SafeKeystoreModule - An extension to the Safe contract that derive its security policy from a Safe on another network
 * @dev TBD
 *
 * @author Greg Jeanmart - @gjeanmart
 */
contract SafeKeystoreModule {
    //// Constants
    address internal constant SENTINEL_OWNERS = address(0x1);

    //// States
    // Safe -> Safe L1 address
    mapping(address => address) public keystores;
    // Safe -> Module Nonce
    mapping(address => uint16) public nonces;

    //// Errors
    error InvalidKeystoreAddress();
    error NoKeyStoreFound();
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
        ISafe safe,
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        bytes memory signatures
    ) public {
        address keystore = keystores[address(safe)];
        if (keystore == address(0)) {
            revert NoKeyStoreFound();
        }

        // Read keystore state on L1
        // @TODO: Use l1sload to load owners (https://scrollzkp.notion.site/L1SLOAD-spec-a12ae185503946da9e660869345ef7dc)
        // @TODO: Use for testing https://github.com/safe-global/safe-smart-account/blob/main/contracts/common/StorageAccessible.sol#L17
        ISafe safeL1 = ISafe(keystore);
        address[] memory ownersL1 = safeL1.getOwners();
        console.log("ownersL1[0]=%s", ownersL1[0]);
        uint256 thresholdL1 = safeL1.getThreshold();
        console.log("thresholdL1=%s", thresholdL1);

        bytes32 msgHash;
        {
            // Calculate the message hash
            msgHash = keccak256(
                abi.encodePacked(to, value, data, operation, nonces[msg.sender])
            );
            checkSignatures(msgHash, signatures, thresholdL1, ownersL1);
        }

        // Execute the transaction
        if (
            !safe.execTransactionFromModule({
                to: to,
                value: value,
                data: "",
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
    ) public view {
        // Check that the provided signature data is not too short
        if (signatures.length < requiredSignatures * 65) revert("GS020");
        // There cannot be an owner with address 0.
        address lastOwner = address(0);
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
            // if (v == 0) {
            //     // If v is 0 then it is a contract signature
            //     // When handling contract signatures the address of the contract is encoded into r
            //     currentOwner = address(uint160(uint256(r)));
            //     // Check that signature data pointer (s) is not pointing inside the static part of the signatures bytes
            //     // This check is not completely accurate, since it is possible that more signatures than the threshold are send.
            //     // Here we only check that the pointer is not pointing inside the part that is being processed
            //     if (uint256(s) < requiredSignatures.mul(65)) revert("GS021");
            //     // The contract signature check is extracted to a separate function for better compatibility with formal verification
            //     // A quote from the Certora team:
            //     // "The assembly code broke the pointer analysis, which switched the prover in failsafe mode, where it is (a) much slower and (b) computes different hashes than in the normal mode."
            //     // More info here: https://github.com/safe-global/safe-smart-account/pull/661
            //     checkContractSignature(currentOwner, dataHash, signatures, uint256(s));
            // } else if (v == 1) {
            //     // If v is 1 then it is an approved hash
            //     // When handling approved hashes the address of the approver is encoded into r
            //     currentOwner = address(uint160(uint256(r)));
            //     // Hashes are automatically approved by the sender of the message or when they have been pre-approved via a separate transaction
            //     if (executor != currentOwner && approvedHashes[currentOwner][dataHash] == 0) revert("GS025");
            // } else if (v > 30) {
            //     // If v > 30 then default va (27,28) has been adjusted for eth_sign flow
            //     // To support eth_sign and similar we adjust v and hash the messageHash with the Ethereum message prefix before applying ecrecover
            //     currentOwner = ecrecover(
            //         keccak256(
            //             abi.encodePacked(
            //                 "\x19Ethereum Signed Message:\n32",
            //                 dataHash
            //             )
            //         ),
            //         uint8(v - 4),
            //         r,
            //         s
            //     );
            // } else {
            //     // Default is the ecrecover flow with the provided data hash
            //     // Use ecrecover with the messageHash for EOA signatures
            //     currentOwner = ecrecover(dataHash, uint8(v), r, s);
            // }
            console.log("currentOwner=%s", currentOwner);

            if (currentOwner != owners[0]) {
                revert("GS026");
            }
            // if (
            //     currentOwner <= lastOwner ||
            //     owners[currentOwner] == address(0) ||
            //     currentOwner == SENTINEL_OWNERS
            // ) revert("GS026");
            // lastOwner = currentOwner;
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
