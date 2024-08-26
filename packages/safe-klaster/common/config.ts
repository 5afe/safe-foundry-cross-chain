import { Address, createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"


const config = {
    sepolia: {
        masterCopy: "0x29fcB43b46531BcA003ddC8FCB67FFE91900C762" as Address,
        proxyFactory: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67" as Address,
        client: createPublicClient({
            chain: sepolia,
            transport: http()
        })
    }
}

export default config