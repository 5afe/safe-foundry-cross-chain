'use client'

import { ethers } from "ethers";
import React, { createContext, useEffect, useState } from "react";
import config, { ENV_VARS } from "./config";
import { EthersAdapter } from "@safe-global/protocol-kit";

const context = createContext(null as any)

export default function SafeCoreProvider({ children }: { children: React.ReactNode }) {
    const [safeAdapter, setSafeAdapter] = useState<EthersAdapter>();

    useEffect(() => {
        setSafeAdapter(new EthersAdapter({
            ethers,
            signerOrProvider: new ethers.JsonRpcProvider(ENV_VARS.CHAIN_RPC)
        }))
    }, []);

    return (
        <context.Provider value={safeAdapter}>
            {children}
        </context.Provider>
    )
}

SafeCoreProvider.context = context;