# Spec: audit-remediation-pass2 — Design

> How: modules touched, approach per finding, sequence, verification. Per methodology §3.

## Modules touched

- `supabase/schema.sql` — F1 (grants + RLS).
- `src/app/receipt/[id]/page.tsx` (and/or receipt components) — F3 (source-chain label).
- `src/app/wallet/page.tsx` — F7 (receive copy).
- `src/components/scroll-narrative.tsx` — F8 (`<img>`).
- `docs/master-tz.md` — F5 (reconcile cross-chain status).
- `docs/risk-register.md` — new rows R21–R23.

## F1 — Supabase least-privilege (security)

**Investigation (done):** the anon client export `supabase` in `src/lib/supabase/client.ts` is
**unused** — `grep` finds no importer and no `supabase.from/.rpc/.auth` call. Every read of
`payment_links` / `payments` goes through `supabaseAdmin` (service_role): the `/receipt/[id]` server
component + all `/api/payments*` and `/api/payment-links*` routes. service_role **bypasses RLS**.

**Change (safe, deny-by-default):**
1. Remove `payments` and `payment_links` from the `grant select ... to anon` block.
2. `alter table ... enable row level security` on `merchants`, `payment_links`, `payments`.
3. Add **no** anon/authenticated SELECT policy (deny-by-default). service_role bypasses RLS so
   server reads keep working; `authenticated` retains its explicit grants but RLS still gates rows
   (no policy → no rows), which is fine (the app does not use an authenticated browser session).
4. Keep `grant usage on schema public to anon` (harmless; no table access without a row policy).

**Apply:** the SQL lives in `schema.sql` with a clearly-marked "run this on an existing project"
block. The user runs it in the Supabase SQL editor (shared system — NOT run autonomously).
**Verify (user):** an anon-key query to `payments` returns 0 rows; the public `/receipt/[id]` still
renders a completed payment.

## F3 — honest source-chain label (honesty)

The settlement USDC transfer + the Base `InvoicePaid` proof are server-verified; only the
funding-source chain is client-reported (`parsed.sourceChainIds`, already commented "advisory" in
`mark-paid`). Full server-side route reconstruction (from UA/UniversalX) is heavy and out of scope.
So the honest fix is **labeling**: on the receipt, render the funding source as "reported by your
wallet" (a muted caption / "reported" chip), and keep "verified" only on the settlement + proof
legs. No data-model change.

## F5 — master-tz reconciliation (docs)

In `docs/master-tz.md`: annotate the E2 epic + the `cross-chain-ua-particle` spec-table row to state
that cross-chain via UA is **PROVEN (C21, 2026-06-21)** — see `status.md` + risk R1; mark the
"Today blocked at Particle's settlement backend" line as **historical**. Add a cross-chain row (or
explicit pointer) to the §7 verification trail so the doc no longer contradicts `status.md`.

## F7 — honest wallet copy

In `src/app/wallet/page.tsx` (~L168–174): replace "single USDC balance across **every supported
chain**" → "across **Particle-supported chains**"; replace "Get paid on Base, Arbitrum, **Solana, or
anywhere else**, and it all arrives as one balance" with an EVM-scoped honest line that keeps the
"one balance" punch without implying SPL→EVM. Keep the Particle attribution.

## F8 — lint hygiene

Read `scroll-narrative.tsx:519` context. If the image is a static asset → swap `<img>` for
`next/image` `<Image>` (explicit `width`/`height` or `fill`). If it is animation/transform-driven
and `<Image>` is impractical, add `{/* eslint-disable-next-line @next/next/no-img-element -- <reason>
*/}`. The `viem/ox` dynamic-dependency build note is a dependency characteristic (non-blocker) —
accepted, no code change, noted in the progress log.

## Sequence (security → honesty → docs → gate)

1. F1 schema → 2. F3 receipt label → 3. F7 wallet copy → 4. F8 img → 5. F5 docs → 6. risk rows →
7. gate (`typecheck`/`lint`/`test:unit`/`build`, dev stopped) → 8. hand the SQL to the user + report.

## Verification

- **F1:** SQL authored; manual (user) — anon query denied + receipt renders. App build unaffected
  (schema.sql is not imported by the app).
- **F3 / F7 / F8:** render-check + lint clean.
- **F5:** doc diff (no contradiction with status.md).
- **Gate:** `typecheck` + `lint` + `test:unit` + `build` all 0.
