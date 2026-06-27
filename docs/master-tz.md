# OneLink Pay — Master Technical Spec (ТЗ)

> Locked 2026-06-21. The single source of truth for what we're building, why, and in what order.
> Synthesized from the 4 deep-research reports in `docs/RES/`.
> Process is governed by `.kiro/steering/methodology.md`.
> Public claims gated by `docs/honest-claim-ledger.md`.
> Demo failure modes tracked in `docs/risk-register.md`.

## 1. North Star + prize stack

**One sentence we are building toward:** *OneLink Pay is an on-chain spending limit for AI
agents — your agent can pay across any chain, but it physically cannot overspend, pay the wrong
merchant, or keep paying after you revoke.*

**Hackathon:** UXmaxx (Encode Club + 7702 Collective). Best-known rubric: UX 40 / UA+7702 30 /
Adoption 20 / Polish 10. Confirmed prizes: UA Track ($5K/$2.5K/$1.5K), Arbitrum bonus (~$2K),
Magic bonus (~$500), ZeroDev + Openfort subtracks.

**Prize stack we are targeting (risk-adjusted, per `docs/RES/deep-research-onelink-pay-uxmaxx.md`):**

- **Floor (must-bank):** Arbitrum bonus + Magic bonus ≈ $2.5K. Largely already proven; finishing
  social login + packaging is the only work.
- **Ceiling (swing):** Universal Accounts Track. Only swing if the cross-chain gate is honestly
  cleared (epic E2). The same submission falls back to General Track without rework if the gate
  doesn't open.
- **Not pursuing now:** ZeroDev / Openfort subtracks. Considered scope creep for solo + AI in
  the remaining time. Reconsider only after all P1 specs are green.

## 2. Epics

Each epic declares the rubric axes it scores. A spec only ships if it advances at least one
axis listed under its parent epic.

### E1. AI-safe card narrative + agent-on-a-leash demo
- **Scores:** UX 40 + UA+7702 30 (the centerpiece for both axes)
- **Why:** all 4 deep-research reports converge: this is the single highest-leverage move. The
  visceral "agent autonomously pays, then gets blocked on-chain" moment is the wow that wins
  rooms after 40 demos.
- **Specs:** `pitch-positioning-rewrite`, `legible-mandate-card`, `agent-on-a-leash-demo`.

### E2. Cross-chain UA gate (compliance for UA Track)
- **Scores:** UA+7702 30 + Polish 10
- **STATUS (updated 2026-06-25): RESOLVED.** Cross-chain value movement via the Particle UA in
  EIP-7702 mode is **proven live and deployed (ledger C21, 2026-06-21)** — see `docs/status.md`
  and risk **R1**. The Circle Gateway backup rail was not needed. The note below is kept for trace.
- **Why (historical):** the binary eligibility gate for UA Track. Was blocked at Particle's
  settlement backend (`REFUND_FAILED` / `-32613`) on SDK 1.1.1; two-rail strategy (Particle
  transfer-rail first, Circle Gateway backup). **Resolved** on
  `@particle-network/universal-account-sdk@2.0.0-beta.3` (C21).
- **Specs:** `cross-chain-ua-particle`, `cross-chain-circle-gateway`,
  `organizer-rule-clarification`.

### E3. Walletless onboarding (Magic bonus + UX score)
- **Scores:** UX 40 + Magic bonus
- **Why:** Google OAuth via Magic is a few hours of work and unlocks the full ~$500 Magic bonus
  + materially better onboarding for the demo (no seed phrase, no extension visible). All 4
  reports list this as a top-3 move.
- **Specs:** `magic-social-login`.

### E4. Proof + trust layer
- **Scores:** UX 40 + Adoption 20 + Polish 10
- **Why:** the public proof receipt + a prior-art comparison table in the README defuse the
  "you reinvented spend permissions" critique that all 4 reports flagged. Ships trust without
  building new on-chain code.
- **Specs:** `proof-receipt-polish`, `prior-art-readme`.

