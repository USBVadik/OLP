import { type Address } from "viem";

export type SupportedChainKey = "base" | "arbitrum";
export type PaymentMode = "transfer_fallback" | "universal_invoice" | "universal_7702_transfer";

export interface ChainPaymentConfig {
  key: SupportedChainKey;
  name: string;
  chainId: number;
  usdcAddress: Address;
  explorerTxBaseUrl: string;
  receiptEmitterAddress: Address | null;
  active: boolean;
}

export const BASE_CHAIN: ChainPaymentConfig = {
  key: "base",
  name: "Base",
  chainId: 8453,
  usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  explorerTxBaseUrl: "https://basescan.org/tx",
  receiptEmitterAddress:
    (process.env.NEXT_PUBLIC_RECEIPT_EMITTER_ADDRESS as Address | undefined) ?? null,
  active: true,
};

export const ARBITRUM_CHAIN: ChainPaymentConfig = {
  key: "arbitrum",
  name: "Arbitrum",
  chainId: Number(process.env.NEXT_PUBLIC_ARBITRUM_CHAIN_ID ?? 42161),
  usdcAddress:
    (process.env.NEXT_PUBLIC_ARBITRUM_USDC_ADDRESS as Address | undefined) ??
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  explorerTxBaseUrl: "https://arbiscan.io/tx",
  receiptEmitterAddress:
    (process.env.NEXT_PUBLIC_ARBITRUM_RECEIPT_EMITTER_ADDRESS as Address | undefined) || null,
  active: false,
};

export const PAYMENT_CHAINS = {
  base: BASE_CHAIN,
  arbitrum: ARBITRUM_CHAIN,
} as const;

export function getActivePaymentChain(): ChainPaymentConfig {
  return BASE_CHAIN;
}

export function getConfiguredPaymentMode(): PaymentMode {
  const mode = process.env.NEXT_PUBLIC_PAYMENT_MODE;
  if (mode === "universal_invoice") return "universal_invoice";
  if (mode === "universal_7702_transfer") return "universal_7702_transfer";
  return "transfer_fallback";
}

export function getExplorerTxUrl(chain: ChainPaymentConfig, txHash: string): string {
  return `${chain.explorerTxBaseUrl}/${txHash}`;
}

export function getPublicRpcUrl(chain: ChainPaymentConfig): string {
  if (chain.key === "arbitrum") {
    return process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";
  }
  return process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";
}
