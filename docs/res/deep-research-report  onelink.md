# OneLink Pay Deep Research Report

## Verdict

**Can it win? Yes — but not in its current form as pitched.** Right now, OneLink Pay is **judge-respectable but judge-forgettable**: technically real, conceptually relevant, but still framed too much like infrastructure plumbing. The strongest version is **not** “consent + proof + permission-safety layer.” It is **“give an AI agent a card it literally cannot abuse.”** That is vivid, current, understandable in 5 seconds, and perfectly aligned with why EIP-7702 exists in the first place: batching, sponsorship, and **privilege de-escalation** for limited delegated actions. citeturn7search0turn25search1turn10search3

My blunt recommendation: **your best single category right now is the General Track, not the Universal Accounts Track.** The reason is simple. Public UXmaxx materials consistently emphasize UX-first consumer-ready apps built with Universal Accounts + EIP-7702, but the publicly indexed technical requirement mirror still includes **“at least one cross-chain operation”** for the Particle-centered challenge. Your project already proves the hard safety story live on mainnet, but your one open risk is exactly the one requirement most likely to trigger disqualification or skepticism: true cross-chain value movement via the UA. Until that is proven end-to-end, the General Track gives you the highest expected win probability. citeturn20search0turn22search4turn15view3turn16view0

The public record is also **inconsistent**. The current official Encode page shows UXmaxx starting **June 22, 2026**, running **6 weeks**, with sponsors **Particle, Arbitrum, Magic, ZeroDev, and Openfort**; meanwhile third-party mirrors still index an older May–June schedule and a rubric of **UX 45%, technical implementation 25%, creativity 20%, completeness 10%**. I would treat the official Encode page as current for timing, and the mirrored rubric/requirements as best-known but provisional because the official page is partly JS-rendered in search results. citeturn28search0turn22search1turn22search4turn27view0

That discrepancy matters less than it seems. Whether the exact weighting is your internal **40/30/20/10** or the public mirror’s **45/25/20/10**, the optimization is the same: **UX dominates, completeness matters, and judges reward a concrete end-user story more than infra cleverness.** citeturn22search4

My assumptions, because your three blanks were not filled: **solo builder plus AI coding help; several days of build time; and submission likely requires the standard hackathon bundle of repo + demo video + live or runnable app**, though I could not verify a public submission-format page from accessible sources. The only public schedule evidence I found for workshops includes the Particle kickoff, Magic/social-login session, Arbitrum UX session, ZeroDev session, and Openfort/x402 session. citeturn22search1turn20search12turn20search1

**Prize-stacking plan with the best risk-adjusted odds:** target **General Track + Arbitrum bonus + Magic bonus**. Arbitrum is already real in your stack; Magic is already integrated and becomes materially stronger if you wire Google OAuth; both improve the story without forcing a last-minute dependency on unstable UA backend paths. ZeroDev and Openfort are attractive, but for a solo team they look like scope creep unless a subtrack sponsor explicitly wants a thin integration rather than meaningful product dependence. Public UXmaxx materials show both as active sponsors/workshops, which means judges will know the names, but that does not mean you should burn time adding them superficially. citeturn20search0turn22search1turn20search12turn20search1

## Positioning

The current positioning is **directionally right, but too abstract**. “Consent + proof + permission-safety layer” sounds like middleware. Judges remember **scenes**, not architecture nouns.

**Best one-sentence pitch**

**OneLink Pay turns any EIP-7702 Universal Account into an AI-safe card: one signature gives an agent or merchant permission to charge, but only within hard on-chain limits, with instant revocation and a public proof receipt.** citeturn7search0turn10search3turn15view3

**Alternative pitch**

**Give your AI agent a card, not your wallet: OneLink Pay lets it pay autonomously from a chain-abstracted account, but it literally cannot overspend, pay the wrong merchant, or keep charging after revocation.** citeturn7search0turn10search3turn16view9

**Alternative pitch**

**The first stablecoin checkout where autopay is not blind trust: arm one bounded payment mandate, let the app or agent charge inside the leash, and prove every successful payment on-chain.** citeturn16view9turn16view6

**The protagonist that will land best with this audience is the AI agent.** Not because consumers are unimportant, but because the UXmaxx sponsor set is saturated with account-abstraction, wallet, session-key, and agentic-payments narratives. x402 is now explicitly positioned as an internet-native standard for machine payments, Openfort markets agent wallets and x402 support, ZeroDev positions permissions/session keys as good for AI agents, Coinbase documents agentic payments as a spend-permission use case, and even Visa is talking publicly about AI plus stablecoin-powered programmable commerce. You should ride that wave, but in a way that feels safer than the current agentic-payments field. citeturn9search0turn9search4turn18search0turn29search0turn16view7turn14search3

