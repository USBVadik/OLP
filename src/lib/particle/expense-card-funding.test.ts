import assert from "node:assert/strict";
import test from "node:test";
import {
  assertExpenseCardAllowance,
  assertExpenseCardReadiness,
  findRecoverableExpenseCardFundingTransaction,
  getExpenseCardFundingAmount,
  getExpenseCardFundingActionCopy,
  hasMaterialExpenseCardPreviewChange,
  isUaFundedExpenseCardEnabled,
  prepareExpenseCardFundingTransaction,
  sendExpenseCardFundingTransaction,
  summarizeExpenseCardFundingPreview,
  waitForExpenseCardFunding,
} from "./expense-card-funding";

const RECOVERY_PAYER = "0x53Bd615635Af778e5E460d5EEC2d6b234693206a";
const RECOVERY_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

test("enables the product path only for the exact true literal", () => {
  assert.equal(isUaFundedExpenseCardEnabled({ NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT: "true" }), true);
  assert.equal(isUaFundedExpenseCardEnabled({ NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT: "false" }), false);
  assert.equal(isUaFundedExpenseCardEnabled({ NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT: "TRUE" }), false);
  assert.equal(isUaFundedExpenseCardEnabled({}), false);
});

test("funds the daily exposure instead of the full lifetime cap", () => {
  assert.equal(getExpenseCardFundingAmount({ maxPerDay: 2_000_000n, totalCap: 10_000_000n }), 2_000_000n);
  assert.equal(getExpenseCardFundingAmount({ maxPerDay: 0n, totalCap: 10_000_000n }), 10_000_000n);
  assert.equal(getExpenseCardFundingAmount({ maxPerDay: 12_000_000n, totalCap: 10_000_000n }), 10_000_000n);
  assert.throws(() => getExpenseCardFundingAmount({ maxPerDay: 0n, totalCap: 0n }), /positive/);
});

test("arms only when the on-chain allowance covers the funded daily budget", () => {
  assert.doesNotThrow(() => assertExpenseCardAllowance(2_000_000n, 2_000_000n));
  assert.doesNotThrow(() => assertExpenseCardAllowance(2_500_000n, 2_000_000n));
  assert.throws(() => assertExpenseCardAllowance(1_999_999n, 2_000_000n), /allowance verification failed/);
  assert.throws(() => assertExpenseCardAllowance(0n, 0n), /positive/);
});

test("arms only when Arbitrum has both the funded balance and allowance", () => {
  assert.doesNotThrow(() =>
    assertExpenseCardReadiness({ balance: 2_000_000n, allowance: 2_000_000n, required: 2_000_000n }),
  );
  assert.throws(
    () => assertExpenseCardReadiness({ balance: 1_999_999n, allowance: 2_000_000n, required: 2_000_000n }),
    /balance verification failed/,
  );
  assert.throws(
    () => assertExpenseCardReadiness({ balance: 2_000_000n, allowance: 1_999_999n, required: 2_000_000n }),
    /allowance verification failed/,
  );
});

test("stale proof never hides a fresh live cross-chain top-up", () => {
  const action = getExpenseCardFundingActionCopy({
    readiness: { balance: 1_870_000n, allowance: 9_870_000n },
    required: 2_000_000n,
    hasVerifiedEvidence: true,
    crossChainPreview: true,
    amountLabel: "2 USDC",
  });

  assert.equal(action.willSendTransaction, true);
  assert.equal(action.showVerifiedEvidence, false);
  assert.match(action.buttonLabel, /Fund live cross-chain/);
  assert.match(action.helperText, /Base.*Arbitrum/);
  assert.match(action.helperText, /Particle explorer/);
});

test("a ready card reuses verified funding without promising a new transaction", () => {
  const action = getExpenseCardFundingActionCopy({
    readiness: { balance: 2_000_000n, allowance: 2_000_000n },
    required: 2_000_000n,
    hasVerifiedEvidence: true,
    crossChainPreview: true,
    amountLabel: "2 USDC",
  });

  assert.equal(action.willSendTransaction, false);
  assert.equal(action.showVerifiedEvidence, true);
  assert.equal(action.buttonLabel, "Arm agent with verified funding");
  assert.match(action.helperText, /No new funding transaction/);
});

test("unknown readiness makes no claim about whether funding will be sent", () => {
  const action = getExpenseCardFundingActionCopy({
    readiness: null,
    required: 2_000_000n,
    hasVerifiedEvidence: true,
    crossChainPreview: true,
    amountLabel: "2 USDC",
  });

  assert.equal(action.willSendTransaction, null);
  assert.equal(action.showVerifiedEvidence, false);
  assert.equal(action.buttonLabel, "Review funding & arm agent");
  assert.match(action.helperText, /Checking the live Arbitrum balance/);
});

