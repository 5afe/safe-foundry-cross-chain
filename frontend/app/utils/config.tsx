import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
    appName: 'Safe',
    projectId: `${process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}`,
    chains: [sepolia],
    ssr: true, 
});

export default {
    page_title: "Safe demo",
    page_description: "hello",
    rpc_endpoint: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`,
    safe_keystore_module: "0xE5caF2b49a939751a0Ef54F96a3123E050ef9223",
    safe_disable_local_keystore_guard: "0x76482a48000ECA244E0294D5970B762572CA95e1"
}