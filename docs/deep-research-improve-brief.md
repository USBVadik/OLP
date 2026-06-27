# Deep Research Brief — OneLink Pay at current stage (improve / win)

> Generated 2026-06-26, post-deploy. An **honest, adversarial audit** of the shipped build to find
> high-leverage, low-risk improvements before judging, ending in sharp research questions. Stance:
> a skeptical judge + a senior reviewer, not a cheerleader. Grounded in a full codebase + docs
> review, a live smoke test, and build metrics — not vibes.

---

## 0. How to read this

- **§1** snapshot of what is actually true right now (grounded).
- **§2** honest scorecard against the confirmed rubric (UX 40 / UA+7702 30 / adoption 20 / polish 10).
- **§3** the brutal weaknesses (what a hostile judge attacks).
- **§4** prioritized improvement opportunities (impact × effort × risk).
- **§5** the research questions — the core deliverable, grouped by theme.
- **§6** my honest recommendation for the remaining time.

---

## 1. Grounded snapshot (what's true today)

- **Deployed live:** `onelink-pay.vercel.app`, prod mode `universal_7702_transfer` (Arbitrum-first,
  cross-chain via Particle UA). All 8 judge-facing routes return 200 (live smoke test 2026-06-26).
- **On the blessed stack:** Particle UA SDK pinned **exact** at `2.0.0-beta.3` — the version Particle
  states is required — and our Magic→UA→7702 delegation + `sendTransaction(rootHash)` flow matches
  their official `ua-7702-magic-demo` reference pattern.
- **Proven on-chain:** cross-chain settlement (C21, Base→Arbitrum, no bridge), `SpendPolicy`
  enforcement (per-charge/daily/total/expiry/merchant/revoke), x402 loop (402→pay→200, over-cap
  blocked), proof receipts. **132 automated tests** (110 unit + 22 contract).
- **Code health:** only 3 TODO markers in the whole `src` tree, all inside the deliberately-deferred
  `src/lib/zerodev/repeat-pay.ts` stub. Production surface is token-consistent (one off-token color
  found and fixed), a11y-audited (AA contrast, reduced-motion, focus rings, alt text).
- **Surface area:** 15 routes (3 debug routes gated off in prod). Heaviest First Load JS:
  `/agent` ~201 KB, `/firewall` ~198 KB, `/pay` ~129 KB, `/wallet` ~115 KB (shared baseline ~88 KB).

**Net:** the product is feature-complete, honest, and provably real. The remaining gains are
*refinement and delivery*, not rebuilds. That is the lens for everything below.

---

## 2. Honest scorecard vs the rubric

### UX — 40% (the axis that decides the prize)
- **Strong:** legible consent (mandate-as-card vs blind signature), the visceral "agent tries to
  overspend → blocked on-chain, zero gas" beat, one-tap revoke, shareable verifiable receipt,
  walletless Google/email login, premium restrained theme.
- **Gaps / open questions:**
  - Is the **judge's first 90 seconds self-guiding** without the runbook? 15 routes is a lot of
    surface; a judge who lands on `/` may not know the optimal path.
  - A fund-less judge cannot *drive* the live flows (login + USDC needed). Is the **no-wallet path**
    (`/demo-replay` + verifiable `/receipt`) compelling enough to land the wow alone?
  - **Mobile** behavior is unverified this session — judges often open on a phone.
  - `/firewall` and `/agent` both tell the "agent on a leash" story — is that **duplicative/confusing**
    for a judge, or a deliberate "live vs scripted" pair?

### Universal Accounts + EIP-7702 — 30%
- **Strong:** real 7702 delegation (same address, 3 chains), account-level mandate enforcement,
  proven cross-chain value movement, one-balance unified view.
- **Gaps / open questions:**
  - Rubric says *prominent* UA+7702. Cross-chain is mostly experienced via **replay + receipt**, not
    in the judge's own hands. Is "prominent" actually met, or merely "present"?
  - The **7702 delegation moment** ("your EOA becomes a smart account, same address, reversible") is
    described but not dramatized as its own beat — it's arguably the most novel primitive and is
    under-staged.

