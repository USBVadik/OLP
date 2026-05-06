import { formatUnits, parseUnits, type Address } from "viem";
import { BASE_CHAIN, PAYMENT_CHAINS, type SupportedChainKey } from "@/lib/config/payment";

export interface PaymentTokenConfig {
  symbol: "USDC" | "USDT" | "ETH";
  address: Address;
  decimals: number;
  particleType: "usdc" | "usdt" | "eth";
  isNative: boolean;
}

export const CHAIN_TOKENS: Record<SupportedChainKey, Record<PaymentTokenConfig["symbol"], PaymentTokenConfig>> = {
  base: {
  USDC: {
    symbol: "USDC",
    address: PAYMENT_CHAINS.base.usdcAddress,
    decimals: 6,
    particleType: "usdc",
    isNative: false,
  },
  USDT: {
    symbol: "USDT",
    address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    decimals: 6,
    particleType: "usdt",
    isNative: false,
  },
  ETH: {
    symbol: "ETH",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    particleType: "eth",
    isNative: true,
  },
  },
  arbitrum: {
    USDC: {
      symbol: "USDC",
      address: PAYMENT_CHAINS.arbitrum.usdcAddress,
      decimals: 6,
      particleType: "usdc",
      isNative: false,
    },
    USDT: {
      symbol: "USDT",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 6,
      particleType: "usdt",
      isNative: false,
    },
    ETH: {
      symbol: "ETH",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      particleType: "eth",
      isNative: true,
    },
  },
};

export const BASE_MAINNET_TOKENS = CHAIN_TOKENS.base;

export function resolvePaymentToken(
  token: string,
  chainId: number = BASE_CHAIN.chainId
): PaymentTokenConfig {
  const chain = Object.values(PAYMENT_CHAINS).find((candidate) => candidate.chainId === chainId);
  const tokens = chain ? CHAIN_TOKENS[chain.key] : CHAIN_TOKENS.base;
  const normalized = token.trim().toUpperCase();
  const bySymbol = tokens[normalized as PaymentTokenConfig["symbol"]];
  if (bySymbol) return bySymbol;

  const byAddress = Object.values(tokens).find(
    (candidate) => candidate.address.toLowerCase() === token.trim().toLowerCase()
  );
  if (byAddress) return byAddress;

  throw new Error(`Unsupported payment token: ${token}`);
}

export function formatAtomicTokenAmount(
  atomicAmount: string,
  token: PaymentTokenConfig
): string {
  return formatUnits(BigInt(atomicAmount), token.decimals);
}

export function parseTokenAmountToAtomic(
  displayAmount: string,
  token: PaymentTokenConfig
): string {
  return parseUnits(displayAmount.trim(), token.decimals).toString();
}
