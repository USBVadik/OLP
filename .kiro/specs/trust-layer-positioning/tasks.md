# Spec: trust-layer-positioning — Tasks

> TDD where there's logic (the honesty-guard); render-checks for presentational blocks. Content/
> positioning only — no product, payment, API, env, or contract change. Branch:
> `feat/trust-layer-positioning`.

## Phase 1 — data module + honesty guard (TDD)

- [ ] **T1. Failing tests: `src/lib/positioning/landscape.test.ts`.**
  - `assertAllSourced(TRUST_STATS)` throws if any stat is missing `source`, `url`, or `asOf`
    (feed a bad fixture → expect throw; feed `TRUST_STATS` → no throw).
  - `TRUST_STATS` is non-empty and every entry has a non-empty `source`/`url`/`asOf` (honesty guard).
  - `STACK_2026` has exactly one `isOurs` layer, and it is "Enforcement & proof".
  - `COMPARISON` every row has a `ledgerRef`; every `directional` row has `ledgerRef === "—"` (we
    never attach a built-claim ledger ref to a directional row).
- [ ] **T2. Implement `src/lib/positioning/landscape.ts`** with the seed content from design §2.
      Green. (Copy lives here for one-place review.)

## Phase 2 — presentational blocks + wire into /trust

- [ ] **T3. Build `src/components/ecosystem-stack.tsx`** — 4 layers, ours highlighted + "you are
      here", caption "we don't replace the rails…".
- [ ] **T4. Build `src/components/trust-gap.tsx`** — stat cards, each with source + link +
      "external research · {asOf}"; closing takeaway line styled as OUR conclusion (not a stat).
- [ ] **T5. Build `src/components/rail-comparison.tsx`** — Player / Their approach / Where OneLink
      differs; `directional` rows show a "directional — not yet integrated" chip. Reuse landing
      table styling.
- [ ] **T6. Wire all three into `src/app/trust/page.tsx`** between the claim table and the receipt
      CTA. Render-check `/trust` on the dev server (200; three blocks present; every stat shows a
      source link; the directional row shows its chip).

## Phase 3 — optional proof-presentation polish (fold-in; skippable)

- [ ] **T7. (Optional) Frame the existing receipt proofs** as "Three independent sources — verify
      any yourself, no account" above the settlement / proof / UniversalX rows in
      `src/components/proof-receipt.tsx`. Pure copy. Render-check `/receipt/[id]` (completed) +
      `/success/[id]`. Skip if scope-trimming.

## Phase 4 — verify + docs

- [ ] **T8. Full gate.** `corepack pnpm typecheck` 0, `corepack pnpm lint` 0, `corepack pnpm
      test:unit` all green (incl. T1 honesty guard), `corepack pnpm build` clean (dev server stopped).
- [ ] **T9. Docs (no new capability claim).**
  - `docs/honest-claim-ledger.md`: one-line note — the `/trust` ecosystem/trust-gap context is
    third-party-sourced (not OneLink metrics); our comparison column maps to C1–C21; AP2/card
    "front any rail" is directional.
  - `docs/demo-runbook.md`: add the "where we fit (stack) + the trust gap" pitch beat.
  - Cross-link `docs/competitive-landscape-2026.md` from the new section (source of the data).

## Acceptance

Closes when T1–T6 (+ T8/T9) are done: `/trust` shows the stack map, sourced trust-gap data, and a
fair comparison; the honesty-guard test passes; directional vs built is unambiguous; gate green.
T7 optional. No product/payment/API/env/contract change. Every market number carries a source +
"external research · mid-2026"; no number is presented as ours.

## Notes / progress log (filled as I go)

- (not started)

## Status: DRAFT — awaiting go to implement
