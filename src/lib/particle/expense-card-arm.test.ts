import assert from "node:assert/strict";
import test from "node:test";
import { encodeFunctionData } from "viem";
import {
  ARBITRUM_ONE_CHAIN_ID,
  buildExpenseCardArmIntent,
  ERC20_APPROVE_INTENT_ABI,
} from "./expense-card-arm";

const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const SPEND_POLICY = "0x9782e3724859469fbBAC5085EA8bf8E70724164E";

test("builds the exact Arbitrum USDC approval intent for Particle preview", () => {
  const intent = buildExpenseCardArmIntent({
    chainId: ARBITRUM_ONE_CHAIN_ID,
    tokenAddress: USDC,
    spendPolicyAddress: SPEND_POLICY,
    amountAtomic: 2_000_000n,
    totalCapAtomic: 10_000_000n,
  });

  assert.deepEqual(intent.request.expectTokens, [{ type: "usdc", amount: "2" }]);
  assert.equal(intent.request.chainId, 42161);
  assert.deepEqual(intent.request.transactions, [
    {
      to: USDC,
      data: encodeFunctionData({
        abi: ERC20_APPROVE_INTENT_ABI,
        functionName: "approve",
        args: [SPEND_POLICY, 2_000_000n],
      }),
      value: "0x0",
    },
  ]);
});

test("forces the proven USDC-only Particle routing options", () => {
  const intent = buildExpenseCardArmIntent({
    chainId: ARBITRUM_ONE_CHAIN_ID,
    tokenAddress: USDC,
    spendPolicyAddress: SPEND_POLICY,
    amountAtomic: 130_000n,
    totalCapAtomic: 2_000_000n,
  });

  assert.deepEqual(intent.options, {
    usePrimaryTokens: ["usdc"],
    slippageBps: 100,
  });
  assert.equal(intent.request.expectTokens[0]?.amount, "0.13");
});

test("rejects unsafe amount, cap, chain, and address inputs before Particle is called", () => {
  const valid = {
    chainId: ARBITRUM_ONE_CHAIN_ID,
    tokenAddress: USDC,
    spendPolicyAddress: SPEND_POLICY,
    amountAtomic: 130_000n,
    totalCapAtomic: 2_000_000n,
  } as const;

  assert.throws(
    () => buildExpenseCardArmIntent({ ...valid, amountAtomic: 0n }),
    /positive/
  );
  assert.throws(
    () => buildExpenseCardArmIntent({ ...valid, amountAtomic: 2_000_001n }),
    /total cap/
  );
  assert.throws(
    () => buildExpenseCardArmIntent({ ...valid, chainId: 8453 }),
    /Arbitrum One/
  );
  assert.throws(
    () => buildExpenseCardArmIntent({ ...valid, tokenAddress: "not-an-address" }),
    /token address/
  );
  assert.throws(
    () =>
      buildExpenseCardArmIntent({
        ...valid,
        tokenAddress: "0x0000000000000000000000000000000000000000",
      }),
    /token address/
  );
  assert.throws(
    () => buildExpenseCardArmIntent({ ...valid, spendPolicyAddress: "0x0" }),
    /SpendPolicy address/
  );
  assert.throws(
    () => buildExpenseCardArmIntent({ ...valid, totalCapAtomic: 0n }),
    /positive/
  );
});
