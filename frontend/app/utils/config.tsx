import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const TITLE = "Safe • Scroll - Keystore demo"

// Scroll devnet
const l2 = {
  rpc_endpoint: 'https://l1sload-rpc.scroll.io',
  chain_id: 2227728,
  currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  singletons: {
    safe_singleton_address: '0x325D7482AEb7D272b395b8D55cE73d827Bd21B82',
    safe_proxyFactory_address: '0x620947A78F864Ab30bb8b8F0f1197E806413B5b0',
    multi_send_address: '0xD720caf00488054BEa3a525b991Ec492B67cEdA3',
    multi_send_call_only_address: '0x947a50f1df39AC597ff7105CF987AE0cC93973f7',
    fallback_handler_address: '0xE76a4120C231B5804B690f2dACC51398Ff68a8cf',
    sign_nessage_lib_address: '0x872223fDF4618FFe4118E3271d4E787244f6528b',
    create_call_address: '0xaFB1d9cd9638B384E9371b23F2c945458571192E',
    simulate_tx_accessor_address: '0xae0E95C414E88156e603c78185a7B86626B13170',
    safe_keystore_module:"0x54876a89AE55E3227891823B46c72Bfac8468eC6", 
    safe_disable_local_keystore_guard: "0x88508FE6fF2bc8b79755aD1cc83acf65980d552D" 
  }
}

// Sepolia
const l1 = {
  rpc_endpoint: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`,
  chain_id: 11155111,
  currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  singletons: {
    safe_singleton_address: '0x69f4D1788e39c87893C980c06EdF4b7f686e2938',
    safe_proxyFactory_address: '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC',
    multi_send_address: '0x998739BFdAAdde7C933B942a68053933098f9EDa',
    multi_send_call_only_address: '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
    fallback_handler_address: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
    sign_nessage_lib_address: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
    create_call_address: '0x56EB502B9C639aF487a3483899A78034a6a8BC03',
    simulate_tx_accessor_address: '0xB438be7D2EB374edb02Cd98B37bd98370F023a81',
  }
}

export const wagmiConfig = getDefaultConfig({
  appName: TITLE,
  projectId: `${process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}`,
  chains: [{
    id: l2.chain_id,
    name: 'Scroll_devnet_Chain',
    nativeCurrency: l2.currency,
    rpcUrls: {
      default: { http: [l2.rpc_endpoint] },
    },
  }],
  ssr: true,
});

export default {
  page_title: TITLE,
  l1,
  l2
}