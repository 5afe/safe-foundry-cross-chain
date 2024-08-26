import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'

const Wagmi = {
  config: getDefaultConfig({
    appName: 'Safe Klaster',
    projectId: 'YOUR_PROJECT_ID',
    chains: [sepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
  })
}

export default Wagmi