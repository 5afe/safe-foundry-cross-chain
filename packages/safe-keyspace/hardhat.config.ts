import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import "./tasks/deploy_safe"
import "./tasks/deploy_singletons"
import "./tasks/send_eth"
import "./tasks/exec_safe_tx_keystore"
import "./tasks/get_safe"
import "./tasks/change_keystore_owner"
import "./tasks/set_keystore_root"

const SOLIDITY_VERSION = "0.8.24"
const REPORT_GAS = true

const COINMARKETCAP_APIKEY = vars.get("COINMARKETCAP_APIKEY")
const INFURA_API_KEY = vars.get("INFURA_API_KEY")
const SEPOLIA_DEPLOYER_KEY = vars.get("SEPOLIA_DEPLOYER_KEY")
const SEPOLIA_ETHERSCAN_API_KEY = vars.get("SEPOLIA_ETHERSCAN_API_KEY")
const BASE_SEPOLIA_DEPLOYER_KEY = vars.get("BASE_SEPOLIA_DEPLOYER_KEY")
const BASE_SEPOLIA_ETHERSCAN_API_KEY = vars.get("BASE_SEPOLIA_ETHERSCAN_API_KEY")


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
      base_sepolia: BASE_SEPOLIA_ETHERSCAN_API_KEY
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
          browserURL: "https://sepolia.basescan.org/"
        }
      }
    ]
  },
}

export default config