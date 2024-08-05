import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createPublicClient, http } from "viem";
import { ReadClient } from "../../../common/types";
import { baseSepolia, optimismSepolia, sepolia } from "viem/chains";

const TITLE = "KeySpace Safe"


export const ENV_VARS = {
  WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
  // CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337),
  // CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME || "UNKNOWN",
  // CHAIN_RPC: process.env.NEXT_PUBLIC_CHAIN_RPC || "http://localhost8545",
  // CHAIN_CURRENCY_NAME: process.env.NEXT_PUBLIC_CHAIN_CURRENCY_NAME || "Ether",
  // CHAIN_CURRENCY_SYMBOL: process.env.NEXT_PUBLIC_CHAIN_CURRENCY_SYMBOL || "ETH",
  // CHAIN_CURRENCY_DECIMALS: Number(process.env.NEXT_PUBLIC_CHAIN_CURRENCY_DECIMALS || "18"),
}


// const chain = {
//   id: ENV_VARS.CHAIN_ID,
//   name: ENV_VARS.CHAIN_NAME,
//   nativeCurrency: {
//     name: ENV_VARS.CHAIN_CURRENCY_NAME,
//     decimals: ENV_VARS.CHAIN_CURRENCY_DECIMALS,
//     symbol: ENV_VARS.CHAIN_CURRENCY_SYMBOL
//   },
//   rpcUrls: {
//     default: { http: [ENV_VARS.CHAIN_RPC] },
//   },
// }
export const wagmiConfig = getDefaultConfig({
  appName: TITLE,
  projectId: ENV_VARS.WALLET_CONNECT_PROJECT_ID,
  chains: [optimismSepolia, baseSepolia],
  transports: {
    [baseSepolia.id]: http("https://base-sepolia-rpc.publicnode.com"),
    [optimismSepolia.id]: http("https://optimism-sepolia-rpc.publicnode.com"),
    [sepolia.id]: http(),
  },
  ssr: true,
});

const sepoliaClient = createPublicClient({ 
  chain: sepolia,
  transport: http()
})

const baseSepoliaClient = createPublicClient({ 
  chain: baseSepolia,
  transport: http("https://base-sepolia-rpc.publicnode.com")
})

const opSepoliaClient = createPublicClient({ 
  chain: optimismSepolia,
  transport: http("https://optimism-sepolia-rpc.publicnode.com")
})

export default {
  page_title: TITLE,
  //sepoliaClient: sepoliaClient as ReadClient,
  baseSepoliaClient: baseSepoliaClient as ReadClient,
  opSepoliaClient: opSepoliaClient as ReadClient,
}