test("recovers only the latest matching finished self-funding activity", () => {
  const nowMs = Date.parse("2026-07-13T10:10:00.000Z");
  const transactionId = findRecoverableExpenseCardFundingTransaction({
    entries: [
      {
        transactionId: "0xaaaa0001",
        status: 7,
        createdAt: "2026-07-13T10:06:00.000Z",
        fromChains: [42161, 8453],
        toChains: [42161],
        targetToken: { chainId: 42161, address: RECOVERY_USDC },
        change: { amount: "-2.0", from: RECOVERY_PAYER, to: "0x8C54783849A2C042544efc37c4657Ee98a411Fb7" },
      },
      {
        transactionId: "0xbbbb0001",
        status: 7,
        createdAt: "2026-07-13T10:05:25.000Z",
        fromChains: [42161, 8453],
        toChains: [42161],
        targetToken: { chainId: 42161, address: RECOVERY_USDC.toUpperCase() },
        change: {
          amount: "-2.00000000000000001",
          from: RECOVERY_PAYER,
          to: RECOVERY_PAYER.toLowerCase(),
        },
      },
      {
        transactionId: "0xcccc0001",
        status: 3,
        createdAt: "2026-07-13T10:07:00.000Z",
        fromChains: [42161, 8453],
        toChains: [42161],
        targetToken: { chainId: 42161, address: RECOVERY_USDC },
        change: { amount: "-2.0", from: RECOVERY_PAYER, to: RECOVERY_PAYER },
      },
    ],
    payerAddress: RECOVERY_PAYER,
    targetChainId: 42161,
    targetTokenAddress: RECOVERY_USDC,
    amountAtomic: 2_000_000n,
    nowMs,
  });

  assert.equal(transactionId, "0xbbbb0001");
});

test("does not recover stale or differently funded activity", () => {
  const transactionId = findRecoverableExpenseCardFundingTransaction({
    entries: [
      {
        transactionId: "0xdddd0001",
        status: 7,
        createdAt: "2026-07-10T10:05:25.000Z",
        fromChains: [42161, 8453],
        toChains: [42161],
        targetToken: { chainId: 42161, address: RECOVERY_USDC },
        change: { amount: "-2.0", from: RECOVERY_PAYER, to: RECOVERY_PAYER },
      },
      {
        transactionId: "0xeeee0001",
        status: 7,
        createdAt: "2026-07-13T10:05:25.000Z",
        fromChains: [42161, 8453],
        toChains: [42161],
        targetToken: { chainId: 42161, address: RECOVERY_USDC },
        change: { amount: "-1.0", from: RECOVERY_PAYER, to: RECOVERY_PAYER },
      },
    ],
    payerAddress: RECOVERY_PAYER,
    targetChainId: 42161,
    targetTokenAddress: RECOVERY_USDC,
    amountAtomic: 2_000_000n,
    nowMs: Date.parse("2026-07-13T10:10:00.000Z"),
  });

  assert.equal(transactionId, null);
});

test("summarizes the real Particle route and 18-decimal fee quote defensively", () => {
  const summary = summarizeExpenseCardFundingPreview({
    rootHash: "0xroot",
    transactionId: "ua-123",
    userOps: [{ chainId: 8453 }, { chainId: 42161 }, { chainId: 8453 }],
    tokenChanges: { fromChains: [42161, 8453], toChains: [42161] },
    feeQuotes: [
      {
        fees: {
          totals: { feeTokenAmountInUSD: "0x4e65b9b148800" },
          feeTokens: [{ token: { symbol: "USDC" } }],
        },
      },
    ],
  });

  assert.equal(summary.rootHashPresent, true);
  assert.equal(summary.transactionId, "ua-123");
  assert.deepEqual(summary.userOpChainIds, [8453, 42161]);
  assert.deepEqual(summary.sourceChainIds, [42161, 8453]);
  assert.deepEqual(summary.destinationChainIds, [42161]);
  assert.equal(summary.crossChain, true);
  assert.equal(summary.feeSymbol, "USDC");
  assert.ok(Math.abs((summary.feeUsd ?? 0) - 0.001379181025069056) < 1e-12);
});

test("requires renewed consent when the rebuilt route or fee changes materially", () => {
  const base = {
    rootHashPresent: true,
    transactionId: "old",
    userOpChainIds: [8453, 42161],
    sourceChainIds: [8453, 42161],
    destinationChainIds: [42161],
    crossChain: true,
    feeUsd: 0.35,
    feeSymbol: "USDC",
  };

  assert.equal(
    hasMaterialExpenseCardPreviewChange(base, { ...base, transactionId: "fresh", feeUsd: 0.38 }),
    false,
  );
  assert.equal(
    hasMaterialExpenseCardPreviewChange(base, {
      ...base,
      transactionId: "fresh",
      sourceChainIds: [42161, 8453],
    }),
    false,
  );
  assert.equal(
    hasMaterialExpenseCardPreviewChange(base, { ...base, transactionId: "fresh", feeUsd: 0.46 }),
    true,
  );
  assert.equal(
    hasMaterialExpenseCardPreviewChange(base, {
      ...base,
      transactionId: "fresh",
      sourceChainIds: [42161],
      crossChain: false,
    }),
    true,
  );
  assert.equal(
    hasMaterialExpenseCardPreviewChange(base, { ...base, transactionId: "fresh", feeUsd: null }),
    true,
  );
});

