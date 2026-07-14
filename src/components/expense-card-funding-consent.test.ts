import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExpenseCardFundingConsent } from "./expense-card-funding-consent";

Object.assign(globalThis, { React });

const baseSummary = {
  rootHashPresent: true,
  transactionId: "0xlive",
  userOpChainIds: [8453, 42161],
  sourceChainIds: [42161, 8453],
  destinationChainIds: [42161],
  crossChain: true,
  feeUsd: 0.01,
  feeSymbol: "USDC",
};

test("makes the live Base to Arbitrum Particle route obvious before funding", () => {
  const html = renderToStaticMarkup(
    ExpenseCardFundingConsent({
      amountAtomic: 2_000_000n,
      totalCapAtomic: 10_000_000n,
      summary: baseSummary,
      loading: false,
      error: null,
      onRetry: () => undefined,
    }),
  );

  assert.match(html, /Live cross-chain funding/);
  assert.match(html, /Particle UA · EIP-7702/);
  assert.match(html, /Base \+1/);
  assert.match(html, /Arbitrum/);
  assert.match(html, /Open Particle explorer/);
  assert.match(html, /FINISHED/);
});

test("does not label a same-chain preview as live cross-chain", () => {
  const html = renderToStaticMarkup(
    ExpenseCardFundingConsent({
      amountAtomic: 2_000_000n,
      totalCapAtomic: 10_000_000n,
      summary: {
        ...baseSummary,
        userOpChainIds: [42161],
        sourceChainIds: [42161],
        crossChain: false,
      },
      loading: false,
      error: null,
      onRetry: () => undefined,
    }),
  );

  assert.doesNotMatch(html, /Live cross-chain funding/);
  assert.match(html, /Daily card funding/);
});

test("keeps fee and server-verification caveats in secondary details", () => {
  const html = renderToStaticMarkup(
    ExpenseCardFundingConsent({
      amountAtomic: 2_000_000n,
      totalCapAtomic: 10_000_000n,
      summary: {
        ...baseSummary,
        feeUsd: 0.36,
      },
      loading: false,
      error: null,
      onRetry: () => undefined,
    }),
  );

  assert.match(html, /<details/);
  assert.match(html, /Verification &amp; fee details/);
  assert.match(html, /This quote is expensive relative to the small demo budget/);
  assert.match(html, /Open Particle explorer appears here after FINISHED/);
});
