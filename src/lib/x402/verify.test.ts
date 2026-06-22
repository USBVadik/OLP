import assert from "node:assert/strict";
import test from "node:test";
import { isPaymentSufficient } from "./verify";
import {
  buildPaymentRequirements,
  X402_SCHEME,
  type X402PaymentProof,
} from "./requirements";

const MERCHANT = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7" as const;
const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const;
const POLICY = "0x9782e3724859469fbBAC5085EA8bf8E70724164E" as const;
const OTHER = "0x000000000000000000000000000000000000dEaD" as const;

const reqs = buildPaymentRequirements({
  resource: "/api/x402/market-insight",
  description: "Market insight snapshot",
  priceAtomic: 50_000n,
  payTo: MERCHANT,
  asset: USDC,
  network: "arbitrum",
  mandatePolicy: POLICY,
});

function proof(overrides: Partial<X402PaymentProof> = {}): X402PaymentProof {
  return {
    scheme: X402_SCHEME,
    txHash: "0xabc",
    amount: "50000",
    asset: USDC,
    payTo: MERCHANT,
    resource: "/api/x402/market-insight",
    ...overrides,
  };
}

test("exact-amount, matching asset/payTo/resource passes", () => {
  assert.deepEqual(isPaymentSufficient(proof(), reqs), { ok: true });
});

test("over-payment also passes (>= required)", () => {
  assert.deepEqual(isPaymentSufficient(proof({ amount: "60000" }), reqs), { ok: true });
});

test("under-payment fails", () => {
  const r = isPaymentSufficient(proof({ amount: "49999" }), reqs);
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /amount/i);
});

test("wrong asset fails", () => {
  const r = isPaymentSufficient(proof({ asset: OTHER }), reqs);
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /asset/i);
});

test("wrong payTo fails", () => {
  const r = isPaymentSufficient(proof({ payTo: OTHER }), reqs);
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /recipient|payTo/i);
});

test("wrong resource fails", () => {
  const r = isPaymentSufficient(proof({ resource: "/api/x402/other" }), reqs);
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /resource/i);
});

test("asset comparison is case-insensitive (checksummed vs lowercase)", () => {
  const r = isPaymentSufficient(proof({ asset: USDC.toLowerCase() as `0x${string}` }), reqs);
  assert.deepEqual(r, { ok: true });
});

test("payTo comparison is case-insensitive", () => {
  const r = isPaymentSufficient(proof({ payTo: MERCHANT.toLowerCase() as `0x${string}` }), reqs);
  assert.deepEqual(r, { ok: true });
});

test("non-numeric amount fails safely", () => {
  const r = isPaymentSufficient(proof({ amount: "not-a-number" }), reqs);
  assert.equal(r.ok, false);
});
