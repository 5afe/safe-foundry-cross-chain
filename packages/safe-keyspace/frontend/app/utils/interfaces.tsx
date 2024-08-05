import { Address, Hex } from "viem";

export interface SafeInfo {
  address: Address;
  version: string;
  owners: readonly Address[];
  threshold: bigint;
  nonce: bigint;
  balance: bigint,
  modules: readonly Address[],
  // guard: Address,
  keyspaceKey: Hex,
  keyspaceKeyNonce: number,
  keystoreAddr: Address,
  keyspaceValue: Hex,
  keystoreRoot: bigint
}

export interface MultiNetworkSafeInfo {
  address: Address,
  safes: {
    [network: string]: SafeInfo
  }
}