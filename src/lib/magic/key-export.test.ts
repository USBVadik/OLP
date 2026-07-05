import test from "node:test";
import assert from "node:assert/strict";
import { getKeyExportCapability } from "./key-export";

// Honesty + security guard: key-export is offered ONLY when Magic exposes its own hosted settings UI
// (`magic.user.showSettings`), which reveals the key inside Magic's UI — the raw key never enters
// OneLink's JS. The probe FAILS CLOSED: absent/blocked/non-function -> not available, and the UI then
// shows the honest undelegate-exit path instead of a fake export.

test("capability is available only when magic.user.showSettings is a function", () => {
  const cap = getKeyExportCapability({ user: { showSettings: () => {} } });
  assert.equal(cap.available, true);
  assert.equal(cap.method, "showSettings");
});

test("capability is unavailable when showSettings is missing", () => {
  assert.equal(getKeyExportCapability({ user: {} }).available, false);
  assert.equal(getKeyExportCapability({ user: { showSettings: "nope" } }).available, false);
});

test("capability fails closed for null / undefined / malformed magic", () => {
  assert.equal(getKeyExportCapability(null).available, false);
  assert.equal(getKeyExportCapability(undefined).available, false);
  assert.equal(getKeyExportCapability({}).available, false);
  assert.equal(getKeyExportCapability({ user: null }).available, false);
});

test("we never advertise revealPrivateKey as the export path (no raw key into our JS)", () => {
  // Even if a build exposes revealPrivateKey, the probe must not select it — only the hosted UI.
  const cap = getKeyExportCapability({ user: { revealPrivateKey: () => "0xdeadbeef" } });
  assert.equal(cap.available, false);
});
