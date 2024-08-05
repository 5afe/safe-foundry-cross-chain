// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./interfaces/ISafe.sol";
import "./interfaces/ISafeKeySpaceModule.sol";
import "./interfaces/IKeyStore.sol";
import "./interfaces/IVerifier.sol";
import {Enum} from "@safe-global/safe-contracts/contracts/common/Enum.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

/**
 * @title SafeKeySpaceModule
 * @dev XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 * @author Greg Jeanmart - @gjeanmart
 */
contract SafeKeySpaceModule is ISafeKeySpaceModule, Initializable {
    //// Constants

    //// States
    // Guard
    address public keystoreGuard;

    // Keyspace
    IKeyStore public keyStore;
    IVerifier public stateVerifier;

    // Safe -> Keyspace Key
    mapping(address => uint256) public keyspaceKeys;
    // Safe -> Module Nonce
    mapping(address => uint16) public nonces;

    //// Errors
    error InvalidKey(uint256);
    error NoKeySpaceFound(uint256);
    error InvalidSignatureCount();
    error InvalidSignature(bytes);
    error RegistrationFailed();
    error ExecutionFailed();

    function initialize(
        address _keyStore, 
        address _stateVerifier,
        address _keystoreGuard
    ) public initializer {
        keyStore = IKeyStore(_keyStore);
        stateVerifier = IVerifier(_stateVerifier);
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
     * @dev Registers a KeySpace key for a given safe and set a guard to disable the local keystore
     * @param key Key in the Keystore
     */

    function registerKeystore(uint256 key) public {
        if (key == 0) revert InvalidKey(key);

        // Register the keystore
        keyspaceKeys[ msg.sender] = key;

        // Disable method `safe.execTransaction`
        if (
            !ISafe( msg.sender).execTransactionFromModule({
                to:  msg.sender,
                value: 0,
                data: abi.encodeWithSignature(
                    "setGuard(address)",
                    keystoreGuard
                ),
                operation: Enum.Operation.Call
            })
        ) revert RegistrationFailed();
    }

    /**
     * xxx
     * @param safe xxx
     * @param to xxx
     * @param value xxx
     * @param data xxx
     * @param operation xxx
     * @param signatures xxx
     * @param publicKeyX xxx
     * @param publicKeyY xxx
     * @param stateProof xxx
     */
    function executeTransaction(
        address safe,
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        bytes memory signatures,
        uint256 publicKeyX,
        uint256 publicKeyY,
        bytes memory stateProof
    ) public {
        uint256 keyspaceKey = keyspaceKeys[safe];
        if (keyspaceKey == 0) revert NoKeySpaceFound(keyspaceKey);

        // Read keystore state
        uint256 threshold = 1; // /!\  Hardcoded to one because KeySpace doesn't support multisig setup
        address[1] memory owners = getOwners(publicKeyX, publicKeyY);

        // Calculate the message hash
        bytes32 txHash = getTxHash(safe, to, value, data, operation);

        // Check signatures
        checkSignatures(txHash, signatures, threshold, owners);

        // Check Keystore inclusion
        checkKeystoreInclusion(keyspaceKey, publicKeyX, publicKeyY, stateProof);

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

    function getOwners(
        uint256 publicKeyX,
        uint256 publicKeyY
    ) internal pure returns (address[1] memory) {
        bytes memory publicKeyBytes = abi.encode(publicKeyX, publicKeyY);
        address owner = address(bytes20(keccak256(publicKeyBytes) << 96));

        return [owner]; // /!\ Only one owner because Keyspace doesn't support multisig setup
    }

    /**
     * xxxxxxx
     * @param keyspaceKey xxxxxxx
     * @param publicKeyX xxxxxxx
     * @param publicKeyY xxxxxxx
     * @param stateProof xxxxxxx
     */
    function checkKeystoreInclusion(
        uint256 keyspaceKey,
        uint256 publicKeyX,
        uint256 publicKeyY,
        bytes memory stateProof
    ) internal view returns (bool) { //TODO change public -> internal
        uint256[] memory data = new uint256[](8);
        data[0] = publicKeyX;
        data[1] = publicKeyY;

        uint256[] memory public_inputs = new uint256[](3);
        public_inputs[0] = keyspaceKey;
        public_inputs[1] = keyStore.root();
        public_inputs[2] = uint256(keccak256(abi.encodePacked(data)) >> 8);

        require(
            stateVerifier.Verify(stateProof, public_inputs),
            "keystore state proof failed"
        );

        return true;
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
        address[1] memory owners
    ) internal pure {
        // Check that the provided signature data is not too short
        if (signatures.length < requiredSignatures * 65)
            revert InvalidSignatureCount();

        for (uint256 i = 0; i < requiredSignatures; i++) {
            (uint8 v, bytes32 r, bytes32 s) = signatureSplit(signatures, i);
            address currentOwner = ECDSA.recover(
                MessageHashUtils.toEthSignedMessageHash(dataHash),
                v,
                r,
                s
            );

            bool found = false;
            for (uint256 j = 0; j < owners.length; j++)
                if (currentOwner == owners[j]) found = true;

            if (!found) revert InvalidSignature(signatures);
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
