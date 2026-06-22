# Pre-Demo Risk Register

> Locked 2026-06-21. Pairs with `.kiro/steering/methodology.md` §9.
>
> **Rule:** a risk in `mitigation_status: open` blocks submission until closed (or accepted with
> a written fallback). Reviewed weekly until submission week, then daily.

## Risk levels

- **likelihood:** `low` (<20%), `med` (20-60%), `high` (>60%).
- **impact:** `low` (annoyance), `med` (a demo beat is rough), `high` (the demo cannot ship as
  pitched, or we get DQ'd from a track).
- **mitigation_status:** `open` (no mitigation yet), `in_progress`, `closed` (mitigation in
  place AND tested), `accepted` (live with it; fallback documented).

## Active risks

### R1 — Particle UA cross-chain stays broken through submission

- **likelihood:** high (V2 migration ongoing, our probes still fail at settlement)
- **impact:** med — **downgraded after the official rules (2026-06-21).** The UA Track does NOT
  require cross-chain value movement; it requires prominently using Universal Accounts in EIP-7702
  mode, with a supported wallet provider, for a chain-agnostic UX — which we already meet (Magic EOA
  → Particle UA in 7702 mode across Base/Arbitrum/Optimism, unified cross-chain balance read,
  account-level mandate enforcement). Cross-chain value movement is an innovation booster for the
  30% UA+7702 axis, NOT an eligibility gate.
- **mitigation:**
  1. No DQ risk: enter the UA Track now; frame cross-chain honestly as roadmap / in-progress, never
     as live.
  2. Pursue cross-chain via UA at the Particle workshop as upside (spec `cross-chain-ua-particle`);
     Circle Gateway is the backup rail (spec `cross-chain-circle-gateway`). Not a blocker.
  3. The Arbitrum ($2000) + Magic ($500) bounties are judged INDEPENDENTLY of the main track
     (confirmed in the official rules) — safe regardless of the UA-Track outcome.
  4. Correction to the earlier note: General Track base = "exceptional UX, any domain" (no SDK
     required; ZeroDev/Openfort are optional subtracks we don't use), so it WOULD be a no-rework
     fallback — but UA Track is the pick and is safe.
- **mitigation_status:** accepted — UA Track entry is safe per the rules; cross-chain is roadmap
  upside, not a gate.
- **owner:** builder
- **review:** revisit only if the rules are clarified otherwise

### R2 — Judges don't grok the firewall in <30 seconds

- **likelihood:** med
- **impact:** high (UX score collapses)
- **mitigation:**
  1. Reframe to "AI-safe card" (spec `pitch-positioning-rewrite`). ✅ shipped (C12)
  2. Single protagonist (the agent), single merchant, two visible moments (success +
     blocked-on-chain). ✅ shipped — split-screen agent demo (C16)
  3. Visible budget HUD so the abstract mandate becomes tangible (spec `legible-mandate-card`).
     ✅ shipped (C14, C15)
  4. Split-screen demo recording (spec `agent-on-a-leash-demo`). ✅ shipped + proven live
- **mitigation_status:** **closed 2026-06-21** — the visceral "agent pays, then is blocked
  on-chain" moment is live on `/firewall` (Arbitrum), with legible mandate card + draining
  budget HUD. Final check: rehearse the recorded demo in Block E.
- **owner:** builder
- **review:** demo dress rehearsal (Block E)

### R3 — "You reinvented spend permissions" (Coinbase / ERC-7715)

- **likelihood:** med
- **impact:** med (innovation score takes a hit)
- **mitigation:**
  1. Cite prior art explicitly on the landing + README (spec `landing-narrative-prior-art`,
     superseding `prior-art-readme`). ✅ shipped (C19) — sourced comparison table vs Coinbase
     Spend Permissions / ERC-7715-7710 / ZeroDev session keys / Google AP2 / x402.
  2. Position the wedge as "on-chain revocable mandate bound to the x402 agent rail + public
     proof receipt + UA/7702 entry point," not "we invented spend permissions." ✅ shipped —
     landing AgentEconomySection + the x402 originality core (C17 / E5).
  3. Align mandate vocabulary to ERC-7715 / 7710 where natural. ✅ partial — the prior-art table
     names the ERC-7715 / 7710 vocabulary; the mandate stays a focused payments-specific type.
- **mitigation_status:** **closed 2026-06-21** — prior art is cited with linked sources and
  neutral framing (R14 also closed), and the x402 wedge (C17) is the concrete originality answer.
  Re-check the framing once more at the demo dress rehearsal (Block E).
- **owner:** builder
- **review:** demo dress rehearsal (Block E)

### R4 — Live demo flake during judging (mainnet RPC, gas, Magic, Particle)

- **likelihood:** med
- **impact:** high (the wow moment fails on stage)
- **mitigation:**
  1. Pre-recorded backup video of every demo beat, labeled clearly as replay.
  2. Tiny amounts on cheap chains (0.10 USDC on Arbitrum).
  3. Dual-chain deployment (Base + Arbitrum) — fall through to whichever is healthy.
  4. Demo runbook rehearsal at least 3 times before submission.
- **mitigation_status:** open (recordings to be made in Block E of master TZ)
- **owner:** builder
- **review:** weekly until Block E, then daily

### R5 — Building to the wrong rubric (40/30/20/10 vs 45/25/20/10)

- **likelihood:** low (rubric versions converge on UX-dominant)
- **impact:** low (strategy is the same under both)
- **mitigation:**
  1. Confirm the exact rubric at Jun 22 kickoff.
  2. Keep UX as the dominant axis priority (safe under both versions).
  3. Update `docs/master-tz.md` §1 if a different rubric is announced.
- **mitigation_status:** in_progress (waiting on Jun 22)
- **owner:** builder
- **review:** Jun 22 kickoff

### R6 — Scope creep into too many bonuses (ZeroDev + Openfort + x402 + Circle simultaneously)

- **likelihood:** high (the temptation is real)
- **impact:** med (breaks the core demo, dilutes polish)
- **mitigation:**
  1. Cut list (`docs/master-tz.md` §6) is sacred.
  2. RICE check before any addition mid-stream (`.kiro/steering/methodology.md` §10).
  3. One cross-chain rail max (Particle OR Gateway, never both as primary).
  4. x402 only as a thin wrapper, only after E1-E3 are stable.
- **mitigation_status:** closed (governance in place; daily reminder is the cut list itself)
- **owner:** builder
- **review:** weekly

### R7 — Magic Google OAuth fails in target browser (AdBlock / strict privacy)

- **likelihood:** med
- **impact:** med (onboarding beat fails on stage)
- **mitigation:**
  1. Demo on a clean Chrome profile, no extensions.
  2. Test the OAuth flow in incognito before recording.
  3. Email login as fallback (already proven, claim C7 lineage).
- **mitigation_status:** **closed 2026-06-21** — `magic-social-login` shipped and user
  confirmed end-to-end Google OAuth round-trip works on `/firewall` (address
  `0x53Bd…206a` rendered). Auto-detect on page reload also confirmed. Incognito + strict
  cookies (T19) deferred as a polish-week sanity check.
- **owner:** builder
- **review:** revisit during demo dress rehearsal (Block E)

### R8 — Receipt page looks centralized (server-side verifier under-explained)

- **likelihood:** med
- **impact:** low (sophisticated judges may notice; most won't)
- **mitigation:**
  1. Receipt copy explicitly says "attested verification" not "oracle truth." ✅ shipped — a
     "How is this verified?" disclosure frames the settlement as trustless and the InvoicePaid
     proof as an on-chain attestation ("not the source of truth").
  2. Show on the page: which transfer was matched against which invoice + tx hashes. ✅ shipped —
     the "Matched consent" leg names recipient + amount re-checked against the invoice from the
     on-chain transfer; payment + proof tx references link to the explorer; invoice id shown.
  3. Open-source the verification logic (already in repo). ✅ — referenced in the disclosure
     (`src/lib/payments/mark-paid-verification.ts`).
- **mitigation_status:** **closed 2026-06-21** — shipped on `/success` (the landing-linked judge
  receipt; renders live) and `/receipt/[id]` (build-verified; live completed-branch visual pending
  a completed invoice). typecheck + lint + 110 unit + 22 contract + production build all green.
- **owner:** builder
- **review:** demo dress rehearsal (Block E)

### R9 — x402 honesty: judges assume "x402" means facilitator-compatible

- **likelihood:** med
- **impact:** med (credibility hit if it reads as overclaim)
- **mitigation:**
  1. The settlement scheme is literally named `onelink-mandate` (not `exact`/EIP-3009).
  2. Demo voiceover + docs always say "x402 *pattern*, settled by an on-chain mandate".
  3. Claim C17 is DRAFT until a live buy is run; denylist forbids "facilitator-compatible".
- **mitigation_status:** closed 2026-06-21 (framing shipped: `onelink-mandate` scheme + "x402-pattern, mandate-settled" everywhere; C17 proven live; denylist keeps only the "not facilitator-compatible" caveat)
- **owner:** builder
- **review:** demo dress rehearsal (Block E)

### R10 — x402 proof replay (demo does not persist consumed txHashes)

- **likelihood:** low (demo only)
- **impact:** low (a paid proof could re-fetch a resource twice in the demo)
- **mitigation:**
  1. Documented limitation in spec `x402-mandate-gateway` design §9.
  2. A production version needs a consumed-proof / nonce store; out of scope for the hackathon.
- **mitigation_status:** accepted (documented; not a demo-blocking issue)
- **owner:** builder
- **review:** n/a (accepted)

### R11 — x402 resource feels laggy (on-chain proof verification + mining wait)

- **likelihood:** med
- **impact:** low (a few seconds between pay and resource delivery)
- **mitigation:**
  1. `/agent` polls up to 6×1.5s while the charge tx mines, with a "retrying with proof" log line
     so the wait is legible, not dead air.
  2. Tiny amounts on fast Arbitrum keep mining ~1s.
- **mitigation_status:** closed 2026-06-21 (live buy confirmed ~2s pay→deliver; the "retrying with proof" log line makes the short wait legible)
- **owner:** builder
- **review:** n/a (confirmed live)

### R12 — Particle `getPrimaryAssets` slow / rate-limited on `/agent`

- **likelihood:** low
- **impact:** low (the unified-balance HUD is a showcase, not the critical path)
- **mitigation:**
  1. It's a single read with a loading state; failure shows "balance unavailable" and the rest of
     the `/agent` demo (arm + x402 buy) still works. ✅ strengthened — the error now reads
     "Balance unavailable — the rest of the demo still works." with a one-click **Retry** so a
     flaky read recovers without reconnecting.
  2. Read-only — no tx, no gas.
- **mitigation_status:** in_progress (retry + clearer copy shipped + build-verified; final feel to
  be confirmed during a live `/agent` open)
- **owner:** builder
- **review:** live `/agent` open (user)

### R13 — Unified balance reads $0 if the wallet was swept

- **likelihood:** low
- **impact:** low (empty state handled; weakens the cross-chain visual)
- **mitigation:**
  1. Empty `$0.00` state is handled (no broken layout).
  2. For the demo the payer holds Base + Arbitrum USDC; keep a little on each so the HUD shows
     a genuine multi-chain balance.
- **mitigation_status:** accepted (documented; keep demo wallet funded on 2 chains)
- **owner:** builder
- **review:** demo dress rehearsal (Block E)

### R14 — Prior-art comparison reads as dismissive of sponsors/peers

- **likelihood:** low
- **impact:** med (could alienate a judge from Coinbase/ZeroDev/Google ecosystems)
- **mitigation:**
  1. Neutral phrasing — "build on the wave", not "beat"; each row states what the prior art IS
     fairly before our differentiator.
  2. Sources linked in README; facts grounded in `docs/RES/*`.
  3. The wedge is packaging + x402 binding, explicitly "not reinventing".
- **mitigation_status:** closed 2026-06-21 (shipped with neutral framing + sourced README)
- **owner:** builder
- **review:** demo dress rehearsal (Block E)

## Security findings (external audit, 2026-06-21)

> Surfaced by an external code-level audit and triaged with Kiro. Funds were never at risk in any
> of these; the exposures were proof integrity, relayer gas, display correctness, and deploy
> hygiene. All fixes are build + typecheck + lint + 110 unit + 22 contract verified; none have been
> re-run against a live mainnet payment yet.

### R15 — Proof payer was client-supplied, not bound to the on-chain transfer

- **likelihood:** med (public `mark-paid` route)
- **impact:** med (no funds at risk, but the payer recorded in the InvoicePaid proof + DB could be
  falsified given a real matching transfer — undermines the "every payment provable" claim)
- **found_by:** external audit
- **mitigation:**
  1. `mark-paid` now records the payer as the ACTUAL sender of the matched on-chain USDC transfer
     (`matchingTransfer.from`), never the client `payerAddress`. ✅ shipped
  2. Binds to whoever the chain says sent the funds, so smart-account / UA settlement still works
     (no brittle equality reject). ✅
- **mitigation_status:** closed 2026-06-21 (build + tests green; **operator-confirmed live
  2026-06-21** — `payer_address` matched the on-chain sender via the payments API)
- **owner:** builder
- **review:** next live `/pay` completion

### R16 — Public relayer charge route can burn relayer gas; key shared with proof owner

- **likelihood:** med
- **impact:** med (funds safe via EIP-712 signature + on-chain caps; exposure is relayer ETH + key
  blast radius, not user funds)
- **found_by:** external audit
- **mitigation:**
  1. `/api/mandates/charge` accepts an optional dedicated `RELAYER_PRIVATE_KEY`, falling back to the
     proof-owner key so existing deploys keep working. ✅ shipped
  2. In-memory rolling-window budget caps gas-spending sends (`RELAYER_MAX_CHARGES_PER_WINDOW`,
     default 30 / 10 min); simulation-only "blocked" calls stay unthrottled. ✅ shipped (right-sized
     for the demo — production needs a shared limiter, e.g. Redis)
- **mitigation_status:** in_progress (guards shipped + build-verified; for a public deploy also set
  a distinct `RELAYER_PRIVATE_KEY` + a shared rate limiter)
- **owner:** builder
- **review:** before any public (non-demo) deploy

### R17 — Dashboard chain mismatch: labels + explorer links hardcoded to Base

- **likelihood:** med (every Arbitrum-settled link; new links default to Arbitrum)
- **impact:** med (a judge clicking a payment tx hits the wrong explorer → looks broken)
- **found_by:** external audit
- **mitigation:**
  1. The dashboard resolves each link/payment's settlement chain by id (`getPaymentChainById`,
     guarded fallback) for the "on <chain>" label and the payment-tx link; the proof-tx link uses
     the proof chain. ✅ shipped
  2. Header chip relabeled from a false global "chain Base" to the true constant "proof anchor
     Base". ✅
- **mitigation_status:** closed 2026-06-21 (build + tests green; `mark-paid` + receipt already
  resolved chains correctly — the bug was dashboard-display-only; **operator-confirmed live
  2026-06-21** — dashboard payment-tx link → arbiscan, proof-tx link → basescan, both resolve)
- **owner:** builder
- **review:** demo dress rehearsal (Block E)

### R18 — Debug routes ship live if the production build has the probe flag on

- **likelihood:** low (deploy-env dependent)
- **impact:** med (the sweep/probe labs expose fund-moving actions when enabled)
- **found_by:** external audit
- **mitigation:**
  1. All three debug pages (`cross-chain-proof`, `particle-probe`, `sweep-legacy-ua`) already gate
     every action behind `NEXT_PUBLIC_ENABLE_DEBUG_PROBES === "true"` and render a harmless
     "disabled" stub otherwise. ✅ verified
  2. `.env.example` defaults the flag to `false`. ⚠️ `.env.local` currently has it `true` (for the
     local cross-chain investigation) — a production build MUST be built with the flag off/unset
     (build-time `NEXT_PUBLIC_` var, inlined at build).
- **mitigation_status:** in_progress (code-gated; deploy-config residual — see checkpoint plan)
- **owner:** builder
- **review:** before any public deploy

## Risks closed (kept for trace)

| id | risk | closed_on | how |
|----|------|-----------|-----|
| R2 | Judges don't grok the firewall in <30s | 2026-06-21 | "AI-safe card" reframe + legible mandate card + draining budget HUD + split-screen agent demo, all shipped & proven live (C12, C14, C15, C16). |
| R3 | "You reinvented spend permissions" | 2026-06-21 | Sourced prior-art comparison shipped on the landing + README with neutral framing (C19, `landing-narrative-prior-art` superseding `prior-art-readme`); the x402 wedge (C17) is the concrete originality answer; R14 (dismissiveness) also closed. |
| R7 | Magic Google OAuth fails in target browser | 2026-06-21 | Spec `magic-social-login` shipped; user-confirmed live OAuth round-trip + auto-detect on reload (claim C13). |
| R8 | Receipt page looks centralized | 2026-06-21 | "How is this verified?" disclosure on `/receipt/[id]` + `/success/[id]`: trustless settlement vs attested InvoicePaid proof ("not an oracle"), concrete matched-leg detail, open-source verifier referenced. Build-verified (`/receipt/[id]` completed-branch live visual pending a completed invoice). |
| R15 | Proof payer was client-supplied (mark-paid) | 2026-06-21 | Record the on-chain transfer sender (`matchingTransfer.from`) as payer instead of the client value; build + tests green; operator-confirmed live (payer_address == on-chain sender). |
| R17 | Dashboard chain mismatch (labels/explorer links hardcoded to Base) | 2026-06-21 | Resolve each link/payment chain by id for labels + payment-tx links; proof-tx uses the proof chain; header chip relabeled "proof anchor"; operator-confirmed live (links resolve to correct chains). |

## Pre-mortem schedule

- **2026-06-22:** post-kickoff pre-mortem. Update R1, R5 with Particle's confirmed answer.
- **2026-06-25:** post-Circle-workshop pre-mortem. Update R1 with Gateway integration status.
- **2026-06-28:** weekly pre-mortem.
- **2026-07-01 onward:** daily pre-mortem during submission week.

## Format note

Each risk row may be expanded into its own section if the mitigation grows beyond a few bullets.
This file stays tight; complex mitigations live in their respective spec.
