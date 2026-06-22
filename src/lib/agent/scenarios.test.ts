import assert from "node:assert/strict";
import test from "node:test";
import { buildAgentScenarios } from "./scenarios";

const PER_CHARGE = 100_000n; // 0.10 USDC

test("buildAgentScenarios returns exactly two scenarios", () => {
  const s = buildAgentScenarios(PER_CHARGE);
  assert.equal(s.length, 2);
});

test("buildAgentScenarios ids are within-cap and over-cap in order", () => {
  const s = buildAgentScenarios(PER_CHARGE);
  assert.equal(s[0].id, "within-cap");
  assert.equal(s[1].id, "over-cap");
});

test("within-cap amount equals maxPerCharge", () => {
  const [within] = buildAgentScenarios(PER_CHARGE);
  assert.equal(within.amountAtomic, PER_CHARGE);
});

test("over-cap amount is strictly greater than maxPerCharge", () => {
  const [, over] = buildAgentScenarios(PER_CHARGE);
  assert.ok(over.amountAtomic > PER_CHARGE);
  assert.equal(over.amountAtomic, PER_CHARGE * 2n);
});

test("within-cap is not expected to be blocked; over-cap is", () => {
  const [within, over] = buildAgentScenarios(PER_CHARGE);
  assert.equal(within.expectBlocked, false);
  assert.equal(over.expectBlocked, true);
});

test("each scenario carries an agent preflight line mentioning the amount", () => {
  const [within, over] = buildAgentScenarios(PER_CHARGE);
  assert.match(within.preflight, /0\.10 USDC/);
  assert.match(over.preflight, /0\.20 USDC/);
});

test("each scenario has a human button label", () => {
  const s = buildAgentScenarios(PER_CHARGE);
  for (const scenario of s) {
    assert.equal(typeof scenario.buttonLabel, "string");
    assert.ok(scenario.buttonLabel.length > 0);
  }
});
