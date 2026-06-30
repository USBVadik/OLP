import { type Address } from "viem";

export type SupportedChainKey = "base" | "arbitrum" | "optimism";
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

// Optimism is kept as an experimental zero-balance settlement probe. It forces the UA
// rail to attempt cross-chain sourcing, but live settlement is not yet proven while
// Particle's Universal Accounts V2 migration is affecting cross-chain rails.
export const OPTIMISM_CHAIN: ChainPaymentConfig = {
  key: "optimism",
  name: "Optimism",
  chainId: Number(process.env.NEXT_PUBLIC_OPTIMISM_CHAIN_ID ?? 10),
  usdcAddress:
    (process.env.NEXT_PUBLIC_OPTIMISM_USDC_ADDRESS as Address | undefined) ??
    "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  explorerTxBaseUrl: "https://optimistic.etherscan.io/tx",
  receiptEmitterAddress: null,
  active: false,
};

export const PAYMENT_CHAINS = {
  base: BASE_CHAIN,
  arbitrum: ARBITRUM_CHAIN,
  optimism: OPTIMISM_CHAIN,
} as const;

export function getActivePaymentChain(): ChainPaymentConfig {
  return BASE_CHAIN;
}

/** Look up a supported settlement chain by numeric chainId. Throws if unknown. */
export function getPaymentChainById(chainId: number): ChainPaymentConfig {
  const chain = Object.values(PAYMENT_CHAINS).find((candidate) => candidate.chainId === chainId);
  if (!chain) throw new Error(`Unsupported payment chain: ${chainId}`);
  return chain;
}

/**
 * The proof-anchor chain. The ReceiptEmitter contract and the owner gas wallet live here,
 * so InvoicePaid proofs are always recorded on this chain — independent of which chain the
 * USDC actually settles on (a cross-chain payment can settle elsewhere and still anchor here).
 */
export function getProofChain(): ChainPaymentConfig {
  return BASE_CHAIN;
}

export function getConfiguredPaymentMode(): PaymentMode {
  const mode = process.env.NEXT_PUBLIC_PAYMENT_MODE;
  if (mode === "universal_invoice") return "universal_invoice";
  if (mode === "universal_7702_transfer") return "universal_7702_transfer";
  return "transfer_fallback";
}

/**
 * Human-readable label for a payment mode, for judge/consumer-facing UI. The raw mode token
 * (e.g. "universal_7702_transfer") stays available in developer disclosures; this is a display
 * helper only and does not change any execution, routing, or env behavior.
 */
export function getPaymentModeLabel(mode: PaymentMode = getConfiguredPaymentMode()): string {
  switch (mode) {
    case "universal_7702_transfer":
      return "Universal Account";
    case "universal_invoice":
      return "Universal invoice";
    case "transfer_fallback":
    default:
      return "Instant USDC";
  }
}

export function getExplorerTxUrl(chain: ChainPaymentConfig, txHash: string): string {
  return `${chain.explorerTxBaseUrl}/${txHash}`;
}

/**
 * UniversalX activity URL for a Particle Universal Account transaction. The UA transactionId
 * (returned by `ua.sendTransaction`) is NOT a single-chain tx hash — it identifies the whole
 * cross-chain orchestration (deposit/lending/settlement legs). UniversalX is the canonical
 * explorer for that activity, so it is the correct link for UA/7702 payments. Returns null when
 * no transactionId is available (e.g. the non-UA fallback path).
 */
export function getUniversalXActivityUrl(transactionId: string | null | undefined): string | null {
  if (!transactionId) return null;
  return `https://universalx.app/activity/details?id=${encodeURIComponent(transactionId)}`;
}

export function getPublicRpcUrl(chain: ChainPaymentConfig): string {
  if (chain.key === "arbitrum") {
    return process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";
  }
  if (chain.key === "optimism") {
    return process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || "https://mainnet.optimism.io";
  }
  return process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";
}
