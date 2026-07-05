import test from "node:test";
import assert from "node:assert/strict";
import {
  STACK_2026,
  TRUST_STATS,
  COMPARISON,
  STANDARDS,
  assertAllSourced,
  type TrustStat,
  type Standard,
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

// --- standards-aligned-trust: emerging-standards honesty guards ---
// The /trust standards block sits on the claim-discipline page. An unsourced standard, or a
// standard dressed as "implemented" rather than "aligned/complements", must fail CI, not ship.

test("assertAllSourced is generic: STANDARDS pass; a bad standard throws with its label", () => {
  assert.ok(STANDARDS.length > 0, "expected at least one standard");
  assert.doesNotThrow(() => assertAllSourced(STANDARDS, "standard"));
  const bad: Standard[] = [
    { name: "x", status: "", what: "", ours: "", relation: "aligned", source: "", url: "", asOf: "" },
  ];
  assert.throws(() => assertAllSourced(bad, "standard"), /Unsourced standard/);
});

test("every STANDARD carries source + https url + asOf, a description, our relation, and a valid relation kind", () => {
  const allowed = new Set(["aligned", "complements"]);
  for (const s of STANDARDS) {
    assert.ok(s.source.trim(), `missing source: ${s.name}`);
    assert.match(s.url, /^https?:\/\//, `standard url must be a link: ${s.name}`);
    assert.ok(s.asOf.trim(), `missing asOf: ${s.name}`);
    assert.ok(s.what.trim(), `missing what: ${s.name}`);
    assert.ok(s.ours.trim(), `missing ours: ${s.name}`);
    assert.ok(s.status.trim(), `missing status: ${s.name}`);
    assert.ok(allowed.has(s.relation), `relation must be aligned|complements (never "implements"): ${s.name}`);
  }
});

test("any STANDARD secondary study citation is itself fully sourced", () => {
  for (const s of STANDARDS) {
    if (s.study) {
      assert.ok(s.study.source.trim(), `study missing source: ${s.name}`);
      assert.match(s.study.url, /^https?:\/\//, `study url must be a link: ${s.name}`);
      assert.ok(s.study.asOf.trim(), `study missing asOf: ${s.name}`);
    }
  }
});
