"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import config, { wagmiConfig } from "./utils/config"
import SafeCoreProvider from "./utils/safe_core_provider";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import '@rainbow-me/rainbowkit/styles.css';

const inter = Inter({ subsets: ["latin"] });
const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>{config.page_title}</title>
      </head>
      <body className={inter.className}>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <SafeCoreProvider>
                {children}
              </SafeCoreProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>

      </body>
    </html>
  );
}
