/**
 * Pure formatting helpers for the legible mandate card and budget HUD.
 *
 * All functions are pure and deterministic: no DOM, no clock, no I/O. Time-dependent
 * helpers accept the current time as a parameter so tests stay deterministic.
 *
 * USDC has 6 decimals throughout this codebase. Atomic amounts are always `bigint`.
 */

const USDC_DECIMALS = 6n;
const USDC_SCALE = 1_000_000n; // 10n ** 6n

/**
 * Render an atomic 6-decimal USDC amount as human text, never silently rounding
 * a non-zero amount to "0.00".
 *
 *   100_000n   -> "0.10 USDC"
 *   1_000_000n -> "1.00 USDC"
 *   123_456n   -> "0.123456 USDC"  (preserve precision when not a clean fraction)
 *   1n         -> "0.000001 USDC"  (do NOT round to 0.00)
 *   0n         -> "0.00 USDC"
 */
export function formatUsdcAmount(atomic: bigint): string {
  const negative = atomic < 0n;
  const abs = negative ? -atomic : atomic;

  const whole = abs / USDC_SCALE;
  const fraction = abs % USDC_SCALE;

  let body: string;
  if (fraction === 0n) {
    body = `${whole}.00`;
  } else {
    // 6 decimals zero-padded
    let frac6 = fraction.toString().padStart(Number(USDC_DECIMALS), "0");
    // If the value has cents-precision (last 4 digits are zero), display as 2 decimals.
    // Otherwise show all 6 digits to never round a non-zero amount to 0.00.
    if (/0000$/.test(frac6)) {
      frac6 = frac6.slice(0, 2);
    } else {
      // Strip trailing zeros only if at least one non-zero digit remains.
      const stripped = frac6.replace(/0+$/, "");
      frac6 = stripped.length > 0 ? stripped : "00";
    }
    body = `${whole}.${frac6}`;
  }

  return `${negative ? "-" : ""}${body} USDC`;
}

/**
 * Truncate an EVM address for legible display, preserving the user-visible
 * leading and trailing hex chunks.
 *
 *   0x8C54783849A2C042544efc37c4657Ee98a411Fb7 -> "0x8C54…1Fb7"
 */
export function formatMerchant(addr: string): string {
  if (typeof addr !== "string" || !addr.startsWith("0x") || addr.length !== 42) {
    throw new Error(`formatMerchant: invalid address: ${String(addr)}`);
  }
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Render an expiry as `Mon DD, HH:MM (in <relative>)` or `(expired)`.
 *
 *   future expiry -> "Jun 22, 23:59 (in 4h 12m)"
 *   past expiry   -> "Jun 22, 23:59 (expired)"
 */
export function formatExpiry(unixSeconds: number, nowMs: number = Date.now()): string {
  const expiryMs = unixSeconds * 1000;
  const d = new Date(expiryMs);
  const dateLabel = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const remainingSeconds = Math.floor((expiryMs - nowMs) / 1000);
  if (remainingSeconds <= 0) {
    return `${dateLabel} (expired)`;
  }
  return `${dateLabel} (in ${formatCountdown(remainingSeconds)})`;
}

/**
 * Render just the calendar date of an expiry in the same fixed English format as
 * `formatExpiry` (no locale dependence), e.g. "Jul 7". Used by compact scope rows
 * that only need the day, not the time or countdown — so the UI never mixes a
 * localized date (e.g. "7 июл.") with the rest of the English copy.
 */
export function formatShortDate(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Render a "remaining / cap" pair as a display string + integer percent.
 *
 *   used=15_000n cap=100_000n -> { display: "0.085 / 0.10 USDC", percent: 85 }
 *
 * `percent` represents the percent CONSUMED, clamped to [0, 100], so a progress
 * bar can render `width: percent%` directly.
 */
export function formatRemaining(used: bigint, cap: bigint): {
  display: string;
  percent: number;
} {
  const remaining = cap > used ? cap - used : 0n;
  const display = `${formatUsdcAmount(remaining).replace(" USDC", "")} / ${formatUsdcAmount(cap)}`;

  let percent: number;
  if (cap === 0n) {
    // Defensive: cap=0 means there's no headroom by definition.
    percent = 100;
  } else {
    // Compute percent in bigint to avoid Number precision loss on large caps.
    const pct = (used * 100n) / cap;
    percent = Number(pct);
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
  }

  return { display, percent };
}

/**
 * Render a remaining-time interval (in seconds) as compact text.
 *
 *   <= 0  -> "expired"
 *   < 60  -> "<1m"
 *   < 1h  -> "Xm Ys"
 *   < 1d  -> "Xh Ym"
 *   >= 1d -> "Xd Yh"
 */
export function formatCountdown(secondsRemaining: number): string {
  if (secondsRemaining <= 0) return "expired";
  if (secondsRemaining < 60) return "<1m";
  if (secondsRemaining < 3600) {
    const m = Math.floor(secondsRemaining / 60);
    const s = secondsRemaining - m * 60;
    return `${m}m ${s}s`;
  }
  if (secondsRemaining < 86400) {
    const h = Math.floor(secondsRemaining / 3600);
    const m = Math.floor((secondsRemaining - h * 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(secondsRemaining / 86400);
  const h = Math.floor((secondsRemaining - d * 86400) / 3600);
  return `${d}d ${h}h`;
}