The visceral story is this: **“My research agent needs to buy data, inference, or API calls. I want it to move fast — but I refuse to hand it my wallet. So I give it a budgeted mandate. It pays once successfully, then tries to overspend, and the blockchain itself says no.”** That is emotional, legible, and hackathon-perfect.

## Prioritized upgrades

| Idea | Why it scores | Impact | Effort |
|---|---|---:|---:|
| Reframe the app as **AI-safe card / agent budget** instead of “permission layer” | Maximizes memorability in the dominant UX/creativity buckets; aligns tightly with EIP-7702’s delegated-limited-action rationale. citeturn22search4turn7search0 | H | L |
| Add **Google OAuth via Magic** and remove wallet jargon from onboarding | Magic + OAuth is explicitly supported in Particle’s Magic UA guide and makes the demo feel Web2-fast. This is the easiest route to the Magic bonus and visibly improves UX. citeturn17view0turn17view2turn17view3 | H | M |
| Build the **three-beat live demo**: allowed payment succeeds, oversized payment reverts, revoke kills future payments | This is the single most judge-friendly proof of value: delight, tension, resolution. It converts your safety model into a memorable moment instead of a spec sheet. | H | L |
| Create a **plain-English mandate card** before signing | Show merchant, per-charge cap, daily cap, lifetime cap, expiry, and kill-switch in human language; this directly answers 7702 trust fears and improves judged UX. EIP-7702 security guidance and Base’s security write-up make safe bounded delegation a live concern. citeturn25search0turn25search1 | H | M |
| Add a **remaining budget meter** and “what this agent can still do” panel | Makes the invisible state legible and product-like. This also differentiates you from raw spend-permission primitives. | H | L |
| Make **Arbitrum the primary settlement chain in demo** | Lowest-effort bonus stack: you already have Arbitrum live. It also lets you say the agentic payment rail runs on a fast cheap chain. citeturn20search0 | M | L |
| Add an **x402-flavored paid API demo** as a thin wrapper, not a full protocol build | Strong innovation signal because x402 is explicitly aimed at human and machine payments over HTTP. Keep it tiny: one API endpoint, one vendor, one capped payment authority. citeturn9search0turn9search4turn18search2 | M | M |
| Implement a **minimal Circle Gateway cross-chain value demo** | This is the cleanest honest route back into UA-track contention because Gateway is purpose-built for unified USDC balance, instant destination access, and payment routing. Particle and Circle already announced partnership on Gateway integration. citeturn16view2turn16view3turn30search1turn30search0 | H | H |
| Add **proof receipt as an audit artifact**, not just success page | Include invoice hash, payer, merchant, token, amount, chain, transfer tx, verification tx, and mandate hash. This turns “proof” into a real product wedge. | M | M |
| Integrate ZeroDev or Openfort only if you can do it meaningfully | Both already offer permissions/session-key/agent-wallet narratives; a shallow last-minute integration will look like sponsor-checkboxing. ZeroDev’s permissions and Openfort’s policies are strong infra, which raises the bar for using them credibly. citeturn29search0turn18search0 | M | H |

A few things I would **cut entirely** unless you have excess time: multi-merchant dashboards, generic agent builders, complex MCP registries, and any attempt to explain Universal Accounts internals in-demo. Judges should feel **one user story**, not attend a protocol seminar.

## The #1 move

**The single highest-leverage move is to turn OneLink Pay into a 90-second unforgettable scene: Google login → arm an AI agent with a hard budget → one real payment succeeds → one overspend fails on-chain → revoke → proof receipt.**

That beats almost anything else you can do with the remaining time.

Why this is the highest-leverage move:

First, it is built almost entirely on what you have **already proven**: the firewall works on Base and Arbitrum, over-cap attempts are blocked on-chain, revoke works, 7702 delegation is live, same-chain checkout works end-to-end, and you have a public proof receipt path. That means you are polishing truth, not inventing new dependencies. The highest win-probability work is almost always **compressing proven capability into a crisp emotional demo**, not gambling on an external backend. citeturn4search16turn10search3turn15view3

