// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../interfaces/IL1Sload.sol";
import "hardhat/console.sol";

contract MockedL1Sload is IL1Sload {
    uint256 internal constant MOCKED_STORAGE = 0x000000000000000000000000d06d5f0d454edc27cdbc992588a230bdf8832dda;

    function l1sload(
        uint64 l1BlockNumber,
        address storageAddr,
        bytes32 storageKey
    ) external pure override returns (uint256) {
        console.log("=== l1sload ===");
        console.log("=== l1BlockNumber=%s", l1BlockNumber);
        console.log("=== storageAddr=%s", storageAddr);
        console.log("=== storageKey");
        console.logBytes32(storageKey);
        return MOCKED_STORAGE;
    }
}
