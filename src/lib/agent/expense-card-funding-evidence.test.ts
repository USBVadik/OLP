import assert from "node:assert/strict";
import test from "node:test";
import { encodeAbiParameters, encodeEventTopics, parseAbiItem, type Address, type Hex } from "viem";
import {
  deriveExpenseCardFundingEvidence,
  type ExpenseCardFundingActivity,
  type FundingOperationReceipt,
} from "./expense-card-funding-evidence";

const PAYER: Address = "0x53Bd615635Af778e5E460d5EEC2d6b234693206a";
const POLICY: Address = "0x9782e3724859469fbBAC5085EA8bf8E70724164E";
const ARBITRUM_USDC: Address = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const BASE_USDC: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ARBITRUM = 42161;
const BASE = 8453;
const REQUIRED = 2_000_000n;
const SOURCE_TX = `0x${"11".repeat(32)}` as Hex;
const APPROVAL_TX = `0x${"22".repeat(32)}` as Hex;
const UNRELATED_TX = `0x${"33".repeat(32)}` as Hex;

const approvalEvent = parseAbiItem(
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
);

function approvalLog(input: {
  token?: string;
  owner?: Address;
  spender?: Address;
  value?: bigint;
}) {
  return {
    address: input.token ?? ARBITRUM_USDC,
    topics: encodeEventTopics({
      abi: [approvalEvent],
      eventName: "Approval",
      args: {
        owner: input.owner ?? PAYER,
        spender: input.spender ?? POLICY,
      },
    }) as readonly Hex[],
    data: encodeAbiParameters([{ type: "uint256" }], [input.value ?? REQUIRED]),
  };
}

const activity: ExpenseCardFundingActivity = {
  status: 7,
  sender: PAYER,
  tokenChanges: {
    fromChains: [ARBITRUM, BASE],
    toChains: [ARBITRUM],
    decr: [
      {
        token: { chainId: ARBITRUM, address: ARBITRUM_USDC, type: "usdc" },
        amount: "0xde0b6b3a7640000",
      },
      {
        token: { chainId: BASE, address: BASE_USDC, type: "usdc" },
        amount: "0xde0b6b3a7640000",
      },
    ],
  },
  depositUserOperations: [{ chainId: BASE, txHash: SOURCE_TX, status: 3 }],
  lendingUserOperations: [{ chainId: ARBITRUM, txHash: APPROVAL_TX, status: 3 }],
};

const receipts: FundingOperationReceipt[] = [
  { chainId: BASE, txHash: SOURCE_TX, status: "success", logs: [] },
  {
    chainId: ARBITRUM,
    txHash: APPROVAL_TX,
    status: "success",
    logs: [approvalLog({})],
  },
];

const context = {
  payer: PAYER,
  settlementChainId: ARBITRUM,
  settlementTokenAddress: ARBITRUM_USDC,
  spendPolicyAddress: POLICY,
  requiredAmount: REQUIRED,
  usdcByChain: {
    [ARBITRUM]: ARBITRUM_USDC,
    [BASE]: BASE_USDC,
  },
};

test("verifies a finished cross-chain Particle activity plus exact on-chain approval", () => {
  const evidence = deriveExpenseCardFundingEvidence(activity, receipts, context);

  assert.equal(evidence.verified, true);
  assert.equal(evidence.crossChain, true);
  assert.deepEqual(evidence.sourceChainIds, [BASE]);
  assert.deepEqual(evidence.sourceLegs, [{ chainId: BASE, txHash: SOURCE_TX }]);
  assert.equal(evidence.approvalTxHash, APPROVAL_TX);
  assert.equal(evidence.approvedAmount, REQUIRED);
  assert.deepEqual(evidence.destinationTxHashes, [APPROVAL_TX]);
  assert.equal(evidence.reason, "ok");
});

test("accepts a same-chain funding activity without inventing a cross-chain source", () => {
  const sameChain = {
    ...activity,
    tokenChanges: {
      fromChains: [ARBITRUM],
      toChains: [ARBITRUM],
      decr: [
        {
          token: { chainId: ARBITRUM, address: ARBITRUM_USDC, type: "usdc" },
          amount: "0x1bc16d674ec80000",
        },
      ],
    },
    depositUserOperations: [],
  };

  const evidence = deriveExpenseCardFundingEvidence(sameChain, receipts.slice(1), context);
  assert.equal(evidence.verified, true);
  assert.equal(evidence.crossChain, false);
  assert.deepEqual(evidence.sourceChainIds, []);
  assert.deepEqual(evidence.sourceLegs, []);
});