test("does not call a multi-userOp preview cross-chain without a foreign token source", () => {
  const summary = summarizeExpenseCardFundingPreview({
    rootHash: "0xroot",
    userOps: [{ chainId: 8453 }, { chainId: 42161 }],
    tokenChanges: { fromChains: [42161], toChains: [42161] },
  });

  assert.equal(summary.crossChain, false);
});

test("delegates each routed chain once and rebuilds a fresh transaction", async () => {
  const builds = [
    { rootHash: "0xstale", userOps: [{ chainId: 8453 }, { chainId: 42161 }, { chainId: 8453 }] },
    { rootHash: "0xfresh", transactionId: "ua-fresh", userOps: [{ chainId: 8453 }, { chainId: 42161 }] },
  ];
  const delegated: number[] = [];
  let buildIndex = 0;

  const result = await prepareExpenseCardFundingTransaction({
    initialTransaction: builds[0],
    buildTransaction: async () => builds[++buildIndex],
    ensureDelegated: async (chainId) => delegated.push(chainId),
  });

  assert.deepEqual(delegated, [8453, 42161]);
  assert.equal(buildIndex, 1);
  assert.equal(result.transaction.rootHash, "0xfresh");
  assert.deepEqual(result.routedChainIds, [8453, 42161]);
});

test("fails closed when the rebuilt transaction has no root hash", async () => {
  await assert.rejects(
    prepareExpenseCardFundingTransaction({
      initialTransaction: { rootHash: "0xstale", userOps: [{ chainId: 42161 }] },
      buildTransaction: async () => ({ userOps: [{ chainId: 42161 }] }),
      ensureDelegated: async () => undefined,
    }),
    /rootHash/,
  );
});

test("signs deduplicated inline auths, signs the root, and sends once", async () => {
  const authCalls: Array<{ chainId: number; legChainId: number; nonce: number }> = [];
  const sends: any[] = [];
  const transaction = {
    rootHash: "0xroot",
    transactionId: "ua-send",
    userOps: [
      {
        chainId: 8453,
        userOpHash: "0xop1",
        eip7702Delegated: false,
        eip7702Auth: { address: "0xdelegate", chainId: 0, nonce: 7 },
      },
      {
        chainId: 42161,
        userOpHash: "0xop2",
        eip7702Delegated: false,
        eip7702Auth: { address: "0xdelegate", chainId: 0, nonce: 7 },
      },
    ],
  };

  const result = await sendExpenseCardFundingTransaction({
    transaction,
    signAuthorization: async (request) => {
      authCalls.push({ chainId: request.chainId, legChainId: request.legChainId, nonce: request.nonce });
      return "0xauth";
    },
    signRootHash: async (rootHash) => `signed:${rootHash}`,
    sendTransaction: async (tx, rootSignature, authorizations) => {
      sends.push({ tx, rootSignature, authorizations });
      return { transactionId: "ua-send" };
    },
  });

  assert.deepEqual(authCalls, [{ chainId: 0, legChainId: 8453, nonce: 7 }]);
  assert.equal(sends.length, 1);
  assert.equal(sends[0].rootSignature, "signed:0xroot");
  assert.deepEqual(sends[0].authorizations, [
    { userOpHash: "0xop1", signature: "0xauth" },
    { userOpHash: "0xop2", signature: "0xauth" },
  ]);
  assert.equal(result.transactionId, "ua-send");
});

test("waits for FINISHED and rejects terminal failure or ambiguity", async () => {
  const statuses = [{ status: 3 }, { status: 7, marker: "done" }];
  const finished = await waitForExpenseCardFunding({
    transactionId: "ua-1",
    getTransaction: async () => statuses.shift(),
    sleep: async () => undefined,
    maxAttempts: 3,
    intervalMs: 0,
  });
  assert.equal(finished.marker, "done");

  await assert.rejects(
    waitForExpenseCardFunding({
      transactionId: "ua-2",
      getTransaction: async () => ({ status: 6 }),
      sleep: async () => undefined,
      maxAttempts: 1,
      intervalMs: 0,
    }),
    /EXECUTION_FAILED/,
  );

  await assert.rejects(
    waitForExpenseCardFunding({
      transactionId: "ua-3",
      getTransaction: async () => ({ status: 3 }),
      sleep: async () => undefined,
      maxAttempts: 2,
      intervalMs: 0,
    }),
    /Do not retry blindly/,
  );
});