### Adoption potential — 20%
- **Strong:** credible thesis (x402 + AWS, AP2 + Google/FIDO, 7702 drainer risk) — a real,
  timely wedge.
- **Gaps / open questions:** the story is **abstract**. No named first customer, no concrete GTM, no
  live third-party x402 marketplace integration. "Who deploys this on Monday?" is unanswered.

### Technical quality / polish — 10%
- **Strong:** 132 tests, end-to-end types, EIP-712 mandate byte-identical contract↔frontend, lean
  deps, minimal tech debt.
- **Gaps / open questions:** **bundle/perf** (~200 KB First Load on the two hero pages — heavy
  Magic/Particle/ethers SDKs loaded eagerly); **beta-SDK risk** (prod on `2.0.0-beta.3`); **live-demo
  fragility** (RPC/Magic/Particle/funded wallet are all single points of failure on stage).

---

## 3. Brutal weaknesses (what a hostile judge attacks)

1. **"I can't try the cool part myself."** The cross-chain + firewall wow needs a funded, logged-in
   wallet. If the self-serve path isn't dead-obvious, the judge only *watches*, never *feels* it.
2. **"Which page is the product?"** 15 routes, two pages telling the agent story. Risk of a judge
   wandering and missing the punchline in their 2 minutes.
3. **"Is this prominent UA+7702 or just using it?"** Cross-chain proof lives in a receipt; the 7702
   delegation isn't a staged beat. A 30%-weighted axis deserves a louder, in-flow moment.
4. **"Who actually pays for this?"** The adoption story is a thesis, not a customer.
5. **"It's on a beta SDK / it might flake live."** Real fragility; mitigated only by the (still
   unrecorded) R4 backup video.
6. **First paint is heavy** on `/agent` and `/firewall` (~200 KB) — a slow first impression on a
   weak conference network.
7. **"You reinvented spend permissions."** Addressed by the prior-art table, but the one-sentence
   wedge must survive a live, skeptical follow-up.

---

## 4. Improvement opportunities (prioritized: low-risk / high-leverage first)

> Risk is rated for *doing it now, days before judging*. Proven, on-chain flows are sacred — measure
> before touching them.

