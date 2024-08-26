import { Abi, Account, Chain, PublicClient, Transport, WalletClient } from "viem";

export type WriteClient = WalletClient<Transport, Chain, Account>
export type ReadClient = PublicClient<Transport, Chain>

