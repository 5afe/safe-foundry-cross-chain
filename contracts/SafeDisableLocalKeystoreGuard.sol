// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./ISafe.sol";
import "hardhat/console.sol";

/**
 * @title SafeDisableLocalKeystoreGuard
 * @dev A guard that disables the method safe.execTransaction(...) if the safeRemoteKeystoreModule is enabled
 * @author Greg Jeanmart - @gjeanmart
 */
contract SafeDisableLocalKeystoreGuard is BaseGuard {
    address public immutable safeRemoteKeystoreModule;

    constructor(address _safeRemoteKeystoreModule) {
        safeRemoteKeystoreModule = _safeRemoteKeystoreModule;
    }

    function checkTransaction(
        address,
        uint256,
        bytes memory,
        Enum.Operation,
        uint256,
        uint256,
        uint256,
        address,
        address payable,
        bytes memory,
        address
    ) external view override {
        require(
            !ISafe(msg.sender).isModuleEnabled(safeRemoteKeystoreModule),
            "This call is restricted, use safeRemoteKeystoreModule.execTransaction instead."
        );
    }

    function checkAfterExecution(bytes32, bool) external view override {}
}
