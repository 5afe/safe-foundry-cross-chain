// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC165 } from "@safe-global/safe-contracts/contracts/interfaces/IERC165.sol";
import { Enum } from "@safe-global/safe-contracts/contracts/common/Enum.sol";

interface ISafe is IERC165 {
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

    function setGuard(address guard) external;

    function getGuard() external view returns (address guard);
}