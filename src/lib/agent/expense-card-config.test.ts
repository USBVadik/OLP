import assert from "node:assert/strict";
import test from "node:test";
import type { Address, Hex } from "viem";
import type { PaymentMandate } from "@/lib/mandates/types";
import {
  assertResearchAgentFundingMandate,
  RESEARCH_AGENT_BASIS_ATOMIC,
  RESEARCH_AGENT_DAILY_FUNDING_ATOMIC,
  RESEARCH_AGENT_MERCHANT,
  RESEARCH_AGENT_TOTAL_CAP_ATOMIC,
} from "./expense-card-config";

const PAYER: Address = "0x53Bd615635Af778e5E460d5EEC2d6b234693206a";
const TOKEN: Address = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

function mandate(overrides: Partial<PaymentMandate> = {}): PaymentMandate {
  return {
    payer: PAYER,
    merchant: RESEARCH_AGENT_MERCHANT,
    token: TOKEN,
    chainId: 42161,
    maxPerCharge: RESEARCH_AGENT_BASIS_ATOMIC,
    maxPerDay: RESEARCH_AGENT_DAILY_FUNDING_ATOMIC,
    totalCap: RESEARCH_AGENT_TOTAL_CAP_ATOMIC,
    expiry: Math.floor(Date.now() / 1000) + 3_600,
    nonce: `0x${"55".repeat(32)}` as Hex,
    ...overrides,
  };
}

const context = {
  payerAddress: PAYER,
  chainId: 42161,
  tokenAddress: TOKEN,
};

test("accepts only the exact signed Research Agent funding mandate", () => {
  assert.doesNotThrow(() => assertResearchAgentFundingMandate({ mandate: mandate(), ...context }));
});

test("rejects broader caps, wrong scope, and expired consent", () => {
  assert.throws(
    () =>
      assertResearchAgentFundingMandate({
        mandate: mandate({ maxPerDay: RESEARCH_AGENT_DAILY_FUNDING_ATOMIC + 1n }),
        ...context,
      }),
    /does not match/,
  );
  assert.throws(
    () =>
      assertResearchAgentFundingMandate({
        mandate: mandate({ merchant: "0x0000000000000000000000000000000000000001" }),
        ...context,
      }),
    /does not match/,
  );
  assert.throws(
    () =>
      assertResearchAgentFundingMandate({
        mandate: mandate({ expiry: Math.floor(Date.now() / 1000) - 1 }),
        ...context,
      }),
    /does not match/,
  );
});
