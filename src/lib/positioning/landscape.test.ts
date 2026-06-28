import test from "node:test";
import assert from "node:assert/strict";
import {
  STACK_2026,
  TRUST_STATS,
  COMPARISON,
  assertAllSourced,
  type TrustStat,
} from "./landscape";

// Honesty guards for the /trust positioning content. These are not cosmetic: this content sits
// on the claim-discipline page, so an unsourced stat or a directional row dressed as "built"
// must fail CI rather than ship.

test("assertAllSourced throws when a stat is missing source/url/asOf", () => {
  const bad: TrustStat[] = [{ stat: "no source", source: "", url: "", asOf: "" }];
  assert.throws(() => assertAllSourced(bad), /Unsourced trust stat/);
});

test("every shipped TRUST_STAT carries a source, url, and asOf", () => {
  assert.ok(TRUST_STATS.length > 0, "expected at least one trust stat");
  assert.doesNotThrow(() => assertAllSourced(TRUST_STATS));
  for (const s of TRUST_STATS) {
    assert.ok(s.source.trim(), `missing source: ${s.stat}`);
    assert.match(s.url, /^https?:\/\//, `stat url must be a link: ${s.stat}`);
    assert.ok(s.asOf.trim(), `missing asOf: ${s.stat}`);
  }
});

test("STACK_2026 highlights exactly one layer as ours — the enforcement layer", () => {
  const ours = STACK_2026.filter((l) => l.isOurs);
  assert.equal(ours.length, 1, "exactly one layer should be marked isOurs");
  assert.equal(ours[0].layer, "Enforcement & proof");
});

test("COMPARISON: every row has a ledgerRef; directional rows are never dressed as built", () => {
  for (const row of COMPARISON) {
    assert.ok(row.ledgerRef.trim(), `missing ledgerRef: ${row.player}`);
    if (row.kind === "directional") {
      assert.equal(row.ledgerRef, "—", `directional row must not claim a ledger row: ${row.player}`);
    } else {
      assert.notEqual(row.ledgerRef, "—", `built row must reference a ledger row: ${row.player}`);
    }
  }
});
