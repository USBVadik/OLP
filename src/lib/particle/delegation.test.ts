import assert from "node:assert/strict";
import test from "node:test";
import { getDelegationStatus, ZERO_ADDRESS } from "./delegation";

test("getDelegationStatus maps per-chain delegation from getEIP7702Deployments", async () => {
  const ua = {
    getEIP7702Deployments: async () => [
      { chainId: 8453, isDelegated: true, address: "0xDEL" },
      { chainId: 42161, isDelegated: false },
    ],
  };
  const s = await getDelegationStatus(ua, [8453, 42161, 10]);
  assert.deepEqual(s[8453], { isDelegated: true, delegate: "0xDEL" });
  assert.equal(s[42161].isDelegated, false);
  // A chain with no deployment record is reported as a plain wallet (not delegated).
  assert.equal(s[10].isDelegated, false);
});

test("getDelegationStatus fails closed to not-delegated on read error", async () => {
  const ua = {
    getEIP7702Deployments: async () => {
      throw new Error("rpc down");
    },
  };
  const s = await getDelegationStatus(ua, [8453]);
  assert.equal(s[8453].isDelegated, false);
});

test("ZERO_ADDRESS is the canonical zero address used to clear a 7702 delegation", () => {
  assert.equal(ZERO_ADDRESS, "0x0000000000000000000000000000000000000000");
});

// Regression coverage for the revert-tx link bug: send7702Transaction's return shape is not a
// guaranteed bare hash string, so we deep-scan for a canonical 32-byte hash. (This is the test that
// should have existed first — it captures exactly the object-return case that broke the link.)
import { extractTxHash } from "./delegation";

const HASH = "0x" + "a".repeat(64);

test("extractTxHash finds a canonical tx hash across return shapes", () => {
  assert.equal(extractTxHash(HASH), HASH); // bare string
  assert.equal(extractTxHash({ hash: HASH }), HASH); // { hash }
  assert.equal(extractTxHash({ transactionHash: HASH }), HASH); // { transactionHash }
  assert.equal(extractTxHash({ txHash: HASH }), HASH); // { txHash }
  assert.equal(extractTxHash({ result: { receipt: { transactionHash: HASH } } }), HASH); // nested
});

test("extractTxHash returns undefined when there is no canonical hash", () => {
  assert.equal(extractTxHash("not-a-hash"), undefined);
  assert.equal(extractTxHash("0x1234"), undefined); // too short
  assert.equal(extractTxHash({ status: "ok", code: 200 }), undefined);
  assert.equal(extractTxHash(null), undefined);
  assert.equal(extractTxHash(undefined), undefined);
});
