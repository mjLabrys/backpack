import React, { useContext } from "react";
import { Blockchain } from "@coral-xyz/common";

import { useActiveWallet } from "../hooks";

import {
  EthereumSwapProvider,
  SolanaSwapProvider,
} from "./SwapProviders/index";
import type { SwapContext } from "./SwapProviders/SwapContextConstants";

export const _SwapContext = React.createContext<SwapContext | null>(null);

export function SwapProvider({
  tokenAddress,
  children,
}: {
  tokenAddress?: string;
  children: React.ReactNode;
}) {
  const { blockchain } = useActiveWallet();

  return (
    <>
      {blockchain === Blockchain.SOLANA ? (
        <SolanaSwapProvider tokenAddress={tokenAddress}>
          {children}
        </SolanaSwapProvider>
      ) : blockchain === Blockchain.ETHEREUM ? (
        <EthereumSwapProvider tokenAddress={tokenAddress}>
          {children}
        </EthereumSwapProvider>
      ) : null}
    </>
  );
}
export function useSwapContext(): SwapContext {
  const ctx = useContext(_SwapContext);
  if (ctx === null) {
    throw new Error("Context not available");
  }
  return ctx;
}

export type { SwapContext };
