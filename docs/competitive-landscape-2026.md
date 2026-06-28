# OneLink Pay — Competitive Landscape (mid-2026)

> Last updated: 2026-06-20 · Owner: team · Status: living doc
>
> **Why this file exists.** Fresh competitive scan (June 2026) of who is already in production
> around agent / universal-account payments, what to borrow, and the whitespace OneLink can own.
> Builds on the prior-art table in `deep-research-onelink-pay-uxmaxx-v2.md` (§H) with current data.
>
> **Honesty discipline.** Every external number below is from third-party sources and is
> **UNVERIFIED** — it is here for STRATEGY only. Before any of it becomes a public claim, it must
> be checked and routed through `docs/honest-claim-ledger.md` (authoritative for claims).
> `docs/winning-strategy.md` remains authoritative for positioning; this file does not change it.

---

## 0. TL;DR — the short answer

Yes, there are many production players. **But none does exactly what we do.** Almost everyone is
building *rails* (how an agent moves money). Fresh consumer research says the bottleneck is **not
rails — it is trust, control, and provability for the human.** That gap is our whitespace.

Our position holds and is stronger than a generic "trust + proof payment product":
**Permission Firewall for Universal Accounts — "a card for your AI, not your wallet."**
Reinforce with one idea: **a rail-agnostic trust layer on top of x402 / AP2 / cards, with a
publicly verifiable proof receipt and non-custodial on-chain enforcement.**

---

## 1. Who is already in production (by category)

