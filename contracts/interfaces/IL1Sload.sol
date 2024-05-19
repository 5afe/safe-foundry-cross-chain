// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IL1Sload {
    function l1sload(
        uint64 l1BlockNumber, 
		address storageAddr, 
		bytes32 storageKey) external view returns (uint256);
}