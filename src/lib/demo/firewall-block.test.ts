import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_BLOCK_MANDATE,
  DEMO_BLOCK_ATTEMPT_AMOUNT,
  DEMO_BLOCK_PER_CHARGE,
  DEMO_BLOCK_CHAIN_ID,
  DEMO_BLOCK_NONCE,
  DEMO_BLOCK_EXPIRY,
  demoBlockRawMandate,
  usdc,
} from "./firewall-block";

test("the attempt is genuinely OVER the per-charge cap (so the revert is PerChargeExceeded)", () => {
  assert.ok(DEMO_BLOCK_ATTEMPT_AMOUNT > DEMO_BLOCK_MANDATE.maxPerCharge);
  assert.equal(DEMO_BLOCK_MANDATE.maxPerCharge, DEMO_BLOCK_PER_CHARGE);
});

test("mandate is enforced where SpendPolicy is live (Arbitrum One)", () => {
  assert.equal(DEMO_BLOCK_MANDATE.chainId, 42161);
  assert.equal(DEMO_BLOCK_CHAIN_ID, 42161);
});

test("expiry is far in the future (won't expire before the revert reason we want)", () => {
  const now = Math.floor(Date.now() / 1000);
  assert.ok(DEMO_BLOCK_EXPIRY > now + 30 * 86_400, "expiry should be well beyond the event window");
});

test("nonce is a fixed 32-byte hex (stable, reproducible signature)", () => {
  assert.match(DEMO_BLOCK_NONCE, /^0x[0-9a-f]{64}$/);
});

test("raw mandate serializes uint fields to strings for the wire / simulation", () => {
  const raw = demoBlockRawMandate();
  assert.equal(raw.maxPerCharge, "100000");
  assert.equal(raw.totalCap, "2000000");
  assert.equal(raw.payer, DEMO_BLOCK_MANDATE.payer);
  assert.equal(typeof raw.expiry, "number");
});

test("usdc display formats atomic amounts", () => {
  assert.equal(usdc(500_000n), "0.50");
  assert.equal(usdc(100_000n), "0.10");
  assert.equal(usdc(2_000_000n), "2.00");
});