### E5. The x402 spending-limit gateway (ORIGINALITY CORE — elevated from stretch 2026-06-21)
- **Scores:** UA+7702 30 (innovation) + Adoption 20
- **Why:** the originality wedge (user directive: originality was the one weak spot). x402 is the
  breakout agent-payment rail of 2026 (~120M+ tx, $41M+ USDC, 400k+ agents) with a *documented*
  security gap — allowance/spend scopes (two arXiv papers on x402 attacks). x402 gives an agent a
  way to pay; nothing bounds how much. OneLink Pay is the on-chain spending-limit layer: every
  x402 payment settles through a revocable mandate, so over-budget agent calls are refused before
  funds move. "x402 gives agents a wallet; OneLink Pay is the leash." Genuinely novel — no shipped
  product pairs the x402 HTTP handshake with on-chain mandate enforcement.
- **Honesty:** x402 *pattern* (402 + requirements → pay → retry) with a custom `onelink-mandate`
  settlement scheme; NOT Coinbase-facilitator wire-compatible. Say so.
- **Specs:** `x402-mandate-gateway` (code-complete 2026-06-21; live on-chain buy pending user).

### E6. Particle chain-abstraction showcase (sponsor-tooling spotlight — added 2026-06-21)
- **Scores:** UA+7702 30 (makes Particle the visible hero)
- **Why:** our differentiator (SpendPolicy) is chain-agnostic, so the 30% "prominent UA usage"
  criterion was a soft spot (all 4 reports flagged it) and the user directed us to make the product
  highlight the sponsors' tooling. Particle's superpower is chain abstraction — one balance across
  chains. We surface it live via read-only `getPrimaryAssets` as a Unified Balance HUD on `/agent`:
  "your agent has one balance across Base + Arbitrum; it pays for x402 APIs without picking a chain
  or holding gas."
- **Honesty:** the aggregated balance is real (read); demo settlement is same-chain Arbitrum — no
  cross-chain-settlement claim.
- **Specs:** `particle-unified-balance` (shipped 2026-06-21).

## 3. User stories (INVEST)

Format: `<id> | <story> | <axis> | INVEST?`

### Under E1 — AI-safe card narrative + demo
| id | story | axis | INVEST |
|----|-------|------|--------|
| E1.S1 | As a hackathon judge, I see the agent autonomously pay 0.10 USDC from a mandate and the budget HUD update, so I understand "agent paid safely" in <10s. | UX, UA | ✅ |
| E1.S2 | As a hackathon judge, I see the agent attempt 0.20 USDC, the simulation refuse it, and the UI show `PerChargeExceeded` with no funds moved, so I feel the "blocked on-chain" wow in <10s. | UX, UA | ✅ |
| E1.S3 | As a hackathon judge, I see the user click "Revoke" and the next agent attempt fail (`MandateIsRevoked`), so I understand reversibility. | UX | ✅ |
| E1.S4 | As a visitor to the landing page, I see "AI-safe card" framing within 2 seconds, so I understand the product without scrolling. | UX | ✅ |
| E1.S5 | As a viewer of the recorded demo, I see split-screen (agent terminal | firewall dashboard), so the contrast between autonomous activity and on-chain immunity is visceral. | UX | ✅ |

### Under E2 — Cross-chain UA gate
| id | story | axis | INVEST |
|----|-------|------|--------|
| E2.S1 | As a payer, I authorize a USDC payment that sources value cross-chain via the Universal Account in 7702 mode, so the submission satisfies "≥1 cross-chain value op via UA." | UA | ✅ |
| E2.S2 | As a payer (backup rail), I deposit USDC on Arbitrum into Circle Gateway and pay merchant on Base, so we have a cross-chain rail even if Particle remains down. | UA, Polish | ✅ |
| E2.S3 | As the project owner, I get written confirmation from organizers on whether sourcing or Gateway counts, so we cannot be DQ'd on rule interpretation. | Polish | ✅ |

### Under E3 — Walletless onboarding
| id | story | axis | INVEST |
|----|-------|------|--------|
| E3.S1 | As a new user, I sign in with Google in ≤5s and never see a seed phrase, so onboarding feels Web2. | UX, Magic bonus | ✅ |
| E3.S2 | As a returning user, my session persists across page reload, so onboarding is one-shot. | UX | ✅ |

