import { useEffect, useRef, useState } from "react";
import {
  Blockchain,
  DAI_MINT,
  ETH_NATIVE_MINT,
  ZERO_X_ETH_PLACEHOLDER,
} from "@coral-xyz/common";
import type { TokenInfo } from "@solana/spl-token-registry";
import { BigNumber, ethers, FixedNumber } from "ethers";

import { EthereumTokenInfo, zeroXInputTokens } from "../../atoms";
import { blockchainTokenData } from "../../atoms/balance";
import {
  useEthereumCtx,
  useLoader,
  useZeroXOutputTokens,
  useZeroXTokenList,
} from "../../hooks";
import { _SwapContext } from "../Swap";

import type { SwapContext, ZeroXSwapQuote } from "./SwapContextConstants";
const { Zero } = ethers.constants;
const DEFAULT_DEBOUNCE_DELAY = 400;

const DEFAULT_SLIPPAGE_PERCENT = 1; //0.01 for 1%

// Poll for new routes every 30 seconds in case of changing market conditions
const ROUTE_POLL_INTERVAL = 30000;

function useDebounce(value: any, wait = DEFAULT_DEBOUNCE_DELAY) {
  const [debounceValue, setDebounceValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceValue(value);
    }, wait);
    return () => clearTimeout(timer); // cleanup when unmounted
  }, [value, wait]);

  return debounceValue;
}
export function EthereumSwapProvider({
  tokenAddress,
  children,
}: {
  tokenAddress?: string;
  children: React.ReactNode;
}) {
  const blockchain = Blockchain.ETHEREUM;
  const ethereumCtx = useEthereumCtx();
  const { backgroundClient, provider, walletPublicKey } = useEthereumCtx();
  const zeroXTokenList = useZeroXTokenList();

  const ZERO_X_BASE_URL = "https://api.0x.org/swap/v1/";
  // const ZERO_X_BASE_URL = "https://goerli.api.0x.org/swap/v1/";

  const [fromTokens] = useLoader(
    zeroXInputTokens({ publicKey: walletPublicKey.toString() }),
    []
  );

  // Swap settings
  const [[fromMint, toMint], setFromMintToMint] = useState([
    ETH_NATIVE_MINT,
    DAI_MINT,
  ]);

  const [fromAmount, _setFromAmount] = useState<BigNumber | undefined>(
    undefined
  );

  // 0x swap quote data
  const [quote, setQuote] = useState<ZeroXSwapQuote>();
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [transactionFees, setTransactionFees] =
    useState<SwapContext["transactionFees"]>(undefined);
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE_PERCENT);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Error states
  // TODO: probably rename these variables
  const [isJupiterError, setIsJupiterError] = useState(false);

  // TODO: implement
  const toAmount = (() => {
    if (quote) {
      return BigNumber.from(quote.buyAmount);
    } else {
      return fromAmount;
    }
  })();
  const priceImpactPct = quote ? Number(quote.estimatedPriceImpact) : 0;
  useEffect(() => {
    console.log("priceImpactPct: ", priceImpactPct);
  }, [priceImpactPct]);

  // On changes to the swap parameters, fetch the swap quote from zero X.
  const pollIdRef: { current: NodeJS.Timeout | null } = useRef(null);

  let fromToken = fromTokens.find((t) => t.address === fromMint);
  if (!fromToken) {
    // This can occur when the users swaps the to/from mints and the token is
    // not one that the user has a token account for
    const token = zeroXTokenList.find((f: TokenInfo) => f.address === fromMint);
    if (token) {
      fromToken = {
        name: token.name,
        ticker: token.symbol,
        decimals: token.decimals,
        logo: token.logoURI || "",
        nativeBalance: ethers.constants.Zero,
        displayBalance: "0",
        address: token.address,
      };
    }
  }
  const toTokens = useZeroXOutputTokens(fromMint);
  const toToken = toTokens.find((t) => t.address === toMint);

  // TODO: add check to ensure they have the balance of output token
  const canSwitch =
    toToken?.mint === ETH_NATIVE_MINT ||
    fromTokens.some((t) => t.address === toMint);

  useEffect(() => {
    console.log("toTokenstoTokenstoTokens: ", toTokens);
  }, [toTokens]);

  let availableForSwap = fromToken
    ? BigNumber.from(fromToken.nativeBalance)
    : Zero;

  const exceedsBalance = fromAmount
    ? fromAmount.gt(availableForSwap)
    : undefined;

  const stopQuotePolling = () => {
    if (pollIdRef.current) {
      clearInterval(pollIdRef.current);
    }
  };

  // Debounce fromAmount to avoid excessive API requests
  const debouncedFromAmount = useDebounce(fromAmount);

  useEffect(() => {
    (async () => {
      const loadQuote = async () => {
        if (fromAmount && fromAmount.gt(Zero) && fromMint !== toMint) {
          setQuote(await fetchSwapQuote());

          stopQuotePolling();
          const pollId = setTimeout(loadQuote, ROUTE_POLL_INTERVAL);
          pollIdRef.current = pollId;
        } else {
          setQuote(undefined);
        }
        setIsLoadingQuote(false);
      };
      setIsLoadingQuote(true);
      // setIsLoadingTransactions(true);
      await loadQuote();
    })();

    // Cleanup
    return stopQuotePolling();
  }, [fromMint, debouncedFromAmount, toMint]);

  useEffect(() => {
    if (quote) {
      const gasTotal = BigNumber.from(
        Number(quote.gasPrice) * Number(quote.gas)
      );
      // TODO: Add transaction fee accounting for APPROVALS
      setTransactionFees({
        fees: {
          "Ethereum network": gasTotal,
        },
        total: gasTotal,
      });
    }
  }, [quote]);

  // Fetch quotes from 0x swap
  const fetchSwapQuote = async () => {
    if (!fromAmount) return;
    const params = {
      sellToken:
        fromMint === ETH_NATIVE_MINT ? ZERO_X_ETH_PLACEHOLDER : fromMint,
      buyToken: toMint === ETH_NATIVE_MINT ? ZERO_X_ETH_PLACEHOLDER : toMint,
      sellAmount: fromAmount.toString(),
      // takerAddress: walletPublicKey.toString(),
    };
    const queryString = new URLSearchParams(params).toString();
    try {
      const response = await fetch(`${ZERO_X_BASE_URL}quote?${queryString}`);
      if (!response.ok) {
        // fetch throws for network errors but http status code errors so throw
        // manually if status code is outside of 200-299 range
        throw new Error(response.status.toString());
      }
      const data = await response.json();
      setIsJupiterError(false);
      return data;
    } catch (e) {
      console.error("error fetching swap routes", e);
      setIsJupiterError(true);
      return;
    }
  };
  // ----------------------------------------------------------------
  // Switch swap direction
  const swapToFromMints = () => {
    setFromMintToMint([toMint, fromMint]);
    setFromAmount(toAmount ?? Zero);
  };
  const setFromMint = (mint: string) => {
    setFromMintToMint([mint, toMint]);
  };
  const setToMint = (mint: string) => {
    setFromMintToMint([fromMint, mint]);
  };
  const setFromAmount = (amount: BigNumber) => {
    // Restrict the input to the number of decimals of the from token
    _setFromAmount(amount);
  };
  // ----------------------------------------------------------------

  // TODO: implement
  const executeSwap = async () => {
    return false;
  };
  return (
    <_SwapContext.Provider
      value={{
        toMint,
        setToMint,
        fromMint,
        fromTokens,
        fromToken,
        toTokens,
        toToken,
        setFromMint,
        fromAmount,
        setFromAmount,
        toAmount,
        swapToFromMints,
        slippage,
        setSlippage,
        executeSwap,
        priceImpactPct,
        isLoadingRoutes: isLoadingQuote,
        isLoadingTransactions,
        transactionFees,
        swapFee: { amount: "0", mint: "", pct: 0 },
        isJupiterError,
        availableForSwap,
        exceedsBalance,
        feeExceedsBalance: undefined,
        canSwap: !availableForSwap.isZero(),
        canSwitch,
      }}
    >
      {children}
    </_SwapContext.Provider>
  );
}
