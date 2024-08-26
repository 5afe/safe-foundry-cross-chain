import { Abi, Account, Address, Chain, GetContractReturnType, Hex, PublicClient, Transport, WalletClient } from "viem";

export type WriteClient = WalletClient<Transport, Chain, Account>
export type ReadClient = PublicClient<Transport, Chain>

export type ContractInstance<TAbi extends Abi> = GetContractReturnType<TAbi, WriteClient>
export type ContractInstanceReadOnly<TAbi extends Abi> = GetContractReturnType<TAbi, ReadClient>

export type Clients = {
    writeClient: WriteClient
    readClient: ReadClient
}

export type SafeInfo = {
    address: Address,
    version: string,
    owners: readonly Address[],
    threshold: bigint,
    nonce: bigint,
    modules: readonly Address[],
    balance: bigint
}