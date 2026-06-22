1. **Verdict**

You can win, but the **safest high-odds path is the General Track (UX)**, stacked with **Magic** and **Arbitrum** bonuses; the Universal Accounts Track is winnable only if you pull off one robust, honest cross-chain value demo using UA in time. [x](https://x.com/encodeclub/status/2044809572653932969)

Given your current state:  
- You already have a differentiated, working **permission firewall + proof** flow on Base and Arbitrum with real USDC, plus EIP-7702 delegation wired.  
- The **only hard blocker** is “at least one cross-chain value op via UA,” which depends on **Particle UA V2 / backend stability** and is outside your control. [blog.particle](https://blog.particle.network/chain-abstract-everything-announcing-2-upcoming-products/)

**Verdict by category:**

- **Best odds (recommended): General Track (UX) + Magic + Arbitrum bonuses.**  
  - Judge story: “The first Web2-grade ‘credit card with a leash’ for AI agents and humans: social-login wallet, one-click ‘arm spending limits’, live on Arbitrum, with on-chain receipts.”  
  - You can fully lean into the **40% UX** and **20% adoption**, and still showcase UA/7702 as an innovation bonus without being hard-gated by UA cross-chain. [hackathons](https://www.hackathons.space/past)

- **High-upside but risky: Universal Accounts Track.**  
  - If you can ship **one stable cross-chain UA payment** (even a tiny USDC flow from chain A → merchant on chain B) using Particle’s transfer rail or a UA-compatible cross-chain deposit once V2 settles, you’re a contender: your firewall is exactly the “agent safety” narrative Particle and 7702 Collective are publicly hyping. [dynamic](https://www.dynamic.xyz/docs/recipes/integrations/particle/particle-network-universal-accounts)
  - But today this is **blocked by Particle infra**, not your code; if it’s still flaky by submission, you risk being disqualified on a technicality.  

***

> **Assumptions (since your [[FILL IN]] fields are blank):**  
> - Submission ≈ GitHub repo + **3‑minute video demo** + optional deployed URL, matching Encode/Circle patterns. [community.arc](https://community.arc.io/public/events/hackathon-programmable-money-74llz8htis)
> - Time: **1 dev + AI agents, ~3–5 days** of focused work left.  
> - Organizers will be pragmatic if Particle infra is down, but will still expect you to be honest and explicit about constraints.

***

2. **Positioning**

### Core one-sentence pitch (strongest)

> **“OneLink Pay is an on-chain ‘credit card with a hard leash’ for AI agents and humans — one signed mandate that lets them pay *only* within strict, revocable limits, enforced and proven on-chain across chains.”**

This hits: visceral (“credit card with a leash”), clearly ties to **AI agents + safety**, and implicitly references UA/7702 and cross-chain without jargon.

### Two alternative positionings

1. **Agent safety / firewall framing**  
   > “OneLink Pay is the safety firewall for Universal Accounts — it turns a single consent into a revocable spend policy that AI agents physically cannot break.”

2. **Merchant / checkout framing**  
   > “OneLink Pay lets merchants send payment links that come with built-in guardrails: customers approve one safe spending lane, and every charge and proof is enforced and receipted on-chain.”

For this crowd (Particle + 7702 Collective + Encode), I’d bias toward **AI agent safety** as the hero story, with merchants as the practical “who pays” follow‑up. They are already talking publicly about **Universal Agent Accounts and agent volume**; you’re the missing control layer. [circle](https://www.circle.com/blog/introducing-circle-agent-stack-financial-infrastructure-for-the-agentic-economy)

***

3. **Prioritized upgrades**

Idea | Why it scores (UX40 / UA30 / adopt20 / polish10) | Impact | Effort
---|---|---|---
**A. “Agent with a leash” end-to-end demo**: simple agent (Node script or local LLM) that (1) reads an offer, (2) calls your backend to pay within mandate, (3) then deliberately tries to overspend and gets reverted on-chain, with UI showing “Agent blocked.” | Huge **UX** (visceral story in 10 seconds), strong **innovation** (agentic payments), good **adoption** narrative (“safe AI spend”), moderate **polish**. Directly matches Particle + Circle messaging about agents needing spend controls.  [circle](https://www.circle.com/blog/building-the-financial-rails-for-the-agentic-economy) | **H** | **M**
**B. Magic social login + “3-click to armed card” funnel**: streamline flow so from blank page to “armed spending mandate” is ≤3 visible steps, with email/social login, pre-filled sensible caps, and a single big “Arm safe spending” button. | Maximizes **UX40** and qualifies you very strongly for **Magic bonus**; also shows real “Web2-feel” onboarding Encode wants.  [encodeclub](https://www.encodeclub.com/programmes/uxmaxx-hackathon) | **H** | **M**
**C. Arbitrum-first checkout path**: make primary happy path run on Arbitrum One (cheaper gas), with Base as proof-anchor chain, and highlight “runs on Arbitrum” banner + Arbiscan links. | Strong **bonus prize alignment (Arbitrum)**, better demo speed and cost; helps **adoption** (“we picked a low-fee production L2”).  [community.arc](https://community.arc.io/public/events/hackathon-programmable-money-74llz8htis) | **M** | **L**
**D. Cross-chain value MVP via Circle Gateway**: deposit USDC from Arbitrum into Gateway, mint on Base, then pay merchant on Base under a OneLink mandate; highlight unified balance and instant mint. | Potentially clears “cross-chain value” requirement even if UA infra is flaky, aligns with Circle’s **agentic economy / Agent Stack** narrative. Strong **innovation** and **adoption** story, but some SDK/API surface area.  [circle](https://www.circle.com/blog/building-the-financial-rails-for-the-agentic-economy) | **H** | **H**
**E. Minimal UA cross-chain transfer-rail demo**: once Particle V2 stabilizes, implement a single “Pay in USDC on chain B from pooled balance across chains” using `getPrimaryAssets` + `sendTransaction` / transfer helper; tiny amount, one happy path. | Directly optimizes **UA30**; if it works, you’re a strong Universal Accounts Track candidate. But infra risk outside your control.  [blog.particle](https://blog.particle.network/chain-abstract-everything-announcing-2-upcoming-products/) | **H** | **M–H** (depends on infra)
**F. Mandate configuration UX polish**: opinionated presets (“Coffee agent”, “SaaS subscriptions”, “One-time purchase”) with corresponding caps; inline explainer chips (“Max per charge”, “Per day”) with 1-line tooltips. | Big **UX** uplift, improves comprehension (critical for judges understanding the value quickly), slightly boosts **adoption** story (“non-crypto users can use this”). | **M** | **L**
**G. Public receipt page storytelling**: beautify the receipt with badges like “Inside mandate ✅”, “Agent blocked ❌”, plus shareable URL that shows hashes, chains, and mandate snapshot in human english. | Strong **UX** and **polish**; also supports **adoption** narrative (“chargebacks / audits / invoices can trust this”). | **M** | **M**
**H. ZeroDev or Openfort tie-in (optional)**: for example, wrap an agent wallet (backend or smart account) that uses OneLink as the policy layer and ZeroDev session keys for day-to-day actions. | Helps tap **ZeroDev/Openfort bonuses**, reinforces “composable infra builder” image; but real impact on UX less than above items and risk of scope creep.  [docs.arbitrum](https://docs.arbitrum.io/for-devs/third-party-docs/ZeroDev/zero-dev) | **M** | **M–H**
**I. “Compare to Coinbase Spend Permissions / Circle Agent Wallets” section in README**: explicit prior-art comparison explaining why revocable, merchant-scoped, multi-cap firewall on UA is differentiated. | Doesn’t score UX directly, but boosts **adoption / polish** (shows you understand ecosystem, not reinventing blindly) and supports judge confidence.  [docs.cdp.coinbase](https://docs.cdp.coinbase.com/wallets/using-wallets/spend-permissions) | **M** | **L**

***

4. **The #1 move**

#1 highest-leverage move:  
**Ship a visceral “AI agent with a credit card it physically can’t abuse” demo, end-to-end, with world-class UX around mandate creation and the overspend being blocked.**

Why:

- It directly targets the **40% UX** and **30% innovation** buckets with one story: judges see an agent paying safely, and see over-spend attempts fail **live**.  
- It aligns perfectly with current **agentic payments narratives** from Circle and Particle (Agent Stack, Universal Agent Accounts), so it feels “of the moment.” [circle](https://www.circle.com/blog/building-the-financial-rails-for-the-agentic-economy)
- It does not depend on Particle’s fragile cross-chain path — you can do it same-chain on Arbitrum with UA delegation in 7702 mode and still say: “Once Particle’s cross-chain is fully stable, this same agent gets chain abstraction for free.” [developers.particle](https://developers.particle.network/universal-accounts/web-quickstart)

Everything else (Circle Gateway, UA cross-chain) is additive; this is the **core emotional moment** that makes judges remember you.

***

5. **Cross-chain plan**

### 5.1 Options to honestly clear “at least one cross-chain value op via UA”

**Context:** Particle is mid-rollout of **Universal Accounts V2**; they themselves highlight that it improves cross-chain execution and is rolling out with new tooling, which lines up with the “maintenance / refund” issues you’re seeing. [blog.particle](https://blog.particle.network/chain-abstract-everything-announcing-2-upcoming-products/)

#### Option A — Particle UA transfer-rail cross-chain once stable

- Use Particle SDK’s **UA client** in 7702 mode with your Magic EOA as owner, as documented in UA quickstart and the Dynamic 7702 demo. [github](https://github.com/Particle-Network/ua-dynamic-7702)
- Minimal cross-chain UX:  
  1. User sees **unified balance** via `getPrimaryAssets()` and a small cross-chain “Pay on Arbitrum using wherever your USDC lives” button. [developers.particle](https://developers.particle.network/universal-accounts/web-quickstart)
  2. Under the hood, you call the UA **transfer helper** / `sendTransaction` configured to pay a merchant on Arbitrum, while UA sources value across chains.  
  3. After success, backend verifies the on-chain `Transfer` on Arbitrum and records the `InvoicePaid` proof on Base (already working).  
- This is the **cleanest path** to satisfying “cross-chain via UA”, but relies on V2 infra being stable and allowing your call pattern again. [blog.particle](https://blog.particle.network/chain-abstract-everything-announcing-2-upcoming-products/)

**Minimal build:** Wire a single `payCrossChain()` flow using Particle’s documented cross-chain example (the UA-Dynamic demo shows a cross-chain convert sequence you can adapt). [dynamic](https://www.dynamic.xyz/docs/recipes/integrations/particle/particle-network-universal-accounts)

#### Option B — Circle Gateway + 7702 EOA (“UA-adjacent” path)

- Circle **Gateway** already exposes a **unified USDC balance across chains**, with instant mint on destination using a single API call. [developers.circle](https://developers.circle.com/gateway)
- Flow you can honestly ship:  
  1. User’s **Magic+7702 EOA** pays USDC from Arbitrum into a **Gateway Wallet contract** (Circle deposit). [developers.circle](https://developers.circle.com/gateway)
  2. Gateway exposes a unified balance; you then call Gateway’s API to **mint USDC on Base** into the same Magic EOA or a merchant address. [developers.circle](https://developers.circle.com/gateway)
  3. OneLink firewall enforces the payment mandate on the outgoing payment (from EOA or UA on Base), and proof is recorded via `ReceiptEmitter`.  
- Technically, this is **cross-chain via Circle Gateway**, not via Particle UA. You should present it as **“cross-chain agent-safe USDC rails using Gateway + 7702 EOAs”**, not as “Universal Accounts cross-chain settlement.”  

**Minimal build:** integrate Circle’s Gateway SDK, implement only: `depositUSDC(sourceChain=Arbitrum)` → `mintUSDC(destChain=Base)` → call your existing payment flow on Base. [developers.circle](https://developers.circle.com/gateway)

#### Option C — Hybrid narrative: UA for same-chain, Gateway for cross-chain

- Use **UA 7702 mode** to handle same-chain payments and UX (unified balance display, EOA delegation), and **Circle Gateway** for the single cross-chain step, openly acknowledging current Particle UA V2 limitations. [developers.particle](https://developers.particle.network/universal-accounts/web-quickstart)
- Script: “Today, cross-chain value moves via Gateway, while UA handles same-account UX and delegation; as UA V2’s cross-chain paths fully stabilize, we can natively swap the cross-chain leg to Particle.”  

### 5.2 Does UA transfer-rail with cross-chain *sourcing* count?

If Particle’s **transfer path** (e.g., cross-chain transfer or convert) works while custom contract calls are still blocked, that likely **does** satisfy the “at least one cross-chain value op via UA” requirement:  
- The rules emphasize **“use Universal Accounts in EIP-7702 mode”** and **“include at least one cross-chain operation moving value via the Universal Account”**, not “must be a contract call.” [x](https://x.com/encodeclub/status/2044809572653932969)
- If you show the UA sourcing balance across chains (via unified balance) and paying a merchant on another chain in one UA transaction, that’s clearly within the spirit of the track. [blog.particle](https://blog.particle.network/chain-abstract-everything-announcing-2-upcoming-products/)

**How to phrase it to judges without overclaiming:**

> “We’re using Particle Universal Accounts in 7702 mode. This cross-chain payment is a UA transfer operation — UA sources USDC from whichever chains the user has funds on and settles on Arbitrum for the merchant. We’re not calling custom contracts through UA yet due to the V2 migration; the firewall contract call happens on the destination chain after settlement.”

Be explicit: **UA does the cross-chain transfer, your contract does same-chain enforcement + proof**.

***

6. **Demo script (3 minutes)**

Target: **General Track + Magic + Arbitrum**, with UA/7702 and agent story prominently featured. Assume live dapp + pre-recorded tx hashes for backup.

**0:00–0:20 — Frame the pain**

- Slide: “AI agents with wallets are terrifying: they can overspend, pay the wrong party, and keep paying after you change your mind.”  
- “Particle, Circle, Coinbase — everyone is building rails for agents to spend USDC. What’s missing is a **hard on-chain leash** that agents physically can’t break.” [docs.cdp.coinbase](https://docs.cdp.coinbase.com/wallets/using-wallets/spend-permissions)

**0:20–0:50 — Introduce OneLink Pay**

- “OneLink Pay is that leash: a **spend mandate** an AI agent or human signs once. It sets per-charge, per-day, and total caps, a single allowed merchant, and an expiry. Everything else reverts on-chain, with a public proof receipt.”  
- “We’ve implemented this as a smart-contract firewall on Arbitrum with proofs anchored on Base, using Magic embedded wallets and Particle Universal Accounts in EIP-7702 mode under the hood.” [developers.particle](https://developers.particle.network/intro/introduction)

**0:50–1:30 — UX: arm a permission in seconds**

Live:

1. **Blank landing page:** big button “Give your AI a safe card.”  
2. Click → Magic **social login** popup; sign in (email or Google). [encodeclub](https://www.encodeclub.com/programmes/uxmaxx-hackathon/events/social-login-ux-with-magic-embedded-wallets-that-feel-web2)
3. You’re auto-routed to Arbitrum; small badge “Powered by Particle Universal Accounts + EIP-7702.” [dynamic](https://www.dynamic.xyz/docs/recipes/integrations/particle/particle-network-universal-accounts)
4. Show a simple mandate form:  
   - Pre-set: “AI Shopping Agent”  
   - Max per charge: 5 USDC, Max per day: 15 USDC, Total cap: 30 USDC, Merchant: demo shop, Expiry: tomorrow.  
   - Microcopy under each: “Per charge cap — e.g. one coffee,” “Per day — daily budget,” etc.  
5. Click **“Arm Safe Card”** → EIP-712 signature modal with clear text: “Authorize AI Agent X to spend up to 5 USDC per purchase with Shop Y until DATE.”  

UX micro-interactions:

- Animated “shield arming” icon when the mandate is signed.  
- At the end, show a summary card: “AI Card Armed: up to 5 USDC per order, 15 per day, 30 total, only for Shop Y, until DATE.”  

**1:30–2:10 — Agent pays within limits, then gets blocked**

- Explain: “Now our little AI agent tries to buy something.”  
- Show a small terminal/side panel or in-UI log representing the agent:  
  - `Agent: Detected offer 3.5 USDC → calling OneLink Pay to charge.`  
- Trigger **within-cap charge**:  
  - Live tx hash (Arbitrum) appears, with status “Success: 3.5 USDC paid to Shop Y (inside mandate).”  
  - Frontend updates: mandate remaining today: 11.5, total remaining: 26.5.  

Then the punchline:

- “Now the agent misbehaves. It tries to buy something for 50 USDC.”  
- Click “Make agent go rogue” button that calls your `charge` with over-cap amount.  
- Show simulation + revert: UI shows  
  - “Charge rejected on-chain: PerChargeExceeded. No funds moved. Agent blocked.”  
  - Display the Arbiscan / BaseScan link with red ❌ badge.  

**2:10–2:40 — Proof receipts & on-chain trail**

- Navigate to the **public receipt page** for the successful payment.  
- Show:  
  - Invoice ID, payer, merchant, chain(s), amount, mandate hash, “Status: Verified & inside mandate.”  
  - “View on BaseScan” for `InvoicePaid` proof.  
- Emphasize: “Any auditor or counterparty can independently verify that this payment respected the original signed mandate — no screenshots, no trust.”  

**2:40–3:00 — Close with ecosystem fit and path**

- “Under the hood we’re:  
  - Using **Magic** for Web2-grade onboarding.  
  - Delegating a Magic EOA to a **Particle Universal Account in 7702 mode**.  
  - Running the firewall on Arbitrum and anchoring proofs on Base.  
  - Designing this as the missing spend-permission layer for **Universal Agent Accounts** and Circle’s **Agent Stack**.” [circle](https://www.circle.com/nanopayments)
- “This is immediately useful for:  
  - AI commerce agents,  
  - capped subscriptions,  
  - and merchant payment links where users want an on-chain leash.”  
- Optional: If you have cross-chain working, end by flipping a toggle “Pay on Arbitrum from Base funds,” run a tiny cross-chain payment, and say: “Same leash, now **truly chain-abstracted**.” [developers.particle](https://developers.particle.network/universal-accounts/web-quickstart)

***

7. **Competitive scan**

### 7.1 Comparable products / patterns

1. **Coinbase Spend Permissions / Smart Wallet Permissions**  
   - Offer programmable spend controls for smart wallets: time-bound, per-transaction, per-merchant controls; aimed at dapps/wallets integrating Coinbase infra. [github](https://github.com/coinbase/spend-permissions)
   - **How you differ:**  
     - You’re infra-agnostic and specifically **built atop Particle UA + 7702** and Magic, not tied to Coinbase stack. [developers.particle](https://developers.particle.network/intro/introduction)
     - You combine **multi-cap policy (per-charge, per-day, total)** with **proof receipts anchored on-chain** as first-class features, and you’re explicitly targeting **AI agents** rather than only human wallets.  

2. **Circle Agent Stack & Agent Wallets / Nanopayments**  
   - Circle is building **Agent Stack**: Agent Wallets with human-configurable controls, Nanopayments powered by Gateway, and an agent marketplace; explicitly about agents holding and spending USDC under “clear financial controls.” [linkedin](https://www.linkedin.com/posts/circle-internet-financial_agents-need-financial-access-but-that-access-activity-7460373303216517120-jOW9)
   - **How you differ:**  
     - Circle’s focus is the **custodial-ish infra and USDC rails**; OneLink is a **contract-level firewall** that can sit **on top** of Circle, UA, or other rails. [circle](https://www.circle.com/blog/building-the-financial-rails-for-the-agentic-economy)
     - You are EVM-native, mandate-based, and merchant-scoped, complementing Agent Wallets rather than competing with them.  

3. **ZeroDev session keys and permissioned actions**  
   - ZeroDev provides smart accounts and **session keys** with restricted scopes (spend limits, allowed methods); popular for embedded wallets and bots. [docs.arbitrum](https://docs.arbitrum.io/for-devs/third-party-docs/ZeroDev/zero-dev)
   - **How you differ:**  
     - Session keys are mostly **implementation detail** for a wallet; your product is a **user-visible, cross-rail mandate** with a public proof surface.  
     - OneLink could **use ZeroDev under the hood** for agent wallets, but your differentiator is the **mandate format + firewall contract + receipts**.  

4. **ERC-7710 / 7715 style permission standards & allowance managers**  
   - There’s ongoing work around standardizing spend permissions and meta-transaction permissions for smart wallets (e.g., ERC-7710, 7715) and various “allowance manager” dashboards.  
   - **How you differ:**  
     - OneLink is **not just allowance UX**; it’s a specific, opinionated **mandate schema + firewall + proof layer** tuned for **agents + cross-chain abstraction**.  
     - Where those standards aim at general composability, you focus on a **narrow but high-value wedge**: safe agent payments and merchant links atop UA/7702.  

5. **Particle UA demos (ua-dynamic-7702, UA reference apps)**  
   - Particle and Dynamic have reference apps showing **EIP-7702 delegation + cross-chain convert** using UA, focusing on chain abstraction UX. [github](https://github.com/Particle-Network/ua-dynamic-7702)
   - **How you differ:**  
     - Those demos say “agents can act on all your chains as one”; you say “and here’s how we keep them from abusing that superpower.”  
     - No official UA demo currently ships a **mandate firewall + proof receipts** story.  

6. **Openfort, Magic, other embedded wallet flows**  
   - Magic, Openfort, and others provide Web2-style onboarding and smart accounts. [x](https://x.com/magic_labs/highlights)
   - **How you differ:**  
     - You leverage Magic as a building block but **your IP is the spending layer + UX, not the wallet itself**.  
     - That’s exactly what bonus sponsors want: strong use of their infra without being a thin wrapper. [encodeclub](https://www.encodeclub.com/programmes/uxmaxx-hackathon)

### 7.2 Where you should explicitly build on / cite

In README, pitch, and maybe a 30‑second segment in the video:

- Cite **Coinbase Spend Permissions** as proving demand for programmable credit-card-like controls, and position OneLink as “the cross-stack, UA/7702-native version tuned for agents.” [docs.base](https://docs.base.org/identity/smart-wallet/guides/spend-permissions/quick-start)
- Cite **Circle Agent Stack** and **Nanopayments** as validation that agentic payments are happening now; show how your firewall maps 1:1 to the “clear financial controls” they describe. [circle](https://www.circle.com/blog/introducing-circle-agent-stack-financial-infrastructure-for-the-agentic-economy)
- Cite **Particle’s Universal Agent Accounts** blog section directly: they talk about AI agents processing billions in on-chain volume and needing chain abstraction; you add the safety piece. [blog.particle](https://blog.particle.network/chain-abstract-everything-announcing-2-upcoming-products/)

***

8. **Risks**

Risk | Description | Mitigation
---|---|---
**Particle UA cross-chain remains flaky** | UA V2 migration + backend issues keep blocking cross-chain operations or custom calls through UA; you can’t honestly demo cross-chain via UA.  [blog.particle](https://blog.particle.network/chain-abstract-everything-announcing-2-upcoming-products/) | Make General Track + Magic + Arbitrum your primary target. Implement **Circle Gateway cross-chain** as a backup narrative: “agent-safe cross-chain USDC via Gateway + 7702 EOA, UA same-chain today, UA cross-chain when infra is stable.”  [circle](https://www.circle.com/blog/building-the-financial-rails-for-the-agentic-economy)
**Judges don’t grok the mandate firewall quickly** | Too abstract; if they don’t emotionally understand “why this matters” in 30 seconds, you lose UX points. | Use **one concrete, relatable story**: “AI agent with a credit card it can’t abuse”, and visually emphasize **two moments**: arm mandate, rogue overspend blocked. Avoid deep parameter explanations; keep them as tooltips.
**Scope creep into too many infra bonuses** | Trying to deeply integrate UA cross-chain + Gateway + ZeroDev + Openfort dilutes polish and breaks the 3‑minute demo. | Choose **one primary stack** (Magic + UA + Arbitrum) and **one cross-chain rail** (UA transfer or Gateway). Only add ZeroDev/Openfort if trivial, and keep them off the main happy path.
**Gas / mainnet instability during live demo** | Live mainnet transactions can be slow or fail due to network or RPC issues, wrecking the emotional beat. | Pre-record at least one **successful within-cap tx** and one **reverted over-cap tx** and have them loaded as “last run” with links; if live fails, instantly flip to those and narrate.
**Perceived overlap with bigger players** | Judges may think “Circle/Coinbase will just do this.” | Have a clear “why now / why us” slide: you’re **protocol-agnostic, UA/7702-native, and shipping today**; this is exactly the kind of **composable layer** big players can plug into rather than rebuild. Cite their own blogs as validation that this is needed.  [circle](https://www.circle.com/blog/building-the-financial-rails-for-the-agentic-economy)

***

9. **Sources**

- UXmaxx Hackathon announcement and positioning by Encode + Particle; sponsors Magic, Arbitrum, ZeroDev, Openfort. [luma](https://luma.com/95lt9lx4)
- Particle Network docs & blog on **Universal Accounts**, **EIP-7702 mode**, and the rollout of **Universal Accounts V2** and **Universal Agent Accounts**. [docs.particle](https://docs.particle.network)
- Circle resources on **Gateway**, **Nanopayments**, and **Agent Stack / Agent Wallets**, including unified USDC balance and agent financial controls. [circle](https://www.circle.com/nanopayments)
- Magic embedded wallet documentation and Encode workshop on social-login UX. [docs.magic](https://docs.magic.link/embedded-wallets/quickstart/overview)
- Coinbase **Spend Permissions** and smart-wallet permissions repos/docs. [docs.cdp.coinbase](https://docs.cdp.coinbase.com/wallets/using-wallets/spend-permissions)
- ZeroDev smart account integration for Arbitrum (session keys, infra), and Openfort overview of embedded wallets. [openfort](https://www.openfort.io/blog/top-10-embedded-wallets)

If you want, next step I can draft:  
- the exact mandate EIP‑712 schema + README section that compares you to Coinbase/Circle/ZeroDev, or  
- a thin Node “agent” script that calls your existing API so the rogue-agent demo is trivial to plug in.