// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

contract MockedL1Sload {
    mapping(address => mapping(uint256 => bytes)) public refs;

    function set(address contractAddr, uint256 slot, bytes memory data) public {
        refs[contractAddr][slot] = data;
    }

    fallback(bytes calldata data) external returns (bytes memory) {
        (, address contractAddr, uint256 slot) = decodeData(data);
        return refs[contractAddr][slot];
    }

    // decode packaed data
    function decodeData(
        bytes memory data
    ) internal pure returns (uint256, address, uint256) {
        uint256 x;
        address y;
        uint256 z;
        assembly {
            x := mload(add(data, 0x20))
            y := mload(add(data, 0x34))
            z := mload(add(data, 0x54))
        }
        return (x, y, z);
    }
}
