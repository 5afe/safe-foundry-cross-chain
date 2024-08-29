import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia, sepolia } from 'wagmi/chains'

const Wagmi = {
  config: getDefaultConfig({
    appName: 'Safe Klaster',
    projectId: 'YOUR_PROJECT_ID',
    chains: [sepolia, baseSepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
  })
}

export default Wagmi