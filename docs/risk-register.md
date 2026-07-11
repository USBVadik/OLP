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

### R1 — Particle UA cross-chain settlement — RESOLVED (proven live, C21)

- **likelihood:** low — RESOLVED (was high during the Particle V2 migration; cross-chain
  settlement is now proven live on stable `2.0.3` — see C21/C8. Row kept for history.)
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
  5. **2026-06-21:** upgraded 1.1.1 → `@particle-network/universal-account-sdk@2.0.0-beta.3` (the
     build Particle confirmed is required for real EIP-7702) and deployed it to prod
     (https://onelink-pay.vercel.app).
  6. **2026-06-21 — CROSS-CHAIN PROVEN LIVE on v2-beta.3 (C21).** A real cross-chain USDC payment to
     the merchant settled on Arbitrum funded partly from Base: 1.0 USDC delivered to the merchant
     (`0x8C54…Fb7`), ~0.12 sourced cross-chain from Base. Settlement tx Arbitrum `0x85d8c4c2…4911`
     (USDC Transfer UA→merchant = 1.0, status 0x1 — independently verified via Arbitrum RPC), source
     tx Base `0x8b85d45f…4a2e` (status 0x1), UniversalX `0x0654e81cfea86a`. Recipe that cracked it:
     `createUniversalTransaction` + `usePrimaryTokens:[USDC]` (forces the USDC route + cross-chain
     sourcing, no ETH sale) + per-chain pre-delegation of the EOA to the V2 delegate
     `0x13E00E08…89A5A` (fixes AA24 from the stale V1 delegate `0x6640c1…831C`) + single-shot
     build/sign/send (fixes -32608 stale quote). Proven in the cross-chain proof lab AND, as of
     2026-06-21, end-to-end through the product `/pay` checkout (commit `92b7fe5`, local feature
     branch): invoice `7be9118e` settled 1.0 USDC cross-chain (100% from Base → merchant on Arbitrum
     `0x41217d8b…c3dd12e1`), InvoicePaid on Base `0x9d66901d…4068359e`, UniversalX `0x0654e9323a0bf7`
     — RPC-verified, UniversalX link on the live + shareable receipt. DEPLOYED to prod 2026-06-21
     (`NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer`); the cross-chain receipt is live-verifiable
     at onelink-pay.vercel.app/receipt/7be9118e.
- **mitigation_status:** accepted — UA Track entry is safe; the V1 `REFUND_FAILED`/`-32613`/`-32801`
  cross-chain failures are RESOLVED on v2-beta.3 (cross-chain payment proven live, C21). Remaining
  work is productization (wire `createUniversalTransaction` into `/pay`), not capability.
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
- **mitigation_status:** in_progress — **event is underway (kickoff 2026-06-22 done; ~2026-06-25 now).**
  Recording (mitigation 1) + rehearsal (mitigation 4) are now the ACTIVE priority (no longer
  deferred): the demo wallet is funded (payer ~2 USDC Arbitrum + 0.65 Base), the Pitch card is ready
  (`docs/demo-runbook.md`), and one live cross-chain run is already verifiable (`/receipt/40027dcf…`).
  Code-side mitigations shipped + live: tiny amounts (2), dual-chain Base+Arbitrum (3).
  TODO (user): record the labeled 90-sec backup + 10-sec Magic clip; confirm the submission deadline.
- **owner:** builder
- **review:** record the backup now; then daily until submission

### R5 — Building to the wrong rubric (40/30/20/10 vs 45/25/20/10)

- **likelihood:** low (rubric versions converge on UX-dominant)
- **impact:** low (strategy is the same under both)
- **mitigation:**
  1. Confirm the exact rubric at Jun 22 kickoff.
  2. Keep UX as the dominant axis priority (safe under both versions).
  3. Update `docs/master-tz.md` §1 if a different rubric is announced.
- **mitigation_status:** **closed 2026-06-25** — rubric CONFIRMED from the event and it matches our
  build exactly. **UA Track (main):** UX 40 / prominent UA+EIP-7702 30 / adoption 20 / polish 10 —
  prizes 1st $2,500, 2nd $2,000, 3rd $1,500; requirements (UA SDK in 7702 mode + ≥1 cross-chain value
  op via UA + functional demo) **all met** (C21). **Arbitrum bounty $2,000:** UX 30 / creativity 30 /
  adoption 20 / execution 20, must run primarily on Arbitrum. **Magic bonus $500:** best embedded-wallet
  onboarding UX. Timeline is generous: Jun 29 = project-outline milestone only (no build); judging is
  Week 5 (~late July). No master-tz change needed (the assumed UX-dominant split was correct).
- **owner:** builder
- **review:** n/a (confirmed)

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
  2. **CLOSED in code (security-hardening-v2, 2026-07-07):** `/api/x402/[resource]` now claims each
     verified proof in a Supabase consume-store (`x402_consumed`, `UNIQUE(tx_hash)`) BEFORE delivering.
     A replayed proof collides → 402; the store is **fail-CLOSED** (any store error → 503, never
     deliver) so "replay is closed" stays honest. Uniqueness is on `tx_hash` ALONE (not
     `tx_hash+resource`) because on-chain `MandateCharged` does not bind to a resource id — so one paid
     tx unlocks ONE resource, closing the audit-pass-2 "one charge satisfies a different resource"
     sharpening (F2). Pure decision logic unit-tested (`src/lib/x402/consume.ts`: fresh/replayed/
     unavailable + the fail-closed 200/402/503 table).
- **DEPLOY step (DONE 2026-07-07):** the `x402_consumed` migration (in `supabase/schema.sql`) is
  applied in prod Supabase (free tier). Still required-before-deploy for any FRESH environment —
  fail-closed means `/api/x402/*` (and the `/agent` x402 loop) return 503 until the table exists.
- **mitigation_status:** **CLOSED, live-verified on prod (2026-07-07, commit `8e8ada8`).** A live
  `/agent` buy ran the full x402 handshake — `402 → charge 0.05 USDC → 200 + resource` — so a fresh
  proof delivers (the consume-store insert + migration work). Replaying that exact proof (charge tx
  `0x11a03299…fab5cc`) against prod returned `402 "payment proof already used"` on repeat calls — the
  `UNIQUE(tx_hash)` guard rejects reuse, and a `402` (not `503`) confirms the store is healthy.
  Was: accepted (demo-only).
- **owner:** builder
- **review:** n/a — closed, live-verified 2026-07-07 (fresh→deliver + replay→402).

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

### R19 — Prod runs a beta Particle SDK; live 7702/UA claims not re-verified on v2

- **likelihood:** med (beta SDK; the API surface can shift between betas)
- **impact:** med (a live 7702/UA beat on prod could differ from 1.1.1; the med-risk claims C7/C8
  were proven on the old SDK)
- **context:** 2026-06-21 prod was upgraded 1.1.1 → `@particle-network/universal-account-sdk@2.0.0-beta.3`
  (the build Particle confirmed real EIP-7702 requires) and deployed to
  https://onelink-pay.vercel.app. Vercel build + 12/12 static + route smoke (200s) green; the
  Supabase `ua_transaction_id` migration is applied + verified live.
- **mitigation:**
  1. Re-run one live 7702 payment on prod (Magic login + small Base/Arbitrum USDC) before reusing
     C7 (live delegation) or C8 (live settle + proof) publicly; then bump their `last_verified`.
  2. Keep the pre-recorded backup (R4) as the demo fallback regardless of SDK version.
  3. The version is pinned exact (`-E`) in `package.json`, so prod cannot drift to a newer beta
     unreviewed.
- **mitigation_status:** **closed 2026-06-21** — live 7702 + cross-chain **re-verified on the current
  prod deploy** (v2-beta.3). A 2 USDC `/pay` payment settled to the merchant on Arbitrum, sourced
  1.74 from Arbitrum + ~0.26 from Base (cross-chain, no manual bridge), fee paid in USDC; InvoicePaid
  anchored on Base. RPC-verified independently: Arbitrum settle `0xca63ccc6…f468ce06` (status 1, USDC
  Transfer 2.0 → merchant), Base proof `0x3a5959e7…09af7a8e` (status 1), UA `0x0655137fc9c8c1`; payer
  Arbitrum 1.74→0, Base 1.07→0.65, merchant +2.0. Both chains were `already delegated` (0 new 7702
  auths), so C7 (delegation) + C8 (settle+proof) + C21 (cross-chain) all re-confirmed on the current SDK.

  **2026-07-04 — now on STABLE `2.0.3` (no longer a beta build).** Prod was bumped `2.0.0-beta.3` →
  `@particle-network/universal-account-sdk@2.0.3` (commit `2ba0dd4`, lockfile-confirmed) and
  re-verified live with TWO real `/pay` payments, both independently RPC-verified: (a) **same-chain**
  invoice `580a1fd4` — Arbitrum settle `0x044ad7b6…778179ca` (status 0x1, merchant +1.0), Base
  InvoicePaid `0x1a3491fc…c1b2630d`; (b) **cross-chain Arbitrum→Base** invoice `2cbb6ff6` — 2 USDC
  delivered on Base, ~0.95 USDC sourced from Arbitrum (`fromChains [8453,42161]`), no manual bridge —
  Base settle `0x8a283c49…8516677d` (status 0x1, merchant +2.0), Base InvoicePaid `0xa32740cf…6238923e`
  (status 0x1), UA `0x0655c4d551b159`. R19 fully closed on the stable SDK.
- **owner:** builder
- **review:** n/a (re-verified live on stable 2.0.3)

### R20 — Autonomous agent run consumes more demo USDC/gas + adds latency

- **likelihood:** med (each run does N sequential charges)
- **impact:** low (a demo beat is slightly slower; the demo wallet drains faster)
- **context:** `/agent` "Send the agent (autonomous run)" loops the proven x402 + charge path over
  the catalog in cost order until the firewall blocks the over-cap call. Deterministic — no LLM, no
  AI reasoning claimed.
- **mitigation:**
  1. Reuses the proven single-charge path (`chargeForResource`) — no new on-chain surface; the
     manual per-API buttons remain as a fallback.
  2. Each run buys only the in-cap APIs (~0.13 USDC) then halts on the over-cap call; ~15 runs per
     2 USDC on Arbitrum. Keep payer + relayer funded (R13/R16).
  3. Sequential awaits (each charge fully mines before the next) avoid relayer nonce races; the
     "retrying with proof" line keeps the wait legible (R11).
  4. Honesty: claim "unattended deterministic agent loop", never "AI/LLM agent".
- **mitigation_status:** closed 2026-06-21 — **confirmed live on prod**: an autonomous run bought
  market-insight (0.05) + sentiment-feed (0.08), then the firewall BLOCKED premium-dataset (0.20)
  ("over the per-charge cap — no funds moved, zero gas") and the agent halted after 2 purchases;
  Budget HUD drained to 1.87/2.00 (today) and 9.87/10.00 (lifetime).
- **owner:** builder
- **review:** demo dress rehearsal (Block E)

### R21 — One-tap checkout could hide consent or break the payment flow when enabled

- **likelihood:** low (flag OFF by default; only re-sequences the proven build/sign/send verbatim)
- **impact:** high (hiding the spend consent, or breaking settlement, would undercut our thesis + the revenue path)
- **context:** Spec `one-tap-checkout` collapses `/pay`'s "Build preview" + "Confirm & pay" into a
  single "Pay" after the Trust Preview, behind `NEXT_PUBLIC_ONE_TAP_CHECKOUT` (build-time, **default
  OFF**). The orchestrator only re-sequences existing handlers (`handleCreateTransaction` now returns
  the tx; `handlePay(txArg?)` accepts it); build/sign/send internals + SpendPolicy/EIP-712 unchanged.
- **mitigation:**
  1. **Flag OFF in prod** until live-verified → shipping is a no-op behaviour change; two-step is the fallback.
  2. **One-consent rule** by construction: the Trust Preview is the single explicit approval; one
     "Pay" tap = one spend; only plumbing (delegation, inline auths, rootHash) is blind-signed.
  3. Rollback = unset the env var + redeploy (no code change).
  4. Gate green (typecheck / lint / 121 unit / build); payment path git-verified untouched.
- **mitigation_status:** **closed 2026-07-05** — live-verified on prod (flag ON, persisted). Same-chain
  one-tap (invoice `1eee91a0`: Arbitrum settle `0x4a92662b…`, proof `0x1789d3e2…`) AND cross-chain
  one-tap (invoice `be9c4494`: 2 USDC on Base sourced 100% from Arbitrum, no bridge — settle
  `0xafbc0c37…`, proof `0x4e2cf6aa…`) both completed end-to-end (build→sign→send→mark-paid→proof),
  independently RPC-verified (status 0x1, merchant credited). Trust Preview stayed the single explicit
  consent; one tap = one spend. A pre-fix stale-closure crash (`null.transactionId`) was caught here
  and fixed (commit `98ef609`) before enabling.
- **owner:** builder
- **review:** n/a (closed, live-verified)

### R24 — Pro-mode key export depends on Magic dashboard config (not enabled by default)

- **likelihood:** high (a default Magic app config ships with key export OFF)
- **impact:** low (no funds at risk; the account is still the user's own EOA — only self-serve key
  portability is gated). Honesty risk: the Pro "Reveal my private key" control must not imply a
  guaranteed export when Magic hasn't enabled it for the app.
- **context:** Pro (self-custody) mode (spec `pro-self-custody-mode`) added a key-custody control on
  `/wallet`. The first impl called `magic.user.showSettings()`, which opens a generic Account
  Settings modal with NO export control for our app config (observed live 2026-07-05 — empty modal).
  Magic's actual key export is a dedicated method (`revealEVMPrivateKey` / legacy `revealPrivateKey`)
  that opens Magic's own reveal UI where only the end user sees the key (neither Magic nor OneLink can).
- **mitigation:**
  1. Code now calls the correct reveal method (prefers `revealEVMPrivateKey`), fail-closed; on
     absence/rejection it shows honest copy — own EOA, undelegate removes the delegation, and full
     key portability depends on Magic enabling export — never a dead-end button. ✅ shipped
  2. `getKeyExportCapability` / `openKeyExport` are unit-guarded (5 tests): `showSettings` is NOT
     treated as export; the key never enters OneLink's JS. ✅
  3. Ops (to make the reveal actually work): enable **Key Export** for the app in the Magic dashboard
     (verify plan), then live-verify the reveal on `/wallet` (Pro → "Reveal my private key").
- **mitigation_status:** in_progress — honest code shipped + gate green; enabling export in the Magic
  dashboard + a live `/wallet` reveal test is a user/ops step (not doable autonomously).
  **2026-07-05 — CLOSED: operator enabled Key Export in the Magic dashboard and live-verified on
  prod `/wallet` (Pro → "Reveal my private key" opened Magic's reveal UI and showed the key).**
  Promoted to claim C22. The reveal is entirely inside Magic's UI — neither Magic nor OneLink sees
  the key.
- **owner:** builder
- **review:** re-verify if the Magic plan / dashboard export setting changes

### R25 — Sponsored-delegation relayer route spends relayer gas (public endpoint)

- **likelihood:** low–med (public `/api/delegate/sponsor`, only active when the flag is on)
- **impact:** low (funds safe — no value transfer, no mandate; exposure is relayer native gas only,
  and only the caller's OWN EOA gets delegated)
- **context:** Spec `sponsored-delegation` (claim C23). When `NEXT_PUBLIC_SPONSORED_DELEGATION` is on,
  the route submits a type-4 delegation tx paying relayer gas so a zero-native-gas payer can delegate.
- **mitigation:**
  1. Server flag-gate (403/inert when off) + `validateSponsorRequest` (rejects malformed input before
     any gas is spent).
  2. Reuses the R16 rolling-window gas guard (`RELAYER_MAX_DELEGATIONS_PER_WINDOW`, default 20) —
     bounds any drain to the relayer's small balance on the sponsored chain (tiny blast radius).
  3. The authorization is the caller's own (scoped to the delegate contract); worst case an attacker
     burns a little relayer gas delegating their own EOAs. Production needs per-caller rate-limit/auth.
- **mitigation_status:** accepted for the demo (guards in place + live-verified C23 on Arbitrum). A
  shared limiter + per-caller auth remain for a non-demo multi-instance public deploy (same as R16).
- **owner:** builder
- **review:** before any non-demo public deploy; keep the relayer funded on sponsored chains

### R26 — ReceiptEmitter owner == merchant (the payee self-attests its own InvoicePaid proof)

- **likelihood:** high (this is the current on-chain state — confirmed, not hypothetical)
- **impact:** low–med (no funds at risk; the USDC settlement itself is trustless and independently
  verifiable — the `InvoicePaid` event is a convenience attestation, not the source of truth. The
  exposure is *perception*: an auditor/judge reading addresses sees the attestor == the payee, which
  softens the "verifiable proof" story.)
- **found_by:** external red-team review (2026-07). Verified on-chain: ReceiptEmitter `owner()` ==
  merchant `0x8C54…Fb7` on BOTH Base (`0x89CF…5bC3`) and Arbitrum (`0xe4C6…D2A1`).
- **context:** `registerInvoice` / `recordVerifiedPayment` are `onlyOwner`, so the emitter OWNER is
  the attestor/registrar. The demo owner key (`RECEIPT_EMITTER_OWNER_PRIVATE_KEY`) is also the demo
  merchant. The per-invoice `merchant` field is independent of the owner, so the fix is to make the
  OWNER a distinct key — no contract redeploy needed (OZ `Ownable.transferOwnership`).
- **mitigation (code artifact ready; the on-chain step is operator/ops, not autonomous):**
  1. Generate a FRESH dedicated attestor EOA — distinct from the merchant (`0x8C54…`) AND the relayer
     (`0x0AC0…`). Key generation is a human ops step.
  2. Fund it with a little native gas on BOTH Base and Arbitrum (it registers invoices + records
     proofs on both).
  3. Dry-run, then transfer, per chain — the script defaults to a DRY RUN and is guarded (refuses if
     signer ≠ current owner, or newOwner ∈ {zero address, current owner}):
     `NEW_RECEIPT_EMITTER_OWNER=0x… RECEIPT_EMITTER_OWNER_PRIVATE_KEY=0x<currentOwner> BASE_MAINNET_RPC_URL=… corepack pnpm hardhat run scripts/transfer-receipt-emitter-owner.ts --network base`
     review the dry run, then re-run with `CONFIRM_TRANSFER=yes` to broadcast; repeat `--network arbitrum`.
  4. IMMEDIATELY set `RECEIPT_EMITTER_OWNER_PRIVATE_KEY` (local + Vercel) to the NEW key and redeploy —
     after the transfer the OLD key can no longer register/record, so sequence transfer → env →
     redeploy back-to-back, in a low-activity window.
  5. Verify `owner()` on both emitters == the new attestor ≠ merchant; run one live `/pay` and confirm
     InvoicePaid still records. THEN flip the docs to claim "attestor ≠ merchant" (proof-pack, `/trust`)
     and paste the transfer tx hashes here.
- **key-loss risk (controlled):** losing the new attestor key = losing emitter control (re-transfer is
  only possible from the new key). Store it as carefully as the merchant/owner key; the script
  post-verifies `owner()` so a fat-fingered address is caught before you rely on it.
- **mitigation_status:** CLOSED, live-verified (2026-07-06) — ownership transferred to the relayer key on
  BOTH chains; the attestor (`0x0AC0…9f41`) is now distinct from the merchant payee (`0x8C54…Fb7`).
  Transfer txs: Base `0xe6a2c4a7…de6da`, Arbitrum `0x5c8db72c…3642` (both status 0x1; `owner()`
  independently RPC-verified == relayer on both). `RECEIPT_EMITTER_OWNER_PRIVATE_KEY` swapped to the
  relayer key on local + Vercel prod (old merchant key preserved as `MERCHANT_PRIVATE_KEY`); prod
  redeployed. The relayer was funded on Base (0.0005 ETH, tx `0x22e57237…7a36`) for proof-recording
  gas. **CLOSED 2026-07-06** — a live `/pay` confirmed recording under the new owner key: cross-chain
  invoice `fc5adc83` (2 USDC, Base→Arbitrum, stable 2.0.3) recorded InvoicePaid on Base — proof tx
  `0x991296…ee898cf8` **sender = relayer `0x0AC0…9f41` (RPC-verified), status 0x1** — NOT the merchant;
  Arbitrum settle `0x65ef…cffcf72d` status 0x1. Register + record now both run under the relayer.
- **tradeoff (honest cross-ref to R16):** the attestor is now the SAME key as the charge relayer, so
  the proof-owner and the gas-relayer are no longer separate (R16 had deliberately split them).
  Accepted for the demo — the ReceiptEmitter holds NO funds and InvoicePaid is an attestation, not
  the settlement's source of truth, so a relayer-key compromise could forge proof *events* but cannot
  move funds or fake the trustless on-chain settlement. A production deploy would use a THIRD
  dedicated attestor key (distinct from both merchant and relayer).
- **owner:** builder
- **review:** n/a — closed, live-verified 2026-07-06 (invoice `fc5adc83`).

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
  3. **security-hardening-v2 (2026-07-07):** merchant + payer allowlists on the GAS-SPENDING path of
     `/api/mandates/charge` (and a payer allowlist on `/api/delegate/sponsor`). Placed AFTER the
     simulation, so the zero-gas over-cap "blocked" demo stays open to any wallet; only the actual
     relayer send is gated. Closes the "fund a throwaway payer, spam micro-charges to the demo
     merchant to burn relayer gas" vector (audit-pass-2 sharpening of F4). Default = demo payer/
     merchant, env-overridable (`CHARGE_MERCHANT_ALLOWLIST` / `CHARGE_PAYER_ALLOWLIST` /
     `SPONSOR_PAYER_ALLOWLIST`; literal `"*"` opens to any). Pure allowlist logic unit-tested
     (`src/lib/relayer/allowlist.ts`). ✅ shipped (code + gate green)
- **code status:** COMPLETE — both code mitigations are shipped + build-verified (the charge route
  reads an optional dedicated `RELAYER_PRIVATE_KEY`, an in-memory global window caps relayer-gas
  sends, and simulate-first means blocked calls cost zero gas). The remainder is OPS/INFRA, not code.
- **go-live ops checklist (before any non-demo public deploy):**
  1. Generate a fresh EOA used ONLY as the relayer; fund it with a little native gas on each
     settlement chain (Base/Arbitrum). Keep its key separate from `RECEIPT_EMITTER_OWNER_PRIVATE_KEY`.
  2. Set `RELAYER_PRIVATE_KEY` in the Vercel project env (Production) to that key, then redeploy —
     the route auto-prefers it over the proof-owner key.
  3. Back the rolling-window limiter with a shared store (e.g. Upstash Redis) so the cap holds
     across serverless instances (the in-memory cap is per-instance).
  4. Tune `RELAYER_MAX_CHARGES_PER_WINDOW` / `RELAYER_CHARGE_WINDOW_MS` for expected load.
- **2026-06-21 — distinct relayer key DEPLOYED + live-verified.** A dedicated `RELAYER_PRIVATE_KEY`
  is now set on local + Vercel prod: relayer `0x0AC0…9f41`, funded on Arbitrum, distinct from the
  proof-owner `0x8C54…Fb7`. Confirmed live — a prod `/agent` run drove the relayer's nonce 0→2 (two
  in-cap charges) with gas spent from it, proving prod settles charges via the dedicated key.
  Checklist steps 1–2 are done; only step 3 (shared/Redis limiter for multi-instance prod) remains,
  and is optional until a real multi-instance public deploy.
- **2026-07-06 — SUPERSEDED by R26 (honest correction).** R26 moved the ReceiptEmitter owner to the
  RELAYER key `0x0AC0…9f41` (to make the attestor ≠ the merchant payee). So the charge-relayer key
  and the proof/attestor key are now the SAME (`0x0AC0…9f41`) — the R16 split (relayer ≠ proof-owner)
  NO LONGER HOLDS. Accepted demo tradeoff: the ReceiptEmitter holds no funds, so a relayer-key
  compromise could forge proof *events* but cannot move funds or fake the trustless settlement. A
  production deploy would use a THIRD dedicated key (distinct from both merchant and relayer) plus
  the shared/Redis limiter (step 3). See R26.
- **mitigation_status:** accepted for the demo (code guards in place; in-memory rolling-window guard
  bounds public charge/delegation gas; simulate-first = blocked calls cost zero gas). NOTE: after
  R26 (2026-07-06) the relayer key == the proof/attestor key `0x0AC0…9f41` — NOT distinct; a distinct
  funded relayer key + a shared/persistent limiter remain for a non-demo multi-instance public
  deploy. Key generation/rotation is a human ops step — not performed autonomously.
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
  2. `.env.example` defaults the flag to `false`. `.env.local` keeps it `true` (for the local
     cross-chain investigation) — but it is gitignored and never reaches Vercel, and `NEXT_PUBLIC_`
     vars are inlined at build, so prod reflects Vercel's project env (flag unset → disabled).
- **mitigation_status:** **closed 2026-06-21** — code-gated AND **prod verified clean**: all three
  debug routes on https://onelink-pay.vercel.app serve the harmless "disabled" stub (curl-checked,
  3/3 — `to enable this page` / `local-only page` / `to use this route`). Standing rule: any future
  deploy MUST keep `NEXT_PUBLIC_ENABLE_DEBUG_PROBES` off/unset.
- **owner:** builder
- **review:** re-verify (curl the 3 stubs) after any change to Vercel build env

## Security findings (external audit pass 2, 2026-06-25)

> A second external audit. Independently re-verified against current code: all 8 findings reference
> real code (no stale-branch errors, no false positives). 5 genuinely open (remediated in spec
> `audit-remediation-pass2`), 1 accepted demo-only (F2/R10), 2 already closed (F4/R16, F6/R18).

### R21 — Supabase schema-file drift: `schema.sql` granted `anon` SELECT (the FILE looked exposed)

- **likelihood:** low (the live DB does not honor it — see live test)
- **impact:** low–med ONLY if a fresh project were provisioned from `schema.sql` as-was (then anon
  could read `payments`). On the CURRENT live DB: not exposed.
- **found_by:** external audit pass 2 (flagged the FILE) — then re-verified against the LIVE DB.
- **LIVE TEST (2026-06-25, anon + service_role via REST count):**
  - ANON → `payments`: HTTP 200, `content-range: */0` (0 rows)
  - ANON → `payment_links`: HTTP 200, `*/0` (0 rows)
  - SERVICE_ROLE → `payments`: HTTP 206, `0-0/23` (23 rows)
  - ⇒ the live DB already denies anon row reads (RLS effectively on / no effective anon grant). The
    auditor read the schema FILE, not the live DB. **No live leak.**
- **mitigation:** `supabase/schema.sql` corrected to match the secure reality — `anon` gets NO table
  SELECT + `enable row level security` on merchants/payment_links/payments — so a future
  `psql < schema.sql` / fresh project is secure by construction (closes the latent drift). ✅ shipped
- **mitigation_status:** closed 2026-06-25 — **live verified not-exposed**; schema-file drift fixed.
  Belt-and-suspenders **DONE**: RLS explicitly enabled on merchants/payment_links/payments via the
  dashboard SQL editor (2026-06-25); re-verified over REST — anon → payments/payment_links = 0 rows,
  service_role → 23 / 13 rows (app reads via service_role unaffected).
- **owner:** builder
- **review:** re-run the anon REST count check after any schema change

### R22 — Receipt funding-source chain was client-reported but read as verified

- **likelihood:** med (every cross-chain receipt)
- **impact:** low (settlement + Base InvoicePaid proof ARE server-verified; only the "funded from
  <chain>" provenance came from the client `sourceChainIds`)
- **found_by:** external audit pass 2
- **mitigation:**
  1. The receipt's settled cross-chain caption now labels the funding source as **reported by your
     wallet**, keeping "verified on-chain" on the settlement + proof legs only
     (`src/components/cross-chain-route.tsx`). ✅ shipped
  2. (future enhancement — NOT required for honesty; item 1 already removed the overclaim) upgrade
     "reported" → "verified" by server-deriving the funding legs, in SPIKE-GATED steps, because the
     load-bearing assumption (the server can fetch the funding breakdown by `ua_transaction_id`) is
     UNVERIFIED and only sourced from Particle's PUBLIC docs — verify it, do not trust the docs:
     - **L0 spike — ✅ DONE, GREEN (2026-07-06, verified EMPIRICALLY, not from docs):** the installed
       SDK `2.0.3` exposes `UniversalAccount.getTransaction(transactionId): Promise<any>`; a
       server-side call (project keys + `ownerAddress`, no Magic session) against `fc5adc83`'s
       `ua_transaction_id` `0x0655f16e0cd6c8` returned server-authoritative funding data —
       `status: 7 (FINISHED)`, `tokenChanges.fromChains: [42161, 8453]`, `toChains: [42161]`,
       `depositTokens`/`decr` chainIds `[42161, 8453]`, plus `sender`/`receiver` and split
       deposit/settlement/refund userOperations. NB: `preview_json.tokenChanges.fromChains` is
       client-originated (built in-browser) → NOT a server-authoritative substitute; only this direct
       server→Particle query counts. VENDOR-verified (Particle backend), NOT on-chain — safe to label
       "verified by Particle activity", never "on-chain proven" (that is L3).
     - **L2 — ✅ SHIPPED + live-verified (2026-07-06, commit `5b042ce`; READ-TIME, off the settlement
       path):** `/receipt/[id]` verifies the route at render via `getTransaction(ua_transaction_id)`,
       validates `status==FINISHED` && `sender==payer` && `receiver==merchant`, derives the
       source-chain ARRAY from `fromChains`, and upgrades the caption "reported" → "verified by
       Particle activity"; any miss/slowness/mismatch falls back to the "reported" label (fail-closed,
       2.5s timeout, never throws). `mark-paid` / DB untouched. Pure `deriveFundingRoute()` + 8 unit
       tests (fixture from `fc5adc83`); E2E-verified locally (fc5adc83 → particle_verified/source Base;
       merchant mismatch → client_reported) and on prod (`/receipt/fc5adc83…` renders "verified by
       Particle activity", 0× "reported"). Free backfill (any past payment with a `ua_transaction_id`).
       Spec: `.kiro/specs/verified-funding-route/`.
     - **L3 — ✅ SHIPPED + live-verified (2026-07-06, commit `1e1b231`):** the receipt now surfaces the
       source-leg on-chain debit tx(s) from the activity's `*UserOperations` (`chainId != settlement`,
       real 0x hash, deduped) as a clickable explorer link ("&lt;chain&gt; debit on-chain"). Recon
       confirmed the source-leg tx is a real MINED Base tx (`0x943ccd1b…687f`, status `0x1`, Base USDC
       in logs); prod `/receipt/fc5adc83…` renders `basescan.org/tx/0x943ccd1b…`. A judge can inspect
       the actual source USDC debit — not just a vendor claim. (Label stays "verified by Particle
       activity"; the source→settlement LINKAGE is via Particle activity, so we do NOT claim
       "on-chain proven" outright — the on-chain link is inspectable supporting evidence.)
     Already shipped + human-verifiable today: the receipt links UniversalX activity by
     `ua_transaction_id` (a vendor/activity view of the legs — NOT an on-chain proof).
- **mitigation_status:** closed 2026-06-25 (honest labeling shipped; gate green). 2026-07-06 — item 2
  L0 spike GREEN + **L2 SHIPPED & live-verified** (commit `5b042ce`): the receipt now server-verifies
  the funding route via Particle `getTransaction` and labels it "verified by Particle activity"
  (read-time; `mark-paid` / DB untouched; fail-closed to "reported"). **L3 also SHIPPED** (commit
  `1e1b231`): the receipt links the on-chain source-leg debit (BaseScan) so the source USDC movement
  is independently inspectable. Route linkage is still via Particle activity (vendor), so we stop
  short of claiming "on-chain proven" — but every leg is now on-chain-inspectable. Fully resolved.
- **2026-07-07 — external audit pass 3 (F1) + payment-code FREEZE:** the reviewer flagged that the
  funding attribution is bound by `ua_transaction_id` (a payer→merchant activity), NOT by the exact
  settlement tx hash from the activity's `userOps` — so in principle a DIFFERENT completed activity of
  the same payer→merchant could be mis-attributed as the funding route. ACCEPTED & DOCUMENTED, not
  code-fixed, because (a) the payment FACT is not fakeable — USDC settlement + InvoicePaid are
  independently on-chain-verified, so F1 is attribution PRECISION, not payment validity; and (b) we are
  FREEZING payment / `mark-paid` / funding-route code before submission to protect the working demo
  (the auditor's own advice). Future hardening (post-hackathon): bind the funding snapshot to the
  settlement userOp hash and persist it immutably at mark-paid time. Label stays "verified by Particle
  activity" (vendor), never "on-chain proven".
- **owner:** builder
- **review:** n/a — funding-route L0/L2/L3 shipped + live-verified 2026-07-06 (`fc5adc83`).

### R23 — Wallet receive copy overclaimed reach ("every chain / Solana / anywhere")

- **likelihood:** low
- **impact:** low (a precise judge could flag that the EVM receive address can't take Solana SPL)
- **found_by:** external audit pass 2
- **mitigation:**
  1. `src/app/wallet/page.tsx` copy narrowed to "any EVM chain" / "Particle-supported chains";
     dropped the "Solana, or anywhere else" claim against the EVM receive address. ✅ shipped
- **mitigation_status:** closed 2026-06-25 (copy narrowed; honest)
- **owner:** builder
- **review:** demo dress rehearsal (Block E)

### Audit pass 2 — items already covered (no new work)

- **F2 (x402 replay):** already **R10** (accepted, demo-only; production needs a consumed-tx store).
  Audit sharpened it: a charge ≥ price can satisfy a *different* resource, not just re-fetch the
  same one — still within R10's "needs a consumed-proof store" remedy.
- **F4 (relayer gas guard in-memory):** already **R16** (dedicated `RELAYER_PRIVATE_KEY` deployed +
  live-verified; shared/Redis limiter is a documented pre-prod ops step, not code).
- **F6 (debug send routes):** already **R18** (all 3 gated on `NEXT_PUBLIC_ENABLE_DEBUG_PROBES`;
  prod curl-verified serving disabled stubs). Server-side guard = optional defense-in-depth.
- **F8 (`<img>` lint warning):** fixed in `audit-remediation-pass2` — the misplaced
  `eslint-disable-next-line` was moved onto the `<img>` line with a justification; the `viem/ox`
  dynamic-dependency build note is accepted (dependency characteristic, non-blocker).

## Security hardening v2 (2026-07-07)

> Third external review. Each finding re-verified in code (two confirmed real, one refuted — the
> visible cross-chain badge is driven by server-verified funding `crossChain`, NOT `isCrossChain`
> (which only drives the accurate "Proof anchored on Base" chip), so it is not a mislabel). Fixes in
> spec `security-hardening-v2`. Code-complete + gate-verified (typecheck / lint / unit / build); the
> Supabase migration + live verification are pending ops/"go" steps.
>
> - **x402 replay** → now fail-CLOSED + `UNIQUE(tx_hash)` consume-store. See **R10** (updated).
> - **relayer gas-drain** → merchant + payer allowlists on the gas-spending send. See **R16** (updated).

### R27 — Internal strategy/research notes (`kiro-import/`) tracked in the public repo

- **likelihood:** high (confirmed: 6 files, ~548K, tracked in Git)
- **impact:** low (no secrets — the 64-hex strings inside are public tx / rootHash / userOp hashes,
  not keys; not referenced by `src/`). Exposure is judge-facing NOISE + an unnecessary question surface.
- **found_by:** external review (2026-07)
- **mitigation:**
  1. `.gitignore` now ignores `kiro-import/`. ✅ shipped
  2. `git rm -r --cached kiro-import` (keeps the files locally, drops them from the repo tree) runs in
     the commit step. ⏳ pending — `.gitignore` alone does NOT untrack already-tracked files.
- **mitigation_status:** in_progress — ignore rule shipped; the `git rm --cached` + commit is the ship step.
- **owner:** builder
- **review:** confirm `git ls-files | grep kiro-import` is empty after the commit

## Risks closed (kept for trace)

| id | risk | closed_on | how |
|----|------|-----------|-----|
| R2 | Judges don't grok the firewall in <30s | 2026-06-21 | "AI-safe card" reframe + legible mandate card + draining budget HUD + split-screen agent demo, all shipped & proven live (C12, C14, C15, C16). |
| R3 | "You reinvented spend permissions" | 2026-06-21 | Sourced prior-art comparison shipped on the landing + README with neutral framing (C19, `landing-narrative-prior-art` superseding `prior-art-readme`); the x402 wedge (C17) is the concrete originality answer; R14 (dismissiveness) also closed. |
| R7 | Magic Google OAuth fails in target browser | 2026-06-21 | Spec `magic-social-login` shipped; user-confirmed live OAuth round-trip + auto-detect on reload (claim C13). |
| R8 | Receipt page looks centralized | 2026-06-21 | "How is this verified?" disclosure on `/receipt/[id]` + `/success/[id]`: trustless settlement vs attested InvoicePaid proof ("not an oracle"), concrete matched-leg detail, open-source verifier referenced. Build-verified (`/receipt/[id]` completed-branch live visual pending a completed invoice). |
| R15 | Proof payer was client-supplied (mark-paid) | 2026-06-21 | Record the on-chain transfer sender (`matchingTransfer.from`) as payer instead of the client value; build + tests green; operator-confirmed live (payer_address == on-chain sender). |
| R17 | Dashboard chain mismatch (labels/explorer links hardcoded to Base) | 2026-06-21 | Resolve each link/payment chain by id for labels + payment-tx links; proof-tx uses the proof chain; header chip relabeled "proof anchor"; operator-confirmed live (links resolve to correct chains). |
| R18 | Debug routes ship live if the prod build has the probe flag on | 2026-06-21 | Code-gated behind `NEXT_PUBLIC_ENABLE_DEBUG_PROBES`; prod curl-verified all three debug routes serve the disabled stub (3/3), so Vercel's build flag is off; `.env.local`'s `true` is local-only + gitignored. |

## Pre-mortem schedule

- **2026-06-22:** post-kickoff pre-mortem. Update R1, R5 with Particle's confirmed answer.
- **2026-06-25:** post-Circle-workshop pre-mortem. Update R1 with Gateway integration status.
- **2026-06-28:** weekly pre-mortem.
- **2026-07-01 onward:** daily pre-mortem during submission week.

## Format note

Each risk row may be expanded into its own section if the mitigation grows beyond a few bullets.
This file stays tight; complex mitigations live in their respective spec.
