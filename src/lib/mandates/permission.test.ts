import { test } from "node:test";
import assert from "node:assert/strict";
import { type Hex } from "viem";
import { describePermission } from "./permission";
import { type PaymentMandate } from "./types";

const ZERO_NONCE = ("0x" + "00".repeat(32)) as Hex;

/** A realistic agent-budget mandate: 0.10 / charge, 2.00 / day, 10.00 total, far-future expiry. */
const BASE: PaymentMandate = {
  payer: "0x53Bd615635Af778e5E460d5EEC2d6b234693206a",
  merchant: "0x8C54783849A2C042544efc37c4657Ee98a411Fb7",
  token: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  chainId: 42161,
  maxPerCharge: 100_000n, // 0.10 USDC
  maxPerDay: 2_000_000n, // 2.00 USDC
  totalCap: 10_000_000n, // 10.00 USDC
  expiry: 4_000_000_000, // year ~2096
  nonce: ZERO_NONCE,
};

// A fixed "now" well before BASE.expiry so the expiry-relative assertions are deterministic.
const NOW_MS = 1_000_000_000 * 1000; // 2001-09-09, long before expiry 4e9s

test("describePermission: merchant is truncated to the containment scope", () => {
  assert.equal(describePermission(BASE, NOW_MS).merchant, "0x8C54…1Fb7");
});

test("describePermission: per-action and total render as human USDC", () => {
  const p = describePermission(BASE, NOW_MS);
  assert.equal(p.perAction, "0.10 USDC");
  assert.equal(p.total, "10.00 USDC");
});

test("describePermission: daily is the cap when set, null when there is no daily limit", () => {
  assert.equal(describePermission(BASE, NOW_MS).daily, "2.00 USDC");
  assert.equal(describePermission({ ...BASE, maxPerDay: 0n }, NOW_MS).daily, null);
});

test("describePermission: expired flag reflects now vs. expiry", () => {
  assert.equal(describePermission(BASE, NOW_MS).expired, false);
  assert.equal(describePermission({ ...BASE, expiry: 500 }, NOW_MS).expired, true);
});

test("describePermission: maxCharges floors total/per-action and never divides by zero", () => {
  assert.equal(describePermission(BASE, NOW_MS).maxCharges, 100); // 10.00 / 0.10
  assert.equal(describePermission({ ...BASE, maxPerCharge: 0n }, NOW_MS).maxCharges, 0);
});
