/**
 * This is used to generate artifacts without importing tasks that imports artifacts
 */
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const SOLIDITY_VERSION = "0.8.24"
const config: HardhatUserConfig = {
  solidity: {
    version: SOLIDITY_VERSION,
    settings: { 
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"]
        }
      }
    }
  },
}

export default config