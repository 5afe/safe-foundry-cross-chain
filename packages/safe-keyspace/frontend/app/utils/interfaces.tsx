import { Address } from "viem";

export interface SafeInfo {
  address: Address;
  version: string;
  owners: readonly Address[];
  threshold: bigint;
  nonce: bigint;
  balance: bigint,
  modules: readonly Address[],
  guard: Address
}