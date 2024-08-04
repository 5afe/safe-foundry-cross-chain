// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ISafe} from "./interfaces/ISafe.sol";
import {ISafeKeySpaceModule} from "./interfaces/ISafeKeySpaceModule.sol";

contract SafeKeySpaceModuleSetup {
    function enableModule(address module) external {
        ISafe(address(this)).enableModule(module);
    }

    function configureModule(address module, uint256 key) external {
        ISafeKeySpaceModule(module).registerKeystore(key);
    }
}
