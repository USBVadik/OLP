import { type Address, type Hex, type TypedDataDomain, hashTypedData, toHex } from "viem";
import { type MandatePreset, type PaymentMandate, type PaymentMandateRaw } from "./types";

export const MANDATE_PRIMARY_TYPE = "PaymentMandate" as const;

/**
 * EIP-712 type for a PaymentMandate. Kept byte-compatible with the on-chain
 * SpendPolicy verifier (Task 5) so the same signature validates on-chain.
 */
export const MANDATE_EIP712_TYPES = {
  PaymentMandate: [
    { name: "payer", type: "address" },
    { name: "merchant", type: "address" },
    { name: "token", type: "address" },
    { name: "chainId", type: "uint256" },
    { name: "maxPerCharge", type: "uint256" },
    { name: "maxPerDay", type: "uint256" },
    { name: "totalCap", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

/** SpendPolicy verifying contract address, per settlement chain. Zero until deployed. */
export function getSpendPolicyAddress(chainId?: number): Address {
  // Arbitrum One has its own SpendPolicy deployment.
  if (chainId === 42161) {
    return (process.env.NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM as Address | undefined) ?? ZERO_ADDRESS;
  }
  return (process.env.NEXT_PUBLIC_SPEND_POLICY_ADDRESS as Address | undefined) ?? ZERO_ADDRESS;
}

export function getMandateDomain(chainId: number, verifyingContract?: Address): TypedDataDomain {
  return {
    name: "OneLink Pay",
    version: "1",
    chainId,
    verifyingContract: verifyingContract ?? getSpendPolicyAddress(chainId),
  };
}

/** Convert to the viem EIP-712 message form (uint fields as bigint). */
export function toTypedMessage(m: PaymentMandate) {
  return {
    payer: m.payer,
    merchant: m.merchant,
    token: m.token,
    chainId: BigInt(m.chainId),
    maxPerCharge: m.maxPerCharge,
    maxPerDay: m.maxPerDay,
    totalCap: m.totalCap,
    expiry: BigInt(m.expiry),
    nonce: m.nonce,
  };
}

/** Full typed-data payload for wallet signing (viem signTypedData). */
export function buildMandateTypedData(m: PaymentMandate, verifyingContract?: Address) {
  return {
    domain: getMandateDomain(m.chainId, verifyingContract),
    types: MANDATE_EIP712_TYPES,
    primaryType: MANDATE_PRIMARY_TYPE,
    message: toTypedMessage(m),
  } as const;
}

/** Deterministic mandate id = EIP-712 digest of the mandate. */
export function computeMandateId(m: PaymentMandate, verifyingContract?: Address): Hex {
  return hashTypedData(buildMandateTypedData(m, verifyingContract));
}

/** 32-byte random salt (works in browser and Node 18+). */
export function randomNonce(): Hex {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function toRawMandate(m: PaymentMandate): PaymentMandateRaw {
  return {
    payer: m.payer,
    merchant: m.merchant,
    token: m.token,
    chainId: m.chainId,
    maxPerCharge: m.maxPerCharge.toString(),
    maxPerDay: m.maxPerDay.toString(),
    totalCap: m.totalCap.toString(),
    expiry: m.expiry,
    nonce: m.nonce,
  };
}

export function fromRawMandate(r: PaymentMandateRaw): PaymentMandate {
  return {
    payer: r.payer,
    merchant: r.merchant,
    token: r.token,
    chainId: r.chainId,
    maxPerCharge: BigInt(r.maxPerCharge),
    maxPerDay: BigInt(r.maxPerDay),
    totalCap: BigInt(r.totalCap),
    expiry: r.expiry,
    nonce: r.nonce,
  };
}

const DAY = 86_400;

export interface DeriveMandateInput {
  payer: Address;
  merchant: Address;
  token: Address;
  chainId: number;
  /** Atomic amount of the current charge — the basis for suggested caps. */
  invoiceAmount: bigint;
  preset: MandatePreset;
  /** Override "now" (unix seconds) for deterministic tests. */
  now?: number;
}

/**
 * Suggest a sensible scoped mandate for the Permission Firewall preview.
 * - one_time: a single charge, capped to exactly this amount, valid 7 days.
 * - subscription: same per-charge, up to ~4 cycles, valid 28 days.
 * - agent_budget: small per-call cap, a daily budget, capped lifetime, 24h.
 */
export function deriveMandate(input: DeriveMandateInput): PaymentMandate {
  const now = input.now ?? Math.floor(Date.now() / 1000);
  const a = input.invoiceAmount;

  let maxPerCharge = a;
  let maxPerDay = a;
  let totalCap = a;
  let expiry = now + 7 * DAY;

  if (input.preset === "subscription") {
    maxPerCharge = a;
    maxPerDay = a;
    totalCap = a * BigInt(4);
    expiry = now + 28 * DAY;
  } else if (input.preset === "agent_budget") {
    maxPerCharge = a;
    maxPerDay = a * BigInt(20);
    totalCap = a * BigInt(100);
    expiry = now + DAY;
  }

  return {
    payer: input.payer,
    merchant: input.merchant,
    token: input.token,
    chainId: input.chainId,
    maxPerCharge,
    maxPerDay,
    totalCap,
    expiry,
    nonce: randomNonce(),
  };
}

export interface CustomMandateInput {
  payer: Address;
  merchant: Address;
  token: Address;
  chainId: number;
  /** Atomic caps (USDC = 6 decimals). maxPerDay = 0 means no daily limit. */
  maxPerCharge: bigint;
  maxPerDay: bigint;
  totalCap: bigint;
  /** Unix seconds. */
  expiry: number;
  /** Deterministic nonce override (tests); a fresh 32-byte salt is rolled otherwise. */
  nonce?: Hex;
}

/**
 * Pro-mode "advanced limits": build a mandate from user-chosen caps instead of a preset. It produces
 * the SAME `PaymentMandate` shape as `deriveMandate`, so it flows through the identical EIP-712
 * struct/domain and on-chain SpendPolicy verification — only the numbers differ. Validation
 * (positive, ordered caps) lives in the UI; the contract enforces the caps regardless.
 */
export function mandateFromCustomCaps(input: CustomMandateInput): PaymentMandate {
  return {
    payer: input.payer,
    merchant: input.merchant,
    token: input.token,
    chainId: input.chainId,
    maxPerCharge: input.maxPerCharge,
    maxPerDay: input.maxPerDay,
    totalCap: input.totalCap,
    expiry: input.expiry,
    nonce: input.nonce ?? randomNonce(),
  };
}