test("fails closed for unfinished or wrong-owner Particle activity", () => {
  assert.match(
    deriveExpenseCardFundingEvidence({ ...activity, status: 5 }, receipts, context).reason,
    /FINISHED/,
  );
  assert.match(
    deriveExpenseCardFundingEvidence(
      { ...activity, sender: "0x0000000000000000000000000000000000000001" },
      receipts,
      context,
    ).reason,
    /sender/,
  );
});

test("requires the expected destination and exact USDC on every reported source chain", () => {
  const wrongDestination = {
    ...activity,
    tokenChanges: { ...activity.tokenChanges, toChains: [BASE] },
  };
  assert.match(
    deriveExpenseCardFundingEvidence(wrongDestination, receipts, context).reason,
    /destination/,
  );

  const wrongSourceToken = {
    ...activity,
    tokenChanges: {
      ...activity.tokenChanges,
      decr: [
        {
          token: { chainId: ARBITRUM, address: ARBITRUM_USDC, type: "usdc" },
          amount: "0xde0b6b3a7640000",
        },
        {
          token: {
            chainId: BASE,
            address: "0x0000000000000000000000000000000000000001",
            type: "usdc",
          },
          amount: "0xde0b6b3a7640000",
        },
      ],
    },
  };
  assert.match(
    deriveExpenseCardFundingEvidence(wrongSourceToken, receipts, context).reason,
    /source token/,
  );
});

test("rejects a Particle route whose USDC source debit cannot cover the card budget", () => {
  const underfunded = {
    ...activity,
    tokenChanges: {
      ...activity.tokenChanges,
      decr: [
        {
          token: { chainId: ARBITRUM, address: ARBITRUM_USDC, type: "usdc" },
          amount: "0x6f05b59d3b20000",
        },
        {
          token: { chainId: BASE, address: BASE_USDC, type: "usdc" },
          amount: "0x6f05b59d3b20000",
        },
      ],
    },
  };
  assert.match(
    deriveExpenseCardFundingEvidence(underfunded, receipts, context).reason,
    /source amount/,
  );
});

test("requires a successful on-chain source leg for every foreign funding chain", () => {
  const missingSourceReceipt = receipts.filter((receipt) => receipt.chainId !== BASE);
  assert.match(
    deriveExpenseCardFundingEvidence(activity, missingSourceReceipt, context).reason,
    /source leg/,
  );

  const revertedSourceReceipt = receipts.map((receipt) =>
    receipt.chainId === BASE ? { ...receipt, status: "reverted" as const } : receipt,
  );
  assert.match(
    deriveExpenseCardFundingEvidence(activity, revertedSourceReceipt, context).reason,
    /source leg/,
  );
});

test("accepts only an Approval receipt tied to a Particle destination operation", () => {
  const unrelatedReceipt: FundingOperationReceipt = {
    chainId: ARBITRUM,
    txHash: UNRELATED_TX,
    status: "success",
    logs: [approvalLog({})],
  };
  assert.match(
    deriveExpenseCardFundingEvidence(activity, [receipts[0], unrelatedReceipt], context).reason,
    /Approval/,
  );

  const revertedApproval = receipts.map((receipt) =>
    receipt.chainId === ARBITRUM ? { ...receipt, status: "reverted" as const } : receipt,
  );
  assert.match(
    deriveExpenseCardFundingEvidence(activity, revertedApproval, context).reason,
    /Approval/,
  );
});

test("rejects wrong token, owner, spender, or non-exact approval amount", async (t) => {
  const cases = [
    { name: "token", log: approvalLog({ token: BASE_USDC }) },
    {
      name: "owner",
      log: approvalLog({ owner: "0x0000000000000000000000000000000000000001" }),
    },
    {
      name: "spender",
      log: approvalLog({ spender: "0x0000000000000000000000000000000000000001" }),
    },
    { name: "insufficient amount", log: approvalLog({ value: REQUIRED - 1n }) },
    { name: "excessive amount", log: approvalLog({ value: REQUIRED + 1n }) },
  ];

  for (const item of cases) {
    await t.test(item.name, () => {
      const candidate = receipts.map((receipt) =>
        receipt.chainId === ARBITRUM ? { ...receipt, logs: [item.log] } : receipt,
      );
      assert.match(
        deriveExpenseCardFundingEvidence(activity, candidate, context).reason,
        /Approval/,
      );
    });
  }
});

test("rejects malformed activity and invalid verification context", () => {
  assert.equal(deriveExpenseCardFundingEvidence(null, receipts, context).verified, false);
  assert.match(
    deriveExpenseCardFundingEvidence(activity, receipts, { ...context, requiredAmount: 0n }).reason,
    /amount/,
  );
});
