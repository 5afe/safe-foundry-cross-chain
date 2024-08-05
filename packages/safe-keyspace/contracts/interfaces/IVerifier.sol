// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IVerifier {
    function Verify(bytes calldata proof, uint256[] calldata public_inputs) external view returns (bool);
}