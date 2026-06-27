# Spec: audit-remediation-pass2 — Requirements

> Epic: **E4. Proof + trust layer** (honesty) + cross-cutting security / ops hygiene
> Story: hardening pass — remediates a 2nd external code audit (2026-06-25). No new feature story.
> Priority: **P2** (security + claim-honesty before judging; ahead of further UI polish)
> Estimated effort: **3-4h**
> Process: `.kiro/steering/methodology.md`

## 1. Why this exists

A second external audit surfaced 8 findings. Each was independently re-verified against the current
code (branch `feat/eip7702-universal-account-mode` = `main`): all 8 reference real code (no
stale-branch errors, no false positives). Triage:

- **Genuinely open (this spec):** F1, F3, F5, F7, F8.
- **Accepted demo-only:** F2 (x402 replay) — already R10.
- **Already closed:** F4 (relayer gas guard) — R16; F6 (debug send routes) — R18.

Per methodology §1.5 ("honesty above polish"), this spec prioritizes security + claim-honesty over
UI polish.

Findings in scope (verified open):

- **F1 (security):** `supabase/schema.sql` grants `anon` SELECT on `payments` + `payment_links`
  with RLS off. The anon key is public, so the table is world-readable via PostgREST. (Most fields
  are already public on-chain; the real leak is `preview_json` / `error_message` + row enumeration.)
- **F3 (honesty):** `mark-paid` persists `source_chain_id` from the client `sourceChainIds`; it is
  NOT server-verified, yet the receipt's "funded from <chain>" reads as fact. Settlement + Base
  proof ARE server-verified.
- **F5 (docs):** `docs/master-tz.md` still frames cross-chain as "Today blocked / scaffold pending"
  while `docs/status.md` + R1/R19 record C21 (cross-chain proven live). Misleads new agents/judges.
- **F7 (honesty/copy):** `src/app/wallet/page.tsx` claims "every supported chain" / "Solana, or
  anywhere else" against an EVM-only receive address (`0x53Bd…`).
- **F8 (polish):** `<img>` at `scroll-narrative.tsx:519` trips `@next/next/no-img-element`; a
  `viem/ox` dynamic-dependency build note (non-blocker).

## 2. Honesty constraints

- No new public claims. This spec REMOVES overclaims (F3, F7) and aligns docs to reality (F5).
- The Supabase change (F1) must NOT break the public server-rendered receipt or checkout. Verified:
  the anon client (`supabase`) is unused; all reads use `supabaseAdmin` (service_role), which
  bypasses RLS.
- No live DB migration is run autonomously. The SQL is authored in `schema.sql`; the user applies
  it in the Supabase SQL editor (shared system).

## 3. Acceptance criteria (EARS)

### F1 — Supabase least-privilege
- The schema shall NOT grant `anon` SELECT on `payments` or `payment_links`.
- While RLS is enabled on `merchants`, `payment_links`, and `payments`, the system shall serve the
  public receipt + checkout unchanged (reads go through `service_role`).
- If an anon-key client queries `payments`, then the system shall return zero rows.

### F3 — honest source-chain
- Where the receipt displays the funding-source chain, the system shall label it as **reported by
  the wallet** (not server-verified), while settlement + proof remain labeled **verified**.

### F5 — docs truth
- The master TZ shall reflect that cross-chain via UA is proven (C21), or mark the "blocked" note
  historical with a pointer to `status.md` / R1.

### F7 — honest wallet copy
- The wallet receive copy shall scope claims to Particle-supported chains and shall not imply an
  EVM receive address takes funds on Solana / "anywhere".

### F8 — lint hygiene
- The scroll-narrative decorative image shall not trip `@next/next/no-img-element` (via `next/image`
  or a justified inline disable).

### Gate (all)
- `typecheck` + `lint` + `test:unit` + `build` all exit 0; risk register + master-tz updated.

## 4. Scope

**In scope:** F1, F3, F5, F7, F8 + the doc/risk updates they imply.

**Out of scope (rationale):**
- F2 x402 replay — accepted demo-only (R10); production needs a consumed-tx store.
- F4 relayer gas guard — already R16 (dedicated `RELAYER_PRIVATE_KEY` deployed; shared/Redis limiter
  is a documented pre-prod ops step, not code).
- F6 debug send routes — already R18 (all 3 gated on `NEXT_PUBLIC_ENABLE_DEBUG_PROBES`; prod
  curl-verified serving disabled stubs). A server-side guard is optional defense-in-depth.
- Any new feature; broad refactors of already-shipped infra (methodology §13).

## 5. INVEST

Independent ✅ · Negotiable ✅ · Valuable (security + claim-honesty before judging) ✅ ·
Estimable (3-4h) ✅ · Small ✅ · Testable (anon-read denied + render/manual checks + gate) ✅

## 6. Definition of Done

- All EARS met; gate green; risk-register rows added; master-tz reconciled.
- The Supabase SQL is authored in `schema.sql` and handed to the user to apply, with a post-apply
  verification step (anon query → 0 rows; `/receipt` still renders).

## Status: CODE + DOCS DONE 2026-06-25

- F1 schema authored (anon table SELECT removed; RLS deny-by-default on 3 tables; user-apply block
  + post-apply check). **Live SQL apply pending (user).**
- F3 receipt funding source labeled "reported by wallet"; F7 wallet copy narrowed; F8 `<img>` lint
  warning fixed; F5 master-tz reconciled (C21); risk rows R21–R23 added.
- Gate green: typecheck 0, lint 0 (no warnings), 110/110 unit tests, build clean.
- Closes fully when the user applies the Supabase SQL and confirms anon-read denial + `/receipt`
  still renders.
