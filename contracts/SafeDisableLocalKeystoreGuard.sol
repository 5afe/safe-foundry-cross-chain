// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import "./interfaces/ISafe.sol";
import "./SafeRemoteKeystoreModule.sol";
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
        ISafe safe = ISafe(msg.sender);
        SafeRemoteKeystoreModule module = SafeRemoteKeystoreModule(safeRemoteKeystoreModule);
        require(
            !safe.isModuleEnabled(safeRemoteKeystoreModule) || module.getKeystore(msg.sender) == address(0),
            "This call is restricted, use safeRemoteKeystoreModule.execTransaction instead."
        );
    }

    function checkAfterExecution(bytes32, bool) external view override {}
}
