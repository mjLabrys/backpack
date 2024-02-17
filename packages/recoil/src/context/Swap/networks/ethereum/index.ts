import type { Blockchain } from "@coral-xyz/common";
import type { QuoteResponse } from "@jup-ag/api";
import { BigNumber } from "ethers";
import type { EthereumContext } from "packages/secure-clients/legacyCommon";

import type { CachedTokenBalance, SwapQuoteResponse } from "../../hooks";
// TODO:

// TODO:
export function availableForSwapOffsetEthereum({
  from,
  availableForSwap,
}: {
  from: {
    walletPublicKey: string;
    mint: string;
    blockchain: Blockchain;
  };
  availableForSwap: BigNumber;
}) {
  return BigNumber.from(0);
}

// TODO:
export async function sendTransactionEthereum(): Promise<string> {
  //   {
  //   ethereumCtx,
  //   to,
  //   fromAmount,
  //   fromToken,
  //   toToken,
  //   quoteResponse,
  //   serializedTransaction,
  // }: {
  //   ethereumCtx: EthereumContext;
  //   to: { walletPublicKey: string; mint: string; blockchain: Blockchain };
  //   fromAmount: BigNumber | null;
  //   fromToken: CachedTokenBalance;
  //   toToken: CachedTokenBalance;
  //   quoteResponse: SwapQuoteResponse;
  //   serializedTransaction: string;
  // }
  const signature = "";
  return signature;
}

export async function fetchTransactionEthereum({
  from,
  quoteResponse,
}: {
  from: { walletPublicKey: string; mint: string; blockchain: Blockchain };
  quoteResponse: SwapQuoteResponse;
}): Promise<string> {
  return "";
}

export async function fetchQuoteEthereum({
  from,
  to,
  fromAmount,
}: {
  from: {
    walletPublicKey: string;
    mint: string;
    blockchain: Blockchain;
  };
  to: {
    walletPublicKey: string;
    mint: string;
    blockchain: Blockchain;
  } | null;
  fromAmount: BigNumber;
}): Promise<SwapQuoteResponse | null> {
  return null;
}
