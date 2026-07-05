# Spec: standards-aligned-trust — Tasks

> TDD for the data guard (test-first, red→green); render-check for the presentational block.
> Content/positioning only — no product, payment, API, env, or contract change.
> Branch: `feat/standards-aligned-trust` (commit only on explicit "го").

## Phase 1 — data module + honesty guard (TDD)

- [ ] **T1. Failing tests: extend `src/lib/positioning/landscape.test.ts`.**
  - `assertAllSourced(STANDARDS, "standard")` does not throw; a bad standards fixture throws
    `/Unsourced standard/`.
  - `STANDARDS` is non-empty; every entry has non-empty `source` + `asOf` and an `https` `url`,
    a non-empty `what` + `ours`, and a `relation` in `{"aligned","complements"}`.
  - Any entry with a `study` — the study carries source + `https` url + asOf.
  - The existing `assertAllSourced(TRUST_STATS)` / bad-stat test still passes (backward compatible).
- [ ] **T2. Implement in `src/lib/positioning/landscape.ts`.** Generalize `assertAllSourced` to
  `<T extends Sourced>(items, label = "trust stat")`; add `Standard` type + `STANDARDS` (design §2b);
  add the 2 new `COMPARISON` rows (design §2c). Green.

## Phase 2 — presentational block + wire into /trust

- [ ] **T3. Build `src/components/standards-alignment.tsx`** — server component; header + honest
  caption; renders `STANDARDS` with status chip, `what`, `ours` + relation chip, source link, and
  optional study link. Reuse existing UI + theme.
- [ ] **T4. Wire `<StandardsAlignment/>` into `src/app/trust/page.tsx`** after `<RailComparison/>`,
  before the receipt CTA.

## Phase 3 — verify + docs

- [ ] **T5. Full gate.** `corepack pnpm typecheck` 0, `corepack pnpm lint` 0, `corepack pnpm
  test:unit` all green (incl. T1 guards), `corepack pnpm build` clean.
- [ ] **T6. Render-check `/trust`** (bg dev server → curl): 200; standards block present; each
  standard shows a draft-status chip + source link; the ERC-8004 study link renders; the 2 new
  comparison rows render. Stop the dev server after.
- [ ] **T7. Docs (no new capability claim).**
  - `docs/honest-claim-ledger.md`: one-line changelog note — `/trust` now shows emerging-standards
    alignment (Asset-Enforced Spend Mandate, ERC-8226/8312, ERC-8004), third-party-sourced; OneLink
    is aligned, not implementing any draft ERC; our side maps to C1–C21.
  - Cross-link `docs/competitive-landscape-2026.md` in the new section's spec references.

## Acceptance

Closes when T1–T6 done: `/trust` shows the standards-alignment block + 2 new comparison rows;
honesty-guard tests pass; every standard carries a source + draft-status chip; relation is only
aligned/complements; gate green. No product/payment/API/env/contract change; SpendPolicy untouched.

## Notes / progress log (filled as I go)

- **T1–T6 done (2026-07-05).** TDD: added 3 standards honesty-guards to `landscape.test.ts` (RED:
  "STANDARDS is not iterable"), then implemented `Standard` + `STANDARDS` + generalized
  `assertAllSourced<T extends Sourced>` + 2 comparison rows (GREEN, 7/7 file-local). Built
  `standards-alignment.tsx`, wired into `/trust` after `<RailComparison/>`. Gate: typecheck 0,
  lint 0, `test:unit` 124/124 (was 121), `build` clean (/trust static). Render-check: bg dev
  server, `/trust` HTTP 200, all markers present (block header, ERC-8226/8312/8004,
  Asset-Enforced Spend Mandate, AWS AgentCore, ERC-7715, aligned/complements, "emerging standard").
- **T7 done:** `docs/honest-claim-ledger.md` changelog note added (no new claim). Competitive-doc
  cross-link lives in design §6 references.
- ALL primary sources verified via web (Jul 2026): ethereum-magicians #28831/#28851,
  eips.ethereum.org/EIPS/eip-8226 + eip-8004, arxiv.org/html/2606.26028v1.

## Status: IMPLEMENTED + gate green + render-checked — awaiting explicit "го" to commit/push/deploy
