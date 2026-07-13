import assert from "node:assert/strict";
import test from "node:test";
import {
  RESEARCH_MISSION,
  RESEARCH_RESOURCE_PLAN,
  orderResearchResources,
  summarizeResearchTask,
  type ResearchResourceOutcome,
} from "./research-task";

const DAILY_CAP = 2_000_000n;

const COMPLETE_OUTCOMES: ResearchResourceOutcome[] = [
  {
    resourceId: "market-insight",
    title: "Market insight snapshot",
    priceAtomic: 50_000n,
    status: "purchased",
    txUrl: "https://arbiscan.io/tx/0xmarket",
    data: {
      summary: "ETH momentum neutral-to-positive; stablecoin flows rising on L2s.",
      signals: [
        { name: "l2_stablecoin_inflow", value: "rising", confidence: 0.71 },
        { name: "eth_funding", value: "neutral", confidence: 0.6 },
      ],
    },
  },
  {
    resourceId: "sentiment-feed",
    title: "Live sentiment feed",
    priceAtomic: 80_000n,
    status: "purchased",
    txUrl: "https://arbiscan.io/tx/0xsentiment",
    data: { score: 0.62, label: "mildly bullish", sources: 1284 },
  },
  {
    resourceId: "premium-dataset",
    title: "Premium dataset (full export)",
    priceAtomic: 200_000n,
    status: "blocked",
    reason: "over the per-charge cap",
  },
];

test("research mission names one concrete task and is explicitly deterministic", () => {
  assert.equal(RESEARCH_MISSION.id, "eth-market-risk-brief");
  assert.match(RESEARCH_MISSION.title, /ETH market-risk brief/i);
  assert.equal(RESEARCH_MISSION.execution, "deterministic");
  assert.equal(RESEARCH_MISSION.adversarialFixture.usesLlm, false);
  assert.match(RESEARCH_MISSION.adversarialFixture.label, /hijack|attack|injected/i);
  assert.match(RESEARCH_MISSION.adversarialFixture.instruction, /premium export/i);
  // Honesty: the block is an over-cap revert to the same merchant (PerChargeExceeded), never an
  // off-merchant transfer, so the copy must not imply funds were routed to an attacker address.
  assert.doesNotMatch(RESEARCH_MISSION.adversarialFixture.instruction, /0x[a-fA-F0-9]{6}|attacker address|send to 0x/i);
});

test("research resource plan buys useful inputs before the unexpected premium export", () => {
  assert.deepEqual(RESEARCH_RESOURCE_PLAN, [
    "market-insight",
    "sentiment-feed",
    "premium-dataset",
  ]);
});

test("orderResearchResources follows the mission plan and drops unrelated resources", () => {
  const input = [
    { id: "premium-dataset", marker: 3 },
    { id: "unrelated", marker: 99 },
    { id: "sentiment-feed", marker: 2 },
    { id: "market-insight", marker: 1 },
  ];

  const ordered = orderResearchResources(input);
  assert.deepEqual(ordered.map((resource) => resource.marker), [1, 2, 3]);
  assert.deepEqual(input.map((resource) => resource.marker), [3, 99, 2, 1]);
});

test("complete task totals purchased spend, protected spend, and remaining daily budget", () => {
  const result = summarizeResearchTask(COMPLETE_OUTCOMES, DAILY_CAP);

  assert.equal(result.status, "complete");
  assert.equal(result.spentAtomic, 130_000n);
  assert.equal(result.protectedAtomic, 200_000n);
  assert.equal(result.remainingDailyAtomic, 1_870_000n);
  assert.equal(result.purchasedCount, 2);
  assert.equal(result.blockedCount, 1);
});

test("complete task produces a human brief from the two purchased payloads", () => {
  const result = summarizeResearchTask(COMPLETE_OUTCOMES, DAILY_CAP);

  assert.ok(result.brief);
  assert.match(result.brief.headline, /brief ready/i);
  assert.match(result.brief.summary, /neutral-to-positive/i);
  assert.match(result.brief.summary, /mildly bullish/i);
  assert.match(result.brief.summary, /1,284 sources/i);
  assert.deepEqual(result.missingRequiredResources, []);
});

test("brief exposes useful evidence instead of raw payloads", () => {
  const result = summarizeResearchTask(COMPLETE_OUTCOMES, DAILY_CAP);

  assert.ok(result.brief);
  assert.deepEqual(result.brief.evidence, [
    "L2 stablecoin inflow: rising (71% confidence)",
    "ETH funding: neutral (60% confidence)",
  ]);
});

