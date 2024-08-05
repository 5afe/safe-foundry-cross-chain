// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../interfaces/IL1Blocks.sol";

contract MockedL1Blocks is IL1Blocks {
    uint256 internal constant MOCKED_BLOCK_NO = 10000;

    function latestBlockNumber() external pure override returns (uint256) {
        return MOCKED_BLOCK_NO;
    }

    function latestBlockHash() external view override returns (bytes32) {}

    function getBlockHash(
        uint256 blockNumber
    ) external view override returns (bytes32) {}

    function latestStateRoot() external view override returns (bytes32) {}

    function getStateRoot(
        uint256 blockNumber
    ) external view override returns (bytes32) {}

    function latestBlockTimestamp() external view override returns (uint256) {}

    function getBlockTimestamp(
        uint256 blockNumber
    ) external view override returns (uint256) {}

    function latestBaseFee() external view override returns (uint256) {}

    function getBaseFee(
        uint256 blockNumber
    ) external view override returns (uint256) {}

    function latestBlobBaseFee() external view override returns (uint256) {}

    function getBlobBaseFee(
        uint256 blockNumber
    ) external view override returns (uint256) {}

    function latestParentBeaconRoot()
        external
        view
        override
        returns (bytes32)
    {}

    function getParentBeaconRoot(
        uint256 blockNumber
    ) external view override returns (bytes32) {}

    function setL1BlockHeader(
        bytes calldata blockHeaderRlp
    ) external override returns (bytes32 blockHash) {}
}
