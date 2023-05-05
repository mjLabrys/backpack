// import type { EthereumTokenInfo } from "../../atoms/ethereum/ZeroXSwap";
import type { TokenInfo } from "@solana/spl-token-registry";
import { useRecoilValue } from "recoil";

import * as atoms from "../../atoms";
import type { TokenData } from "../../types";

export function useZeroXTokenList(): Array<TokenInfo> {
  return useRecoilValue(atoms.zeroXTokenList);
}

export function useZeroXSwapTokenMap(): Map<string, TokenInfo> {
  return useRecoilValue(atoms.zeroXTokenMap);
}

export function useZeroXOutputTokens(inputMint: string): Array<TokenData> {
  return useRecoilValue(atoms.zeroXOutputTokens({ inputMint }));
}
