import assert from "node:assert/strict";
import test from "node:test";
import { assertFundingEvidenceIdentity, type FundingEvidenceIdentity } from "./funding-evidence-store";

const identity: FundingEvidenceIdentity = {
  ua_transaction_id: "0x0655f16e0cd6c8",
  mandate_id: `0x${"77".repeat(32)}`,
  payer_address: "0x53Bd615635Af778e5E460d5EEC2d6b234693206a",
  settlement_chain_id: 42161,
  token_address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  spend_policy_address: "0x9782e3724859469fbBAC5085EA8bf8E70724164E",
  required_amount: "2000000",
};

test("accepts an idempotent replay of the same immutable funding evidence", () => {
  assert.doesNotThrow(() =>
    assertFundingEvidenceIdentity(identity, {
      ...identity,
      payer_address: identity.payer_address.toLowerCase(),
      token_address: identity.token_address.toUpperCase(),
    }),
  );
});

test("rejects reusing a Particle transactionId for a different payer or amount", () => {
  assert.throws(
    () =>
      assertFundingEvidenceIdentity(identity, {
        ...identity,
        payer_address: "0x0000000000000000000000000000000000000001",
      }),
    /different Expense Card funding parameters/,
  );
  assert.throws(
    () => assertFundingEvidenceIdentity(identity, { ...identity, required_amount: "1" }),
    /different Expense Card funding parameters/,
  );
});
