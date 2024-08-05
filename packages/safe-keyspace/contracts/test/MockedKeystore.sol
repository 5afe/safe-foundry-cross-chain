// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../interfaces/IKeyStore.sol";
import "hardhat/console.sol";

contract MockedKeystore is IKeyStore {
    uint256 public root;

    function setRoot(uint256 _root) public {
        root = _root;
    }
}
