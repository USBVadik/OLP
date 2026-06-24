# OneLink Pay — Winning Strategy (single source of truth)

> Last updated: 2026-06-21 · Owner: team · Status: living doc
>
> **Why this file exists.** Four deep-research reports (`docs/DEEP/*`) + a Codex review + Kiro's
> synthesis converge on one strategy. This is the canonical version so agents don't pull the
> project in different directions. **For verifiable CLAIMS, `docs/honest-claim-ledger.md` is
> authoritative; this file is authoritative for STRATEGY, priorities, demo, and specs.**
> If any other doc (e.g. `status.md`) contradicts the ledger, the ledger wins and the other doc
> is stale and must be fixed (see P0.1).

---

## 0. TL;DR

**Positioning:** OneLink Pay is the **Permission Firewall for Universal Accounts**.
Particle makes payments chain-agnostic; OneLink makes them **safely authorized** — a user hands an
agent or merchant *a limited, revocable on-chain permission card, not their wallet*.

**Mantra (the product in three beats):**
- **Trust before payment** — a legible, scoped mandate (card-limit UX).
- **Limits during automation** — on-chain enforcement; over-cap reverts, zero funds move.
- **Proof after settlement** — a public, verifiable cross-chain receipt.

**Tagline:** *A card for your AI, not your wallet.*

---

## 1. Positioning & narrative

**Strong version (for judges):**
> OneLink Pay is a permission firewall for Universal Accounts. It lets users safely authorize
> merchants and agents to pay within clear, revocable limits, while Particle handles cross-chain
> execution invisibly.

**The differentiator that wins (use this when challenged):** it's about **where enforcement lives**.
- Most agent-wallet products (Crossmint, Privy, Turnkey, Coinbase AgentKit) enforce limits in a
  **custodial TEE/MPC server wallet or off-chain policy** you must trust.
- OneLink enforces in an **auditable on-chain contract anyone can re-check**.
- One-liner: **"Policy you can audit, not policy you have to trust."**
- Category framing: **"x402 gives agents a wallet; OneLink is the leash."** / **"Rails vs guardrails."**

**Framing hooks (all defensible):**
- **Operationalizes EIP-7702's own goal.** The EIP names *privilege de-escalation* (permissions
  weaker than full wallet access) as a design goal — OneLink is that goal made into a product.
- **vs Google AP2:** AP2 uses signed *"Payment Mandates"* too — but as **off-chain** verifiable
  credentials. "Same word; we enforce the mandate **on-chain** at the user's account — a promise
  becomes a guarantee."
