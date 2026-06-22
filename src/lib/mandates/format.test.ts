import assert from "node:assert/strict";
import test from "node:test";
import {
  formatUsdcAmount,
  formatMerchant,
  formatExpiry,
  formatRemaining,
  formatCountdown,
} from "./format";

// formatUsdcAmount — render an atomic 6-decimal USDC bigint as human text.

test("formatUsdcAmount renders 0.10 USDC for 100_000n", () => {
  assert.equal(formatUsdcAmount(100_000n), "0.10 USDC");
});

test("formatUsdcAmount renders a clean integer", () => {
  assert.equal(formatUsdcAmount(1_000_000n), "1.00 USDC");
});

test("formatUsdcAmount preserves precision when not a clean fraction", () => {
  assert.equal(formatUsdcAmount(123_456n), "0.123456 USDC");
});

test("formatUsdcAmount renders 0.00 USDC for zero", () => {
  assert.equal(formatUsdcAmount(0n), "0.00 USDC");
});

test("formatUsdcAmount does not silently round 1n to 0.00", () => {
  // Defensive: a 1-atomic-unit amount must NOT display as 0.00 — that would lie.
  assert.equal(formatUsdcAmount(1n), "0.000001 USDC");
});

test("formatUsdcAmount renders 10.00 USDC for 10_000_000n (total cap range)", () => {
  assert.equal(formatUsdcAmount(10_000_000n), "10.00 USDC");
});

// formatMerchant — truncate an EVM address for legible display.

test("formatMerchant truncates a checksummed address to 0x8C54…1Fb7", () => {
  assert.equal(
    formatMerchant("0x8C54783849A2C042544efc37c4657Ee98a411Fb7"),
    "0x8C54…1Fb7"
  );
});

test("formatMerchant preserves casing in the visible chunks", () => {
  assert.equal(
    formatMerchant("0xDEADBEEFcafebabeDEADBEEFcafebabeDEADBEEF"),
    "0xDEAD…BEEF"
  );
});

test("formatMerchant accepts lowercase addresses", () => {
  assert.equal(
    formatMerchant("0x8c54783849a2c042544efc37c4657ee98a411fb7"),
    "0x8c54…1fb7"
  );
});

test("formatMerchant throws on an obviously malformed input", () => {
  assert.throws(() => formatMerchant("not-an-address"), /address/i);
});

// formatExpiry — render an expiry timestamp as localized + relative.

test("formatExpiry shows a relative future time when expiry is ahead of now", () => {
  const now = 1_750_000_000_000; // arbitrary fixed ms
  const future = Math.floor(now / 1000) + 4 * 3600 + 12 * 60; // +4h 12m
  const out = formatExpiry(future, now);
  assert.match(out, /in 4h 12m/);
  assert.doesNotMatch(out, /expired/i);
});

test("formatExpiry shows '(expired)' when expiry is in the past", () => {
  const now = 1_750_000_000_000;
  const past = Math.floor(now / 1000) - 60;
  assert.match(formatExpiry(past, now), /\(expired\)/);
});

test("formatExpiry shows '(expired)' for an expiry equal to now", () => {
  const now = 1_750_000_000_000;
  const same = Math.floor(now / 1000);
  assert.match(formatExpiry(same, now), /\(expired\)/);
});

// formatRemaining — render a "used vs cap" pair.

test("formatRemaining returns 0% when nothing is used", () => {
  const r = formatRemaining(0n, 100_000n);
  assert.equal(r.percent, 0);
  assert.equal(r.display, "0.10 / 0.10 USDC");
});

test("formatRemaining returns 50% when half is used", () => {
  const r = formatRemaining(50_000n, 100_000n);
  assert.equal(r.percent, 50);
  assert.equal(r.display, "0.05 / 0.10 USDC");
});

test("formatRemaining returns 100% when fully used", () => {
  const r = formatRemaining(100_000n, 100_000n);
  assert.equal(r.percent, 100);
  assert.equal(r.display, "0.00 / 0.10 USDC");
});

test("formatRemaining clamps percent at 100 even when used > cap (defensive)", () => {
  const r = formatRemaining(150_000n, 100_000n);
  assert.equal(r.percent, 100);
});

test("formatRemaining handles a zero cap without dividing by zero", () => {
  const r = formatRemaining(0n, 0n);
  assert.equal(r.percent, 100);
  assert.equal(r.display, "0.00 / 0.00 USDC");
});

// formatCountdown — render seconds-until-expiry as compact text.

test("formatCountdown renders 4h 0m for 4 hours", () => {
  assert.equal(formatCountdown(4 * 3600), "4h 0m");
});

test("formatCountdown renders 4h 12m for 4h12m", () => {
  assert.equal(formatCountdown(4 * 3600 + 12 * 60), "4h 12m");
});

test("formatCountdown renders 2m 0s for 120 seconds", () => {
  assert.equal(formatCountdown(120), "2m 0s");
});

test("formatCountdown renders '<1m' for < 60s positive", () => {
  assert.equal(formatCountdown(30), "<1m");
});

test("formatCountdown renders 'expired' for 0", () => {
  assert.equal(formatCountdown(0), "expired");
});

test("formatCountdown renders 'expired' for negative", () => {
  assert.equal(formatCountdown(-30), "expired");
});

test("formatCountdown renders days for >24h", () => {
  // 2 days, 3 hours
  assert.equal(formatCountdown(2 * 86400 + 3 * 3600), "2d 3h");
});
