# OneLink Pay — Deep Research & Win Strategy v2 (UXmaxx)

> Compiled 2026-06-24 (mid-hackathon, post-kickoff). Supersedes the strategic posture of
> `docs/deep-research-onelink-pay-uxmaxx.md` (v1, 2026-06-21) on one decisive point: **the
> cross-chain-via-UA gate that v1 treated as the #1 existential risk is now CLEARED and deployed
> (claim C21).** This brief therefore pivots from "clear the gate" to "maximize depth, polish,
> pitch, and de-risk the live beta demo."
>
> Grounded in: `honest-claim-ledger.md` (C1–C21), `risk-register.md`, `master-tz.md`, `pitch.md`.
> External claims paraphrased/summarized for licensing compliance; primary sources linked inline
> and in §Sources. Numbers are cited to their source; nothing here authorizes a public claim that
> isn't already in the claim ledger.

---

## 0. What changed since v1 (read this first)

v1 was written the day before kickoff and built the entire strategy around a binary risk: "you
have not moved value cross-chain via the Universal Account, and the UA Track requires it." Three
things have since changed and they reshape the playbook:

1. **Cross-chain is proven and live (C21).** A real USDC payment settled on Arbitrum, sourced
   cross-chain from Base, through a Magic-signed Particle UA in EIP-7702 mode on
   `universal-account-sdk@2.0.0-beta.3`, deployed to prod with a public verifiable receipt. The
   eligibility question is answered; the conversation with judges is now about *depth and polish*,
   not *can you do it at all*.
2. **The rules were clarified (per `risk-register.md` R1):** cross-chain value movement is an
   *innovation booster* on the 30% axis, not an eligibility gate. So the floor is safe and the
   ceiling is reachable.
3. **The product is feature-complete.** Every P1 spec shipped (C12–C21): the AI-safe-card
   narrative, Magic Google login, legible mandate card + draining budget HUD, the agent-on-a-leash
   demo, the x402-pattern gateway, the Particle unified-balance HUD, the prior-art landing, and
   shareable proof receipts.

**Implication:** the remaining marginal points are won on (a) making Particle's chain abstraction
*visibly deep* (the 30% axis, historically your softest), (b) demo stagecraft and polish, (c) a
pitch that makes the wedge feel inevitable, and (d) not blowing the live demo on a beta SDK. This
brief is weighted accordingly.

---

## 1. Executive summary (the sharpest moves to win)

1. **Stop hedging cross-chain — make it the hero.** v1's "#1 move" (the agent's payment *is* the
   cross-chain payment) is now achievable. Lead the demo with the visceral "pay a merchant on
   Arbitrum with USDC pulled from Base, no bridge, gas paid in the stablecoin" moment. This single
   beat scores UX (40%) and UA+7702 depth (30%) at once.
