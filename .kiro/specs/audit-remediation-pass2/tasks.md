# Spec: audit-remediation-pass2 — Tasks

> Order: security → honesty → docs → gate. DoD per methodology §6. Mostly copy/config/docs + one
> SQL change (user-applied) — manual verification where not unit-testable.
> Branch: additive/low-risk; gate green before close. Commit/push/deploy only on user approval.

## Phase 1 — F1 Supabase least-privilege (security)

- [x] **T1. Record the read-path investigation.** anon client (`supabase`) unused; all reads via
      `supabaseAdmin` (service_role) — `/receipt/[id]` server component + `/api/payments*` +
      `/api/payment-links*`. service_role bypasses RLS → locking anon is safe.
- [x] **T2. Edit `supabase/schema.sql`.** Drop `payments` + `payment_links` from the `anon` SELECT
      grant; `enable row level security` on `merchants` / `payment_links` / `payments`
      (deny-by-default, no anon policy). Add a commented "run this on an existing project" block +
      the post-apply check.
- [x] **T3. Verify locally + author the user step.** Schema is not imported by the app → typecheck/
      build unaffected. Write the exact "run in Supabase SQL editor" snippet + post-apply check
      (anon query → 0 rows; `/receipt` renders). DO NOT run against the live DB.

## Phase 2 — F3 honest source-chain label

- [x] **T4. Relabel the receipt funding source as "reported by wallet".** Keep settlement + proof
      "verified". Render-check the receipt copy.

## Phase 3 — F7 honest wallet copy

- [x] **T5. Narrow `wallet/page.tsx` receive copy.** "Particle-supported chains"; drop SPL/"anywhere"
      overclaim against the EVM receive address. Render-check `/wallet`.

## Phase 4 — F8 lint hygiene

- [x] **T6. Fix `<img>` at `scroll-narrative.tsx:519`** (next/image or a justified inline disable).
      Lint clean. Note the `viem/ox` build warning as accepted (non-blocker).

## Phase 5 — F5 docs reconciliation

- [x] **T7. Reconcile `docs/master-tz.md`.** E2 + spec table + §7: cross-chain via UA proven (C21);
      mark the "Today blocked" note historical (pointer to status.md / R1).

## Phase 6 — risk register + gate

- [x] **T8. Risk register rows.** R21 (Supabase anon/RLS — fix authored, user-apply pending),
      R22 (source-chain reported-not-verified — labeled honestly), R23 (wallet copy narrowed).
      Note F2/F4/F6 already covered by R10/R16/R18.
- [x] **T9. Full gate.** `typecheck` + `lint` + `test:unit` + `build` (dev stopped) all exit 0.

## Acceptance

Closes when T1–T9 are done AND the user has applied the Supabase SQL (F1) and confirmed an anon read
is denied + the public receipt still renders. Until then: "code + docs done; Supabase SQL apply
pending (user)".

## Notes / progress log

- (2026-06-25) All code/doc tasks done; gate green: **typecheck 0, lint 0 (the `<img>` warning is
  gone — misplaced eslint-disable moved onto the `<img>` line), 110/110 unit tests, production
  build clean (all routes)**.
  - **F1** `supabase/schema.sql`: dropped `anon` table SELECT, enabled RLS on
    merchants/payment_links/payments. **LIVE TEST (anon + service REST):** anon already gets 0 rows
    from payments/payment_links; service_role gets 23 → the live DB was already secure, the FILE had
    drifted. The fix keeps a fresh `psql < schema.sql` / new project secure by construction.
    (R21 closed — live verified not-exposed.)
  - **F3** `cross-chain-route.tsx` (settled state only): funding source now labeled "reported by
    your wallet"; settlement + proof stay "verified". `/pay` preview/routing states untouched.
  - **F7** `wallet/page.tsx`: copy narrowed to "any EVM chain" / "Particle-supported chains";
    dropped the "Solana, or anywhere else" overclaim against the EVM receive address.
  - **F8** `scroll-narrative.tsx`: eslint-disable moved onto the `<img>` line + justification.
  - **F5** `master-tz.md`: E2 + spec-table + §7 reconciled — cross-chain proven (C21), old
    "blocked" note marked historical.
  - **risk register**: R21 (Supabase — apply pending user), R22 (source-chain labeled), R23 (wallet
    copy); plus a note that F2/F4/F6 are already R10/R16/R18.
- **F1 live status:** the live DB already denies anon (verified) → no urgent SQL to apply. Optional
  belt-and-suspenders (RLS explicit on live) needs the dashboard SQL editor / a DB connection string
  — the `service_role` key cannot run DDL via REST. Not required.
- **REMAINING (user-side):** only git commit/push/deploy — await approval.

## Status: DONE 2026-06-25 — gate green; R21 live-verified not-exposed (schema-file drift fixed). Only commit/push/deploy pending user approval.