Second, it directly matches the public UXmaxx emphasis on **making the complexity disappear**. Encode’s public copy says the goal is apps where the complexity stays under the hood and the user journey feels effortless; the mirrored judging rubric heavily weights UX and completeness. Your current story is still too internal-facing. This move fixes that. citeturn20search0turn22search4

Third, it differentiates from adjacent infra. Coinbase, ZeroDev, and Openfort all now have spend permissions / permissions systems / policy-based agent wallets. If you try to beat them on “we also have permissions,” you lose. If you beat them on **“watch the exact moment an agent is safely allowed, then safely denied, with receipts”**, you have a demo they do not own. citeturn16view9turn29search0turn18search0

If you finish that scene and still have time, **then** spend the remainder on cross-chain.

## Cross-chain plan

**Most reliable honest route:** **Circle Gateway first, Particle transfer rail second, raw CCTP-only third.**

### Circle Gateway as the best backup rail

Circle Gateway is designed for exactly the user experience you need when the story is “one balance, pay anywhere.” Circle’s docs say Gateway provides a **unified USDC balance across multiple blockchains**, with non-custodial Gateway Wallet contracts, and lets apps mint destination USDC **instantly in under 500 ms after balance is established**. It is explicitly positioned for **chain abstraction**, **payment routing**, and **agentic commerce**. Gateway also supports deposit methods including **depositWithPermit** and **depositWithAuthorization**, which makes it credible for a signature-driven flow rather than a clunky two-step approval story. citeturn16view2turn16view3turn16view4turn16view5

That matters because your app is USDC-centric, your demo already lives on Base and Arbitrum, and Particle publicly announced Gateway partnership and integration plans. Particle’s AA docs even reference a demo repository for interacting with Circle Gateway, and Particle’s 2025 recap explicitly says it is integrating Circle Gateway into Universal Accounts. So this is not a random workaround; it is strategically adjacent to the sponsor stack. citeturn30search1turn31view0

**Minimal build for a credible demo**

Use Magic login and your existing UIs. Have the payer deposit a small amount of USDC into Gateway on one chain. Show the unified balance. Then pay a merchant on the other chain and verify the resulting transfer/mint plus your own receipt emission. The honesty line is: **“For cross-chain value movement we use Circle Gateway’s unified USDC rail; for spend safety we use our mandate contract and proof layer.”** That does mean the firewall is not yet inside the cross-chain execution path itself, so say that clearly. Do not imply full policy enforcement around the Gateway leg unless it truly exists.

### Particle transfer rail as the most compliant-if-it-works path

Particle’s official `createTransferTransaction()` docs are strong support for the idea that a **cross-chain payment transfer** can satisfy the “at least one cross-chain operation” requirement. Their docs say the SDK lets you **send tokens to any address across supported chains**, and that the user **does not need assets or gas on the destination chain**, because liquidity and gas are abstracted behind the scenes. Particle’s Universal Accounts docs also still point to `createTransferTransaction()` as the active withdrawal path during the V2 migration. citeturn15view3turn16view0

So yes: **if you can get a real transfer-rail payment that sources value from chain A and pays a merchant on chain B through the UA in EIP-7702 mode, it plausibly satisfies the rule even if custom contract calls remain down.** It is still a value-moving cross-chain operation initiated through the Universal Accounts SDK and signed by the 7702-upgraded owner. citeturn15view3turn10search3

**The honest phrasing to judges**

Say: **“Our cross-chain payment uses the Universal Account’s native transfer rail to source value from the user’s unified balance and settle to the merchant on the destination chain. Our mandate firewall currently enforces same-chain delegated charges, while cross-chain payment execution is handled by the UA transfer rail and then recorded by our proof layer.”**

That is honest, technically precise, and avoids pretending the policy contract currently wraps the whole cross-chain leg.

### CCTP V2 alone

CCTP is excellent infrastructure, but **CCTP alone is weaker for the Particle track story** because the requirement is not just “do something cross-chain”; it is “use Universal Accounts in EIP-7702 mode” and likely perform a cross-chain operation through that stack. Circle’s docs say CCTP does native burn-and-mint transfers, while Gateway is expressly for unified-balance apps and instant spend-anywhere UX. Gateway is a better conceptual fit than bare CCTP. If you use CCTP, use it because you need control or hooks — not because it is the easiest judging narrative. citeturn16view2turn3search5turn3search8

**Recommendation hierarchy**

If you have limited time, do this:

1. **Default plan:** optimize for General Track.
2. **Stretch goal:** add Circle Gateway minimal cross-chain demo.
3. **Opportunistic upgrade:** if Particle transfer rail stabilizes, swap to the cleaner UA-native cross-chain story.
4. **Do not** spend the final days fighting `createUniversalTransaction()` maintenance windows.