2. **Surface three Particle depth features you already have plumbing for, for cheap 30%-axis
   points:** (a) pay gas in USDC / [Universal Gas](https://blog.particle.network/universalx/),
   (b) a [transaction preview](https://developers.particle.network/universal-accounts/how-to/tx-preview)
   that shows the cross-chain route + fee before signing, (c) the
   [primary-asset routing](https://developers.particle.network/universal-accounts/ua-reference/faq)
   that sources the USDC. You are using these; the points come from *showing* them, not building
   them.
3. **Weaponize the 2026 "approval gap" data.** x402 has crossed ~165M transactions and
   [95% of value now comes from payments above $1](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/)
   (up from 49%) — agents are paying for real things now, and there is a documented
   [approval gap](https://cryptorank.io/news/feed/ff692-tiny-x402-payments-expose-gap-holding-ai-agents-back).
   That is your wedge stated by third parties: rails exist, guardrails don't.
4. **Own the on-chain-enforcement differentiator against a custodial field.** Nearly every agent
   wallet (Crossmint, Privy, Turnkey, Coinbase AgentKit) enforces limits in a
   [TEE/MPC server wallet or off-chain policy](https://crossmint.com/learn/agent-wallets-compared).
   OneLink enforces in an auditable on-chain contract anyone can re-check — "policy you can audit,
   not policy you have to trust."
5. **Use AP2 as the foil, not the competitor.** Google's AP2 uses signed *"Payment Mandates"* —
   the same word — but as [off-chain verifiable credentials](https://eco.com/support/en/articles/14845479-ap2-agent-payments-protocol-explained).
   "Same word, but we enforce the mandate on-chain at your own account: a promise becomes a
   guarantee."
6. **Bank the floor now: Arbitrum + Magic bonuses (~$2.5K), already essentially earned.** Package
   them explicitly; don't let them go uncredited. The Arbitrum bonus is the
   [Road to Open House London](https://blog.arbitrum.foundation/builders-block-017-415k-in-prizes-at-open-house-london-apply-now/)
   program, whose NYC edition explicitly rewarded *agentic commerce* and *payment rails* — a direct fit.
7. **Do NOT integrate Circle Gateway, and do NOT chase ZeroDev/Openfort session-key subtracks.**
   Circle is a workshop partner, not a confirmed UXmaxx prize sponsor (partners per Particle are
   [Arbitrum, Magic, ZeroDev, Openfort](https://blog.particle.network/monthly-update-all-in-on-7702/)),
   so a second cross-chain rail is high-effort, low-prize, and breaks your "one rail max" governance
   (R6). Session keys violate your hard constraint. Cite both as ecosystem context only.
8. **De-risk the beta SDK demo like your prize depends on it (it does).** Pre-delegate both chains
   before judging, pre-warm `getPrimaryAssets`, pin the exact beta, keep a fallback chain, and
   record a labeled backup of every beat (closes R4/R19). A flaky live tx is the single most likely
   way you lose points you've already earned.
9. **Pre-empt the three skeptical-judge questions in your own voice:** "you reinvented spend
   permissions" (cite prior art, own the packaging), "is this really x402?" (say "x402 *pattern*,
   mandate-settled" before they ask), and "is the agent real?" (say "agent-initiated harness over a
   real on-chain firewall"). Honesty pre-emption reads as mastery.
10. **Keep scope frozen.** You are feature-complete; the highest-EV work left is *subtraction and
    polish*, not new features. Every hour goes to the demo, the narrative, and robustness.

---

## 2. Research answers (A–I), prioritized and sourced

### A. Judge psychology & differentiation

**A1 — What makes a chain-abstraction / payments project memorable to judges?**
The consistent pattern across 2026 judging write-ups: a clear, fast-to-grok demo beats a clever
one. As one June-2026 judge round-up put it, a strong project with a confusing demo loses to a
simpler one the judges actually understand
([JetBrains](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/));
"a working demo beats a beautiful slide deck"
([Reskilll](https://blogs.reskilll.com/how-to-win-a-hackathon-in-2026-reskillls-guide-from-5000-events/)).
For *this* crowd specifically (the 7702 Collective + Encode, judged by Particle), the rewarded
narrative is "make the chain disappear" — the same pattern that won Circle's agentic-commerce and
payment-rail tracks at recent ETHGlobal/Arbitrum events
([Arbitrum NYC recap](https://blog.arbitrum.foundation/builders-block-015-apply-for-open-house-london-new-wallet-standards-on-arbitrum/)).
Memorable = one protagonist, one verb, one "it physically can't do the bad thing" moment.
*Content rephrased for compliance with licensing restrictions.*

**A2 — How to frame "bounded agent payments" as inevitable, not niche.** Anchor to three external
facts: (1) agents are already transacting at scale —
[~165M+ x402 transactions / $50M+ volume / tens of thousands of agents](https://coingape.com/block-of-fame/pulse/95-of-agentic-payment-value-now-comes-from-transactions-above-1/);
(2) the money is getting *bigger* —
[95% of value is now payments over $1](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/),
so "blast radius" is no longer hypothetical; (3) the gap is acknowledged industry-wide — eco.com
catalogs [five categories of agent spend control](https://eco.com/support/support/en/articles/14839409-ai-agent-spend-controls)
and OneLink sits in two of them (programmable on-chain allowances + cryptographic mandates).
Framing: "Every major player shipped a way for agents to *pay* in the last year
([AP2](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol/),
[x402](https://docs.cdp.coinbase.com/x402), MPP, Visa/Mastercard agent rails). The missing layer is
the one that makes sure they can't *overpay*."

**A3 — The single "wow" moment.** The cross-chain agent payment that gets blocked on-chain. Concretely:
the agent pays a real merchant, value is **sourced from Base and settled on Arbitrum with no bridge
and gas paid in USDC** (Particle does the impossible-looking part), then the agent tries to exceed
its cap and the charge **reverts on-chain — zero gas, no funds move** (your `SpendPolicy` does the
safety part). One screen, two miracles, ~20 seconds. Everything else is setup.

### B. UX upgrades (40%)

**B4 — Highest-leverage UX improvements** (you have most of the foundation; these are polish):
- **A visible cross-chain route in the pay/receipt flow** ("Base → Arbitrum · no bridge · gas paid
  in USDC"). You already render a Base→Arbitrum badge on the receipt (C20); pull that *forward* to
  the pre-signature preview so the magic is seen *before* confirm, not just after. Effort S.
- **Google One Tap** instead of redirect OAuth — Magic supports an
  [inline One Tap prompt](https://docs.magic.link/embedded-wallets/authentication/login/oauth/social-providers/google),
  which shaves the onboarding to a single click and removes a full-page redirect on stage. Effort S.
- **A "what just happened" micro-explainer** on first success (one line: "you just paid across
  chains without bridging"). Non-crypto judges need the payoff named. Effort S.

**B5 — Make signing an EIP-712 mandate feel like "set a card limit."** You've shipped the legible
mandate card (C14); push it further toward the Web2 mental model:
- Render the caps as a **filled-in card form** ("Spend limit: $10 total · $0.10 per charge · $2/day
  · expires in 24h · one merchant") with the EIP-712 hash behind "show technical details."
- Borrow the framing the standards bodies use: ERC-7715 describes this as
  [ask once to spend up to a value, against a contract, until an expiry](https://eco.com/support/en/articles/11953354-erc-7715-explained-wallet-permissions-sessions-and-subscriptions);
  Base Spend Permissions describe it as enabling [subscription renewals and automated payouts without re-prompting](https://docs.base.org/base-account/improve-ux/spend-permissions).
  Use that vocabulary so a fintech-literate judge instantly maps it to "a card with a limit."
- Add a one-line consequence preview: "If a charge breaks any limit, it reverts on-chain — you pay
  nothing." That converts an abstract signature into a felt guarantee.

**B6 — Onboarding / empty / error states that remove the last crypto friction:**
- **Empty budget HUD** before arming should *teaser* the limits, not show "$0.00".
- **Error states** must never leak raw RPC/SDK codes to a judge. R12 already added a "balance
  unavailable — the rest of the demo still works" + retry on the unified-balance card; apply the
  same pattern everywhere a beta-SDK read can fail (preview, delegation status).
- **Skip mundane flows** in the demo — have any addresses/links pre-copied to clipboard, per
  [Devpost's demo guidance](https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo).
  *Content rephrased for compliance.*

### C. Universal Accounts + EIP-7702 depth (30%) — your biggest upside

This was your acknowledged soft spot (all four v1 reports + `master-tz` E6 flagged that
`SpendPolicy` is chain-agnostic). The fix is to make Particle the *visible hero* of the chain-magic
while your contract stays the safety layer.

**C7 — Particle UA features that most increase perceived depth, mapped to payments:**

| Particle feature | What it is | How it maps to OneLink | Effort |
|---|---|---|---|
| **Universal Gas / pay-gas-in-USDC** | UA can [pay gas with any token on any chain](https://blog.particle.network/universalx/); primary assets fund gas | "Your agent never holds ETH. It pays the API and the gas, all in USDC." Removes the #1 stablecoin-UX papercut | S–M (surface it in copy + preview) |
| **Transaction preview** | `createUniversalTransaction`/`createBuyTransaction` return [estimated fees, token transfers, metadata](https://developers.particle.network/universal-accounts/how-to/tx-preview) before confirm | Show the *route* (source chain → dest chain), the fee, and the USDC delta in the pre-sign card | S (you already get the object) |
| **Primary-asset routing** | [Deep-liquidity tokens used as cross-chain sources](https://developers.particle.network/universal-accounts/ua-reference/faq) for gas/swaps/liquidity | This is *why* `usePrimaryTokens:[USDC]` sources Base liquidity to settle on Arbitrum — name it on screen | S (label the magic you already do) |
| **Unified balance** | One balance across EVM + Solana | Already shipped (C18); add the per-chain breakdown tooltip so judges see it aggregates real multi-chain liquidity | done / S |
| **Convert + Buy flows** | [`createConversionTransaction` with `expectTokens`](https://developers.particle.network/universal-accounts/how-to/conversions) and `createBuyTransaction` | Roadmap slide only: "top up the agent's USDC from any asset" — do NOT build mid-hackathon | 0 (narrative) |
| **Solana / non-EVM reach** | UA spans [EVM chains and Solana](https://developers.particle.network/universal-accounts/ua-reference/web/overview) | One sentence: "the same mandate model extends to Solana via the UA" — roadmap, not build | 0 (narrative) |

Priority: surface **Universal Gas + transaction preview + primary-asset routing** (all S effort,
all you already invoke). That converts "we used Particle to send a tx" into "we used Particle's
chain abstraction the way it's meant to be used," which is exactly what the 30% axis rewards.

**C8 — EIP-7702 capabilities to showcase (without third-party session keys):**
- **Reversibility as a safety feature.** EIP-7702's documented #1 risk is signing a delegation to
  malicious code ([phishing analysis](https://arxiv.org/abs/2512.12174)). Your one-tap revoke
  *is* the answer — frame it as "7702 delegation is reversible, and we make that the kill switch."
- **Batching / atomic execution.** The EIP itself lists
  [batching multiple operations in one atomic transaction](https://eips.ethereum.org/EIPS/eip-7702)
  as a primary use. Your checkout already bundles per-chain pre-delegation + settle. Say so: "the
  approval, delegation, and payment are one signed action, not five pop-ups."
- **In-place upgrade, same address.** The Magic EOA *is* the Universal Account (same address across
  chains) — a concrete, demoable 7702 property that contrasts with smart-contract-wallet detours.
  This is "session-like UX without session keys": one scoped, revocable mandate at the account,
  enforced by your contract — not a delegated signing key held by a third party.

**C9 — Make cross-chain sourcing VISIBLE and impressive in the demo:**
- A **split balance → unified balance** animation: show "Base: 0.9 USDC · Arbitrum: 0.1 USDC" snap
  into "Universal balance: 1.0 USDC," then spend it on Arbitrum.
- An **animated route line** Base → Arbitrum on the pre-sign preview (not just the receipt), with
  "no bridge · gas in USDC" labels.
- Keep the **UniversalX activity link** (you persist `ua_transaction_id`, C20/C21) on screen so a
  judge can independently click through to Particle's own explorer — third-party verification of
  your hardest claim.

### D. Adoption / GTM / real-world wedge (20%)

**D10 — Beachhead ranking (readiness × TAM × demo-ability):**

| Rank | Wedge | Why | Caveat |
|---|---|---|---|
| **1** | **AI-agent commerce (x402)** | Highest demo-ability + ride the hottest 2026 narrative; the [approval gap](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/) is real and named; you already ship the gateway (C17) | x402 hype includes [meme-coin farming (PING)](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/) — cite *real* usage honestly |
| **2** | **Subscriptions without card-on-file risk** | Huge TAM; maps to the exact use case Base Spend Permissions cites ([subscription renewals](https://docs.base.org/base-account/improve-ux/spend-permissions)); your daily/total caps fit | Less novel; better as a "this also does X" than the hero |
| **3** | **B2B usage-based / API billing** | Natural fit for caps + proof receipts; Circle is courting it via [API monetization for agents](https://www.circle.com/blog/turn-your-api-into-a-storefront-for-agents) | Longer sales cycle; weak as a 90s demo |
| **4** | **Marketplace / creator payouts** | Proof receipts shine here | Needs multi-merchant UI you've (correctly) cut |

Lead with #1, name #2 as the "and it also does subscriptions" expansion. That's the strongest
adoption story for *this* judging panel.

**D11 — Real buyers and the smallest valuable integration:**
- **Buyers:** agent-framework builders and API/data sellers who already speak x402; secondarily,
  SaaS teams wanting "spend caps for an automation."
- **Smallest integration that delivers value:** a hosted mandate + a one-call charge endpoint —
  "drop in a payment link, or call `/charge` with a signed mandate." Pitch it as "Stripe-style
  hosted link OR an SDK snippet," so a non-crypto buyer can adopt without touching contracts.

**D12 — Partnerships / standards that strengthen adoption:**
- **x402 ecosystem** (the rail you bound). Position as complementary: "x402 gives agents a wallet;
  OneLink is the leash." Note the [academic security gaps](https://arxiv.org/abs/2605.30998) as the
  reason on-chain enforcement matters.
- **ERC-7715 / 7710 vocabulary.** Align mandate language to the
  [emerging permission standard](https://eips.ethereum.org/EIPS/eip-7715) (also implemented in
  [MetaMask Advanced Permissions](https://metamask.io/news/introducing-advanced-permissions)) so you
  read as standards-aligned, not bespoke.
- **AP2 (now under [FIDO](https://agentpaymentsprotocol.eu/))** as the complementary off-chain
  authorization layer your on-chain enforcement could anchor.
- **Circle / CCTP** as a *narrative* interop partner only (see F16) — not a build.

### E. Polish & demo stagecraft (10%)

**E13 — Micro-interactions / information design that read as production-grade:**
- The **budget HUD draining** in real time on a charge (you have this — make the drain *animated*,
  not a snap).
- A **red "BLOCKED — PerChargeExceeded · 0 gas · 0 funds moved" state** with a subtle shake; the
  contrast with the green success is the whole point.
- **Monospace tx hashes that resolve to explorer links on hover**, and a "verified ✓" check that
  animates in after the on-chain match.
- **Consistent motion language** (one easing curve, one duration scale) across arm → charge →
  block → revoke, so the flow feels like one product, not four screens.

**E14 — Optimal 90-second demo script + backup plan:** see §4 below.

### F. Sponsor-prize alignment

**F15 — Track-by-track mapping** (respecting: no ZeroDev/Openfort session keys, honest claims):

| Track / prize | Credible angle? | Minimal qualifying addition | Verdict |
|---|---|---|---|
| **Particle UA Track** ($5K/$2.5K/$1.5K) | **Yes — primary.** UA + 7702 + chain-agnostic UX + now cross-chain value movement (C21) | Surface Universal Gas + tx preview + route (§C) | **Go all-in** |
| **Magic bonus** (~$500) | **Yes — basically earned.** Google + email login live (C13) | Add One Tap; show a 10s onboarding clip | **Bank it** |
| **Arbitrum bonus** (~$2K, [Road to OH London](https://blog.arbitrum.foundation/builders-block-017-415k-in-prizes-at-open-house-london-apply-now/)) | **Yes — earned.** SpendPolicy + ReceiptEmitter live on Arbitrum; firewall/x402 settle there (C2/C5/C16/C17) | Make Arbitrum the visible settlement chain in the hero demo | **Bank it** |
| **ZeroDev subtrack** | No (hard constraint) | n/a | **Skip; cite as prior art only** |
| **Openfort subtrack (x402 + embedded wallets)** | Tempting but no | Would need their session keys / backend wallets | **Skip; respects R6 + constraint** |

**F16 — Is integrating Circle Gateway worth it?** **No.** Cost/benefit:
- **Cost:** a second cross-chain rail (deposit → attestation → mint), new verification path, more
  beta surface to break, and it violates your "one rail max" governance (R6). Medium-to-large
  effort during submission week.
- **Benefit:** low. Circle appears to be a *workshop* partner, not a confirmed UXmaxx prize sponsor
  (Particle names [Arbitrum/Magic/ZeroDev/Openfort](https://blog.particle.network/monthly-update-all-in-on-7702/)),
  and you *already* prove cross-chain via Particle (C21), which is the judged path.
- **Recommendation:** don't build it. Use Circle in the *narrative* — its
  [Nanopayments / Agent Stack](https://www.circle.com/nanopayments) and
  [<500ms unified USDC balance](https://www.circle.com/gateway) validate the agentic-payments TAM and
  give you a credible "interop roadmap" line. If a judge asks "why not Circle?", the honest answer —
  "we proved it natively via the Universal Account; Circle Gateway is a clean future second rail" —
  reads as focus, not gap.

### G. Technical optimization & robustness

**G17 — De-risk a beta-SDK + EIP-7702 live demo (no faking):**
- **Pre-delegate both chains before judging.** The one-time 7702 delegation per chain (and its
  native-gas cost) is your slowest, most failure-prone step; do it in advance so the live flow is
  just sign + settle. (Directly addresses R19.)
- **Pre-warm `getPrimaryAssets`** on page load with the retry already added (R12), so the
  unified-balance read is never the thing that hangs on stage.
- **Pin the exact beta** (`2.0.0-beta.3`, already `-E` pinned) so prod can't float to an unreviewed
  beta — your README already documents this; keep it.
- **Dual-chain fallback:** SpendPolicy + ReceiptEmitter are live on both Base and Arbitrum — if one
  chain's RPC is sick on stage, settle on the other.
- **Tiny amounts** (0.05–0.10 USDC) on Arbitrum keep mining ~1s.
- **Observability:** keep the `inspectUserOps` logging (chainId, userOpHash, `eip7702Delegated`)
  behind the debug flag so *you* can see a failure instantly — but ship with
  `NEXT_PUBLIC_ENABLE_DEBUG_PROBES=false` (R18).
- **Recorded backup of every beat, labeled "replay"** (R4) — the single highest-ROI insurance.

**G18 — Security/abuse of a relayer-driven mandate system, and what a security-minded judge will
probe:**
- **Replay / consume-once.** The x402 literature is blunt here: independent analyses formalize
  [logic flaws around atomicity and context binding](https://arxiv.org/abs/2605.30998) and
  [five concrete attacks on authorization, binding, and replay](https://arxiv.org/abs/2605.11781);
  an IETF draft warns a payment authorized to one agent can be
  [replayed by another](https://www.ietf.org/ietf-ftp/internet-drafts/draft-vauban-x402-delegation-binding-01.html).
  Your R10 already admits the demo lacks a consumed-proof/nonce store. **Pre-empt it:** "in
  production each proof is single-use via a nonce store; the cap enforcement is on-chain and real
  today; replay-hardening of the x402 proof is the documented next step." *Content rephrased for
  compliance.*
- **Relayer gas-drain.** `/api/mandates/charge` is public; you've added a dedicated
  `RELAYER_PRIVATE_KEY` + rolling-window budget (R16). For any public deploy, add a shared limiter
  (Redis) — say this if asked.
- **Proof integrity.** You already bind the recorded payer to the *actual on-chain sender*, not a
  client value (R15) — a strong answer to "can someone forge a receipt?"
- **Funds safety.** The honest, powerful point: over-cap/off-merchant/post-revoke charges revert in
  simulation, so the relayer can't move funds outside the signed mandate even if compromised.

### H. Competitive / prior-art scan

The category is crowded but **OneLink's combination is not occupied.** The differentiator is *where
the enforcement lives*.

| Player | What it is | Where OneLink differs |
|---|---|---|
| **Crossmint / Privy / Turnkey / Coinbase AgentKit** | Agent wallets; limits enforced in a [TEE/MPC server wallet or dual-key model](https://crossmint.com/learn/agent-wallets-compared) | Enforcement is **on-chain + auditable + revocable**, not in a custodial enclave you must trust |
| **Payman** | [AI agents pay humans under programmable human-set policies](https://dupple.com/tools/payman) | On-chain caps + public proof + wallet-agnostic 7702 entry; not a closed policy engine |
| **Coinbase / Base Spend Permissions** | [Allowance + period + revoke for smart wallets](https://docs.base.org/base-account/improve-ux/spend-permissions) | Lives on the 7702 Universal Account (not one wallet brand); adds proof receipt + x402 binding |
| **ERC-7715 / 7710** | [Emerging standard for scoped permissions + delegation](https://eips.ethereum.org/EIPS/eip-7715) | A focused, auditable payments-specific mandate shipping today, aligned to that vocabulary |
| **Google AP2** | [Signed Intent/Cart/Payment Mandates as off-chain VCs](https://eco.com/support/en/articles/15192002-ap2-protocol-explained-google-s-agentic-commerce-standard-2026) | Same word "mandate," enforced **on-chain at the user's account** — a promise becomes a guarantee |
| **x402 / MPP / Circle Nanopayments** | Payment *rails* for agents | The *guardrail* layer that bounds them; "rails vs guardrails" |
| **ZeroDev / Openfort session keys** | Low-level account delegation | You enforce *payment policy* (per-charge/day/total/merchant) with legible consent + proof — and deliberately avoid third-party session keys |

**Where OneLink is weaker (be honest internally):** it's narrower than full agent-wallet platforms
(no card rails, single token, single merchant in the demo); the "agent" is agent-initiated, not an
autonomous LLM loop; and the spend-permission *primitive* is not novel — the **packaging** is
(on-chain revocable mandate + x402 binding + UA/7702 entry + public proof). Compete on that, never
on "we invented limits."

### I. Risk & integrity — the claims most likely to draw skeptical questions

| Claim likely probed | Honest pre-emption |
|---|---|
| "Cross-chain via UA" (C21) | "Proven live and deployed; here's the UniversalX link + both tx hashes. A first-time payer needs a little native gas per chain for the one-time 7702 delegation — that's why we pre-delegated for this demo." |
| "x402" gateway (C17) | "It's the x402 *pattern* — 402 → pay → retry-with-proof — settled by our on-chain mandate (`onelink-mandate` scheme), **not** the Coinbase EIP-3009 facilitator. The enforcement is real; the wire-compat is not claimed." |
| "Agent on a leash" (C16) | "The agent runs a real unattended deterministic loop (one click, then no human per-step) calling the same relayer + contract a real agent would. The on-chain enforcement is 100% real; it is NOT LLM-driven — no AI decision-making is claimed (that's the x402 stretch, E5)." |
| "Provable / every payment" (C20) | "The settlement is trustless; the InvoicePaid receipt is an on-chain *attestation*, and the recorded payer is bound to the actual on-chain sender — not a client value." |
| "Beta SDK" (R19) | "Pinned exact; cross-chain proven on this exact build; backup recording ready." |
| "You reinvented spend permissions" | "Correct that the primitive isn't new — here's the prior-art table. Our wedge is the packaging: on-chain revocable mandate bound to x402, entered via a UA/7702 account, with a public receipt." |

Never claim "first/only/leading," gas sponsorship, Circle integration, or facilitator
compatibility (per the claim ledger denylist).

---

## 3. Prioritized roadmap table

Effort: S (<2h) · M (half-day) · L (1–2 days). Impact 1–5 on winning the judged outcome.

| # | Recommendation | Judging axis | Sponsor prize | User value | Effort | Impact | Sources |
|---|---|---|---|---|---|---|---|
| 1 | Make the **cross-chain agent payment the demo climax** (source Base → settle Arbitrum, gas in USDC, then over-cap block) | UX 40 + UA 30 | Particle + Arbitrum | "Pay across chains, can't overpay" in one breath | M | 5 | [Particle UA](https://developers.particle.network/universal-accounts/overview), C21 |
| 2 | **Surface Particle depth**: Universal Gas + tx-preview route + primary-asset label, *before* signing | UA 30 + UX 40 | Particle | Sees the magic before confirming | S–M | 5 | [Universal Gas](https://blog.particle.network/universalx/), [tx preview](https://developers.particle.network/universal-accounts/how-to/tx-preview) |
| 3 | **Record labeled backup** of every demo beat + dual-chain fallback + pre-delegation | Polish 10 (saves all) | all | Demo never dies on stage | M | 5 | R4/R19; [Devpost](https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo) |
| 4 | **Tighten the "approval gap" narrative** with 2026 data in pitch + landing | Adoption 20 | Particle | Wedge feels inevitable | S | 4 | [Chainalysis](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/) |
| 5 | **Pre-empt the 3 skeptic questions** in voiceover + a "what's real" slide | Adoption 20 + Polish 10 | all | Reads as mastery | S | 4 | C16/C17/C21, [x402 attacks](https://arxiv.org/abs/2605.11781) |
| 6 | **Google One Tap** + 10s onboarding clip | UX 40 | Magic | One-click, no redirect | S | 3 | [Magic OAuth](https://docs.magic.link/embedded-wallets/authentication/login/oauth/social-providers/google) |
| 7 | **Mandate card → "card limit" framing** + consequence preview | UX 40 + UA 30 | Particle | Feels like setting a card limit | S | 4 | [ERC-7715](https://eco.com/support/en/articles/11953354-erc-7715-explained-wallet-permissions-sessions-and-subscriptions), [Base](https://docs.base.org/base-account/improve-ux/spend-permissions) |
| 8 | **Animate** budget-drain, block-shake, verified-check; unify motion | Polish 10 + UX 40 | — | Production-grade feel | S–M | 3 | E13 |
| 9 | **Adoption slide**: x402 #1 wedge + subscriptions expansion + buyers | Adoption 20 | Particle | Real "who uses this" | S | 3 | [Crossmint](https://crossmint.com/learn/agent-wallets-compared) |
| 10 | **Harden error states** to never show raw SDK/RPC codes | UX 40 + Polish 10 | — | No scary failures | S | 3 | R12 |
| 11 | **Security one-liner** on replay/nonce + relayer limiter (say it before asked) | Polish 10 | — | Survives a security probe | S | 3 | [x402 logic flaws](https://arxiv.org/abs/2605.30998), R10/R16 |
| — | ~~Integrate Circle Gateway~~ | — | none confirmed | — | L | ✗ | F16 — **do not** |
| — | ~~ZeroDev/Openfort session keys~~ | — | violates constraint | — | M | ✗ | hard constraint |

---

## 4. Recommended 90-second demo script + pitch narrative

### 90-second run-of-show (UX 40 + UA 30 + Adoption 20)

| Time | On screen | Say |
|---|---|---|
| 0:00–0:12 | `/firewall` → **Continue with Google** (One Tap) | "You can't hand an AI agent your wallet. So we give it a card. I sign in with Google — no seed phrase, no extension." |
| 0:12–0:28 | Pick **Agent budget** preset → the mandate card (caps as a card form) → sign | "One signature sets the limits: $0.10 a charge, $2 a day, $10 total, one merchant, 24h, revocable. Enforced on-chain by my own account via EIP-7702 — not a promise, a guarantee." |
| 0:28–0:48 | **Run agent** → cross-chain settle: route line **Base → Arbitrum**, "no bridge · gas in USDC" → green `Charged 0.10 · settled` → HUD drains | "The agent pays a merchant on Arbitrum — but the USDC is pulled from Base, no bridge, and gas is paid in the stablecoin. Particle's Universal Account makes the chains disappear." |
| 0:48–1:05 | **Run agent (over cap 0.20)** → red `BLOCKED: PerChargeExceeded · 0 gas · 0 funds moved` (shake) | "Now it tries to overspend. It physically can't. The charge reverts on-chain — nothing moves, no gas. The seatbelt holds, on camera." |
| 1:05–1:16 | **Revoke** → run again → `BLOCKED: MandateIsRevoked` | "And I hold the kill switch. Revoke, and the agent is disarmed instantly — 7702 reversibility as a safety feature." |
| 1:16–1:30 | Open `/receipt/[id]` → Base→Arbitrum badge + UniversalX link + verified ✓ | "Every payment ships a receipt anyone can re-check on-chain. Rails let agents pay. OneLink makes sure they can't overpay — on any chain, at your own account. Live on Base and Arbitrum today." |

**Backup plan if the live cross-chain tx is slow/fails:** (1) cut to the **labeled replay** of the
cross-chain beat without breaking stride ("here's one I ran earlier, on-chain, here's the explorer
link"); (2) if Arbitrum RPC is sick, **switch settlement to Base** (both chains are deployed); (3)
the same-chain firewall block + revoke beats don't depend on cross-chain and always work — lead
with those if the network is hostile. Never present a replay as live.

### One-paragraph pitch narrative

> In 2026, AI agents are paying for real things — over 165 million x402 transactions, and 95% of
> the value is now payments above a dollar
> ([Chainalysis](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/)). Everyone shipped
> a way for agents to *pay*; nobody shipped the layer that stops them from *overpaying*. OneLink Pay
> is that layer: you sign one scoped, revocable mandate, and your Particle Universal Account can be
> charged only inside it — per-charge, daily, total, one merchant, expiry. The agent pays across
> chains with no bridge and gas in USDC; if it tries to exceed the limit, the charge reverts
> on-chain at zero gas; and every payment leaves a receipt anyone can verify. Google's AP2 calls its
> agent permissions "mandates" too — but theirs live off-chain as credentials; ours are enforced
> on-chain at your own account. Particle makes the chains disappear; OneLink makes the limits
> unbreakable.

---

## 5. Differentiation one-liner

> **"Crossmint, Privy, and Coinbase give an agent a wallet with limits you have to *trust*; AP2 and
> x402 give it a way to *pay*. OneLink Pay gives it limits you can *audit* — an on-chain, revocable
> spending mandate, entered through a Particle Universal Account, that makes over-spending physically
> impossible and every payment provable."**

Shorter, for a slide: **"A card for your AI — the spending limit is enforced on-chain, not on
trust."**

---

## 6. Open questions / unknowns for sponsor office hours

1. **Rubric lock (R5):** confirm UX 40 / UA+7702 30 / Adoption 20 / Polish 10 (vs the stale
   placeholder 45/25/20/10) — strategy holds either way, but confirm for the deck.
2. **Particle:** does sourcing USDC cross-chain via `createUniversalTransaction` +
   `usePrimaryTokens` count as the "innovative UA usage" they most want to see — and is there a
   *named* depth feature (Universal Gas? preview?) judges reward seeing on screen?
3. **Particle:** any guidance on beta `2.0.0-beta.3` stability for a live mainnet demo during
   judging — known issues, rate limits, a recommended pre-warm?
4. **Magic:** does One Tap vs redirect OAuth affect the bonus, and is there a preferred way to show
   "embedded wallet that feels Web2" for the judges?
5. **Arbitrum:** confirm the bonus = Road to Open House London track, what "runs primarily on
   Arbitrum" requires, and whether agentic-commerce framing is explicitly rewarded.
6. **Circle (workshop):** is there any *prize* attached to Circle Gateway use in UXmaxx, or is it
   content-only? (Determines whether F16 ever flips.)
7. **Submission mechanics:** required artifacts (repo + video + deployed URL + deck?), max public
   demo length, and whether a labeled replay is acceptable fallback evidence.

---

## Sources

Hackathon & sponsors:
- Particle, "All-In On 7702" (UXmaxx, $12k+→$15.5K, partners) — https://blog.particle.network/monthly-update-all-in-on-7702/
- Particle blog (7702 Collective, partners Arbitrum/Magic/ZeroDev/Openfort) — https://blog.particle.network/
- Arbitrum Open House London ($415K, agentic-commerce theme) — https://blog.arbitrum.foundation/builders-block-017-415k-in-prizes-at-open-house-london-apply-now/
- Arbitrum NYC recap (payment rails, agentic commerce themes) — https://blog.arbitrum.foundation/builders-block-015-apply-for-open-house-london-new-wallet-standards-on-arbitrum/

Particle UA + EIP-7702 depth:
- UA overview — https://developers.particle.network/universal-accounts/overview
- EIP-7702 default mode / initialization — https://developers.particle.network/universal-accounts/ua-reference/web/initialization
- EIP-7702 requires embedded (WaaS) wallet — https://developers.particle.network/universal-accounts/ua-reference/desktop/eip7702-wallets
- Primary assets (cross-chain sourcing) — https://developers.particle.network/universal-accounts/ua-reference/faq
- Transaction preview — https://developers.particle.network/universal-accounts/how-to/tx-preview
- Conversions (`expectTokens`) — https://developers.particle.network/universal-accounts/how-to/conversions
- Custom tx (`createUniversalTransaction`) — https://developers.particle.network/universal-accounts/ua-reference/web/transactions/custom
- EVM + Solana reach — https://developers.particle.network/universal-accounts/ua-reference/web/overview
- V2 migration (`createTransferTransaction` only) — https://developers.particle.network/universal-accounts/reference-implementation
- UniversalX (pay gas with any token; buy with card) — https://blog.particle.network/universalx/
- EIP-7702 spec (batching/atomic) — https://eips.ethereum.org/EIPS/eip-7702
- EIP-7702 phishing analysis — https://arxiv.org/abs/2512.12174

x402 + agentic payments (adoption):
- Chainalysis: 100M on Base, 95% of value > $1 — https://www.chainalysis.com/blog/x402-agentic-payments-adoption/
- Coingape: 165M tx / $50M+ / tens of thousands of agents — https://coingape.com/block-of-fame/pulse/95-of-agentic-payment-value-now-comes-from-transactions-above-1/
- "Approval gap" (volume −77% from peak, tx rebounded) — https://cryptorank.io/news/feed/ff692-tiny-x402-payments-expose-gap-holding-ai-agents-back
- Coinbase x402 docs — https://docs.cdp.coinbase.com/x402
- x402 facilitator — https://docs.cdp.coinbase.com/x402/core-concepts/facilitator
- AWS / McKinsey $3–5T agentic commerce — https://aws.amazon.com/ru/blogs/industries/x402-and-agentic-commerce-redefining-autonomous-payments-in-financial-services/

x402 + AP2 security (the enforcement argument):
- Five Attacks on x402 — https://arxiv.org/abs/2605.11781
- Logic Flaws in x402-Enabled Payment Systems — https://arxiv.org/abs/2605.30998
- x402 Delegation Binding (IETF draft, replay/privilege escalation) — https://www.ietf.org/ietf-ftp/internet-drafts/draft-vauban-x402-delegation-binding-01.html
- AP2 red-teaming (crypto guarantees ≠ decision protection) — https://arxiv.org/html/2601.22569

Prior art / competitors:
- Agent wallets compared (Crossmint/Privy/Turnkey/Coinbase) — https://crossmint.com/learn/agent-wallets-compared
- eco.com — five categories of agent spend control — https://eco.com/support/support/en/articles/14839409-ai-agent-spend-controls
- Payman (programmable agent payouts) — https://dupple.com/tools/payman
- Coinbase / Base Spend Permissions — https://docs.base.org/base-account/improve-ux/spend-permissions
- ERC-7715 explained — https://eco.com/support/en/articles/11953354-erc-7715-explained-wallet-permissions-sessions-and-subscriptions
- ERC-7715 / 7710 (EIPs) — https://eips.ethereum.org/EIPS/eip-7715 · https://eips.ethereum.org/EIPS/eip-7710
- MetaMask Advanced Permissions — https://metamask.io/news/introducing-advanced-permissions
- ZeroDev session keys (prior art only) — https://docs.zerodev.app/smart-accounts/permissions/intro
- Google AP2 announcement — https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol/
- AP2 explained (Intent/Cart/Payment Mandates) — https://eco.com/support/en/articles/15192002-ap2-protocol-explained-google-s-agentic-commerce-standard-2026
- AP2 donated to FIDO — https://agentpaymentsprotocol.eu/

Circle (narrative only):
- Circle Gateway (<500ms unified USDC) — https://www.circle.com/gateway
- Circle Nanopayments / Agent Stack — https://www.circle.com/nanopayments
- Monetize your API for agents (x402 + USDC) — https://www.circle.com/blog/turn-your-api-into-a-storefront-for-agents

Magic + onboarding UX:
- Magic Google OAuth / One Tap — https://docs.magic.link/embedded-wallets/authentication/login/oauth/social-providers/google
- Magic email OTP — https://docs.magic.link/embedded-wallets/authentication/login/email-otp
- Magic WalletKit (prebuilt UI) — https://docs.magic.link/embedded-wallets/authentication/login/wallet-kit

Judge psychology:
- JetBrains — notes from the judging table (confusing demo loses) — https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/
- Reskilll — working demo beats slides — https://blogs.reskilll.com/how-to-win-a-hackathon-in-2026-reskillls-guide-from-5000-events/
- Devpost — how to present a successful hackathon demo — https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo

> Flagged as not independently verified: the exact UXmaxx prize split and whether Circle carries any
> prize (the public CompeteHub page is a stale placeholder per v1); confirm at office hours (§6).
> All on-chain OneLink claims trace to `docs/honest-claim-ledger.md` (C1–C21) — re-verify rows
> before any public reuse.
