// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IKeyStore {
    function root() external view returns (uint256);
}