### Under E4 — Proof + trust
| id | story | axis | INVEST |
|----|-------|------|--------|
| E4.S1 | As a recipient of a shared receipt URL, I see mandate hash + tx hashes + chain badges + verification trail, so the proof is independently verifiable in <30s. | UX, Adoption | ✅ |
| E4.S2 | As a judge reading the README, I see a prior-art table comparing OneLink to Coinbase Spend Permissions / ERC-7715 / ZeroDev / AP2 / x402, so I don't dismiss us as derivative. | Adoption, Polish | ✅ |

### Under E5 — The x402 spending-limit gateway
| id | story | axis | INVEST |
|----|-------|------|--------|
| E5.S1 | As a demo viewer, I see the agent hit a 402-gated API endpoint and pay via the mandate (over-budget refused), so I understand the agentic-payments ecosystem fit. | UA, Adoption | ✅ |
| E5.S2 | As a developer, the `/api/x402/<resource>` route returns a faithful x402 `402` + payment requirements when called without payment, so the pattern is recognizably x402. | UA | ✅ |
| E5.S3 | As a payer, an x402 purchase that would exceed my mandate caps is blocked before any funds move, so my agent literally cannot overspend on paid APIs. | UA, Adoption | ✅ |

### Under E6 — Particle chain-abstraction showcase
| id | story | axis | INVEST |
|----|-------|------|--------|
| E6.S1 | As a demo viewer, I see the agent's Universal Account balance as ONE number across Base + Arbitrum, so Particle's chain abstraction is obvious in <5s. | UA | ✅ |
| E6.S2 | As a judge, I see the per-token, per-chain breakdown of the unified balance, so I understand the UA aggregates real cross-chain liquidity, not a single-chain wallet. | UA | ✅ |

### Under E4 — Proof + trust (added 2026-06-21)
| id | story | axis | INVEST |
|----|-------|------|--------|
| E4.S3 | As a visitor to the landing, I can reach the x402 agent demo in one click and see the agent-economy framing + prior-art comparison + sponsor tooling, so our most original work is front and center. | UX, Adoption | ✅ |

## 4. Spec mapping

| spec_id | stories covered | priority | est. effort | status |
|---------|-----------------|----------|-------------|--------|
| `pitch-positioning-rewrite` | E1.S4 | P1 | 1-2h | **closed** 2026-06-21 |
| `magic-social-login` | E3.S1, E3.S2 | P1 | 4h | **closed 2026-06-21** (T15 + T17 user-confirmed; T18 email regression + T19 incognito strict-cookies deferred to demo dress rehearsal in Block E) |
| `legible-mandate-card` | E1.S1 (HUD), part of E1.S4 | P1 | 4h | **closed 2026-06-21** (card + budget HUD live on `/firewall`, user-confirmed; 25 format unit tests; bar drains; default preset → agent_budget) |
| `agent-on-a-leash-demo` | E1.S1, E1.S2, E1.S3, E1.S5 | P1 | 6-8h | **closed 2026-06-21** (split-screen agent terminal + scenarios + revoke; proven live on Arbitrum; 66 unit tests; C16) |
| `cross-chain-ua-particle` | E2.S1 | P2 | 4-8h (infra-bound) | **proven live 2026-06-21 (C21)** — see `status.md` / R1 |
| `organizer-rule-clarification` | E2.S3 | P2 | 1h | scaffold pending |
| `cross-chain-circle-gateway` | E2.S2 | P2 (backup) | 8-12h | scaffold pending |
| `proof-receipt-polish` | E4.S1 | P3 | 2-3h | **closed 2026-06-21** (share URL helper 5 tests; server-side QR + Share section on completed `/receipt/[id]`; build clean; C20). Note: completed-branch render verified by build + QR generation; live visual pending a completed invoice. |
| `prior-art-readme` | E4.S2 | P3 | 2h | **superseded 2026-06-21** by `landing-narrative-prior-art` (which delivered E4.S2 on the landing + README). |
| `x402-mandate-gateway` | E5.S1, E5.S2, E5.S3 | **P1 (originality core)** | 6-10h | **closed 2026-06-21** (proven live on Arbitrum: $0.05 x402 buy delivered + $0.20 over-cap blocked; 28 unit tests; build clean; C17) |
| `particle-unified-balance` | E6.S1, E6.S2 | **P1 (sponsor showcase)** | 3-5h | **closed 2026-06-21** (read-only `getPrimaryAssets` unified-balance HUD on `/agent`; 11 unit tests; build clean; C18) |
| `landing-narrative-prior-art` | E4.S2, E4.S3 | **P1** | 2-3h | **closed 2026-06-21** (landing links `/agent` + agent-economy section + prior-art table + sponsor strip; README prior-art section; build clean; C19) |

