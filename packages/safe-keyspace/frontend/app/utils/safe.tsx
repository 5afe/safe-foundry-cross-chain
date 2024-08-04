import { Address } from "viem";
import { SafeInfo } from "./interfaces";
import { getSafeInfo } from "../../../common/utils"
import { ReadClient } from "../../../common/types";

export const readSafe = async (client: ReadClient, address: Address): Promise<SafeInfo> => {
    const safe = await getSafeInfo(client, address)

    return safe
}