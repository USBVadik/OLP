import test from "node:test";
import assert from "node:assert/strict";
import { deriveFundingRoute, type UaActivityLike } from "./route";

const PAYER = "0x53Bd615635Af778e5E460d5EEC2d6b234693206a";
const MERCHANT = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
const ARBITRUM = 42161;
const BASE = 8453;

// Captured shape of a real Particle getTransaction() response — invoice fc5adc83, the canonical
// cross-chain payment (Base+Arbitrum -> Arbitrum). Only the fields the mapper reads are kept.
const BASE_DEBIT = "0x943ccd1b71c0469b3ef9e14193395b13aa2f081944d96822f1c478312f5c687f";
const ARB_SETTLE = "0x65ef93082bc8bfabcd16d5034e95f45e60ad80e17bbf8c12f0494606cffcf72d";

const FC5ADC83: UaActivityLike = {
  status: 7, // FINISHED
  sender: PAYER,
  receiver: MERCHANT,
  tokenChanges: { fromChains: [ARBITRUM, BASE] },
  depositUserOperations: [{ chainId: BASE, txHash: BASE_DEBIT, status: 3 }], // source leg (Base)
  lendingUserOperations: [{ chainId: ARBITRUM, txHash: ARB_SETTLE, status: 3 }], // settlement chain
};

const ctx = { payer: PAYER, merchant: MERCHANT, settlementChainId: ARBITRUM };

test("deriveFundingRoute: real fc5adc83 activity → verified cross-chain, source Base", () => {
  const r = deriveFundingRoute(FC5ADC83, ctx);
  assert.equal(r.verified, true);
  assert.equal(r.crossChain, true);
  assert.deepEqual(r.sourceChainIds, [BASE]); // Arbitrum (settlement) filtered out
  assert.deepEqual(r.sourceLegs, [{ chainId: BASE, txHash: BASE_DEBIT }]); // on-chain Base debit; Arbitrum(settlement) excluded
  assert.equal(r.reason, "ok");
});

test("deriveFundingRoute: same-chain activity → verified but not cross-chain", () => {
  const r = deriveFundingRoute({ ...FC5ADC83, tokenChanges: { fromChains: [ARBITRUM] } }, ctx);
  assert.equal(r.verified, true);
  assert.equal(r.crossChain, false);
  assert.deepEqual(r.sourceChainIds, []);
});

test("deriveFundingRoute: sender != payer → not verified (fail-closed)", () => {
  const r = deriveFundingRoute({ ...FC5ADC83, sender: "0x0000000000000000000000000000000000000001" }, ctx);
  assert.equal(r.verified, false);
  assert.equal(r.reason, "sender != payer");
});

test("deriveFundingRoute: receiver != merchant → not verified", () => {
  const r = deriveFundingRoute({ ...FC5ADC83, receiver: "0x0000000000000000000000000000000000000002" }, ctx);
  assert.equal(r.verified, false);
  assert.equal(r.reason, "receiver != merchant");
});

test("deriveFundingRoute: non-FINISHED status → not verified", () => {
  const r = deriveFundingRoute({ ...FC5ADC83, status: 5 }, ctx);
  assert.equal(r.verified, false);
});

test("deriveFundingRoute: null / malformed activity → not verified", () => {
  assert.equal(deriveFundingRoute(null, ctx).verified, false);
  assert.equal(deriveFundingRoute({ status: 7, sender: PAYER, receiver: MERCHANT, tokenChanges: null }, ctx).verified, true);
  // tokenChanges null but sender/receiver/status ok → verified, no sources (same-chain-ish)
  assert.deepEqual(
    deriveFundingRoute({ status: 7, sender: PAYER, receiver: MERCHANT, tokenChanges: null }, ctx).sourceChainIds,
    [],
  );
});

test("deriveFundingRoute: dedupes + drops non-numbers and the settlement chain", () => {
  const r = deriveFundingRoute(
    { ...FC5ADC83, tokenChanges: { fromChains: [BASE, BASE, ARBITRUM, "10" as unknown as number, 10] } },
    ctx,
  );
  assert.deepEqual(r.sourceChainIds, [BASE, 10]); // dedupe BASE, drop "10" string + ARBITRUM(settlement), keep 10
});

test("deriveFundingRoute: case-insensitive address match", () => {
  const r = deriveFundingRoute({ ...FC5ADC83, sender: PAYER.toLowerCase(), receiver: MERCHANT.toUpperCase() }, ctx);
  assert.equal(r.verified, true);
});

test("deriveFundingRoute: sourceLegs = on-chain debits on non-settlement chains only (dedupe + drop invalid)", () => {
  const r = deriveFundingRoute(
    {
      ...FC5ADC83,
      depositUserOperations: [
        { chainId: BASE, txHash: "0x" + "aa".repeat(32), status: 3 },
        { chainId: BASE, txHash: "0x" + "aa".repeat(32), status: 3 }, // duplicate → collapsed
        { chainId: ARBITRUM, txHash: "0x" + "bb".repeat(32) }, // settlement chain → excluded
        { chainId: 10, txHash: "not-a-hash" }, // malformed hash → excluded
        { chainId: 10, txHash: "0x" + "cc".repeat(32) }, // extra valid source leg
      ],
      lendingUserOperations: undefined,
    },
    ctx,
  );
  assert.deepEqual(r.sourceLegs, [
    { chainId: BASE, txHash: "0x" + "aa".repeat(32) },
    { chainId: 10, txHash: "0x" + "cc".repeat(32) },
  ]);
});

test("deriveFundingRoute: not-verified activity yields no sourceLegs", () => {
  assert.deepEqual(deriveFundingRoute({ ...FC5ADC83, status: 5 }, ctx).sourceLegs, []);
  assert.deepEqual(deriveFundingRoute(null, ctx).sourceLegs, []);
});