`scaffolded` = `requirements.md` + `design.md` + `tasks.md` exist in `.kiro/specs/<spec-id>/`.
`scaffold pending` = listed here but not yet broken into tasks; will be opened when prior P-tier
clears.

## 5. Priority + sequence

The sequence is locked. Each block must be green before opening the next.

### Block A — P1 quick wins (target: complete by 2026-06-23 EOD)
1. `pitch-positioning-rewrite` — fastest move, biggest narrative impact. ~1-2h.
2. `magic-social-login` — secures Magic bonus. ~4h.
3. `legible-mandate-card` — wires the "no blind signature" UX moment + budget HUD. ~4h.

### Block B — P1 centerpiece (target: complete by 2026-06-25 EOD)
4. `agent-on-a-leash-demo` — bot script + agent terminal panel + 3-beat scene. ~6-8h.

### Block C — P2 cross-chain gate (parallel to Block B, gated on workshops)
5. `organizer-rule-clarification` — Discord question on Jun 22. ~1h.
6. `cross-chain-ua-particle` — Particle DevRel attempt at Jun 22 kickoff. ~4-8h.
7. `cross-chain-circle-gateway` — only if 6 doesn't clear by Jun 26. ~8-12h.

### Block D — P3 polish (target: 2026-06-27 EOD)
8. `proof-receipt-polish`.
9. `prior-art-readme`.
10. `x402-thin-wrapper` (only if Block C is green and time remains).

### Block E — submission week
11. Pre-mortem (run §14 of methodology).
12. Pre-recorded backup video of every demo scene.
13. Final claim ledger re-verification.
14. Submit.

## 6. Cut list (sacred)

These will not ship before submission. Any proposal to add must pass a RICE check against the
rubric.

- Multi-token support (USDC only).
- Multi-merchant marketplace UI (single demo merchant).
- Mobile-first responsive overhaul (best-effort responsive only).
- Internationalization beyond Russian (UI stays English).
- Native mobile app.
- ZeroDev / Openfort deep integration "for the bonus."
- Full x402 SDK integration (only the thin wrapper from E5.S1 is allowed, and only as P3 stretch).
- Admin dashboard.
- Subscriptions / recurring payments beyond the daily cap (out of scope).
- DEX swap UX.
- Receipt NFTs.
- Refactoring already-shipped infra "for cleanliness."
- New chains beyond Base + Arbitrum.

## 7. Verification trail (filled as specs complete)

Each row written when a spec is closed (Definition of Done met).

