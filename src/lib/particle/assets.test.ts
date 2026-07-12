import assert from "node:assert/strict";
import test from "node:test";
import { summarizeUniversalBalance, splitHeldTokens, chainLabel } from "./assets";

// A realistic getPrimaryAssets() result: USDC split across Arbitrum + Base, plus a little ETH.
const FIXTURE = {
  assets: [
    {
      tokenType: "usdc",
      price: 1.0,
      amount: 1.95,
      amountInUSD: 1.95,
      chainAggregation: [
        {
          token: { assetId: "usdc", type: "usdc", chainId: 42161, address: "0xaf88", decimals: 6 },
          amount: 1.6,
          amountInUSD: 1.6,
        },
        {
          token: { assetId: "usdc", type: "usdc", chainId: 8453, address: "0x8335", decimals: 6 },
          amount: 0.35,
          amountInUSD: 0.35,
        },
      ],
    },
    {
      tokenType: "eth",
      price: 1727.83,
      amount: 0.000696,
      amountInUSD: 1.2,
      chainAggregation: [
        {
          token: { assetId: "eth", type: "eth", chainId: 8453, address: "0x0", decimals: 18 },
          amount: 0.000696,
          amountInUSD: 1.2,
        },
      ],
    },
  ],
};

test("totalUsd sums every token's USD value", () => {
  const s = summarizeUniversalBalance(FIXTURE);
  assert.ok(Math.abs(s.totalUsd - 3.15) < 1e-9);
});

test("tokens are summarized with upper-cased symbols", () => {
  const s = summarizeUniversalBalance(FIXTURE);
  const symbols = s.tokens.map((t) => t.symbol);
  assert.ok(symbols.includes("USDC"));
  assert.ok(symbols.includes("ETH"));
});

test("tokens are sorted by USD value descending (USDC before ETH)", () => {
  const s = summarizeUniversalBalance(FIXTURE);
  assert.equal(s.tokens[0].symbol, "USDC");
  assert.equal(s.tokens[1].symbol, "ETH");
});

test("USDC token carries a per-chain breakdown", () => {
  const s = summarizeUniversalBalance(FIXTURE);
  const usdc = s.tokens.find((t) => t.symbol === "USDC")!;
  assert.equal(usdc.byChain.length, 2);
  const arb = usdc.byChain.find((c) => c.chainId === 42161)!;
  assert.equal(arb.amount, 1.6);
});

test("chainIds is the sorted unique set of chains the balance spans", () => {
  const s = summarizeUniversalBalance(FIXTURE);
  assert.deepEqual(s.chainIds, [8453, 42161]);
});

test("accepts a bare array (not wrapped in { assets })", () => {
  const s = summarizeUniversalBalance(FIXTURE.assets);
  assert.ok(Math.abs(s.totalUsd - 3.15) < 1e-9);
});

test("garbage input returns a zero summary and never throws", () => {
  for (const bad of [null, undefined, 42, "x", {}, { assets: "nope" }, { assets: [null, 1] }]) {
    const s = summarizeUniversalBalance(bad);
    assert.equal(s.totalUsd, 0);
    assert.deepEqual(s.tokens, []);
    assert.deepEqual(s.chainIds, []);
  }
});

test("empty assets array returns a zero summary", () => {
  const s = summarizeUniversalBalance({ assets: [] });
  assert.equal(s.totalUsd, 0);
  assert.deepEqual(s.tokens, []);
});

test("token total USD falls back to the sum of its chain USD when missing", () => {
  const s = summarizeUniversalBalance({
    assets: [
      {
        tokenType: "usdc",
        chainAggregation: [
          { token: { chainId: 42161 }, amount: 1, amountInUSD: 1 },
          { token: { chainId: 8453 }, amount: 2, amountInUSD: 2 },
        ],
      },
    ],
  });
  assert.equal(s.totalUsd, 3);
});

test("chain entries without a chainId are dropped", () => {
  const s = summarizeUniversalBalance({
    assets: [
      {
        tokenType: "usdc",
        amount: 1,
        amountInUSD: 1,
        chainAggregation: [
          { token: {}, amount: 1, amountInUSD: 1 },
          { token: { chainId: 42161 }, amount: 1, amountInUSD: 1 },
        ],
      },
    ],
  });
  assert.deepEqual(s.chainIds, [42161]);
});

test("chains are ordered by held USD descending (funding chains lead the chips)", () => {
  const s = summarizeUniversalBalance(FIXTURE);
  // Arbitrum holds $1.60, Base holds $0.35 + $1.20 = $1.55 — Arbitrum leads.
  assert.deepEqual(
    s.chains.map((c) => c.chainId),
    [42161, 8453]
  );
  assert.ok(Math.abs(s.chains[0].usd - 1.6) < 1e-9);
  assert.ok(Math.abs(s.chains[1].usd - 1.55) < 1e-9);
});

test("zero-held chains sort after held chains, in stable numeric order", () => {
  const s = summarizeUniversalBalance({
    assets: [
      {
        tokenType: "usdc",
        chainAggregation: [
          { token: { chainId: 56 }, amount: 0, amountInUSD: 0 },
          { token: { chainId: 42161 }, amount: 1, amountInUSD: 1 },
          { token: { chainId: 1 }, amount: 0, amountInUSD: 0 },
        ],
      },
    ],
  });
  assert.deepEqual(
    s.chains.map((c) => c.chainId),
    [42161, 1, 56]
  );
});

test("garbage input yields empty chains", () => {
  assert.deepEqual(summarizeUniversalBalance(null).chains, []);
});

test("splitHeldTokens separates held rows from the zero tail", () => {
  const s = summarizeUniversalBalance(FIXTURE);
  const zeroToken = { symbol: "USDT", amount: 0, amountInUSD: 0, byChain: [] };
  const { held, zeroCount } = splitHeldTokens([...s.tokens, zeroToken, { ...zeroToken, symbol: "BNB" }]);
  assert.deepEqual(
    held.map((t) => t.symbol),
    ["USDC", "ETH"]
  );
  assert.equal(zeroCount, 2);
});

test("splitHeldTokens with nothing held reports every row in the zero tail", () => {
  const { held, zeroCount } = splitHeldTokens([
    { symbol: "USDT", amount: 0, amountInUSD: 0, byChain: [] },
  ]);
  assert.deepEqual(held, []);
  assert.equal(zeroCount, 1);
});

test("chainLabel maps known chains and falls back gracefully", () => {
  assert.equal(chainLabel(8453), "Base");
  assert.equal(chainLabel(42161), "Arbitrum");
  assert.equal(chainLabel(10), "Optimism");
  assert.equal(chainLabel(999999), "Chain 999999");
});
