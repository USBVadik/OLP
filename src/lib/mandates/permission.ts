import { formatExpiry, formatMerchant, formatUsdcAmount } from "./format";
import { type PaymentMandate } from "./types";

/**
 * A legible, honest summary of a signed PaymentMandate — the display model behind the
 * Permission Receipt certificate. Pure and deterministic: it composes the mandate's real
 * values through the shared formatters, so what the certificate shows can never drift from
 * what was actually signed.
 */
export interface PermissionSummary {
  /** Truncated merchant address — the only recipient this permission can pay (the containment scope). */
  merchant: string;
  /** Hard cap for a single charge, as human USDC (e.g. "0.10 USDC"). */
  perAction: string;
  /** Daily cap as human USDC, or null when there is no daily limit (maxPerDay === 0). */
  daily: string | null;
  /** Lifetime cap across all charges, as human USDC. */
  total: string;
  /** Human expiry label, e.g. "Jun 22, 23:59 (in 4h 12m)" / "… (expired)". */
  expiry: string;
  /** True when the mandate is already past its expiry (relative to `nowMs`). */
  expired: boolean;
  /** How many max-size charges fit under the total cap (floored); 0 when per-action is 0. */
  maxCharges: number;
}

/**
 * Derive the Permission Receipt display model from a mandate. `nowMs` is injectable so the
 * `expired` flag and expiry label stay deterministic under test.
 */
export function describePermission(
  mandate: PaymentMandate,
  nowMs: number = Date.now(),
): PermissionSummary {
  const expirySec = Number(mandate.expiry);
  return {
    merchant: formatMerchant(mandate.merchant),
    perAction: formatUsdcAmount(mandate.maxPerCharge),
    daily: mandate.maxPerDay > 0n ? formatUsdcAmount(mandate.maxPerDay) : null,
    total: formatUsdcAmount(mandate.totalCap),
    expiry: formatExpiry(expirySec, nowMs),
    expired: expirySec * 1000 <= nowMs,
    maxCharges: mandate.maxPerCharge > 0n ? Number(mandate.totalCap / mandate.maxPerCharge) : 0,
  };
}
