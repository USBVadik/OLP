import assert from "node:assert/strict";
import test from "node:test";
import { encodeAbiParameters, encodeEventTopics, type Address, type Hex, type Log } from "viem";
import {
  ERC20_TRANSFER_EVENT_ABI,
  assertCanMarkPaid,
  verifyUsdcTransferForPayment,
} from "./mark-paid-verification";

const USDC: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const OTHER_TOKEN: Address = "0x1111111111111111111111111111111111111111";
const MERCHANT: Address = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
const OTHER_RECIPIENT: Address = "0x2222222222222222222222222222222222222222";
const PAYER: Address = "0xeE1FB8b1d24d658F39D1AFEc50a82D0c306c0246";
const TX_HASH: Hex = "0xfb480ac9357e88d6a98f8e08fdf8a6a686cbcd8ee5e46aff20a56893615eb357";
const OTHER_TX_HASH: Hex = "0x0651195ad2af8c00000000000000000000000000000000000000000000000000";
const AMOUNT = "100000";

const chain = {
  name: "Base",
  usdcAddress: USDC,
};

function transferLog({
  token = USDC,
  from = PAYER,
  to = MERCHANT,
  amount = AMOUNT,
}: {
  token?: Address;
  from?: Address;
  to?: Address;
  amount?: string;
} = {}): Log {
  return {
    address: token,
    topics: encodeEventTopics({
      abi: ERC20_TRANSFER_EVENT_ABI,
      eventName: "Transfer",
      args: { from, to },
    }),
    data: encodeAbiParameters([{ type: "uint256" }], [BigInt(amount)]),
  } as Log;
}

test("valid USDC Transfer marks paid", () => {
  const transfer = verifyUsdcTransferForPayment({
    receipt: { status: "success", logs: [transferLog()] },
    chain,
    link: { merchant_address: MERCHANT, amount: AMOUNT },
    txHash: TX_HASH,
  });

  assert.equal(transfer.from, PAYER);
  assert.equal(transfer.to, MERCHANT);
  assert.equal(transfer.value, BigInt(AMOUNT));
});

test("wrong recipient is rejected", () => {
  assert.throws(
    () =>
      verifyUsdcTransferForPayment({
        receipt: { status: "success", logs: [transferLog({ to: OTHER_RECIPIENT })] },
        chain,
        link: { merchant_address: MERCHANT, amount: AMOUNT },
        txHash: TX_HASH,
      }),
    /Matching Base USDC Transfer/
  );
});

test("wrong amount is rejected", () => {
  assert.throws(
    () =>
      verifyUsdcTransferForPayment({
        receipt: { status: "success", logs: [transferLog({ amount: "99999" })] },
        chain,
        link: { merchant_address: MERCHANT, amount: AMOUNT },
        txHash: TX_HASH,
      }),
    /Matching Base USDC Transfer/
  );
});

test("wrong token is rejected", () => {
  assert.throws(
    () =>
      verifyUsdcTransferForPayment({
        receipt: { status: "success", logs: [transferLog({ token: OTHER_TOKEN })] },
        chain,
        link: { merchant_address: MERCHANT, amount: AMOUNT },
        txHash: TX_HASH,
      }),
    /Matching Base USDC Transfer/
  );
});

test("failed tx is rejected", () => {
  assert.throws(
    () =>
      verifyUsdcTransferForPayment({
        receipt: { status: "reverted", logs: [transferLog()] },
        chain,
        link: { merchant_address: MERCHANT, amount: AMOUNT },
        txHash: TX_HASH,
      }),
    /Transaction failed on Base/
  );
});

test("duplicate mark-paid is idempotent for the same tx hash", () => {
  const result = assertCanMarkPaid(
    { status: "completed", paid_tx_hash: TX_HASH.toUpperCase() },
    TX_HASH
  );

  assert.deepEqual(result, { deduped: true });
});

test("already-paid invoice with different tx hash is rejected", () => {
  assert.throws(
    () => assertCanMarkPaid({ status: "completed", paid_tx_hash: TX_HASH }, OTHER_TX_HASH),
    /already completed with a different tx hash/
  );
});
