'use client'

import { ethers } from "ethers";
import React, { createContext, useEffect, useState } from "react";
import config from "./config";
import { EthersAdapter } from "@safe-global/protocol-kit";

const context = createContext(null as any)

export default function SafeCoreProvider({ children }: { children: React.ReactNode }) {
    const [safeAdapter, setSafeAdapter] = useState<{ l1Adapter: EthersAdapter, l2Adapter: EthersAdapter }>();

    useEffect(() => {
        setSafeAdapter({
            l1Adapter: new EthersAdapter({
                ethers,
                signerOrProvider: new ethers.JsonRpcProvider(config.l1.rpc_endpoint)
            }), l2Adapter: new EthersAdapter({
                ethers,
                signerOrProvider: new ethers.JsonRpcProvider(config.l2.rpc_endpoint)
            })
        })
    }, []);

    return (
        <context.Provider value={safeAdapter}>
            {children}
        </context.Provider>
    )
}

SafeCoreProvider.context = context;