test("missing a required paid input keeps the task incomplete", () => {
  const result = summarizeResearchTask(
    COMPLETE_OUTCOMES.filter((outcome) => outcome.resourceId !== "sentiment-feed"),
    DAILY_CAP,
  );

  assert.equal(result.status, "incomplete");
  assert.equal(result.brief, null);
  assert.deepEqual(result.missingRequiredResources, ["sentiment-feed"]);
});

test("a blocked premium request is protected spend, never actual spend", () => {
  const result = summarizeResearchTask(COMPLETE_OUTCOMES, DAILY_CAP, 100_000n);

  assert.equal(result.protectedAtomic, 200_000n);
  assert.equal(result.spentAtomic, 130_000n);
  assert.deepEqual(result.policyBlock, {
    title: "Premium dataset (full export)",
    attemptedAtomic: 200_000n,
    signedLimitAtomic: 100_000n,
    fundsMovedAtomic: 0n,
    reason: "over the per-charge cap",
  });
});

test("an infrastructure failure is not presented as protected spend", () => {
  const outcomes: ResearchResourceOutcome[] = [
    ...COMPLETE_OUTCOMES.slice(0, 2),
    {
      resourceId: "premium-dataset",
      title: "Premium dataset (full export)",
      priceAtomic: 200_000n,
      status: "error",
      reason: "RPC unavailable",
    },
  ];
  const result = summarizeResearchTask(outcomes, DAILY_CAP);

  assert.equal(result.status, "complete");
  assert.equal(result.protectedAtomic, 0n);
  assert.equal(result.blockedCount, 0);
  assert.equal(result.errorCount, 1);
  assert.equal(result.policyBlock, null);
});

test("a non-per-charge policy block stays honest when no matching signed limit is known", () => {
  const outcomes: ResearchResourceOutcome[] = [
    {
      resourceId: "premium-dataset",
      title: "Premium dataset (full export)",
      priceAtomic: 200_000n,
      status: "blocked",
      reason: "MandateIsRevoked",
    },
  ];

  const result = summarizeResearchTask(outcomes, DAILY_CAP, 100_000n);

  assert.ok(result.policyBlock);
  assert.equal(result.policyBlock.signedLimitAtomic, null);
  assert.equal(result.policyBlock.fundsMovedAtomic, 0n);
  assert.equal(result.policyBlock.reason, "MandateIsRevoked");
});

test("a blocked outcome marked as settled is never presented as contained spend", () => {
  const outcomes: ResearchResourceOutcome[] = [
    ...COMPLETE_OUTCOMES.slice(0, 2),
    {
      resourceId: "premium-dataset",
      title: "Premium dataset (full export)",
      priceAtomic: 200_000n,
      status: "blocked",
      settled: true,
      reason: "inconsistent upstream result",
    },
  ];

  const result = summarizeResearchTask(outcomes, DAILY_CAP, 100_000n);

  assert.equal(result.spentAtomic, 330_000n);
  assert.equal(result.protectedAtomic, 0n);
  assert.equal(result.blockedCount, 0);
  assert.equal(result.policyBlock, null);
});

test("a settled charge with withheld data is still counted as actual spend", () => {
  const outcomes: ResearchResourceOutcome[] = [
    {
      resourceId: "market-insight",
      title: "Market insight snapshot",
      priceAtomic: 50_000n,
      status: "withheld",
      settled: true,
      txUrl: "https://arbiscan.io/tx/0xsettled",
      reason: "proof indexing timed out",
    },
  ];

  const result = summarizeResearchTask(outcomes, DAILY_CAP);

  assert.equal(result.status, "incomplete");
  assert.equal(result.spentAtomic, 50_000n);
  assert.equal(result.protectedAtomic, 0n);
  assert.equal(result.purchasedCount, 0);
  assert.deepEqual(result.settlementLinks, [
    { label: "Market insight snapshot", href: "https://arbiscan.io/tx/0xsettled" },
  ]);
});

test("remaining daily budget is clamped at zero", () => {
  const outcomes: ResearchResourceOutcome[] = [
    {
      resourceId: "market-insight",
      title: "Market insight snapshot",
      priceAtomic: 2_500_000n,
      status: "purchased",
      data: { summary: "Market data." },
    },
  ];

  const result = summarizeResearchTask(outcomes, DAILY_CAP);
  assert.equal(result.remainingDailyAtomic, 0n);
});

test("settlement links include only successful purchases", () => {
  const result = summarizeResearchTask(COMPLETE_OUTCOMES, DAILY_CAP);
  assert.deepEqual(result.settlementLinks, [
    { label: "Market insight snapshot", href: "https://arbiscan.io/tx/0xmarket" },
    { label: "Live sentiment feed", href: "https://arbiscan.io/tx/0xsentiment" },
  ]);
});
