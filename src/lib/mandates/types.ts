import { type Address, type Hex } from "viem";

/** Lifecycle of a permission mandate. */
export type MandateStatus = "active" | "revoked" | "expired" | "exhausted";

/** Cap-window presets surfaced in the Permission Firewall UI. */
export type MandatePreset = "one_time" | "subscription" | "agent_budget";

/**
 * PaymentMandate — the scoped, signed consent a payer grants so a merchant (or,
 * later, an autonomous agent) can pull USDC from their Universal Account within
 * explicit guardrails. Mirrors AP2-style mandates and is designed to be enforced
 * on-chain by the SpendPolicy contract. All token amounts are atomic units
 * (USDC = 6 decimals).
 */
export interface PaymentMandate {
  /** The Universal Account owner being charged. */
  payer: Address;
  /** The only address allowed to receive funds under this mandate (scope). */
  merchant: Address;
  /** Settlement token (USDC). */
  token: Address;
  /** Settlement chain id. */
  chainId: number;
  /** Hard cap for a single charge (atomic). */
  maxPerCharge: bigint;
  /** Rolling 24h cap (atomic); 0 = no daily limit. */
  maxPerDay: bigint;
  /** Lifetime cap across all charges (atomic). */
  totalCap: bigint;
  /** Unix seconds; the mandate is invalid after this. */
  expiry: number;
  /** 32-byte uniqueness salt — combined into the mandate id. */
  nonce: Hex;
}

/** Wire/storage form of a mandate (bigints serialized to decimal strings). */
export interface PaymentMandateRaw {
  payer: Address;
  merchant: Address;
  token: Address;
  chainId: number;
  maxPerCharge: string;
  maxPerDay: string;
  totalCap: string;
  expiry: number;
  nonce: Hex;
}

/** A signed + tracked mandate as persisted / surfaced to the client. */
export interface MandateRecord {
  /** EIP-712 digest of the mandate — its unique id. */
  id: Hex;
  mandate: PaymentMandateRaw;
  preset: MandatePreset;
  /** Payer's EIP-712 signature (null until signed). */
  signature: Hex | null;
  status: MandateStatus;
  /** Atomic totals spent so far against this mandate. */
  spentTotal: string;
  spentToday: string;
  createdAt: string;
  revokedAt: string | null;
}

/** One leg of the Proof Receipt shown after a verified payment. */
export interface ProofStep {
  txHash: string | null;
  chainId: number;
  explorerUrl: string | null;
}

/**
 * ProofReceipt — the shareable, verifiable consent receipt rendered on success.
 * - verified: USDC actually moved on the settlement chain.
 * - matched: amount/token/merchant matched the consented mandate.
 * - recorded: an InvoicePaid proof anchored on the proof chain (Base).
 */
export interface ProofReceipt {
  verified: ProofStep;
  matched: {
    amount: string;
    token: Address;
    merchant: Address;
    withinMandate: boolean;
  };
  recorded: ProofStep & { invoiceId: string | null };
  mandateId: Hex | null;
}
