// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./interfaces/ISafe.sol";
import "./interfaces/IL1Blocks.sol";
import {Enum} from "@safe-global/safe-contracts/contracts/common/Enum.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

/**
 * @title SafeRemoteKeystoreModule
 * @dev An extension to the Safe contract that derives its security policy from a Safe on another network (L1)
 * @author Greg Jeanmart - @gjeanmart
 */
contract SafeRemoteKeystoreModule is Initializable {
    //// Constants
    uint256 internal constant SAFE_OWNERS_SLOT_IDX = 2;
    uint256 internal constant SAFE_THRESHOLD_SLOT_IDX = 4;
    uint256 internal constant SAFE_APPROVE_HASH_SLOT_IDX = 8;
    address internal constant SENTINEL_OWNERS = address(0x1);

    //// States
    // Guard
    address public keystoreGuard;

    // l1sload
    address public l1Blocks;
    address public l1Sload;

    // Safe -> Safe L1 address
    mapping(address => address) public keystores;
    // Safe -> Module Nonce
    mapping(address => uint16) public nonces;

    //// Errors
    error InvalidKeystoreAddress(address);
    error NoKeystoreFound(address);
    error InvalidSignatureCount();
    error InvalidSignature();
    error L1SloadError();
    error RegistrationFailed();
    error ExecutionFailed();

    function initialize(
        address _l1Blocks,
        address _l1Sload,
        address _keystoreGuard
    ) public initializer {
        l1Blocks = _l1Blocks;
        l1Sload = _l1Sload;
        keystoreGuard = _keystoreGuard;
    }

    /**
     * @dev Returns the unique tx hash (msg) to sign for a given tuple (to, value, data, operation) and nonce
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
     * @dev Registers a keystore for a given safe and set a guard to disable the local keystore
     * @param keystore Address of the keystore Safe(L1)
     */
    function registerKeystore(address keystore) public {
        if (keystore == address(0)) revert InvalidKeystoreAddress(keystore);
        //TODO::Check if keystore is a Safe (ERC165)

        // Register the keystore
        keystores[msg.sender] = keystore;

        // Disable local keystore if a guard is provided
        if (
            !ISafe(msg.sender).execTransactionFromModule({
                to: msg.sender,
                value: 0,
                data: abi.encodeWithSignature(
                    "setGuard(address)",
                    keystoreGuard
                ),
                operation: Enum.Operation.Call
            })
        ) revert RegistrationFailed();
    }

    function executeTransaction(
        address safe,
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        bytes memory signatures
    ) public {
        address keystore = keystores[safe];
        if (keystore == address(0)) revert NoKeystoreFound(keystore);

        // Calculate the message hash
        bytes32 txHash = getTxHash(safe, to, value, data, operation);

        // Check signatures
        checkSignatures(txHash, signatures, keystore);

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
     * @param keystore Address of a Safe Keystore
     */
    function getKeystoreThreshold(
        address keystore
    ) internal view returns (uint256) {
        return l1sload(keystore, SAFE_THRESHOLD_SLOT_IDX);
    }

    /**
     * @dev returns approvedHash of tx on layer1
     * @param keystore Address of a Safe Keystore
     */
    function getKeystoreApproveHash(
        address keystore,
        address approver,
        bytes32 dataHash
    ) internal view returns (uint256) {
        bytes32 key = keccak256(
            abi.encode(
                dataHash,
                abi.encode(approver, SAFE_APPROVE_HASH_SLOT_IDX)
            )
        );
        return l1sload(keystore, uint256(key));
    }

    /**
     * @dev Recursive funcion to get the Safe owners list from storage layout
     * @param keystore Address of a Safe Keystore
     * @param key Mapping key of OwnerManager.owners
     * @param owners Owners's array used as accumulator
     */
    function getKeystoreOwners(
        address keystore,
        address key,
        address[] memory owners
    ) internal view returns (address[] memory) {
        bytes32 mappingSlot = keccak256(abi.encode(key, SAFE_OWNERS_SLOT_IDX));
        uint256 sto = l1sload(keystore, uint256(mappingSlot));
        address owner = address(uint160(sto));

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

        // Recursive call
        return getKeystoreOwners(keystore, owner, newOwners);
    }

    /**
     * @dev Load L1 state
     * @param contractAddr Contract address on L1
     * @param storageKey Storage key to load
     *
     * Use l1sload to load threshold from a safe on L1
     * -> https://scrollzkp.notion.site/L1SLOAD-spec-a12ae185503946da9e660869345ef7dc
     */
    function l1sload(
        address contractAddr,
        uint256 storageKey
    ) public view returns (uint256) {
        (bool success, bytes memory result) = l1Sload.staticcall(
            abi.encodePacked(contractAddr, storageKey)
        );
        if (!success) revert L1SloadError();

        return abi.decode(result, (uint256));
    }

    /**
     * @dev Check signatures against msg hash and owners/threshold of the keystore
     * @param dataHash Hash of the data
     * @param signatures Signature data that should be verified (ECDSA signature)
     * @param keystore Address of the keystore
     */
    function checkSignatures(
        bytes32 dataHash,
        bytes memory signatures,
        address keystore
    ) internal view {
        // Read keystore state
        uint256 requiredSignatures = getKeystoreThreshold(keystore);
        address[] memory owners;
        owners = getKeystoreOwners(keystore, SENTINEL_OWNERS, owners);

        // Check that the provided signature data is not too short
        if (signatures.length < requiredSignatures * 65)
            revert InvalidSignatureCount();

        for (uint256 i = 0; i < requiredSignatures; i++) {
            (uint8 v, bytes32 r, bytes32 s) = signatureSplit(signatures, i);
            address currentOwner;
            if (v == 0) {
                // If v is 0 then it is a contract signature
                // When handling contract signatures the address of the contract is encoded into r
                currentOwner = address(uint160(uint256(r)));

                // Check that signature data pointer (s) is not pointing inside the static part of the signatures bytes
                // This check is not completely accurate, since it is possible that more signatures than the threshold are send.
                // Here we only check that the pointer is not pointing inside the part that is being processed
                require(uint256(s) >= requiredSignatures * 65, "GS021");

                // Check that signature data pointer (s) is in bounds (points to the length of data -> 32 bytes)
                require(uint256(s) + 32 <= signatures.length, "GS022");

                // Check if the contract signature is in bounds: start of data is s + 32 and end is start + signature length
                uint256 contractSignatureLen;
                // solhint-disable-next-line no-inline-assembly
                assembly {
                    contractSignatureLen := mload(add(add(signatures, s), 0x20))
                }
                require(
                    uint256(s) + 32 + contractSignatureLen <= signatures.length,
                    "GS023"
                );

                // Check signature
                bytes memory contractSignature;
                // solhint-disable-next-line no-inline-assembly
                assembly {
                    // The signature data for contract signatures is appended to the concatenated signatures and the offset is stored in s
                    contractSignature := add(add(signatures, s), 0x20)
                }

                checkSignatures(dataHash, contractSignature, currentOwner);
            } else if (v == 1) {
                // TODO: this branch can be removed, because no one will approve L2's tx on L1
                // If v is 1 then it is an approved hash
                // When handling approved hashes the address of the approver is encoded into r
                currentOwner = address(uint160(uint256(r)));
                // Hashes are automatically approved by the sender of the message or when they have been pre-approved via a separate transaction
                require(
                    msg.sender == currentOwner ||
                        getKeystoreApproveHash(
                            keystore,
                            currentOwner,
                            dataHash
                        ) !=
                        0,
                    "GS025"
                );
            } else if (v > 30) {
                currentOwner = ECDSA.recover(
                    MessageHashUtils.toEthSignedMessageHash(dataHash),
                    v - 4,
                    r,
                    s
                );

                bool found = false;
                for (uint256 j = 0; j < owners.length; j++)
                    if (currentOwner == owners[j]) found = true;

                if (!found) revert InvalidSignature();
            } else {
                currentOwner = ecrecover(dataHash, v, r, s);
                bool found = false;
                for (uint256 j = 0; j < owners.length; j++)
                    if (currentOwner == owners[j]) found = true;

                if (!found) revert InvalidSignature();
            }
        }
    }

    /**
     * @dev Divides bytes signature into `uint8 v, bytes32 r, bytes32 s`.
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
