import { JsonRpcSigner, BrowserProvider } from "ethers"
import { useMemo } from 'react'
import type { Account, Chain, Client, Hex, Transport } from 'viem'
import { type Config, useConnectorClient } from 'wagmi'

export const formatHex = (h: Hex): string => {
    const l = h.toString().length
    return  `0x${h.toString().substring(2, 6)}...${h.toString().substring(l-5, l-1)}`
}

export const formatBigInt = (n: bigint): string => {
    const l = n.toString().length
    return `${n.toString().substring(0, 4)}...${n.toString().substring(l - 5, l - 1)}`
}

export const isInt = (number: string) => {
    if (!/^["|']{0,1}[-]{0,1}\d{0,}(\.{0,1}\d+)["|']{0,1}$/.test(number)) return false;
    return !(number as any - parseInt(number));
}

export const isFloat = (number: string) => {
    if (!/^["|']{0,1}[-]{0,1}\d{0,}(\.{0,1}\d+)["|']{0,1}$/.test(number)) return false;
    return number as any - parseInt(number) ? true : false;
}

export function clientToSigner(client: Client<Transport, Chain, Account>) {
    const { account, chain, transport } = client
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    }
    const provider = new BrowserProvider(transport, network)
    const signer = new JsonRpcSigner(provider, account.address)
    return signer
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
    const { data: client } = useConnectorClient<Config>({ chainId })
    return useMemo(() => (client ? clientToSigner(client) : undefined), [client])
}