## Demo script

**Goal:** win on memory, not on contract count.

### Opening

Start with one sentence:

**“Everyone wants AI agents to pay for things. Nobody wants to give them their wallet. So we built the AI-safe card for Web3.”**

Then immediately show the user, not the architecture.

### Onboarding

Log in with Google through Magic. No wallet extension, no seed phrase, no chain selector. Show the user landing on a simple “Arm this agent” screen. That matters because Magic + Particle are explicitly positioned together for passwordless OAuth onboarding with chain-abstracted accounts. citeturn17view0turn17view2

### Arming the permission

Use a highly legible policy card:

- Merchant: `DataAPI Pro`
- Max per payment: `$2`
- Max per day: `$5`
- Lifetime cap: `$20`
- Expires: `tonight`
- Revocable anytime

The UI copy should read like a bank card control, not a Solidity struct. Under it, include a collapsed “view exact on-chain policy” section for credibility.

Then say:

**“I sign once. From now on, the agent can pay — but only inside this leash.”**

### Happy-path payment

Trigger the agent to buy a $1 API call or invoice on Arbitrum. Show:

- merchant invoice marked paid,
- payer balance reduced,
- “remaining today” and “remaining total” counters update,
- receipt page generated with tx link and mandate hash.

Do not linger on hashes. Linger on the counters, because that is the user value.

### Attack path

Now trigger a second payment attempt that asks for `$7` or points to the wrong merchant.

Show two things:

- the simulation gate catches it before the user wastes gas,
- the on-chain revert reason is visible.

Then say:

**“Even if my backend, merchant, or agent goes rogue, the blockchain itself refuses the charge.”**

That is the applause moment.

### Revocation

Click **Revoke**. Retry an otherwise-valid $1 payment. It fails.

Say:

**“Autonomy when I want it. A kill switch when I don’t.”**

### Optional cross-chain kicker

If the cross-chain flow is truly live, then add one final 20-second button:

**“Now the same user pays a merchant on Arbitrum using value sourced from another chain, without bridging.”**

If it is not live, skip it entirely. Do not let a flaky stretch goal poison a perfect main story.

### Close

End with:

**“OneLink Pay makes agentic payments feel like giving a card — not surrendering a wallet.”**

Why this script works: it mirrors what has won in adjacent ecosystems. Public examples that get remembered are not “here is our infra stack”; they are products like UniversalX making multi-chain trading feel like one app, or EEZY making Base Smart Wallet users interact across chains with one tx and winning Base’s smart-wallet prize. citeturn23view2turn24view1

## Competitive scan

The good news: your wedge is real. The bad news: **you are not alone anymore.** The field is crowded enough that “permissions” by itself is not a differentiator.

### What already exists

**Coinbase Spend Permissions** are the closest product comp. Coinbase documents a system where a trusted spender can spend from a smart account within limits based on **token, time period, and amount**, and explicitly lists **subscription payments** and **agentic payments** as use cases. Permissions can also be revoked. That means the base category already exists in production. citeturn16view9turn16view6turn16view8

**ZeroDev Permissions / Session Keys** go even deeper on generic account-level delegation. Their docs frame permissions as **who / when / what** plugins, with policies like rate limits, timestamp windows, contract/function call restrictions, and AI-agent automation. That is powerful infra, but it is horizontal developer tooling, not a consumer payment product. citeturn29search0turn29search3turn29search1

**Openfort** now markets exactly the kind of language you need to be aware of: embedded wallets, transaction policies, agent wallets, stablecoin orchestration, and x402-powered agentic payments. Again: infra, not your exact product — but enough overlap that sponsor judges will have seen the pattern. citeturn18search0turn18search2

**ERC-7715 and ERC-7710** are the standards backdrop. ERC-7715 defines wallet-requested execution permissions; ERC-7710 defines smart-contract delegation interfaces. These are not direct comps, but they prove your architectural direction is part of the broader permissions wave. Cite them in your deck if you want to look standards-aware rather than homegrown. citeturn8search1turn8search2

### Comparable hackathon projects

Recent ETHGlobal projects show the landscape clearly:

