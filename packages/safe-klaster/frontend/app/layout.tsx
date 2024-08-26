'use client'

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeModeScript } from "flowbite-react";
import { WagmiProvider } from 'wagmi';
import Wagmi from "./utils/wagmi";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "./globals.css";
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
        <ThemeModeScript />
        {/* Not sure why I need this!!! */}
        <link rel="stylesheet" href="https://unpkg.com/flowbite@latest/dist/flowbite.min.css" />
      </head>
      <body className={inter.className}>
        <WagmiProvider config={Wagmi.config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
