import assert from "node:assert/strict";
import test from "node:test";
import { firewallResultLine } from "./log-formatter";

test("firewallResultLine: success is an 'ok' tone with the amount and a tx url passthrough", () => {
  const line = firewallResultLine({
    kind: "ok",
    amountDisplay: "0.10 USDC",
    txUrl: "https://arbiscan.io/tx/0xabc",
  });
  assert.equal(line.tone, "ok");
  assert.match(line.message, /0\.10 USDC/);
  assert.equal(line.txUrl, "https://arbiscan.io/tx/0xabc");
});

test("firewallResultLine: blocked is a 'blocked' tone prefixed with BLOCKED and naming the reason", () => {
  const line = firewallResultLine({ kind: "blocked", reason: "PerChargeExceeded" });
  assert.equal(line.tone, "blocked");
  assert.match(line.message, /^BLOCKED:/);
  assert.match(line.message, /PerChargeExceeded/);
  // The "no funds moved / zero gas" promise is the whole point of simulate-first.
  assert.match(line.message, /no funds moved/i);
});

test("firewallResultLine: blocked has no txUrl (nothing was sent)", () => {
  const line = firewallResultLine({ kind: "blocked", reason: "MandateIsRevoked" });
  assert.equal(line.txUrl, undefined);
});

test("firewallResultLine: error is an 'error' tone carrying the message", () => {
  const line = firewallResultLine({ kind: "error", message: "network down" });
  assert.equal(line.tone, "error");
  assert.match(line.message, /ERROR/);
  assert.match(line.message, /network down/);
});

test("firewallResultLine: a revoked charge reads as blocked, not error", () => {
  // MandateIsRevoked comes back as a simulation revert -> blocked branch.
  const line = firewallResultLine({ kind: "blocked", reason: "MandateIsRevoked" });
  assert.equal(line.tone, "blocked");
  assert.match(line.message, /MandateIsRevoked/);
});
