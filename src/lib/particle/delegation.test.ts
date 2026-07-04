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
