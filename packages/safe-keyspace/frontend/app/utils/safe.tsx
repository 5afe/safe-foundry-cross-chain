import { Address } from "viem";
import { SafeInfo } from "./interfaces";
import { getSafeInfo } from "../../../common/utils"
import config from "./config";

export const readSafe = async (address: Address): Promise<SafeInfo> => {
    const safe = await getSafeInfo(config.publicClient, address)

    return safe
}