- **Standards-aligned, not bespoke:** speak the **ERC-7715/7710** permission vocabulary and the
  **Base Spend Permissions** mental model ("ask once to spend up to X, to one merchant, until an
  expiry") so a fintech-literate judge maps it instantly to "a card with a limit."

---

## 2. Claim discipline (read before writing any public copy)

**Rule:** every public claim needs a row in `docs/honest-claim-ledger.md`. No exceptions.

**NEVER say (overclaim denylist):**
- ❌ "Fully autonomous AI agent" → it's an **agent-initiated harness** over a real on-chain firewall.
- ❌ "Coinbase x402 compatible" / "facilitator-compatible" → it's the **x402 *pattern*, `onelink-mandate` settled**.
- ❌ "Gasless / gas sponsored" → not claimed; no paymaster row in the ledger.
- ❌ "Zero ETH ever needed" → first-time 7702 delegation needs a little native gas per chain.
- ❌ "First / only / leading."
- ❌ "Circle integrated" / "Gateway integrated."
- ❌ "ZeroDev / Openfort implemented."
- ❌ Showing a recorded replay **as** a live run.

**Skeptic question → honest answer (rehearse these):**

| Likely question | Honest answer |
|---|---|
| "Is this really x402?" | "It's the x402 *pattern* — 402 → pay → retry-with-proof — settled by our on-chain mandate (`onelink-mandate`), not the Coinbase EIP-3009 facilitator. Enforcement is real; wire-compat is not claimed." |
| "Is the agent autonomous?" | "The on-chain enforcement is 100% real; the agent is an agent-*initiated* harness calling the same relayer + contract a real agent would. The autonomy is dramatized." |
| "What does 'zero gas' mean?" | "Over-cap charges revert in **simulation**, before broadcast — no funds move and no on-chain gas is spent on the blocked attempt." |
| "Is cross-chain real?" | "Proven live + deployed (ledger C21). Here are both tx hashes + the UniversalX link. A first-time payer needs a little native gas per chain for the one-time 7702 delegation — that's why we pre-delegate for the demo." |
| "Did you reinvent spend limits?" | "Correct that the primitive isn't new — here's the prior-art table. Our wedge is the **packaging**: an on-chain revocable mandate bound to x402, entered via a UA/7702 account, with a public receipt." |

---

## 3. Cross-report consensus + critical flags

**Consensus (all 4 reports + Codex agree → high confidence):**
1. Make the **cross-chain agent payment the demo climax** (Base→Arbitrum, gas in USDC, no bridge),
   then an **over-cap charge blocked on-chain**. One screen, two miracles.
2. Make Particle's chain abstraction **visible** (the 30% axis, our softest): route chips,
   Universal Gas, balance provenance, **tx preview before signing**, UniversalX link. *Surface, don't build.*
3. **Mandate = card-limit UX**, not a web3 form.
4. Beachhead = **AI-agent commerce (x402)**; subscriptions / B2B-API-billing secondary.
5. Sponsors: **Particle all-in**; **Magic + Arbitrum "bank it" by packaging**; **Circle = narrative only**;
   **ZeroDev/Openfort = prior-art only**.
6. **De-risk the beta demo**: pre-delegate, pre-warm balances, dual-chain fallback, tiny amounts,
   **recorded labeled backup of every beat**.
7. **Pre-empt skeptic questions** in our own voice (reads as mastery).

**Critical flags (Kiro's additions — do NOT skip):**
- ⚠️ **Unverified numbers.** Reports cite stats ("165M x402 tx", "95% of value > $1"), arXiv IDs,
  "Ukraine PrivatBank/Mastercard Agent Pay", and **conflicting prize amounts** (Particle $5K vs $2.5K).
  **Verify before any public use.** Conflicting figures across reports = treat as unverified.
- ⚠️ **"Empty the wallet of ETH to prove Universal Gas" is a trap.** First-time 7702 delegation
  needs native gas. Show Universal Gas on the *settlement* leg; never claim "no ETH ever."
- ⚠️ **EIP-5792 batching (`wallet_sendCalls`)** is tempting but High-effort on a beta SDK and
  conflicts with "freeze scope." Defer (P2 at most).
- ⚠️ **Do NOT rename the on-chain EIP-712 struct/domain** to make signing legible — the
  `PaymentMandate` type is byte-identical to the deployed `SpendPolicy` (status.md). Renaming
  breaks signature verification and invalidates live proofs (C5/C6/C16/C17/C21). **Improve the
  DISPLAY layer only.**

---

## 4. Roadmap — module specs with acceptance checkboxes

> Effort: S (<2h) · M (half-day) · L (1–2 days). Each item: Goal · Rubric/sponsor · Files · Acceptance.
> Check a box only when it's verifiably true (build/RPC/curl), per our gate.

### P0 — now (today / tomorrow)

#### P0.1 — Doc sync: one source of truth `[Effort S] [Polish 10 / integrity]`
**Goal:** No deployed/public-facing doc may contradict the ledger. `status.md` currently says
"Final-rule-compliant cross-chain value movement is still pending" and frames `-32801` /
`transfer_fallback` as current — both **stale** (contradict C21).
**Files:** `docs/status.md`, `docs/cross-chain-proof-runbook.md` (mark "CLOSED — see C21"), and a
header on `docs/deep-research-onelink-pay-uxmaxx.md` (v1) pointing to v2.
**Acceptance:**
- [x] `status.md` "Current honest gap" updated: cross-chain via UA is **proven (C21)**, not pending.
- [x] `status.md` "Known Risk" reframed: `-32801` resolved on `createUniversalTransaction` + v2-beta.3; active mode is `universal_7702_transfer`.
- [x] `cross-chain-proof-runbook.md` marked **CLOSED** with the C21 tx hashes (keep steps for re-runs).
- [x] Grep shows no doc claims "cross-chain pending" / "transfer_fallback is the active track candidate".
- [x] No new claim introduced; ledger unchanged except a changelog line.

#### P0.2 — Proof Pack (one page a judge can verify) `[Effort S] [Adoption 20 / integrity]`
**Goal:** A single page/section with the exact C21 evidence + the one sentence we're allowed to say.
**Source of truth (verified, from ledger C21):**
- Claim: "A cross-chain USDC payment settles live via a Magic-signed Particle UA in EIP-7702 mode:
  a merchant is paid 1.0 USDC on **Arbitrum** with ~0.12 USDC sourced cross-chain from **Base**,
  no manual bridge."
- Cross-chain proof-lab run: Arbitrum settle `0x85d8c4c24b75ef404889b44a63e97b9b2ac23d9a341a991f86cd0a4dbf6a4911`;
  Base source `0x8b85d45f013f7ef86436b723e00cabebd41cba8f96c5d9ec85ad4e5d757d4a2e`;
  UniversalX `https://universalx.app/activity/details?id=0x0654e81cfea86a`.
- End-to-end via product `/pay` (invoice `40027dcf`, post source-fix): Arbitrum settle
  `0x8163be21df713539c257165bdcd2de9ce4a4d097e6ff60ca6ad50c569f966464`; Base InvoicePaid proof
  `0x2fba4854014cba9a56ca6a29061cef408f94bb03e25a2e36d9ce1a6963fd7055`; UniversalX `0x0654ea35e34844`;
  public receipt `https://onelink-pay.vercel.app/receipt/40027dcf-f45e-4991-a215-553dfb71d0e3`.
  (Invoice `7be9118e` was also cross-chain but its DB `source_chain_id` predates the fix — prefer `40027dcf`.)
- Recipe: `createUniversalTransaction` + `usePrimaryTokens:[USDC]` + per-chain pre-delegation to the
  V2 delegate (`0x13E00E089F81aD9F36B655C9E9A07C6BF1489A5A`) + single-shot build/sign/send.
**Acceptance:**
- [x] `docs/proof-pack.md` created with the above, each tx as a clickable explorer link.
- [x] The merchant + payer addresses labelled; amounts stated; "verified via RPC" noted.
- [x] Exactly ONE claim sentence, copy-pasteable, matching ledger C21 verbatim.
- [x] A "what's real / pattern / future" mini-table (mirrors §2).
- [x] Screenshot(s) of the public receipt attached or linked.

#### P0.3 — Cross-chain route visible BEFORE pay `[Effort S–M] [UX 40 + UA 30] [Particle/Arbitrum]`
**Goal:** Move the "Base → Arbitrum · no bridge · gas in USDC" route from in-flight/receipt into the
**pre-signature Trust Preview**, so judges see the magic *before* confirming.
**Already shipped:** live routing animation during the paying phase + settled route on the receipt
(`src/components/cross-chain-route.tsx`). **This item = the pre-sign preview increment (done).**
**Files:** `src/app/pay/[id]/page.tsx` (Trust Preview / confirm card), reuse `CrossChainRoute`,
`createUniversalTransaction` preview object (fees, token transfers, `fromChains`/`toChains`).
**Acceptance:**
- [x] Before signing, the confirm card shows source chain(s) → settlement chain + the USDC delta.
- [x] If the Particle preview exposes a fee, show it labelled "paid in USDC" (only if true on that leg).
- [x] Falls back gracefully (no raw SDK error) if the preview read is slow/unavailable (route hidden for same-chain / missing data).
- [x] typecheck + lint + production build green; no new public claim beyond C21.

#### P0.4 — Mandate Card = "set a card limit" `[Effort S–M] [UX 40 + UA 30] [Particle/Magic]`
**Goal:** The signing moment reads like a banking "card limit" form, not an EIP-712 signature.
**Constraint:** DISPLAY layer only — do **not** change the on-chain EIP-712 struct/domain (locked to
deployed SpendPolicy; would break C5/C6/C16/C17/C21).
**Files:** `src/components/permission-firewall.tsx`, `src/components/mandate-card` (if present),
`src/app/firewall/page.tsx`, `src/app/agent/page.tsx`, copy in `src/lib/mandates/*` (labels only).
**Acceptance:**
- [ ] Each cap shows plain-English label: per charge / per day / total / expires / one merchant / revoke anytime.
- [ ] Consequence line present: "If a charge breaks any limit, it reverts on-chain — you pay nothing."
- [ ] Risky settings flagged (e.g. very high/unlimited total = "this weakens the firewall").
- [ ] EIP-712 hash hidden behind a "show technical details" disclosure.
- [ ] Signed hash still validates on-chain (a live charge still succeeds) — proves struct unchanged.

#### P0.5 — 90-second demo + recorded replay fallback `[Effort M] [Polish 10 / saves all]`
**Goal:** The demo never dies on stage. Pre-recorded, labeled replay of every beat with the same proof links.
**Files:** `docs/demo-runbook.md` (update to the §5 script), a recorded video, `docs/proof-pack.md` links.
**Acceptance:**
- [ ] Both chains pre-delegated for the demo account before judging (native gas topped up).
- [ ] `getPrimaryAssets` pre-warmed on load; balance read never blocks the flow.
- [ ] Dual-chain fallback rehearsed (if one RPC is sick, settle on the other).
- [ ] Recorded backup of all 10 beats exists, clearly labelled "replay" (never shown as live).
- [ ] Demo amounts tiny (0.05–0.10 USDC); wallet funded (USDC on Arbitrum + a little native gas).

### P1 — this week

#### P1.1 — Magic One Tap / smoothest onboarding `[Effort S] [UX 40] [Magic]`
- [ ] Google One Tap (inline) instead of full-page redirect, if Magic supports it on our setup.
- [ ] "No seed phrase — just email/Google; your wallet is non-custodial" copy on the login card.
- [ ] 10-second onboarding clip captured for the Magic bonus packaging.

#### P1.2 — Budget HUD drain animation `[Effort S] [Polish 10] [Particle]`
- [ ] On a successful charge, the remaining-cap bars **animate** down (not snap).
- [ ] (Done) On a block, the HUD flashes "Firewall held · budget untouched" and bars do NOT move.

#### P1.3 — Blocked state as a product moment `[Effort S] [UX 40 + Polish 10]` — ✅ DONE (this session)
- [x] BLOCKED line slams in (shield glyph, red border, one-shot pulse, bold).
- [x] Honest copy: over-cap shows "over the per-charge cap. No funds moved, zero gas."; funding errors are NOT mislabeled as blocks.

#### P1.4 — "What's real / pattern / future" slide `[Effort S] [Adoption 20 + integrity]`
- [ ] One slide mirroring §2's table; shown or available during the pitch.
- [ ] Pre-empts x402-pattern, agent-initiated, beta-SDK, no-gas-sponsorship in our own voice.

#### P1.5 — Integrator snippet `[Effort S–M] [Adoption 20] [Particle/Circle-narrative]`
- [ ] 15–20 line snippet: create a hosted pay link OR `charge` with a signed mandate.
- [ ] Positioned as "Stripe-style hosted link OR an SDK call" — no contracts needed by the integrator.
- [ ] Lives in README or `docs/integrate.md`; honest about being a thin reference, not a published package.

### P2 — only if P0/P1 are done

- [ ] "No USDC yet?" Particle buy/convert probe (`createBuyTransaction`) — empty-state upgrade.
- [ ] Circle Gateway **sidecar** — only if a concrete bounty requires it (else narrative only; respects R6).
- [ ] Stricter x402 compatibility (official header/negotiation semantics) — only if cheap + honest.
- [ ] ZeroDev/Openfort — prior-art slide only; never in the architecture (hard constraint).

---

## 5. Demo script (≈90s, 10 beats)

1. Hook: "You can't give an AI your wallet."
2. Log in with Magic (email/Google) — no seed phrase.
3. Show **Universal Account ready** (one balance across chains).
4. Show the **Mandate Card**: `$0.10 / charge`, `$2 / day`, one merchant, expires today, revocable.
5. Agent makes a valid paid API call (x402: 402 → pay → 200).
6. Payment **settles cross-chain**: Base USDC → Arbitrum merchant via Particle UA (route shown).
7. Open the **Proof Receipt**: merchant, amount, source/settlement chains, UniversalX + explorer links, InvoicePaid.
8. Agent tries to **overspend**.
9. **Permission Firewall blocks it** — no funds moved, zero gas (red BLOCKED beat + budget untouched).
10. User **revokes** — the agent is disarmed.

**Fallback:** if a live tx stalls >5s: "While Particle settles the block, here's the exact receipt
from our pre-run" → switch to the labeled replay with the same proof links. Never apologize for
beta latency; present it as an expected variable.

---

## 6. Sponsor-prize mapping

| Track | Angle | Minimal qualifying move | Verdict |
|---|---|---|---|
| **Particle UA** | Primary. UA + 7702 + chain-agnostic UX + cross-chain value (C21) | Surface Universal Gas + tx preview + route (P0.3) | **All-in** |
| **Magic** | Walletless Google/email login (C13) | One Tap + 10s clip (P1.1) | **Bank it** |
| **Arbitrum** | Merchant settlement on Arbitrum, chain hidden | Make Arbitrum the visible settlement chain in the hero demo | **Bank it** |
| **Circle** | Agentic-payments TAM narrative | Mention Nanopayments/Gateway as future interop only — **do not build** | **Narrative only** |
| **ZeroDev / Openfort** | Prior art | none | **Skip (constraint)** |

**Circle Gateway integration?** No. Cold-start deposit to Gateway on Base/Arbitrum is ~13–19 min
(bad live rail), it's a second cross-chain stack (more beta surface), and Particle already proves
cross-chain (C21). Use as narrative; if asked "why not Circle?", answer: "we proved it natively via
the Universal Account; Gateway is a clean future second rail" — reads as focus, not gap.

---

## 7. Already shipped (don't redo)

- ✅ Cross-chain proven live + deployed (C21); README + ARCHITECTURE refreshed to match.
- ✅ Cross-chain route visualization (live routing on `/pay` + settled on `/receipt`).
- ✅ Visceral over-cap block moment + "budget untouched" HUD pulse (P1.3).
- ✅ Honest charge-error labeling (funding errors not mislabeled as policy blocks).
- ✅ Magic login reassurance copy (Web2 feel); Sign-out + clickable home logo.

---

## 8. Open questions for office hours

- **Particle:** best pattern to surface Universal Gas + show 7702 depth so judges read it as
  mastery, not "just a signature"? Any beta nonce/RPC edge-cases to cache against for a clean live demo?
- **Magic:** recommended One Tap / OAuth UX + `wallet_getCapabilities` handling to maximize the UX score?
- **Arbitrum:** prefer Arbitrum shown explicitly in the UI, or invisible and only in receipts/explorer?
- **Judges (general):** one polished use case vs several modes, given the time limit?

---

## Sources note

Strategy synthesized from `docs/DEEP/*` (4 reports) + Codex review + Kiro analysis. Treat any
external statistic, prize amount, or paper citation in those reports as **unverified** until checked
against a primary source and recorded in the claim ledger. This file adds **no** new public claim;
all product claims trace to `docs/honest-claim-ledger.md` (C1–C21).
