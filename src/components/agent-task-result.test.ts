import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ResearchTaskSummary } from "@/lib/agent/research-task";
import { AgentTaskResult } from "./agent-task-result";

Object.assign(globalThis, { React });

const completeSummary: ResearchTaskSummary = {
  status: "complete",
  brief: {
    headline: "ETH market-risk brief ready",
    summary: "Market risk is elevated while sentiment remains cautious.",
    evidence: ["Volatility: elevated (91% confidence)"],
  },
  spentAtomic: 130_000n,
  protectedAtomic: 200_000n,
  remainingDailyAtomic: 1_870_000n,
  purchasedCount: 2,
  blockedCount: 1,
  errorCount: 0,
  withheldCount: 0,
  missingRequiredResources: [],
  settlementLinks: [
    { label: "Market insight", href: "https://arbiscan.io/tx/0xmarket" },
    { label: "Sentiment", href: "https://arbiscan.io/tx/0xsentiment" },
  ],
  policyBlock: {
    title: "Premium dataset",
    attemptedAtomic: 200_000n,
    signedLimitAtomic: 100_000n,
    fundsMovedAtomic: 0n,
    reason: "PerChargeExceeded",
  },
};

test("renders one complete judge outcome with useful work, containment, Particle, and revoke proof", () => {
  const html = renderToStaticMarkup(
    AgentTaskResult({
      summary: completeSummary,
      particleActivity: {
        activityId: "0x06567b3a8eed3a",
        href: "https://universalx.app/activity/details?id=0x06567b3a8eed3a",
        sourceNames: ["Base"],
        settlementName: "Arbitrum One",
        verified: true,
      },
      fundingLinks: [
        { label: "Base source leg", href: "https://basescan.org/tx/0xsource" },
        { label: "Arbitrum approval", href: "https://arbiscan.io/tx/0xapproval" },
      ],
      revoked: true,
      revokeProof: {
        proven: true,
        message:
          "Re-checked against the live contract: a retry charge reverts with MandateIsRevoked. No transaction submitted, no gas spent.",
      },
      revokeTxUrl: "https://arbiscan.io/tx/0xrevoke",
      receiptHref: "/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5",
    }),
  );

  assert.match(html, /Task completed safely/);
  assert.match(html, /0\.13 USDC/);
  assert.match(html, /0\.20 USDC/);
  assert.match(html, /0\.00 USDC moved/);
  assert.match(html, /Executed by Particle Universal Account/);
  assert.match(html, /Open Particle explorer/);
  assert.match(html, /cross-chain card funding before this task/);
  assert.match(html, /0x06567b3a8eed3a/);
  assert.match(html, /Base source leg/);
  assert.match(html, /Arbitrum approval/);
  assert.match(html, /Budget revoked/);
  assert.match(html, /MandateIsRevoked/);
  assert.match(html, /View Proof Receipt/);
  assert.match(html, /\/receipt\/fc5adc83-3b17-4004-8902-a5a40a178dd5/);
});

test("does not present an incomplete task as a safe completed outcome", () => {
  const incomplete: ResearchTaskSummary = {
    ...completeSummary,
    status: "incomplete",
    brief: null,
    missingRequiredResources: ["sentiment-feed"],
    policyBlock: null,
    blockedCount: 0,
    protectedAtomic: 0n,
  };

  const html = renderToStaticMarkup(AgentTaskResult({ summary: incomplete }));

  assert.match(html, /The brief could not be completed/);
  assert.doesNotMatch(html, /Task completed safely/);
  assert.doesNotMatch(html, /Particle Network proof/);
  assert.doesNotMatch(html, /View Proof Receipt/);
});
