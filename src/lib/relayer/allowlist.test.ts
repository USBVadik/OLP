import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_MERCHANT_FALLBACK,
  DEMO_PAYER_FALLBACK,
  isAllowlisted,
  parseAllowlist,
} from "./allowlist";

const DEMO = DEMO_PAYER_FALLBACK;
const OTHER = "0x000000000000000000000000000000000000dEaD";

test("unset env falls back to the demo address only", () => {
  assert.equal(isAllowlisted(DEMO, undefined, DEMO), true);
  assert.equal(isAllowlisted(OTHER, undefined, DEMO), false);
});

test("empty / whitespace env falls back to the demo address", () => {
  assert.equal(isAllowlisted(DEMO, "", DEMO), true);
  assert.equal(isAllowlisted(DEMO, "   ", DEMO), true);
  assert.equal(isAllowlisted(OTHER, "", DEMO), false);
});

test("match is case-insensitive (checksummed vs lowercase)", () => {
  assert.equal(isAllowlisted(DEMO.toLowerCase(), undefined, DEMO), true);
  assert.equal(isAllowlisted(DEMO, undefined, DEMO.toLowerCase()), true);
});

test("comma-separated env allows multiple addresses", () => {
  const env = `${OTHER}, ${DEMO}`;
  assert.equal(isAllowlisted(DEMO, env, DEMO_MERCHANT_FALLBACK), true);
  assert.equal(isAllowlisted(OTHER, env, DEMO_MERCHANT_FALLBACK), true);
  assert.equal(
    isAllowlisted("0x0000000000000000000000000000000000000001", env, DEMO_MERCHANT_FALLBACK),
    false
  );
});

test("wildcard '*' disables the restriction (open to any)", () => {
  assert.equal(isAllowlisted(OTHER, "*", DEMO), true);
  assert.equal(isAllowlisted(DEMO, "*", DEMO), true);
});

test("parseAllowlist trims, lowercases, and drops empty entries", () => {
  assert.deepEqual(parseAllowlist(` ${DEMO} , ,${OTHER} `, DEMO), [
    DEMO.toLowerCase(),
    OTHER.toLowerCase(),
  ]);
});