- **Agent Paymaster**: policy vaults for AI agents with per-tx and daily limits. citeturn24view3
- **SpendMate**: zero-code AI agents with spending rules and limits. citeturn24view4
- **Crosschain NS pay**: Circle Gateway-powered cross-chain payment and payout UX. citeturn24view5turn24view6
- **ad-402**: x402-based direct advertiser-to-publisher payments; ETHGlobal finalist. citeturn23view4
- **EEZY**: Base Smart Wallet + cross-chain simplicity; won **Base – Best use of Smart Wallet**. citeturn24view1

### What actually differentiates OneLink Pay

Your real differentiation is **not** “we have spend permissions.”

It is this combination:

- **EIP-7702 + Universal Accounts framing**, so the story begins from an existing EOA and chain-abstracted spending, not from a fresh smart-wallet-only world. citeturn11search10turn10search3
- **Merchant-bound, human-legible payment mandates**, not generic capability plugins.
- **A live on-chain failure moment** as first-class UX. Most demos show happy-path success; you should show **bounded failure**.
- **Public proof receipts** tied to verified payment completion.
- **A safer answer to agentic commerce**, which is becoming a hot narrative across x402, Openfort, Circle, ZeroDev, Visa, and others. citeturn9search0turn18search0turn16view3turn14search3

### Patterns that win

The pattern across Particle’s own products and adjacent winners is consistent:

- a **single consumer verb**,
- hidden chain complexity,
- one signature or one-click flow,
- and an end-to-end demo that feels complete.

Particle’s flagship examples are **UniversalX** and apps like **Overtime** — concrete trading and sportsbook products, not “infrastructure routers.” UniversalX’s whole pitch is “buy any token on any chain without bridging.” That is the level of directness you need. OneLink Pay should become **“pay safely with one bounded mandate”**, not “policy layer for composable value movement.” citeturn23view2turn23view1

## Risks and sources

The top risks are not purely technical.

**The first risk is category mismatch.** If you pitch for the Universal Accounts Track without a live cross-chain value movement through the UA, you may simply be too exposed to rule interpretation. **Mitigation:** default to General Track; only switch your primary target if a clean Circle Gateway or Particle transfer-rail cross-chain demo is genuinely live. citeturn22search4turn16view2turn15view3

**The second risk is abstraction overdose.** If judges hear “consent/proof/permission-safety layer,” they will understand you — and then forget you. **Mitigation:** use one protagonist, one merchant, one bounded mandate, one success, one failure.

**The third risk is looking derivative next to Coinbase / ZeroDev / Openfort.** Those teams already have permissions, session keys, or agent-wallet stories. **Mitigation:** explicitly acknowledge them in your deck and say your wedge is **payment-specific mandates + public proof + chain-abstracted EIP-7702 entry point**, not generic wallet permissions. citeturn16view9turn29search0turn18search0

**The fourth risk is trust anxiety around EIP-7702 itself.** The EIP’s own security considerations warn about replay protection, safe initialization, and care when changing delegations; Base’s 7702 security write-up also stresses initialization-front-running risks during EOA-to-smart-wallet upgrades. **Mitigation:** make the permission screen absurdly explicit, show the exact merchant and hard caps, surface revocation, and keep the mandate scope painfully narrow. citeturn25search1turn25search0

**The fifth risk is that your proof layer can look centralized if the server-side verifier is under-explained.** **Mitigation:** publish the matching logic, show exactly which transfer is verified against which invoice, include mandate hash and tx references in the receipt, and describe the receipt as **attested verification**, not as a magical oracle truth.

**Key sources used**

Encode Club’s current UXmaxx page and workshop schedule snippets for timing, sponsors, and current public positioning. citeturn28search0turn22search1turn20search12turn20search1

Particle’s official Universal Accounts docs and blog for EIP-7702 mode, transfer/custom transaction behavior, UA V2 migration notice, Magic integration, UniversalX, early adopters, and Circle Gateway partnership. citeturn10search3turn15view3turn15view4turn16view0turn17view0turn23view2turn23view1turn30search1turn30search0

Circle’s official Gateway and CCTP docs for unified balance, payment routing, deposit methods, and transfer-speed characteristics. citeturn16view2turn16view3turn16view4turn3search5turn3search8

Magic, Coinbase, ZeroDev, Openfort, x402, EIP-7702, ERC-7715, and ERC-7710 official documentation for the prior-art and sponsor-tech scan. citeturn17view3turn16view9turn29search0turn18search0turn9search0turn9search4turn7search0turn8search1turn8search2

ETHGlobal showcase pages for comparable projects and winning patterns in adjacent ecosystems. citeturn24view1turn24view3turn24view4turn24view5turn23view4