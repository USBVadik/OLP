import assert from "node:assert/strict";
import test from "node:test";
import { encodeAbiParameters, encodeEventTopics, parseAbiItem, type Address, type Hex } from "viem";
import type {
  ExpenseCardFundingActivity,
  FundingOperationReceipt,
} from "./expense-card-funding-evidence";
import {
  readFundingReceiptWithRetry,
  verifyExpenseCardFundingWithProviders,
} from "./expense-card-funding-verifier";

const PAYER: Address = "0x53Bd615635Af778e5E460d5EEC2d6b234693206a";
const POLICY: Address = "0x9782e3724859469fbBAC5085EA8bf8E70724164E";
const USDC: Address = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const CHAIN = 42161;
const TX = `0x${"44".repeat(32)}` as Hex;
const approvalEvent = parseAbiItem(
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
);

const context = {
  payer: PAYER,
  settlementChainId: CHAIN,
  settlementTokenAddress: USDC,
  spendPolicyAddress: POLICY,
  requiredAmount: 2_000_000n,
  usdcByChain: { [CHAIN]: USDC },
};

function activity(operations: unknown): ExpenseCardFundingActivity {
  return {
    status: 7,
    sender: PAYER,
    tokenChanges: {
      fromChains: [CHAIN],
      toChains: [CHAIN],
      decr: [
        {
          token: { chainId: CHAIN, address: USDC, type: "usdc" },
          amount: "0x1bc16d674ec80000",
        },
      ],
    },
    settlementUserOperations: operations,
  };
}

function receipt(): FundingOperationReceipt {
  return {
    chainId: CHAIN,
    txHash: TX,
    status: "success",
    logs: [
      {
        address: USDC,
        topics: encodeEventTopics({
          abi: [approvalEvent],
          eventName: "Approval",
          args: { owner: PAYER, spender: POLICY },
        }) as readonly Hex[],
        data: encodeAbiParameters([{ type: "uint256" }], [2_000_000n]),
      },
    ],
  };
}

test("loads receipts for Particle operations and returns verified evidence", async () => {
  const receiptCalls: Array<{ chainId: number; txHash: Hex }> = [];
  const evidence = await verifyExpenseCardFundingWithProviders({
    uaTransactionId: "0xua1234",
    context,
    providers: {
      getActivity: async () => activity([{ chainId: CHAIN, txHash: TX }]),
      getReceipt: async (operation) => {
        receiptCalls.push(operation);
        return receipt();
      },
      getDestinationBalance: async () => 2_000_000n,
    },
  });

  assert.equal(evidence.verified, true);
  assert.deepEqual(receiptCalls, [{ chainId: CHAIN, txHash: TX }]);
});

test("retries a temporarily missing operation receipt before accepting it", async () => {
  let attempts = 0;
  const result = await readFundingReceiptWithRetry({
    operation: { chainId: CHAIN, txHash: TX },
    getReceipt: async () => {
      attempts += 1;
      if (attempts < 3) throw new Error(`Transaction receipt with hash \"${TX}\" could not be found`);
      return receipt();
    },
    sleep: async () => undefined,
    maxAttempts: 4,
  });

  assert.equal(attempts, 3);
  assert.equal(result.status, "success");
});

test("fails closed after the receipt retry budget is exhausted", async () => {
  let attempts = 0;
  await assert.rejects(
    readFundingReceiptWithRetry({
      operation: { chainId: CHAIN, txHash: TX },
      getReceipt: async () => {
        attempts += 1;
        throw new Error("receipt temporarily unavailable");
      },
      sleep: async () => undefined,
      maxAttempts: 3,
    }),
    /temporarily unavailable/,
  );
  assert.equal(attempts, 3);
});

test("fails before RPC reads when Particle activity has no usable operation", async () => {
  let receiptCalls = 0;
  await assert.rejects(
    verifyExpenseCardFundingWithProviders({
      uaTransactionId: "0xua1234",
      context,
      providers: {
        getActivity: async () => activity([]),
        getReceipt: async () => {
          receiptCalls += 1;
          return receipt();
        },
        getDestinationBalance: async () => 2_000_000n,
      },
    }),
    /no on-chain operations/,
  );
  assert.equal(receiptCalls, 0);
});

test("caps vendor-controlled operation fanout", async () => {
  const operations = Array.from({ length: 25 }, (_, index) => ({
    chainId: CHAIN,
    txHash: `0x${index.toString(16).padStart(64, "0")}`,
  }));
  await assert.rejects(
    verifyExpenseCardFundingWithProviders({
      uaTransactionId: "0xua1234",
      context,
      providers: {
        getActivity: async () => activity(operations),
        getReceipt: async () => receipt(),
        getDestinationBalance: async () => 2_000_000n,
      },
    }),
    /too many/,
  );
});

test("rejects a completed approval when the destination card balance is still underfunded", async () => {
  await assert.rejects(
    verifyExpenseCardFundingWithProviders({
      uaTransactionId: "0xua1234",
      context,
      providers: {
        getActivity: async () => activity([{ chainId: CHAIN, txHash: TX }]),
        getReceipt: async () => receipt(),
        getDestinationBalance: async () => 1_999_999n,
      },
    }),
    /balance .* is below/,
  );
});
