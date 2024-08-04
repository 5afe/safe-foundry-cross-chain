import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import fs from "fs";
import path from "path";

const artifactsPath = path.join(__dirname, "artifacts");
if (fs.existsSync(artifactsPath)) {
  require("./tasks/deploy_safe")
  require("./tasks/deploy_singletons")
  require("./tasks/send_eth")
  require("./tasks/exec_safe_tx_keystore")
  require("./tasks/get_safe")
  require("./tasks/change_keystore_owner")
  require("./tasks/set_keystore_root")
}

const SOLIDITY_VERSION = "0.8.24"
const REPORT_GAS = true

const COINMARKETCAP_APIKEY = vars.get("COINMARKETCAP_APIKEY")
const INFURA_API_KEY = vars.get("INFURA_API_KEY")
const SEPOLIA_DEPLOYER_KEY = vars.get("SEPOLIA_DEPLOYER_KEY")
const SEPOLIA_ETHERSCAN_API_KEY = vars.get("SEPOLIA_ETHERSCAN_API_KEY")
const BASE_SEPOLIA_DEPLOYER_KEY = vars.get("BASE_SEPOLIA_DEPLOYER_KEY")
const BASE_SEPOLIA_ETHERSCAN_API_KEY = vars.get("BASE_SEPOLIA_ETHERSCAN_API_KEY")
const OP_SEPOLIA_DEPLOYER_KEY = vars.get("OP_SEPOLIA_DEPLOYER_KEY")
const OP_SEPOLIA_ETHERSCAN_API_KEY = vars.get("OP_SEPOLIA_ETHERSCAN_API_KEY")


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
  networks: {
    hardhat: { // Chain ID: 31337
      accounts: {
        mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
      }
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_DEPLOYER_KEY],
    },
    base_sepolia: {
      url: `https://sepolia.base.org`,
      accounts: [BASE_SEPOLIA_DEPLOYER_KEY],
    },
    op_sepolia: {
      url: `https://sepolia.optimism.io`,
      accounts: [OP_SEPOLIA_DEPLOYER_KEY],
    },
  },
  gasReporter: {
    enabled: Boolean(REPORT_GAS),
    currency: "USD",
    coinmarketcap: COINMARKETCAP_APIKEY,
    excludeContracts: ["TestToken"]
  },
  etherscan: {
    apiKey: {
      sepolia: SEPOLIA_ETHERSCAN_API_KEY,
      base_sepolia: BASE_SEPOLIA_ETHERSCAN_API_KEY,
      op_sepolia: OP_SEPOLIA_ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io"
        }
      }, {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }, {
        network: "op_sepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io"
        }
      }
    ]
  },
}

export default config