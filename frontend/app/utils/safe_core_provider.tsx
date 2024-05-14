'use client'

import { ethers } from "ethers";
import React, { createContext, useEffect, useState } from "react";
import config from "./config";
import { EthersAdapter } from "@safe-global/protocol-kit";

const context = createContext(null as any)

export default function SafeCoreProvider({ children }: { children: React.ReactNode }) {
    const [safeAdapter, setSafeAdapter] = useState<EthersAdapter>();

    useEffect(() => {
        const provider = new ethers.JsonRpcProvider(config.rpc_endpoint)
        const adapter = new EthersAdapter({
            ethers,
            signerOrProvider: provider
        })
        setSafeAdapter(adapter)
    }, []); 

    return (
        <context.Provider value={safeAdapter}>
            {children}
        </context.Provider>
    )
}

SafeCoreProvider.context = context;