| spec_id | completed | demo_path | proof_artifact | claim_ledger_rows | tests_added |
|---------|-----------|-----------|----------------|-------------------|-------------|
| `pitch-positioning-rewrite` | 2026-06-21 | `/` (landing) + `README.md` opening | `src/app/page.tsx` hero + footer; `README.md` first section; typecheck + lint exit 0; user visual confirmation pending | C12 | none (copy rewrite) |
| `magic-social-login` | 2026-06-21 | `/firewall` (Google → /auth/callback → restored session, address `0x53Bd…206a`) | live OAuth round-trip user-confirmed; auto-detect on reload confirmed; typecheck + lint + 29 unit tests green | C13 | 16 new node:test cases for `redirect.ts` (sanitizeReturnPath + buildOauthCallbackUrl) |
| `legible-mandate-card` | 2026-06-21 | `/firewall` arming flow (MandateCard pre-sign) + ArmedPanel (BudgetHud) | user paste confirmed card + HUD render live with on-chain reads; typecheck + lint + 54 unit tests green; tsconfig target bumped ES2017→ES2020 for BigInt literals | C14, C15 | 25 new node:test cases for `format.ts` (formatUsdcAmount / formatMerchant / formatExpiry / formatRemaining / formatCountdown) |
| `agent-on-a-leash-demo` | 2026-06-21 | `/firewall` split-screen (agent terminal vs firewall dashboard) | proven live on Arbitrum: within-cap 0.10 settled + budget drained to 1.90/9.90, over-cap 0.20 BLOCKED PerChargeExceeded, revoke → MandateIsRevoked; typecheck + lint + 66 unit tests green | C16 | 12 new node:test cases (`scenarios.ts` 7 + `log-formatter.ts` 5) |
| `x402-mandate-gateway` | 2026-06-21 | `/agent` (x402 catalog + agent terminal) + `/api/x402/[resource]` | **proven live on Arbitrum**: $0.05 market-insight bought via full x402 handshake (402→charge→proof→200 OK + data, budget →1.95/9.95); $0.20 premium-dataset BLOCKED PerChargeExceeded, resource withheld; build clean (19 routes); typecheck+lint+94 unit tests green | C17 | 28 new node:test cases (`requirements` 11 + `catalog` 8 + `verify` 9) |
| `particle-unified-balance` | 2026-06-21 | `/agent` Unified Balance HUD (read-only `getPrimaryAssets`) | UniversalBalanceCard surfaces the real cross-chain aggregated balance + sponsor badges + honest cross-chain caption; build clean (105 tests total); `/agent` renders 200 | C18 | 11 new node:test cases (`assets.ts`) |
| `landing-narrative-prior-art` | 2026-06-21 | `/` landing (nav + hero → `/agent`; agent-economy section; prior-art table; sponsor strip) + README | `/agent` now one click from the landing; prior-art comparison on landing + README (sourced); build clean (105 tests); `/` renders 200 with the `/agent` link + agent-economy copy | C19 | none (copy/JSX) |
| `proof-receipt-polish` | 2026-06-21 | `/receipt/[id]` Share & verify section (server QR + copy link) | `receiptShareUrl` 5 unit tests; server-side QR SVG (`qrcode`) + CopyLinkButton + "scan to verify" on completed receipts; build clean (110 tests); QR generation verified | C20 | 5 new node:test cases (`share.ts`) |
| `cross-chain-ua-particle` | 2026-06-21 | `/pay` checkout (cross-chain settle) + public `/receipt/[id]` | **C21** — invoice `7be9118e` settled 1.0 USDC cross-chain (Base → merchant on Arbitrum `0x41217d8b…c3dd12e1`), InvoicePaid on Base `0x9d66901d…4068359e`, UniversalX `0x0654e9323a0bf7`; RPC-verified. Full detail in `status.md` + risk R1 | C21 | rail proven live; guarded by `mark-paid` verification |

## 8. Acceptance for the master TZ itself

This document is acceptable when:

- All 5 epics declare their rubric axes (✅).
- All user stories are INVEST-checked (✅).
- All P1 specs are scaffolded (✅ for 3 of 4 — `pitch-positioning-rewrite` opens next).
- Sequence (§5) is concrete and dated.
- Cut list (§6) is signed off.
- Verification trail (§7) is initialized empty and ready to fill.

## 9. Living document policy

This file changes when:

- The rubric is confirmed at Jun 22 kickoff (update §1).
- A spec closes (add row in §7).
- A new constraint appears (e.g. Particle gives a definitive answer on cross-chain). Update §2,
  §3, §5 as needed.
- A scope item is reconsidered. Move it from §6 to §3 only after RICE approval.

Every change to this doc is a `docs(master-tz): <subject>` commit.
