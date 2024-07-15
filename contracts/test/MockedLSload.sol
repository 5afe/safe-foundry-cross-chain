// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

contract MockedL1Sload {
    mapping(address => mapping(uint256 => bytes)) public refs;

    function set(address contractAddr, uint256 slot, bytes memory data) public {
        refs[contractAddr][slot] = data;
    }

    fallback(bytes calldata data) external returns (bytes memory) {
        (address contractAddr, uint256 slot) = decodeData(data);
        return refs[contractAddr][slot];
    }

    // decode packaed data
    function decodeData(
        bytes memory data
    ) internal pure returns (address, uint256) {
        address contractAddress;
        uint256 slot;
        assembly {
            contractAddress := mload(add(data, 0x14))
            slot := mload(add(data, 0x34))
        }
        return (contractAddress, slot);
    }
}