| # | Opportunity | Impact | Effort | Risk now | Verdict |
|---|-------------|--------|--------|----------|---------|
| A | **"For judges: start here" guided entry** (a 2-min tour / explicit path on `/`) | High (UX 40) | Low | Low | **Do** |
| B | **Record + rehearse the R4 backup video** (the #1 open risk) | High (all axes) | Med | Low | **Do (user)** |
| C | **Make the no-wallet path unmissable** on `/firewall` + `/agent` (inline "watch the 90s replay, no funds needed") | High (UX) | Low | Low | **Do** |
| D | **Stage the 7702 delegation as its own beat** (a clear "same address → smart account, reversible" moment) | High (UA 30) | Med | Med | **Investigate** |
| E | **Mobile/responsive pass** on the judge path | Med (UX) | Low–Med | Low | **Do (verify first)** |
| F | **Lazy-load heavy SDKs** to cut First Load on `/agent`,`/firewall` | Med (polish) | Med | Med (touches proven flows) | **Measure, then maybe** |
| G | **Crisper adoption beat** (named design-partner / "deploy a link in 60s" self-serve) | Med (adoption 20) | Med | Low | **Investigate** |
| H | **Lead with honesty as a flex** (open or close the pitch on `/trust`) | Med (UX/credibility) | Low | Low | **Do** |
| I | New features (recurring/session-key automation, more chains, etc.) | — | High | **High (R6 scope creep)** | **Defer** |

---

## 5. Research questions (the core ask — "how do we improve / win?")

### Theme 1 — Judge experience in the first 2 minutes (UX, 40%)
1. Does a cold judge landing on `/` know the optimal path within 10 seconds, with zero prior context?
   Would an explicit **"Judge mode / 2-minute guided tour"** measurably reduce navigation guesswork —
   and is it worth the build risk this close?
2. For a **fund-less judge**, is the `/demo-replay` + verifiable `/receipt` experience enough to land
   the wow on its own? What is the single most convincing no-wallet artifact, and is it one click from `/`?
3. Is the **mobile** experience of the judge path (landing → firewall/agent → receipt) actually good,
   or are there layout/tap-target/scroll problems on a phone?
4. Are `/firewall` and `/agent` **complementary or redundant** to a first-time judge? Should one be the
   canonical demo and the other a labeled "advanced/scripted" variant?

### Theme 2 — Making UA + EIP-7702 *prominent*, not just present (30%)
5. What is the most legible way to **stage the 7702 delegation** as a visible beat ("your wallet became
   a smart account — same address, reversible") without adding fragility to the proven flow?
6. Can a judge safely trigger a **tiny real cross-chain op themselves** (e.g., a pre-funded shared demo
   account they drive), or is the replay + independently-verifiable receipt the right, safer bar?
7. Does our framing make clear that **mandate enforcement is at the account/7702 layer** (the novel
   part), not just "a contract that checks limits"? How do competing UA submissions show 7702 depth?

### Theme 3 — Adoption that isn't abstract (20%)
8. Who is the **concrete first user** — an AI-agent dev paying for x402 APIs, a SaaS doing capped
   subscriptions, a marketplace? Which one is most credible to demo/name?
9. Is there a **real, thin third-party x402 integration** (a public x402-gated API/marketplace) we
   could call live to prove "plugs into the real agentic economy" rather than our own catalog?
10. What is the **"deploy a payment link in 60 seconds"** self-serve story, and is the merchant
    dashboard close enough to make that real for a judge?

### Theme 4 — Polish, performance, resilience (10%)
11. How much does the ~200 KB First Load on `/agent`/`/firewall` hurt first paint on a weak network,
    and can the Magic/Particle/ethers SDKs be **lazy-loaded** without destabilizing the proven flows?
12. What is the **contingency** if Particle ships a breaking `2.0.0-beta.*` during judging week (we pin
    exact — is monitoring + a pinned fallback enough)?
13. Is the **R4 backup video** recorded, labeled, and rehearsed end-to-end, and does it cover every
    beat so a live flake never blocks the score?

### Theme 5 — Positioning & memorability (cross-cutting)
14. Can the **wedge survive one sentence under fire**? Stress-test: "on-chain revocable mandate bound
    to the x402 agent rail, entered via a UA/7702 account, with a public proof receipt" — vs Coinbase
    Spend Permissions / ERC-7715 / ZeroDev session keys. Where does it actually win, where does it tie?
15. What is the **one thing** a judge remembers 10 minutes later, and does the first 30 seconds plant it?
16. Is **honesty itself** (the `/trust` page + claim ledger) being used as a *differentiator* — a trust
    flex most teams can't make — rather than buried as a footnote?

### Theme 6 — External / competitive (needs web research)
17. What patterns won recent **Particle UA / EIP-7702 hackathons**, and what did judges praise? Are we
    matching or exceeding that bar on the 30% axis?
18. What's the **current state of x402** (facilitator, AWS, ecosystem APIs) we could honestly reference
    or lightly integrate to strengthen adoption?
19. How are **Coinbase Spend Permissions / ERC-7715-7710** evolving — does anything there strengthen or
    threaten our "wedge" narrative?

---

## 6. Honest recommendation for the remaining time

**Do now (low-risk, high-leverage):** A (judge-start guidance), C (no-wallet path unmissable),
H (lead with honesty), E (mobile verify) — all UI/copy, no touching proven on-chain flows. And
above all **B/13 — record + rehearse the R4 backup video**, which is the single biggest score
protector and still open.

**Investigate, decide with data:** D (stage the 7702 beat), F (lazy-load perf), G (sharper adoption
beat). Worth it only if they don't risk the proven flows.

**Defer (post-hackathon / explicit scope creep — R6):** new automation/session-keys, more chains,
deeper integrations. Tempting, wrong timing.

**Bottom line:** the build is done and honest; the prize is now won or lost on *delivery and
legibility in the first 2 minutes*, not on more features. The highest-value "improvement" is making
the existing wow impossible to miss — and having the backup video so a live flake never costs the score.

---

## Appendix — open research questions to hand to an external deep-research pass

Questions 17–19 (and 8–9 where market data helps) are the ones that benefit from live web research:
recent UA/7702 hackathon-winning patterns, the current x402 ecosystem surface, and the trajectory of
Coinbase Spend Permissions / ERC-7715. Everything else is decidable internally with the team.


---

## 7. External research findings (Q17–19 + market) — 2026-06-26

> Live web research answering the external questions. *Content was rephrased for compliance with
> licensing restrictions; sources linked inline.* Figures are third-party reported, not ours.

### 7.1 x402 is real, hyperscaler-backed — but demand is still early
- By April 2026 x402 had ~69,000 active agents, 165M+ transactions, ~$50M cumulative volume, avg
  ticket ~$0.30 ([cryptonews](https://cryptonews.com/news/coinbase-x402-ai-agent-app-store-crypto-payments/),
  [eco.com](https://eco.com/support/en/articles/14846274-pay-per-call-apis-for-ai-agents)).
- **Honesty caveat (use this, don't overclaim):** a March 2026 CoinDesk piece reports daily volume
  around only ~$28K, much of it testing/"gamed", i.e. demand isn't there *yet* despite a large
  ecosystem valuation ([CoinDesk](https://www.coindesk.com/markets/2026/03/11/coinbase-backed-ai-payments-protocol-wants-to-fix-micropayment-but-demand-is-just-not-there-yet)).
- **Hyperscaler validation (timely pitch ammo):** on June 17, 2026 AWS wired x402 into CloudFront +
  WAF so any site behind the CDN can charge agents per request in USDC — first hyperscaler to put
  on-chain settlement at the CDN edge ([thirdweb](https://blog.thirdweb.com/aws-cloudfront-now-accepts-onchain-payments-from-ai-agents-via-x402-what-builders-need-to-know/),
  [The Defiant](https://thedefiant.io/news/defi/aws-cloudfront-coinbase-x402-ai-agents-usdc-base)).
  Coinbase also tied x402 into Amazon Bedrock AgentCore Payments ([Crypto Briefing](https://cryptobriefing.com/coinbase-agentic-checkout-payments-apis/)),
  and Google Cloud + Solana lets agents pay for Gemini/BigQuery/Vertex + 50+ APIs in stablecoins
  ([Gate](https://www.gate.com/blog/102653/solana-google-cloud-stablecoin-ai-agent-api-pay-per-use-x402-protocol-onchain-payments-web3-infrastructure-analysis)).

### 7.2 Competitive landscape — the wedge must get sharper (Q19)
The biggest finding: **"agent wallet + spend limits + x402" is no longer novel by itself.**
- **Coinbase Agentic Wallets** (launched Feb 11, 2026): an MPC wallet + x402 client + programmable
  spend controls + gasless Base rail, via CLI/MCP ([eco.com](https://eco.com/support/support/en/articles/14845485-coinbase-agentic-wallets-explained)).
- **ERC-7715 session keys** (scoped spend caps + allowlists + expiry, approve-once) are a draft EIP
  already live across Coinbase, ZeroDev, Biconomy, Safe ([eco.com](https://eco.com/support/en/articles/15254038-erc-7715-session-keys-2026-granular-permissions-explained)).
- **Coinbase Spend Permissions** let apps spend tokens on your behalf from a Base smart wallet
  ([Coinbase Help](https://help.coinbase.com/en/wallet/getting-started/smart-wallet-permissions)).

**So our differentiation can't be "we limit agent spend." It must be the packaging that none of
them combine:**
1. **On the user's own EOA via EIP-7702** — same address, no new smart/MPC account, no asset
   migration — not a vendor-issued wallet.
2. **Chain-abstracted via Particle UA** — one balance across EVM **+ Solana** (15 chains), not
   Base-centric.
3. **A public, independently-verifiable proof receipt** per payment (verified → matched → recorded)
   — a trust artifact the vendor stacks don't emit.
4. **Our own auditable `SpendPolicy` contract** — the product, not a setting in a vendor dashboard.

### 7.3 EIP-7702 / Universal Accounts — the thesis is validated (Q17)
- Particle is "all-in on 7702": any existing EOA can be upgraded to a Universal Account with no new
  address or migration, unifying balances across Ethereum/Base/Solana/BNB as one pool
  ([Particle blog](https://blog.particle.network/monthly-update-all-in-on-7702/)). 7702 mode
  requires an embedded (WaaS) wallet for `signAuthorization` — **confirming our Magic choice is the
  correct/required path** ([Particle docs](https://developers.particle.network/universal-accounts/ua-reference/desktop/eip7702-wallets)).
- The EIP-7702 **drainer/phishing risk** (signing a delegation to malicious code) is documented in
  the literature ([arXiv](https://arxiv.org/html/2512.12174v1)) — which directly validates our
  "on-chain guardrail for 7702" thesis. *Lead with this:* the very mechanism we use has a named #1
  risk, and our mandate is the safety rail for it.

### 7.4 Where we sit in the 2026 stack
Industry framing converges on a composed stack: **AP2 (authorize / signed mandates) + ACP (checkout)
+ x402 / MPP (settle)** ([alignify](https://alignify.co/blog/agentic-payments),
[CCN](https://www.ccn.com/education/crypto/ai-agents-payment-rails-mpp-acp-ap2-x402-explained/)).
AP2's mandates prove human consent **off-chain** (Verifiable Credentials). **Our crisp slot:** the
**on-chain enforcement** layer that the stack is missing — consent that the account itself enforces
via 7702, not just a signed credential. Pitch line: *"AP2 proves consent off-chain; x402 settles;
OneLink enforces the mandate on-chain at your own account."*

### 7.5 Concrete adoption angles (Q8–Q9)
- **x402 Bazaar** is the live discovery layer — a machine-readable catalog of x402 API endpoints
  ([x402 docs](https://docs.x402.org/extensions/bazaar)). Calling a **real Bazaar-listed third-party
  API** (instead of only our own catalog) in the `/agent` demo would concretely prove "plugs into
  the real agentic economy." Worth a thin, optional integration — measure risk first.
- **First-customer framings that now have external backing:** an AI-agent dev paying x402 APIs
  (AWS CloudFront / Bedrock / Google Cloud are live rails to name), or a SaaS doing capped agent
  budgets. Name one concretely in the pitch instead of "the agentic economy" in the abstract.

### 7.6 What this changes for us (recommendations)
1. **Re-sharpen the wedge (Q14):** lead the differentiation with the 4-point packaging in §7.2 —
   explicitly "vs Coinbase Agentic Wallets / ERC-7715 / ZeroDev," because judges may know those exist.
   The prior-art table should name Coinbase Agentic Wallets (new since our last positioning pass).
2. **Lead the pitch with the validated thesis (§7.3):** the documented 7702 drainer risk + the
   missing on-chain-enforcement slot (§7.4). That's a stronger, externally-grounded opening than
   "give your AI a card."
3. **Make the adoption beat concrete (§7.5):** name a real rail (AWS CloudFront x402, June 2026) and,
   if low-risk, call one real x402 Bazaar API live.
4. **Keep the honesty flex (§7.1 caveat):** x402 demand is still early — say it plainly; it makes our
   "real, verifiable, on-chain" framing more credible, not less.
5. **Unanswered externally:** specific UXMAXX/Encode UA-hackathon *winner* patterns aren't public
   (current event); best proxy is Particle's own 7702 positioning above, which we already meet/exceed.
