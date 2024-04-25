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
 * @dev TBC
 * 
 * @author Greg Jeanmart - @gjeanmart
 */
contract SafeKeystoreModule {

    // Safe -> ModuleNonce
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
        // Use l1sload

        // Calculate the message hash 
        // @note: We shouldn't use txhash because it could be use to replay 
        bytes32 msgHash;
        {
            // msgHash = keccak256(encodeTransactionData(to, value, data, operation, module_nonce)
            msgHash = keccak256(abi.encodePacked(to, value, data, operation, nonces[msg.sender]));
            // Validate the message against the signature and the owners of keystoreSafe
            safe.checkSignatures(msgHash, signatures);
        }


        // Execute the transaction
        if (!safe.execTransactionFromModule({to: address(safe), value: 0, data: data, operation: Enum.Operation.Call})) {
            revert ExecutionFailed();
        }

        // Increment nonce on successful execution
        nonces[msg.sender]++;
    }

}