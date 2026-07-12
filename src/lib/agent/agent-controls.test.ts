import assert from "node:assert/strict";
import test from "node:test";
import { agentControls } from "./agent-controls";

test("armed and idle: can run and can revoke", () => {
  const c = agentControls({ running: false, revoked: false });
  assert.equal(c.canRun, true);
  assert.equal(c.canRevoke, true);
  assert.equal(c.statusTone, "armed");
});

test("running: neither run nor revoke (avoid racing an in-flight charge)", () => {
  const c = agentControls({ running: true, revoked: false });
  assert.equal(c.canRun, false);
  assert.equal(c.canRevoke, false);
  assert.equal(c.statusTone, "working");
});

test("revoked: run and revoke both disabled; status says charges revert", () => {
  const c = agentControls({ running: false, revoked: true });
  assert.equal(c.canRun, false);
  assert.equal(c.canRevoke, false);
  assert.equal(c.statusTone, "revoked");
  assert.match(c.statusLabel, /revoked/i);
});

test("revoked takes precedence over running", () => {
  const c = agentControls({ running: true, revoked: true });
  assert.equal(c.statusTone, "revoked");
  assert.equal(c.canRun, false);
  assert.equal(c.canRevoke, false);
});