### Settlement rails
- **x402** (Coinbase → donated to the Linux Foundation, Apr 2 2026). Headline numbers: ~165M txns,
  ~69k agents, ~$50M cumulative volume ([cryptonews](https://cryptonews.com/news/coinbase-x402-ai-agent-app-store-crypto-payments/)).
  Honest caveat for us: real volume is small / partly "gamed" — ~$28k/day per CoinDesk
  ([coindesk](https://www.coindesk.com/markets/2026/03/11/coinbase-backed-ai-payments-protocol-wants-to-fix-micropayment-but-demand-is-just-not-there-yet)),
  adjusted volume down ~77% from the Nov 2025 peak ([letsdatascience](https://letsdatascience.com/news/x402-reveals-approval-gap-in-agentic-micropayments-761bf8e7)).
- **Circle USDC** — agents made 140M+ payments, ~$43M, 98.6% in USDC, 400k+ agents in the 9 months
  to Mar 2026 ([sherlock](https://sherlock.xyz/post/how-to-build-an-ai-agent-that-pays-with-usdc)).
  Circle is pushing *managed* (custodial) agent payments.

### Authorization / mandates (mostly off-chain)
- **Google AP2** — donated to the FIDO Alliance (May 2026), 60+ partners (Mastercard, PayPal, Amex,
  Coinbase). Mandates are cryptographically signed Verifiable Credentials
  ([eco](https://eco.com/support/en/articles/15192002-ap2-protocol-explained-google-s-agentic-commerce-standard-2026),
  [agentpaymentsprotocol.eu](https://agentpaymentsprotocol.eu/)).
- Surrounding stack: **OpenAI ACP** (checkout), **Google UCP**, **Visa TAP**, **Anthropic MCP**,
  **A2A**. The 2026 consensus stack is AP2 (authorization) + ACP (checkout) + x402/MPP (settlement)
  ([alignify](https://alignify.co/blog/agentic-payments)).
- **Mastercard Verifiable Intent** (with Google) — a separate "trust paradigm"
  ([mastercard](https://www.mastercard.com/global/en/news-and-trends/stories/2026/verifiable-intent.html)).

### Agent wallets + spend permissions
- **Coinbase Agentic Wallets + Spend Permissions** — email-OTP, holds USDC, no private-key access
  ([coinbase](https://docs.cdp.coinbase.com/agentic-wallet/)).
- **ERC-7715 session keys** — now live in Coinbase, ZeroDev, Biconomy, Safe, and MetaMask Smart
  Accounts Kit ([eco](https://eco.com/support/en/articles/15254038-erc-7715-session-keys-2026-granular-permissions-explained)).
  **Key implication: "on-chain spend limits" are commoditizing** — no longer a unique primitive.
- Agent-wallet comparisons (Crossmint / Privy / Turnkey / Coinbase) — often TEE/MPC, lean custodial
  ([crossmint](https://crossmint.com/learn/agent-wallets-compared)).

### Card networks / big tech
- **Visa Intelligent Commerce + OpenAI** (Jun 10 2026): tokenized Visa credentials inside
  ChatGPT/Codex, **spend limits enforced before authorization**
  ([digitalapplied](https://www.digitalapplied.com/blog/visa-openai-tokenized-agentic-commerce-payments-merchant-guide),
  [axios](https://www.axios.com/2026/06/10/visa-chatgpt-agents-commerce)).
- **Mastercard Agent Pay** → into Microsoft Copilot Checkout.
- **AWS Bedrock AgentCore Payments** (May 7 2026, with Coinbase + Stripe) — session-level spend
  limit ([forbes](https://www.forbes.com/sites/janakirammsv/2026/05/17/agent-payments-arrive-before-audit-and-insurance-catch-up/)).

### Regulated / custodial
- **Catena Labs** (Sean Neville, Circle co-founder): $30M Series A (a16z crypto, Acrew), ~$48M total,
  **filing for a national trust bank charter** to *custody* agent funds
  ([fortune](https://fortune.com/2026/05/20/catena-labs-series-a-sean-neville-ai-native-bank/),
  [theblock](https://www.theblock.co/post/402029/catena-labs-lands-30-million-series-a-files-for-national-trust-bank-charter-to-underpin-agentic-finance)).
  ~$50M VC flowed into "agent payment infra" in Mar 2026 (Nekuda $12M, Skyfire $10M)
  ([hashnode](https://ai-agent-economy.hashnode.dev/the-50m-agent-payment-infrastructure-race-why-open-source-non-custodial-wins)).

### Chain abstraction (our base layer)
- **Particle Universal Accounts** (7702 mode: "keep your wallet, no migration")
  ([particle](https://developers.particle.network/intro/which-product)); rivals **OneBalance** and
  **NEAR intents** ([yellow](https://yellow.com/learn/near-protocol-chain-abstraction-one-network)).

### Audit / receipts
- **RisingWave** — agentic payment audit logs via streaming SQL (off-chain)
  ([risingwave](https://risingwave.com/blog/agentic-payment-audit-logs-streaming-sql/)).
- **OriginStamp** — blockchain timestamps for AP2 transactions / chargeback evidence
  ([originstamp](https://originstamp.com/en/blog/reader/audit-trails-ap2-agent-transactions-verifiable-credentials)).
- **SAR Protocol** — offline-verifiable signed settlement receipt ([sarprotocol](https://sarprotocol.org/)).
- Microsoft AI-agents guide — hash-chained receipts prove attribution/integrity/ordering, **not**
  correctness of the action.

> Content from external sources was rephrased for compliance with licensing restrictions.

---

## 2. Ideas worth borrowing (in our own style)

1. **AP2 mandate vocabulary** (Intent / Cart / Payment mandate). Align SpendPolicy wording to it so
   we speak the ecosystem's language. Foil: "same word *mandate* — we enforce it **on-chain**, not
   as an off-chain VC."
2. **"Enforced before authorization"** (Visa/OpenAI). Ours is stronger: an over-cap charge reverts
   on-chain *before* funds move. Name it: **pre-authorization enforcement**.
3. **eco.com framing**: "policy-constrained, not signature-constrained" — a clean one-liner for the
   firewall narrative.
4. **Consumer-research insight**: people want AI for research/comparison but **human approval before
   the buy**. Our Trust Preview *is* that approval gate — say so explicitly.
5. **Chargeback evidence** (OriginStamp): position the Proof Receipt also as **dispute evidence for
   the merchant**, not only a buyer's receipt.
6. **Session/daily budgets over per-charge** (RisingWave): we already have daily/total caps — frame
   as "a budget for the agent's session."

---

## 3. Whitespace — how we win even against shipping players

1. **All of it, and consumer-facing.** Rivals are either infra/protocol (not for end users), or
   custodial (Circle/Catena), or off-chain mandate (AP2). **No one** gives a normal person the full
   chain: *Trust Preview → on-chain revocable Permission Firewall → public shareable Proof Receipt
   tied to real settlement.* That integration is the moat.
2. **Trust as the product, not a feature.** Forrester (Jun 2026): 3/4 are uncomfortable letting AI
   pay **even with limits set** ([forrester](https://www.forrester.com/blogs/consumers-arent-ready-to-delegate-payments-to-ai-agents/)).
   Commerce+PayPal: 2/3 will try agentic shopping but demand human approval before the buy
   ([marketscreener](https://www.marketscreener.com/news/two-thirds-of-consumers-are-ready-to-try-agentic-shopping-but-many-demand-human-approval-before-ai-ce7f5fdadc8df220)).
   Ecommpay: only ~13.9% would trust an agent to complete a purchase
   ([thepaypers](https://thepaypers.com/payments/thought-leader-insights/ecommpay-report-key-takeaways-trust-and-control-in-agentic-commerce)).
   Everyone builds rails; we build the **trust layer on top of any rail**.
3. **Rail-agnostic guardrail.** We can sit *in front of* x402 / AP2 / cards as the firewall instead
   of competing as another rail — turning the giants into our substrate.
4. **Wallet-agnostic via UA/7702.** The limit lives on the user's own EOA (same address), not a
   branded wallet (unlike Coinbase Agentic Wallet). Non-custodial — the direct contrast to
   Circle/Catena.
5. **Public verifiability vs off-chain audit.** Most "verifiable receipts" are signed VCs /
   timestamps / SQL logs. Ours is tied to the **actual on-chain settlement tx + an on-chain
   InvoicePaid attestation** anyone can re-check without an account.
6. **Honesty as an asset.** Against inflated x402 numbers and hype, our honest-claim discipline
   earns judge and partner trust.

---

## 4. Risks (so we don't fool ourselves)

- **The primitive is commoditizing.** ERC-7715 is already in Coinbase/ZeroDev/Safe/MetaMask. We
  cannot sell "we have on-chain limits" — we sell *integration + UX + verifiability + chain
  abstraction + honesty*.
- **Giants are entering with money and distribution** (Visa, Mastercard, AWS, Circle, Catena). Play
  where they are weak: non-custodial, public verifiability, consumer-consent UX, multi-rail.
- **Demand is early and fragmented** (x402 down ~77%; ~13.9% trust an agent to buy). The winner is
  whoever **removes the fear** — again, our theme.

---

## 5. Conclusion

Keep the canonical positioning — it is sharper than a generic payment framing. Reinforce with a
single sentence: **OneLink Pay is the rail-agnostic trust layer on top of x402 / AP2 / cards — with
non-custodial on-chain enforcement and a publicly verifiable proof receipt.** That is what makes us
stronger than even the players already in production.

---

> **Surfaced in-app.** The stack map, the trust-gap data, and the "vs the giants" comparison now
> render on `/trust` (spec `trust-layer-positioning`; reviewable copy in
> `src/lib/positioning/landscape.ts`, honesty-guarded by `landscape.test.ts` — an unsourced stat
> fails CI). Every market number on that page shows its source + link + "external research · 2026-06".
