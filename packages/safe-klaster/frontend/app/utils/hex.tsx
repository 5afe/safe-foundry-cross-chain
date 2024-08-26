import { Hex } from "viem"

export const formatHex = (h: Hex): string => {
    const l = h.toString().length
    return  `0x${h.toString().substring(2, 6)}...${h.toString().substring(l-5, l-1)}`
}