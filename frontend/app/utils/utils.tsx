import { AddressLike, JsonRpcSigner, BrowserProvider, ZeroAddress } from "ethers"
import { SafeInfo } from "./interfaces"
import { useMemo } from 'react'
import type { Account, Chain, Client, Transport } from 'viem'
import { type Config, useConnectorClient } from 'wagmi'
import { AiOutlineStop } from "react-icons/ai";


export const formatAddr = (addr: AddressLike): string =>
    `0x${addr.toString().substring(2, 4)}...${addr.toString().substring(38, 42)}`

export const makeSafeDescription = ({ owners, threshold, guard }: SafeInfo): React.ReactNode => {
    return <div className="flex flex-row space-x-2 align-middle">
        <span>owners: {owners.map(a => formatAddr(a)).join(", ")} • multisig {threshold}/{owners.length}</span>
        {guard != ZeroAddress && <AiOutlineStop size="16" className="fill-red-500" />}
    </div>
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