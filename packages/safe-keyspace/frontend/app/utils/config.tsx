import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createPublicClient, http } from "viem";
import { ReadClient } from "../../../common/types";

const TITLE = "X-CHAIN SAFE"

// // Scroll devnet
// const l2 = {
//   rpc_endpoint: 'http://34.222.147.164:8545',
//   chain_id: 222222,
//   currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
//   singletons: {
//     safe_singleton_address: '0x325D7482AEb7D272b395b8D55cE73d827Bd21B82',
//     safe_proxyFactory_address: '0x620947A78F864Ab30bb8b8F0f1197E806413B5b0',
//     multi_send_address: '0xD720caf00488054BEa3a525b991Ec492B67cEdA3',
//     multi_send_call_only_address: '0x947a50f1df39AC597ff7105CF987AE0cC93973f7',
//     fallback_handler_address: '0xE76a4120C231B5804B690f2dACC51398Ff68a8cf',
//     sign_nessage_lib_address: '0x872223fDF4618FFe4118E3271d4E787244f6528b',
//     create_call_address: '0xaFB1d9cd9638B384E9371b23F2c945458571192E',
//     simulate_tx_accessor_address: '0xae0E95C414E88156e603c78185a7B86626B13170',
//     safe_keystore_module: "0x54876a89AE55E3227891823B46c72Bfac8468eC6",
//     safe_disable_local_keystore_guard: "0x88508FE6fF2bc8b79755aD1cc83acf65980d552D"
//   }
// }

// // Sepolia
// const l1 = {
//   rpc_endpoint: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`,
//   chain_id: 11155111,
//   currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
//   singletons: {
//     safe_singleton_address: '0x69f4D1788e39c87893C980c06EdF4b7f686e2938',
//     safe_proxyFactory_address: '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC',
//     multi_send_address: '0x998739BFdAAdde7C933B942a68053933098f9EDa',
//     multi_send_call_only_address: '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
//     fallback_handler_address: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
//     sign_nessage_lib_address: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
//     create_call_address: '0x56EB502B9C639aF487a3483899A78034a6a8BC03',
//     simulate_tx_accessor_address: '0xB438be7D2EB374edb02Cd98B37bd98370F023a81',
//   }
// }

export const ENV_VARS = {
  WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
  CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337),
  CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME || "UNKNOWN",
  CHAIN_RPC: process.env.NEXT_PUBLIC_CHAIN_RPC || "http://localhost8545",
  CHAIN_CURRENCY_NAME: process.env.NEXT_PUBLIC_CHAIN_CURRENCY_NAME || "Ether",
  CHAIN_CURRENCY_SYMBOL: process.env.NEXT_PUBLIC_CHAIN_CURRENCY_SYMBOL || "ETH",
  CHAIN_CURRENCY_DECIMALS: Number(process.env.NEXT_PUBLIC_CHAIN_CURRENCY_DECIMALS || "18"),
}


const chain = {
  id: ENV_VARS.CHAIN_ID,
  name: ENV_VARS.CHAIN_NAME,
  nativeCurrency: {
    name: ENV_VARS.CHAIN_CURRENCY_NAME,
    decimals: ENV_VARS.CHAIN_CURRENCY_DECIMALS,
    symbol: ENV_VARS.CHAIN_CURRENCY_SYMBOL
  },
  rpcUrls: {
    default: { http: [ENV_VARS.CHAIN_RPC] },
  },
}
export const wagmiConfig = getDefaultConfig({
  appName: TITLE,
  projectId: ENV_VARS.WALLET_CONNECT_PROJECT_ID,
  chains: [chain],
  ssr: true,
});

const publicClient = createPublicClient({ 
  chain: chain,
  transport: http()
})

export default {
  page_title: TITLE,
  publicClient: publicClient as ReadClient,
  // l1,
  // l2
}