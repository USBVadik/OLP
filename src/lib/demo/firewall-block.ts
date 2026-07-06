import { type Address, type Hex } from "viem";
import { type PaymentMandate, type PaymentMandateRaw } from "@/lib/mandates/types";
import { toRawMandate } from "@/lib/mandates/mandate";

/**
 * Walletless "guided live" firewall block — a fixed, pre-signed demo mandate that lets an anonymous
 * judge trigger the REAL on-chain over-cap block (no login, no funds, no gas).
 *
 * How it stays honest + safe:
 *  - The block is a real `SpendPolicy.charge` SIMULATION with a VALID payer signature. Because the
 *    contract checks the signature (step 4) BEFORE the per-charge cap (step 6), the mandate MUST be
 *    genuinely signed by the payer for the revert to be the real `PerChargeExceeded` (not
 *    `BadSignature`). So this demonstrates the actual firewall, not a fake.
 *  - The over-cap revert happens BEFORE `safeTransferFrom`, so the simulation needs NO allowance,
 *    NO funds, and moves nothing. The server always simulates with a fixed over-cap amount and
 *    never submits a transaction, so there is no relayer-gas / drain vector from the public route.
 *  - `maxPerDay`/`totalCap` are kept small; they are never reached because the per-charge cap
 *    reverts first — they only bound any theoretical exposure.
 */

/** The demo payer (Magic embedded wallet used across the demo). */
export const DEMO_BLOCK_PAYER: Address = "0x53Bd615635Af778e5E460d5EEC2d6b234693206a";
/** The single authorized merchant payee. */
export const DEMO_BLOCK_MERCHANT: Address = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
/** Arbitrum One USDC — the chain where SpendPolicy is deployed and this mandate is enforced. */
export const DEMO_BLOCK_TOKEN: Address = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
export const DEMO_BLOCK_CHAIN_ID = 42161;

/** Far-future expiry so the pre-signed mandate stays valid through the event (2027-01-01Z). */
export const DEMO_BLOCK_EXPIRY = 1798761600;
/** Fixed nonce → the mandate (and thus its one-time signature) is stable and reproducible. */
export const DEMO_BLOCK_NONCE: Hex =
  "0xa1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

/** Per-charge cap: 0.10 USDC. The agent's attempt below exceeds it → PerChargeExceeded. */
export const DEMO_BLOCK_PER_CHARGE = 100_000n;

/** The fixed, deterministic demo mandate (the exact struct the payer signs once). */
export const DEMO_BLOCK_MANDATE: PaymentMandate = {
  payer: DEMO_BLOCK_PAYER,
  merchant: DEMO_BLOCK_MERCHANT,
  token: DEMO_BLOCK_TOKEN,
  chainId: DEMO_BLOCK_CHAIN_ID,
  maxPerCharge: DEMO_BLOCK_PER_CHARGE, // 0.10 USDC
  maxPerDay: 2_000_000n, // 2 USDC (never reached — per-charge cap reverts first)
  totalCap: 2_000_000n, // 2 USDC
  expiry: DEMO_BLOCK_EXPIRY,
  nonce: DEMO_BLOCK_NONCE,
};

/** The agent's attempted charge for the walletless demo: 0.50 USDC — 5× over the 0.10 cap. */
export const DEMO_BLOCK_ATTEMPT_AMOUNT = 500_000n;

/** Raw (string-encoded) form of the demo mandate, for the charge simulation / signing. */
export function demoBlockRawMandate(): PaymentMandateRaw {
  return toRawMandate(DEMO_BLOCK_MANDATE);
}

/** Human display, e.g. "0.50" / "0.10". USDC has 6 decimals; demo amounts are cent-precision. */
export function usdc(amount: bigint): string {
  return (Number(amount) / 1_000_000).toFixed(2);
}
