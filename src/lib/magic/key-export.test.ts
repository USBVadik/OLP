import test from "node:test";
import assert from "node:assert/strict";
import { getKeyExportCapability } from "./key-export";

// Key export uses Magic's dedicated reveal method (revealEVMPrivateKey / legacy revealPrivateKey),
// which opens Magic's OWN hosted reveal UI — the key is shown only to the end user; neither Magic nor
// OneLink can see it (per Magic docs). We do NOT use showSettings: it opens generic account settings
// with no export control for our app config (observed live). The probe FAILS CLOSED: when no reveal
// method exists, Pro mode shows the honest undelegate-exit path instead of a dead-end button.

test("capability prefers revealEVMPrivateKey when present", () => {
  const cap = getKeyExportCapability({ user: { revealEVMPrivateKey: () => {}, revealPrivateKey: () => {} } });
  assert.equal(cap.available, true);
  assert.equal(cap.method, "revealEVMPrivateKey");
});

test("capability falls back to legacy revealPrivateKey", () => {
  const cap = getKeyExportCapability({ user: { revealPrivateKey: () => {} } });
  assert.equal(cap.available, true);
  assert.equal(cap.method, "revealPrivateKey");
});

test("showSettings alone is NOT an export capability (it has no reveal control)", () => {
  assert.equal(getKeyExportCapability({ user: { showSettings: () => {} } }).available, false);
});

test("capability is unavailable when no reveal method exists / is not a function", () => {
  assert.equal(getKeyExportCapability({ user: {} }).available, false);
  assert.equal(getKeyExportCapability({ user: { revealPrivateKey: "nope" } }).available, false);
});

test("capability fails closed for null / undefined / malformed magic", () => {
  assert.equal(getKeyExportCapability(null).available, false);
  assert.equal(getKeyExportCapability(undefined).available, false);
  assert.equal(getKeyExportCapability({}).available, false);
  assert.equal(getKeyExportCapability({ user: null }).available, false);
});
