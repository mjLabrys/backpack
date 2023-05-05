import type { BigNumber } from "ethers";

import type { TokenData, TokenDataWithBalance } from "../../types";

// Jupiter route
// ----------------------------------------------------------------
export type JupiterRoute = {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  marketInfos: Array<{
    id: string;
    label: string;
    inputMint: string;
    outputMint: string;
    notEnoughLiquidity: boolean;
    inAmount: string;
    outAmount: string;
    priceImpactPct: number;
    lpFee: {
      amount: string;
      mint: string;
      pct: number;
    };
    platformFee: {
      amount: string;
      mint: string;
      pct: number;
    };
  }>;
  amount: string;
  slippageBps: number;
  otherAmountThreshold: string;
  swapMode: string;
};

// 0x swap quote data
// ----------------------------------------------------------------
export type ZeroXSwapQuote = {
  chainId: number;
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  estimatedGas: string;
  estimatedGasForRouter: number;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  buyAmount: string;
  sellAmount: string;
  allowanceTarget: string;
  decodedUniqueId: string;
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
  expectedSlippage: string | null;
};

export type SwapContext = {
  // Mint settings
  fromMint: string;
  setFromMint: (mint: string) => void;
  toMint: string;
  setToMint: (mint: string) => void;
  // Swap to <-> from tokens
  swapToFromMints: () => void;
  // Token metadata
  fromTokens: Array<TokenDataWithBalance>;
  fromToken: TokenData | TokenDataWithBalance | undefined;
  toTokens: Array<TokenData>;
  toToken: TokenData | undefined;
  // Amounts
  fromAmount: BigNumber | undefined;
  setFromAmount: (a: BigNumber | undefined) => void;
  toAmount: BigNumber | undefined;
  // Slippage
  slippage: number;
  setSlippage: (s: number) => void;
  priceImpactPct: number;
  // Execute the function
  executeSwap: () => Promise<boolean>;
  // Fees
  transactionFees:
    | { fees: Record<string, BigNumber>; total: BigNumber }
    | undefined;
  swapFee: JupiterRoute["marketInfos"][number]["platformFee"];
  availableForSwap: BigNumber;
  exceedsBalance: boolean | undefined;
  feeExceedsBalance: boolean | undefined;
  // Loading flags
  isLoadingRoutes: boolean;
  isLoadingTransactions: boolean;
  isJupiterError: boolean;
};
