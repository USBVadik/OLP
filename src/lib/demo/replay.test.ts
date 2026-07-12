import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_REPLAY_AGENT,
  DEMO_REPLAY_AGENT_OUTCOMES,
  DEMO_REPLAY_AGENT_SUMMARY,
  getDemoReplaySuccess,
  DEMO_REPLAY_PAYMENT_LINK,
} from "./replay";

test("verified Research Agent replay reports useful spend and protected spend separately", () => {
  assert.equal(DEMO_REPLAY_AGENT.mode, "verified_replay");
  assert.equal(DEMO_REPLAY_AGENT.sendsTransactions, false);
  assert.equal(DEMO_REPLAY_AGENT_SUMMARY.status, "complete");
  assert.equal(DEMO_REPLAY_AGENT_SUMMARY.spentAtomic, 130_000n);
  assert.equal(DEMO_REPLAY_AGENT_SUMMARY.protectedAtomic, 200_000n);
  assert.equal(DEMO_REPLAY_AGENT_SUMMARY.remainingDailyAtomic, 1_870_000n);
  assert.equal(DEMO_REPLAY_AGENT_SUMMARY.purchasedCount, 2);
  assert.equal(DEMO_REPLAY_AGENT_SUMMARY.blockedCount, 1);
  assert.equal(DEMO_REPLAY_AGENT_SUMMARY.brief?.headline, "ETH market-risk brief ready");
  assert.match(DEMO_REPLAY_AGENT_SUMMARY.brief?.summary ?? "", /mildly bullish across 1,284 sources/);
  assert.deepEqual(DEMO_REPLAY_AGENT_SUMMARY.brief?.evidence, [
    "L2 stablecoin inflow: rising (71% confidence)",
    "ETH funding: neutral (60% confidence)",
  ]);
});

test("verified Research Agent replay exposes real settlement and revoke evidence", () => {
  const purchased = DEMO_REPLAY_AGENT_OUTCOMES.filter((outcome) => outcome.status === "purchased");
  const blocked = DEMO_REPLAY_AGENT_OUTCOMES.find((outcome) => outcome.status === "blocked");

  assert.equal(purchased.length, 2);
  assert.ok(purchased.every((outcome) => outcome.txUrl?.startsWith("https://arbiscan.io/tx/0x")));
  assert.equal(blocked?.resourceId, "premium-dataset");
  assert.equal(blocked?.txUrl, undefined);
  assert.match(blocked?.reason ?? "", /PerChargeExceeded/);
  assert.match(DEMO_REPLAY_AGENT.revokeExplorer, /^https:\/\/arbiscan\.io\/tx\/0x/);
});

test("existing payment replay remains available", () => {
  const replay = getDemoReplaySuccess(DEMO_REPLAY_PAYMENT_LINK.id);
  assert.ok(replay);
  assert.equal(replay?.payment.status, "completed");
});
