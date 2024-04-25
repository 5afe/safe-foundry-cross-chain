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

        // Validate signatures against L1 keystore
        bytes32 txHash;
        {
            txHash = safe.getTransactionHash( // Transaction info
                to,
                value,
                data,
                operation,
                0, //safeTxGas,
                // Payment info
                0, //baseGas,
                0, //gasPrice,
                address(0), //gasToken,
                address(0), //refundReceiver,
                // Signature info
                // We use the post-increment here, so the current nonce value is used and incremented afterwards.
                safe.nonce() + 1
            );
            safe.checkSignatures(txHash, signatures);
        }


        // Execute the transaction
        if (!safe.execTransactionFromModule({to: address(safe), value: 0, data: data, operation: Enum.Operation.Call})) {
            revert ExecutionFailed();
        }
    }

}