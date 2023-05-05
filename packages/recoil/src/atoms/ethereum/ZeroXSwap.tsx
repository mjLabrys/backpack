import {
  Blockchain,
  ETH_NATIVE_MINT,
  UniswapTokenList,
} from "@coral-xyz/common";
import { TokenExtensions } from "@solana/spl-token-registry";
import { selector, selectorFamily } from "recoil";

import type { TokenDataWithBalance } from "../../types";
import { blockchainBalancesSorted } from "../balance";

import { ethersContext } from "./provider";
import { ethereumTokenMetadata } from "./token-metadata";
export interface EthereumTokenInfo {
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  logoURI?: string;
}

// // Load the route map
// const zeroXRouteMap = selector({
//   key: "zeroXRouteMap",
//   get: async () => {
//     try {
//       const [response, topTokensReversed] = await (async () => {
//         const url = "https://tokens.coingecko.com/uniswap/all.json";
//         const res = await fetch(url);
//         return [await res.json(), []];
//       })();

//       const getToken = (index: number) => response["tokens"][index];
//       return Object.keys(response["indexedRouteMap"]).reduce((acc, key) => {
//         acc[getToken(parseInt(key))] = response["indexedRouteMap"][key].map(
//           (i: number) => getToken(i)
//         );

//         return acc;
//       }, {});
//     } catch (e) {
//       console.log("failed to load stuff");
//       return null;
//     }
//   },
// });

export const zeroXTokenList = selector<EthereumTokenInfo[]>({
  key: "zeroXTokenList",
  get: () => {
    return UniswapTokenList.tokens;
  },
});

export const zeroXTokenMap = selector<Map<string, EthereumTokenInfo>>({
  key: "zeroXTokenMap",
  get: ({ get }) => {
    const tokens = get(zeroXTokenList);
    const m = new Map();
    for (const t of tokens) {
      m.set(t.address, t);
    }
    return m;
  },
});

// All input tokens
const allZeroXInputMints = selector({
  key: "allZeroXInputMints",
  get: ({ get }) => {
    const tokens = get(zeroXTokenList);
    const inputTokens = tokens.map((token) => token.address);
    return inputTokens;
  },
});

// Tokens with positive balance that can be swapped from
export const zeroXInputTokens = selectorFamily({
  key: "zeroXInputTokens",
  get:
    ({ publicKey }: { publicKey: string }) =>
    async ({ get }) => {
      // Get all possible inputs
      const inputMints = get(allZeroXInputMints);
      // Get balances for the current public key
      const walletTokens = get(
        blockchainBalancesSorted({
          publicKey,
          blockchain: Blockchain.ETHEREUM,
        })
      );
      // Filter all input mints to only those that the wallet holds a
      // balance for, and always display native ETH.
      return walletTokens.filter(
        (token: TokenDataWithBalance) =>
          (inputMints.includes(token.address) && token.nativeBalance.gt(0)) ||
          token.address === ETH_NATIVE_MINT
      ) as Array<TokenDataWithBalance>;
    },
});

export const zeroXOutputTokens = selectorFamily({
  key: "zeroXOutputTokens",
  get:
    ({ inputMint }: { inputMint: string }) =>
    ({ get }: any) => {
      // Convert hex chainId to number
      const chainId = parseInt(get(ethersContext).chainId, 16);
      const tokens = get(zeroXTokenList);

      // mutate our ethereum tokens list to satisfy our backpack overlords
      const swapTokens = tokens.map((token: EthereumTokenInfo) => {
        return {
          ticker: token.symbol,
          name: token.name,
          address: token.address,
          logo: token.logoURI,
          decimals: token.decimals,
          chainId: token.chainId,
        };
      });

      const ETH_LOGO_URI =
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";
      // Push placeholder ethereum obj
      swapTokens.push({
        name: "Ethereum",
        ticker: "ETH",
        logo: ETH_LOGO_URI,
        decimals: 18,
        address: ETH_NATIVE_MINT,
        chainId: chainId,
        extensions: {
          coingeckoId: "ethereum",
        },
      });

      // Filter out tokens that don't have name, ticker, address or incorrect current chain id
      return swapTokens.filter(
        (t: any) => t.name && t.ticker && t.address && chainId === t.chainId
      );
    },
});
