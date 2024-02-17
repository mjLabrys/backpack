/*
 * This file contains all the hooks that generalize over blockchains.
 * Adding a blockchain to the swapper should entail adding cases here.
 *
 * Note: not completely done.
 */
import { useCallback, useMemo, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import { Blockchain } from "@coral-xyz/common";
import type { SwapQuoteResponse } from "@coral-xyz/recoil";
import {
  availableForSwapOffsetEthereum,
  availableForSwapOffsetSolana,
  fetchQuoteEthereum,
  fetchQuoteSolana,
  fetchTransactionEthereum,
  fetchTransactionSolana,
  sendTransactionEthereum,
  sendTransactionSolana,
  useSolanaCtx,
} from "@coral-xyz/recoil";
import {
  SOL_NATIVE_MINT,
  WSOL_MINT,
} from "@coral-xyz/secure-clients/legacyCommon";
import type {} from "@jup-ag/api";
import { BigNumber, ethers } from "ethers";
import useAsyncEffect from "use-async-effect";

import type { CachedTokenBalance } from "./hooks";
import {
  GET_SWAP_OUTPUT_TOKENS,
  GET_SWAP_VALID_INPUT_TOKENS,
  useFromToken,
  useToToken,
} from "./hooks";

const { Zero } = ethers.constants;

export function useSwapValidInputTokens({
  from,
  to,
  fromBalances,
}: {
  from: {
    walletPublicKey: string;
    mint: string;
    blockchain: Blockchain;
  } | null;
  to: {
    walletPublicKey: string;
    mint: string;
    blockchain: Blockchain;
  } | null;
  fromBalances: CachedTokenBalance[];
}): [CachedTokenBalance[], boolean] {
  const swapValidInputTokensSolana =
    useSwapValidInputTokensSolanaFn(fromBalances);

  // TODO:
  const swapValidInputTokensEthereum = async () => {};
  const [response, setResponse] = useState<[CachedTokenBalance[], boolean]>([
    [],
    true,
  ]);

  useAsyncEffect(
    async (isMounted) => {
      if (from === null) {
        return;
      }

      setResponse([[], true]);
      const data = await (async () => {
        const swapTy = swapType({ from, to });
        switch (swapTy) {
          case SwapType.Solana:
            return await swapValidInputTokensSolana();
          case SwapType.Ethereum:
            return await swapValidInputTokensEthereum();
          case SwapType.Wormhole:
            // todo
            throw new Error("swap not implemented for wormhole");
          default:
            throw new Error("swap not implemented for non solana blockchains");
        }
      })();
      if (!isMounted()) {
        return;
      }
      setResponse([data ?? [], false]);
    },
    [swapValidInputTokensSolana, from, to]
  );

  return response;
}

export function useSwapOutputTokens({
  from,
  to,
  outputBalances,
}: {
  from: {
    walletPublicKey: string;
    mint: string;
    blockchain: Blockchain;
  } | null;
  to: {
    walletPublicKey: string;
    mint: string;
    blockchain: Blockchain;
  } | null;
  outputBalances: CachedTokenBalance[];
}): [CachedTokenBalance[], boolean] {
  const swapOutputTokensSolana = useSwapOutputTokensSolanaFn(
    from?.mint ?? "",
    outputBalances
  );
  // TODO: do
  const swapOutputTokensEthereum = async () => {};
  const [response, setResponse] = useState<[CachedTokenBalance[], boolean]>([
    [],
    true,
  ]);

  useAsyncEffect(
    async (isMounted) => {
      if (from === null) {
        return;
      }

      setResponse([[], true]);
      const data = await (async () => {
        const swapTy = swapType({ from, to });
        switch (swapTy) {
          case SwapType.Solana:
            return await swapOutputTokensSolana();
          case SwapType.Ethereum:
            return await swapOutputTokensEthereum();
          case SwapType.Wormhole:
            // todo
            throw new Error("swap not implemented for wormhole");
          default:
            throw new Error("swap not implemented for non solana blockchains");
        }
      })();
      if (!isMounted()) {
        return;
      }
      setResponse([data ?? [], false]);
    },
    [swapOutputTokensSolana, from, to]
  );

  return response;
}

export function useFetchTransaction<T>({
  from,
  to,
  quoteResponse,
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
  quoteResponse: SwapQuoteResponse | SwapQuoteResponse | null;
}): () => Promise<string> {
  return useCallback(async () => {
    if (quoteResponse === null) {
      throw new Error("quote not found");
    }
    const swapTy = swapType({ from, to });
    switch (swapTy) {
      case SwapType.Solana:
        return await fetchTransactionSolana({
          from,
          quoteResponse: quoteResponse as SwapQuoteResponse,
        });
      case SwapType.Ethereum:
        return await fetchTransactionEthereum({
          from,
          quoteResponse: quoteResponse as SwapQuoteResponse,
        });
      case SwapType.Wormhole:
        // todo
        throw new Error("swap not implemented for wormhole");
      default:
        throw new Error("swap not implemented for non solana blockchains");
    }
  }, [quoteResponse, from, to]);
}

export function useFetchQuote({
  from,
  to,
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
}): (fromAmount: BigNumber) => Promise<SwapQuoteResponse | null> {
  return useCallback(
    async (fromAmount: BigNumber) => {
      const swapTy = swapType({ from, to });
      switch (swapTy) {
        case SwapType.Solana:
          return await fetchQuoteSolana({
            from,
            to,
            fromAmount,
          });
        case SwapType.Ethereum:
          return await fetchQuoteEthereum({
            from,
            to,
            fromAmount,
          });
        case SwapType.Wormhole:
          // todo
          throw new Error("swap not implemented for wormhole");
        default:
          throw new Error("swap not implemented for non solana blockchains");
      }
    },
    [from, to]
  );
}

export function useSendTransaction({
  from,
  to,
  fromAmount,
  quoteResponse,
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
  fromAmount: BigNumber | null;
  quoteResponse: SwapQuoteResponse | null;
}): (tx: string) => Promise<string> {
  const solanaCtx = useSolanaCtx();
  const { fromToken, isLoading: isLoadingFromToken } = useFromToken({
    from,
    to,
  });
  const { toToken, isLoading: isLoadingToToken } = useToToken({ from, to });

  return useCallback(
    async (transaction: string) => {
      if (
        !to ||
        !fromToken ||
        !toToken ||
        isLoadingFromToken ||
        isLoadingToToken ||
        !quoteResponse
      ) {
        throw new Error("tokens not loaded");
      }
      const swapTy = swapType({ from, to });
      switch (swapTy) {
        case SwapType.Solana:
          return await sendTransactionSolana({
            solanaCtx,
            to,
            fromAmount,
            fromToken,
            toToken,
            quoteResponse,
            serializedTransaction: transaction,
          });
        case SwapType.Ethereum:
          return await sendTransactionEthereum();
        case SwapType.Wormhole:
          // todo
          throw new Error("swap not implemented for wormhole");
        default:
          throw new Error("swap not implemented for non solana blockchains");
      }
    },
    [
      from,
      to,
      fromToken,
      toToken,
      isLoadingFromToken,
      isLoadingToToken,
      quoteResponse,
      solanaCtx,
    ]
  );
}

export function useAvailableForSwap({
  from,
  to,
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
}): {
  isLoading: boolean;
  availableForSwap: BigNumber | null;
} {
  const { isLoading, fromToken } = useFromToken({ from, to });

  if (isLoading) {
    return {
      isLoading,
      availableForSwap: null,
    };
  }

  const availableForSwap = (() => {
    const swapTy = swapType({ from, to });
    const a = fromToken ? BigNumber.from(fromToken.amount) : Zero;
    switch (swapTy) {
      case SwapType.Solana:
        return availableForSwapOffsetSolana({
          from,
          availableForSwap: a,
        });
      case SwapType.Ethereum:
        return availableForSwapOffsetEthereum({
          from,
          availableForSwap: a,
        });
      case SwapType.Wormhole:
        // todo
        throw new Error("swap not implemented for wormhole");
      default:
        throw new Error("swap not implemented for non solana blockchains");
    }
  })();

  return {
    isLoading: false,
    availableForSwap,
  };
}

////////////////////////////////////////////////////////////////////////////////
// Blockchain specific utils below (can move to another file once
// the shape of this is more clear--probably best todo once we do wormhole or
// Ethereum swaps).
////////////////////////////////////////////////////////////////////////////////

function useSwapValidInputTokensSolanaFn(
  balances: CachedTokenBalance[]
): () => Promise<CachedTokenBalance[]> {
  const apollo = useApolloClient();

  return useCallback(async () => {
    const { data } = await apollo.query({
      query: GET_SWAP_VALID_INPUT_TOKENS,
      fetchPolicy: "cache-first",
      variables: {
        tokens: balances.map((b) => b.token),
      },
    });
    const mints = (data?.jupiterSwapValidInputTokens ?? []) as string[];

    return balances.filter(
      (b) => mints.includes(b.token) || b.token === SOL_NATIVE_MINT
    );
  }, [apollo, balances]);
}

// TODO: remove this function as soon as mobile is migrated over to the
//       new swap patterns.
export function useSwapValidInputTokensSolana(
  balances: CachedTokenBalance[]
): [CachedTokenBalance[], boolean] {
  const { data, loading } = useQuery(GET_SWAP_VALID_INPUT_TOKENS, {
    fetchPolicy: "cache-and-network",
    variables: {
      tokens: balances.map((b) => b.token),
    },
  });

  const values = useMemo(() => {
    const mints = (
      loading ? [] : data?.jupiterSwapValidInputTokens ?? []
    ) as string[];

    return balances.filter(
      (b) => mints.includes(b.token) || b.token === SOL_NATIVE_MINT
    );
  }, [balances, data, loading]);

  return [values, loading];
}

function useSwapOutputTokensSolanaFn(
  inputToken: string,
  outputBalances: CachedTokenBalance[]
): () => Promise<CachedTokenBalance[]> {
  const apollo = useApolloClient();

  return useCallback(async () => {
    const { data } = await apollo.query({
      query: GET_SWAP_OUTPUT_TOKENS,
      fetchPolicy: "cache-first",
      variables: {
        inputToken: inputToken === SOL_NATIVE_MINT ? WSOL_MINT : inputToken,
      },
    });

    const nodes = (() =>
      data?.jupiterSwapOutputTokens?.map((t) => {
        const b = outputBalances.find(
          (b) =>
            b.token === (t.address === WSOL_MINT ? SOL_NATIVE_MINT : t.address)
        );

        return {
          id: b?.id ?? "",
          amount: b?.amount ?? "0",
          displayAmount: b?.displayAmount ?? "0",
          marketData: {
            value: b?.marketData?.value ?? 0,
            valueChange: b?.marketData?.valueChange ?? 0,
          },
          token: t.address,
          tokenListEntry: {
            ...t,
            name: t.address === WSOL_MINT ? "Solana" : t.name,
          },
        };
      }) ?? [])();

    return nodes;
  }, [apollo, inputToken, outputBalances]);
}

// TODO: remove this function as soon as mobile is migrated over to the
//       new swap patterns.
export function useSwapOutputTokensSolana(
  inputToken: string,
  outputBalances: CachedTokenBalance[]
): [CachedTokenBalance[], boolean] {
  const { data, loading } = useQuery(GET_SWAP_OUTPUT_TOKENS, {
    fetchPolicy: "cache-and-network",
    variables: {
      inputToken: inputToken === SOL_NATIVE_MINT ? WSOL_MINT : inputToken,
    },
  });

  const nodes = useMemo<CachedTokenBalance[]>(
    () =>
      loading
        ? []
        : data?.jupiterSwapOutputTokens?.map((t) => {
            const b = outputBalances.find(
              (b) =>
                b.token ===
                (t.address === WSOL_MINT ? SOL_NATIVE_MINT : t.address)
            );

            return {
              id: b?.id ?? "",
              amount: b?.amount ?? "0",
              displayAmount: b?.displayAmount ?? "0",
              marketData: {
                value: b?.marketData?.value ?? 0,
                valueChange: b?.marketData?.valueChange ?? 0,
              },
              token: t.address,
              tokenListEntry: {
                ...t,
                name: t.address === WSOL_MINT ? "Solana" : t.name,
              },
            };
          }) ?? [],
    [outputBalances, data, loading]
  );

  return [nodes, loading];
}

enum SwapType {
  Solana,
  Ethereum,
  Wormhole,
  // TODO: add monad
}

function swapType({
  from,
  to,
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
}): SwapType {
  if (to !== null && from.blockchain !== to.blockchain) {
    return SwapType.Wormhole;
  }
  switch (from.blockchain) {
    case Blockchain.SOLANA:
      return SwapType.Solana;
    case Blockchain.ETHEREUM:
      return SwapType.Ethereum;
    default:
      throw new Error("blockchain not available for swap!");
  }
}

export { SwapQuoteResponse } from "./networks";
