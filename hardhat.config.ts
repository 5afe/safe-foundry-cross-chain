import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";
import 'solidity-coverage'

const SOLIDITY_VERSION = "0.8.24"
const COINMARKETCAP_APIKEY = vars.get("COINMARKETCAP_APIKEY")
const INFURA_API_KEY = vars.get("INFURA_API_KEY")
const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY")
const REPORT_GAS = vars.get("REPORT_GAS")

const config: HardhatUserConfig = {
  solidity: SOLIDITY_VERSION,
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: Boolean(REPORT_GAS),
    currency: "USD",
    coinmarketcap: COINMARKETCAP_APIKEY,
    excludeContracts: ["TestToken"]
  }
}

export default config
