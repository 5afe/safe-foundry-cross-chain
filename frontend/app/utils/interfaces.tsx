import { AddressLike, BigNumberish } from "ethers";

export interface SafeInfo {
    address: AddressLike;
    owners: AddressLike[];
    threshold: number;
    balance: BigNumberish,
    modules: AddressLike[],
    guard: AddressLike
  }