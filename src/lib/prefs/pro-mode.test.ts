import test from "node:test";
import assert from "node:assert/strict";
import { PRO_MODE_KEY, readProModeFrom, serializeProMode } from "./pro-mode";

// Pro mode is an opt-in expert overlay. The storage read must FAIL CLOSED — anything other than the
// exact "on" token (including null, garbage, a throwing storage, or a legacy "true") resolves to
// the simple default (false), so a normal user never accidentally lands in Pro mode.

test("PRO_MODE_KEY is the stable namespaced localStorage key", () => {
  assert.equal(PRO_MODE_KEY, "olp:proMode");
});

test("serializeProMode maps booleans to the stored tokens", () => {
  assert.equal(serializeProMode(true), "1");
  assert.equal(serializeProMode(false), "0");
});

test("readProModeFrom is true ONLY for the exact on-token", () => {
  assert.equal(readProModeFrom({ getItem: () => "1" }), true);
  assert.equal(readProModeFrom({ getItem: () => "0" }), false);
  assert.equal(readProModeFrom({ getItem: () => null }), false);
  assert.equal(readProModeFrom({ getItem: () => "true" }), false); // legacy/garbage -> default off
  assert.equal(readProModeFrom({ getItem: () => "  1  " }), false); // exact match only
});

test("readProModeFrom fails closed when storage is missing or throws", () => {
  assert.equal(readProModeFrom(null), false);
  assert.equal(readProModeFrom(undefined), false);
  assert.equal(
    readProModeFrom({
      getItem: () => {
        throw new Error("SecurityError: localStorage blocked");
      },
    }),
    false,
  );
});

test("serialize -> read round-trips both ways", () => {
  assert.equal(readProModeFrom({ getItem: () => serializeProMode(true) }), true);
  assert.equal(readProModeFrom({ getItem: () => serializeProMode(false) }), false);
});
