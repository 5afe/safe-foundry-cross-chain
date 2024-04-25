// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

library Enum {
    enum Operation {
        Call,
        DelegateCall
    }
}

interface ISafe {
    function getTransactionHash(address to, uint256 value, bytes calldata data, Enum.Operation operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) external view returns (bytes32);
    function execTransaction(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver,  bytes memory signatures ) external payable returns (bool success);
    function execTransactionFromModule(address to, uint256 value, bytes calldata data, Enum.Operation operation) external returns (bool success);
    function checkSignatures(bytes32 dataHash, bytes memory signatures) external view;
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

    // Safe -> Module Nonce
    mapping(address => uint16) public nonces;

    error ExecutionFailed();

    function executeTransaction(
        address to, 
        uint256 value, 
        bytes memory data, 
        Enum.Operation operation,
        address keystoreSafe,
        bytes memory signatures
    ) public {
        ISafe safe = ISafe(msg.sender);

        // Read keystore state on L1
        // @TODO: Use l1sload to load owners
        ISafe safeL1 = ISafe(keystoreSafe);
        address[] memory ownersL1 = safeL1.getOwners();

        bytes32 msgHash;
        {
            // Calculate the message hash 
            msgHash = keccak256(abi.encodePacked(to, value, data, operation, nonces[msg.sender]));
            // @TODO: Validate the message against the signature and the owners of keystoreSafe `ownersL1`
            // @TODO: Use custom checkSignatures method
            safe.checkSignatures(msgHash, signatures);
        }


        // Execute the transaction
        if (!safe.execTransactionFromModule({to: address(safe), value: 0, data: data, operation: Enum.Operation.Call})) {
            revert ExecutionFailed();
        }

        // Increment nonce after successful execution
        nonces[msg.sender]++;
    }

}