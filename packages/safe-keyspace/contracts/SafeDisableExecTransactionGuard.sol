// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

import { Guard } from "@safe-global/safe-contracts/contracts/base/GuardManager.sol";
import "./SafeKeySpaceModule.sol";
import "hardhat/console.sol";

/**
 * @title SafeDisableExecTransactionGuard
 * @dev A guard that disables the method safe.execTransaction(...) if the SafeKeySpaceModule is enabled
 * @author Greg Jeanmart - @gjeanmart
 */
contract SafeDisableExecTransactionGuard is Guard {
    address public immutable safeKeySpaceModule;

    constructor(address _safeKeySpaceModule) {
        safeKeySpaceModule = _safeKeySpaceModule;
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
        SafeKeySpaceModule module = SafeKeySpaceModule(
            safeKeySpaceModule
        );
        require(
            !safe.isModuleEnabled(safeKeySpaceModule) ||
                module.keyspaceKeys(msg.sender) == 0,
            "This call is restricted, use SafeKeySpaceModule.execTransaction instead."
        );
    }

    function checkAfterExecution(bytes32, bool) external view override {}

    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return
            interfaceId == type(Guard).interfaceId || // 0x945b8148
            interfaceId == type(IERC165).interfaceId; // 0x01ffc9a7
    }
}
