# OneLink Pay — Deep Research & Win Strategy (UXmaxx)

> Compiled: 2026-06-21. Structured to the section-8 output format of the deep-research brief.
> Every external claim was cross-checked against primary sources (links inline + in Sources).
> Content from web sources was paraphrased/summarized for compliance with licensing restrictions.

## Fact-corrections up front (these change the strategy)

- **The public CompeteHub page is a stale, AI-generated placeholder.** It lists dates of
  May 18 - Jun 19 2026, a rubric of UX&Design 45 / Technical 25 / Creativity 20 / Completeness 10,
  and a single Particle challenge ($5K/$2.5K/$1.5K) —
  [competehub.dev](https://www.competehub.dev/en/competitions/encodeclub_uxmaxx-hackathon).
  The prompt's rubric (UX 40 / UA+7702 30 / Adoption 20 / Polish 10), the two-track structure, and
  the ~Jun 22 / ~Jun 25 workshops are *different*. Since today is Jun 21 and those workshops are in
  the future, the real event is **starting now, not ending** — the placeholder dates are wrong.
  **Confirm the exact rubric + deadline + whether a "General Track" exists at the Jun 22 kickoff.**
  Good news: every rubric version makes UX the dominant axis (40-45%), so the strategy below holds
  either way.
- **The total prize pool is now ~$15.5K** (up from the "$12k+" in earlier posts), with Arbitrum,
  Magic, ZeroDev, and Openfort as partners —
  [Particle blog](https://blog.particle.network/monthly-update-all-in-on-7702/).

---

## 1. Verdict

**Can it win? Yes — realistically a category, most likely a bonus + a competitive shot at a main
track. Not a lock on the $5K grand prize, but well above the median submission.**

What's genuinely strong (and rare for a hackathon): a **real, on-chain, tested** product —
`SpendPolicy` live on **both** Base (`0x73C8...3957`) and Arbitrum (`0x9782...164E`), 22 passing
tests, a provable "over-cap charge reverts at zero gas" moment, working revoke, EIP-7702 delegation
proven on Base, and an on-chain proof receipt. Most teams demo a happy path on testnet. You have
adversarial proof on mainnet. That maps directly to the rubric's polish and "no broken flows"
criteria.

What's genuinely at risk:

- **The Universal Accounts Track has a hard, mandatory gate you have not cleared:** "at least one
  cross-chain operation that moves value via the Universal Account." Your own logs show this fails
  at Particle's backend (`REFUND_FAILED` / `-32613`), and custom calls are down due to Particle's
  **V2 migration — confirmed in Particle's own docs**: during migration, assets move "only via the
  `createTransferTransaction` method"
  ([developers.particle.network](https://developers.particle.network/universal-accounts/reference-implementation)).
  The blocker is real and external, but the rule is the rule. Submitting to the UA Track without
  clearing this risks failing a stated requirement.
- **The differentiator (the firewall) is partly orthogonal to Particle UA.** `SpendPolicy` is an
  EIP-712 + ERC-20-allowance contract that works with *any* EOA. It is not "Universal Accounts doing
  something only a UA can do." On the 30% "prominent/innovative UA+7702 usage" criterion, that's a
  soft spot to engineer around.
- **The core primitive is not novel.** Scoped on-chain spend permissions already ship in Coinbase
  Spend Permissions and are being standardized as ERC-7715/7710 (see §7). The edge is *packaging*,
  not invention — own that honestly.

### Single best category to target (best odds, not biggest logo)

Bank the floor, then swing for the ceiling.

- **Floor (already basically won): the Arbitrum bonus (~$2K).** `SpendPolicy` + `ReceiptEmitter` are
  deployed on Arbitrum One with a live `MandateCharged` tx (`0x33a4...9ced`). Highest-EV money on
  the board, and it's done. Package it.
- **Plus the Magic bonus (~$500):** email onboarding works; adding Google social login is a few
  hours. High probability.
- **Ceiling — the main track: go for the Universal Accounts Track,** contingent on clearing the
  cross-chain gate (§5). Counter-intuitive reason it beats the General Track: **the UA Track will
  have a thinner field.** The cross-chain-via-UA requirement is hard for everyone right now
  (Particle's own migration is breaking it), so fewer compliant submissions will exist. Clearing
  that gate is itself a moat. The General Track will be a bloodbath of polished UX apps where a
  "spend-permission" primitive looks less differentiated.
- **Fallback:** if you cannot clear cross-chain honestly by the deadline, pivot the *same*
  submission to the **General Track** (no cross-chain requirement), lead with the firewall + agent
  demo, and still take Arbitrum + Magic. Do **not** fake a cross-chain demo.

Net: **realistic expected outcome = Arbitrum + Magic bonuses (~$2.5K) as a high floor; a credible
top-3 shot on the UA Track if the cross-chain gate falls.**

---

## 2. Positioning

The current one-liner ("the consent + proof + permission-safety layer for Universal Accounts — the
on-chain guardrail that makes agentic payments safe") is **accurate but abstract**. Three abstract
nouns before a human feels anything. Judges remember protagonists and verbs, not "layers."

**Sharpest one-sentence pitch (recommended):**

> **OneLink Pay is a spending limit for AI agents that's enforced on-chain — your agent can pay
> across any chain, but it physically cannot overspend, pay the wrong merchant, or keep paying
> after you revoke.**

**Two alternatives:**

- **(Safety / seatbelt framing, best for the 7702 crowd):** "EIP-7702 lets you hand your account to
  code. OneLink Pay is the seatbelt: sign one mandate, and your Universal Account can be charged
  only inside the limits you approved — everything else reverts."
- **(Category framing, best for the adoption story):** "Google's AP2 and Coinbase's x402 let agents
  *pay*. OneLink Pay is the missing piece that makes sure they can't *overpay* — a programmable
  allowance for the agent era, enforced at your own account."

**The protagonist that makes judges feel it:** the **AI agent with a credit card it can't abuse.**
Not the consumer, not the merchant. This crowd (7702 Collective + Encode) is literally building the
agent-payments future. The agent-on-a-leash framing lands hardest with them, it's the most visceral
demo (a bot autonomously paying, then hard-blocked on-chain), and it rides the single hottest
narrative in crypto. Keep the human-merchant checkout as the approachable on-ramp, but make the
**agent** the hero of the climax.

---

## 3. Prioritized upgrades

Mapped to the (best-known) rubric: **UX 40 / UA+7702 30 / Adoption 20 / Polish 10.** Sorted by
leverage.

| # | Upgrade | Why it scores (rubric mapping) | Impact | Effort |
|---|---------|--------------------------------|--------|--------|
| 1 | **Live "agent on a leash" demo:** a scripted bot that autonomously calls `charge` within the mandate, then attempts an over-cap charge and is **blocked on-chain**, then you revoke and it dies. | Most visceral 60-90s you can show. UX40 (memorable, legible) + UA30 (innovative 7702 use) + Adoption20 (rides agent-commerce wave). | H | M |
| 2 | **Clear the cross-chain gate** (Particle cross-chain sourcing first, Circle Gateway backup — see §5). | Unlocks UA-Track eligibility (binary). UA30 + Polish10. | H (gate) | M-H |
| 3 | **"Blind signature vs legible mandate" split-screen:** raw scary EIP-7702 delegation blob vs human-readable scoped consent. | Weaponizes the documented #1 7702 risk. UX40 + UA30. | H | L |
| 4 | **Magic Google/social login** + a 10-second onboarding clip. | Magic bonus (~$500) + UX40 (no seed phrase, Web2-smooth). | M | L |
| 5 | **Real-time "remaining budget" meter** on checkout + `/firewall` budget HUD (per-charge / daily / total remaining, expiry countdown). | Makes the abstract mandate tangible. UX40 + Polish10. | M | L |
| 6 | **One-tap revoke with instant "agent now blocked" feedback** in the same view. | Reversibility-as-safety; the 7702 kill switch. UX40 + UA30. | M | L |
| 7 | **Shareable public proof receipt polish:** verified -> matched -> recorded timeline, explorer links, copyable, QR. | Trust + virality. Adoption20 + Polish10. | M | L |
| 8 | **x402 tie-in (stretch, optional):** agent hits a 402-gated endpoint, pays via a mandate-bounded charge; over-budget request is refused. | Wow + Openfort bonus alignment + Adoption20 + UA30. Scope-creep risk. | H | M-H |
| 9 | **Mandate semantics aligned to ERC-7715 vocabulary** (cite the standard in the pitch). | Defuses "you reinvented spend permissions." UA30 + credibility. | M | L-M |

**Cut/avoid:** multi-token support, merchant auth systems, anything that doesn't show in the
3-minute demo, and **doing #2 + #8 + ZeroDev all at once** (that's how you break the core demo —
reliability beats breadth).

---

## 4. The #1 move

**Wire the cross-chain settlement so the *agent's* payment is the cross-chain payment — one move
that fixes the biggest risk and creates the biggest wow simultaneously.**

Make the climax demo be: *the AI agent, holding USDC on Arbitrum, autonomously pays a Base invoice
within its mandate — value moves cross-chain via the 7702 account — and when it tries to exceed the
cap, the charge reverts on-chain.* That single scripted flow:

1. **Clears the UA-Track's mandatory cross-chain gate** (eligibility — the existential risk).
2. **Maxes the 40% UX axis** — the most memorable thing a judge sees all day.
3. **Maxes the 30% UA+7702 axis** — cross-chain value via a 7702-delegated account *and*
   account-level policy enforcement, in one shot.
4. **Maxes the 20% adoption axis** — a live demo of the exact agent-commerce future AP2/x402/Circle
   are building toward.

Single sub-task to start: **at the Jun 22 Particle kickoff / office hours, sit with DevRel (Davide
Zambiasi) and get one tiny cross-chain `createTransferTransaction` to actually settle.** Your probes
already *build* multi-chain userOps for an Arbitrum-target 2.05 USDC transfer; the failure is
settlement on a zero-balance destination (fixable with destination dust + `universalGas`). That is
the cleanest "via UA" proof, and Particle's own people can unblock it live. If it won't settle,
fall back to Circle Gateway (§5).

---

## 5. Cross-chain plan

The rule: *"at least one cross-chain operation moving value via the Universal Account."* The phrase
**"via the Universal Account"** is the crux. Honest options, ranked by how cleanly they satisfy the
rule and how reliably they demo.

### Option A — Particle native cross-chain *sourcing* via `createTransferTransaction` (try first)

- The only path unambiguously "via the UA." Particle's migration notice says
  `createTransferTransaction` is the one method that still works
  ([docs](https://developers.particle.network/universal-accounts/reference-implementation)) — so
  you're using the *supported* rail, not a blocked one.
- `cross-chain-proof-runbook.md` already shows the build succeeds with two userOps (Base
  `eip7702Delegated:true` + Arbitrum inline `eip7702Auth`) for an Arbitrum-target transfer above the
  local balance. The only failure is **settlement** on a zero-balance destination.
- **Minimal build:** pre-fund the destination with dust, attach `universalGas`/top-up, and have a
  dedicated proof route verify settlement on the destination chain (you currently verify Base only —
  generalize it). Validate live with Particle DevRel at kickoff.
- **How to phrase it (no overclaiming):** "USDC sourced on Arbitrum, settled to the merchant on
  Base, routed via the Universal Account in EIP-7702 mode."

### Option B — Circle Gateway (reliable backup, build after the Jun 25 workshop)

- Live on mainnet since Aug 2025, 11+ chains incl. Base and Arbitrum, unified USDC balance, mint on
  destination in <500ms ([Circle](https://developers.circle.com/gateway)). Pairs naturally with
  7702 EOAs (the EOA signs burn intents directly). Ships **"Nanopayments... purpose-built for AI
  agents"** ([Circle crosschain docs](http://developers.circle.com/crosschain-transfers)) — doubles
  down on the agentic narrative.
- **Honesty caveat:** Gateway is *Circle's* rail, not "via the Particle Universal Account." It
  cleanly satisfies "a cross-chain operation moving value," but a strict reading of "via the UA" may
  not be met. Use it as the backup, presented honestly ("cross-chain USDC via Circle Gateway, signed
  by the same 7702 account that is your Universal Account").
- **Minimal build:** deposit to Gateway Wallet on source chain -> request attestation -> mint on
  destination -> existing server-side verification + `ReceiptEmitter` proof. The verification/proof
  half already exists.

### Option C — ask the organizers (free, de-risks everything)

At the Jun 22 kickoff, ask Particle/Encode directly: (1) Does cross-chain *sourcing* via
`createTransferTransaction` count as "moving value via the UA"? (2) Given the V2 migration blocks
custom calls, is a Circle Gateway cross-chain op acceptable for the requirement? Get it in writing
in Discord.

**Recommended sequence:** Try A with Particle's help at kickoff -> if it settles once on a tiny
amount, you're done and it's the cleanest story -> if not by ~Jun 26, ship B (Circle) and lean on
the answer from C. Keep the same-chain firewall demo as the guaranteed-working spine regardless.

**Does transfer-rail cross-chain sourcing satisfy the rule even while custom calls are down?** Yes,
plausibly — and it's your best honest claim. The UA genuinely sources liquidity from a non-native
chain and settles on the target. Frame it as "cross-chain sourcing via the Universal Account," show
the two userOps and the source/destination chains in the preview, let explorer links speak. Don't
call it "atomic cross-chain settlement" unless it is.

---

## 6. Demo script (3-minute run-of-show)

Optimized for the UA Track (UX40 + UA30 + Adoption20). Open cold with the stakes, end on the wow.

- **0:00-0:25 — The hook (to camera, one sentence).** "There are ~69,000 AI agents already moving
  real money on-chain — and almost none of them have any enforced spending limit. OneLink Pay is the
  on-chain spending limit for the agent era." (Cite the number on screen.)
- **0:25-0:55 — Onboarding (UX40).** Open a payment link -> sign in with email/Google (Magic), no
  seed phrase, no extension. As the UA initializes in EIP-7702 mode, show the **Trust Preview**:
  amount, merchant, destination chain, and the **scoped mandate** (per-charge / daily / total caps,
  expiry, single merchant, revocable). "This is legible consent — not a blind signature."
- **0:55-1:25 — The split-screen (UA30 + UX40).** Raw EIP-7702 delegation blob a phishing drainer
  would have you sign, beside your human-readable mandate. "EIP-7702's #1 documented risk is signing
  your account away to malicious code. We turn that same delegation into a safety primitive."
- **1:25-2:15 — The climax: agent on a leash, cross-chain (UA30 + UA gate + Adoption20).** Trigger
  the **AI agent**. It autonomously pays the invoice — **USDC sourced on Arbitrum, settling on Base
  via the Universal Account** (show source/destination chains + tx link). Then it tries to overspend
  (0.20 vs a 0.10 cap) -> **`PerChargeExceeded`, reverts, zero gas, no funds move.** Let it land.
  "The agent can pay. It cannot overpay. Enforced by the chain, not by trust."
- **2:15-2:40 — Kill switch + proof (UX40 + Polish10).** One-tap **revoke** -> next agent charge
  reverts (`MandateIsRevoked`). Open the **public proof receipt** (verified -> matched -> recorded)
  and click through to the block explorer.
- **2:40-3:00 — Close (Adoption20).** "AP2, x402, Circle Gateway — the whole industry is racing to
  let agents pay. OneLink Pay is the guardrail that makes it safe, on any chain, at your own account.
  Live on Base and Arbitrum today." Show deployed addresses + "22 tests passing."

Two rules: **rehearse a pre-recorded backup** of the cross-chain leg (mainnet/Particle can flake),
and **label any replay as replay.**

---

## 7. Competitive scan

**Meta-point: the spend-permission *primitive* is not novel — do not pitch it as invented. Pitch the
packaging (legible UX + verifiable proof + agent demo + UA/7702 cross-chain), which is exactly what a
UX-weighted rubric rewards.**

- **Coinbase Spend Permissions (Base)** — trusted spender + allowance + period + revoke; powers
  subscriptions and automated payouts
  ([Base docs](https://docs.base.org/base-account/improve-ux/spend-permissions)). Same core idea as
  `SpendPolicy`. **Differentiate:** wallet-agnostic (mandate lives on the 7702 account, not tied to
  Coinbase Smart Wallet), adds a public proof receipt, framed around UA cross-chain + agents. Cite
  it; don't claim to beat it on the primitive.
- **ERC-7715 (`wallet_grantPermissions`) + ERC-7710 (delegation)** — the emerging standard for
  scoped, time-bounded permissions; implemented across Coinbase, ZeroDev, Biconomy, Safe, and
  MetaMask's Delegation Toolkit ([EIP-7715](https://eips.ethereum.org/EIPS/eip-7715),
  [eco.com](https://eco.com/support/en/articles/15254038-erc-7715-session-keys-2026-granular-permissions-explained)).
  **Differentiate + de-risk:** position `SpendPolicy` as a focused, auditable, payments-specific
  implementation, and *name the standard* in the pitch.
- **ZeroDev Kernel session keys / Polygon Smart Sessions (EOA+7702)** — scoped delegation at the
  account layer ([ZeroDev](https://docs.zerodev.app/smart-accounts/permissions/intro)).
  **Differentiate:** session keys are low-level infra; you enforce *payment policy*
  (per-charge/day/total/merchant) with legible consent + proof. ZeroDev is a sponsor — honest usage
  for the agent's session key could reach that subtrack, but only if real.
- **Google AP2** — "Mandates" as cryptographically signed, **off-chain** Verifiable Credentials;
  60+ partners incl. Coinbase/Mastercard/PayPal; donated to FIDO
  ([Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol/)).
  **Your best foil:** same word ("mandate"), but enforced **on-chain at the user's account** instead
  of trusting an off-chain credential. Same vocabulary, complementary layer.
- **x402 (Coinbase) / MPP (Stripe+Tempo) / Circle Gateway Nanopayments** — payment *rails* for
  agents. **Differentiate:** those are how agents *pay*; you're how they're *prevented from
  overpaying*. "Rails vs guardrails."

Independent corroboration of the thesis: agent spend should be **"policy-constrained, not
signature-constrained — rules cap amount, merchant, time, and chain"**
([eco.com, paraphrased](https://eco.com/support/en/articles/14839403-agent-wallets-how-ai-agents-spend-money)).
That is literally `SpendPolicy`'s thesis, stated by a third party. One widely-shared framing —
*~69,000 AI agents transacting on-chain, ~zero with governance enforcement* — names the wedge for
you ([execlayer; treat its patent claims skeptically, but the gap framing holds](https://execlayer.substack.com/p/69000-ai-agents-are-transacting-on)).

**Past winners / patterns:** Encode previously ran a Particle "Chain Abstraction Hackathon," and the
clearest recent pattern across comparable events (e.g., Circle's Arc tracks at ETHGlobal
Cannes/HackMoney 2026) is unambiguous: **stablecoin infra is converging on agentic systems,
nanopayments, and "make the chain disappear" UX**
([arc.network recap](https://www.arc.network/blog/meet-the-arc-track-winners-from-ethglobal-cannes-hackathon-and-what-we-learned)).
Winners in this lineage win on a clean end-to-end demo where the hard infrastructure is invisible and
the use case is obviously real. The firewall + agent demo fits — if kept ruthlessly simple.

---

## 8. Risks (top 5 + mitigations)

1. **Cross-chain-via-UA gate not cleared -> UA-Track non-compliance.** Mitigation: try Particle
   cross-chain sourcing with DevRel at kickoff (§5A); Circle Gateway backup (§5B); get the rule
   definition in writing (§5C); General-Track fallback. Never fake it.
2. **Firewall reads as orthogonal to Particle UA -> weak on the 30% UA+7702 score.** Mitigation:
   tighten the narrative and the demo so the **mandate governs the very 7702-delegated account that
   Particle turns into a UA**, and show the cross-chain UA payment being bounded by the mandate. One
   story, not two.
3. **"You reinvented spend permissions" (Coinbase / ERC-7715).** Mitigation: cite the prior art on a
   slide, align the mandate to ERC-7715 vocabulary, compete on UX + proof + agent demo, not novelty.
4. **Live demo flakes during judging** (Particle V2 instability, mainnet RPC, gas). Mitigation:
   pre-recorded backup of the cross-chain leg; run on the stable transfer rail; tiny amounts on
   cheap Arbitrum; dual-chain deployment gives a fallback chain.
5. **Building to the wrong rubric/deadline** (two conflicting versions exist). Mitigation: confirm
   at the Jun 22 kickoff; until then optimize UX first (safe under both 40% and 45% versions) and
   don't hard-commit scope to any unconfirmed item.

Bonus risk: **scope creep** (Circle + x402 + ZeroDev simultaneously) is the most likely
self-inflicted wound. Lock the core agent-on-a-leash demo first; add at most one bonus integration
after it's stable.

---

## 9. Sources

Hackathon & sponsor tech:

- Particle, "All-In On 7702" (UXmaxx, prizes, V2 rollout) — https://blog.particle.network/monthly-update-all-in-on-7702/
- Particle blog (7702 Collective, $15.5K, partners) — https://blog.particle.network/
- CompeteHub UXmaxx listing (stale placeholder; older rubric/dates) — https://www.competehub.dev/en/competitions/encodeclub_uxmaxx-hackathon
- Particle UA — EIP-7702 mode & initialization — https://developers.particle.network/universal-accounts/ua-reference/web/initialization
- Particle UA — V2 migration / `createTransferTransaction`-only — https://developers.particle.network/universal-accounts/reference-implementation
- Circle Gateway (unified USDC balance, <500ms) — https://developers.circle.com/gateway
- Circle crosschain (CCTP, Gateway, agentic Nanopayments) — http://developers.circle.com/crosschain-transfers

Prior art (spend permissions / delegation):

- Coinbase/Base Spend Permissions — https://docs.base.org/base-account/improve-ux/spend-permissions
- ERC-7715 (request permissions) — https://eips.ethereum.org/EIPS/eip-7715
- ERC-7710 (delegation) — https://eips.ethereum.org/EIPS/eip-7710
- ERC-7715 session keys overview — https://eco.com/support/en/articles/15254038-erc-7715-session-keys-2026-granular-permissions-explained
- ZeroDev session keys / Kernel — https://docs.zerodev.app/smart-accounts/permissions/intro

Agentic payments trend (adoption):

- Google AP2 (mandates as off-chain VCs) — https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol/
- x402 (Coinbase) — https://docs.cdp.coinbase.com/x402
- x402 Foundation w/ Cloudflare — https://blog.cloudflare.com/x402/
- AWS WAF/CloudFront x402 (Jun 2026) — https://aws.amazon.com/about-aws/whats-new/2026/06/aws-waf-ai-traffic-monetization/
- AWS x402 coverage (The Defiant) — https://thedefiant.io/news/defi/aws-cloudfront-coinbase-x402-ai-agents-usdc-base
- Agent spend market data (~69k agents / 165M+ tx) — https://0xprocessing.com/blog/prepare-crypto-gateway-for-ai-agent-payments/
- Circle agent-payment volume — https://sherlock.xyz/post/how-to-build-an-ai-agent-that-pays-with-usdc
- "Policy-constrained, not signature-constrained" framing — https://eco.com/support/en/articles/14839403-agent-wallets-how-ai-agents-spend-money
- Openfort (agent wallets + x402) — https://www.openfort.io/

EIP-7702 security (the narrative hook):

- Security Alliance, verifying 7702 (delegation phishing as primary threat) — https://frameworks.securityalliance.org/wallet-security/signing-and-verification/verifying-7702

---

## Next 48 hours (in order)

1. At the Jun 22 kickoff, ask the organizers the §5C rule question and try the Particle cross-chain
   settlement live with DevRel.
2. Build the "agent on a leash" demo (#1 upgrade) on the already-working firewall.
3. Add Magic Google login and package the Arbitrum bonus — real money you've essentially earned.
