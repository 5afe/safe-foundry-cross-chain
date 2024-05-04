import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'solidity-coverage'

const SOLIDITY_VERSION = "0.8.24"
const COINMARKETCAP_APIKEY = vars.get("COINMARKETCAP_APIKEY")
const REPORT_GAS = vars.get("REPORT_GAS")

const config: HardhatUserConfig = {
  solidity: SOLIDITY_VERSION,
  gasReporter: {
    enabled: Boolean(REPORT_GAS),
    currency: "USD",
    coinmarketcap: COINMARKETCAP_APIKEY,
    excludeContracts: ["TestToken"]
  }
}

export default config
