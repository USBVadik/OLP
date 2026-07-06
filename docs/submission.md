# OneLink Pay — Submission & Rubric Map

> Canonical submission copy + how the project scores on each track's criteria.
> Confirmed from the event 2026-06-25. All claims trace to `docs/honest-claim-ledger.md`;
> verifiable proofs in `docs/proof-pack.md`. Live app: **https://onelink-pay.vercel.app**

## Tracks entered

- **Universal Accounts Track** (main, Particle) — 1st **$2,500** · 2nd $2,000 · 3rd $1,500.
- **Arbitrum "Road to Open House London"** — **$2,000** (independent).
- **Magic Labs bonus** — **$500** (independent).

Realistic max: **$5,000**.

**Key dates** — mid-hackathon checkpoint **Jul 5** (23:59 GMT+1) **confirmed on the platform 2026-07-05**;
final submission **Jul 19**, finale + prize-giving **Jul 30** (per the hosts — schedule shows Week 5
Judging / Week 6 Finale; confirm exact final time on the platform). UX workshop track: ZeroDev
chain-abstraction Jul 7 · x402 Jul 8 · Magic social-login Jul 22.

---

## Project description (paste into the platform)

**One-liner (≤140 chars):**
> Give your AI a card, not your wallet. Sign one on-chain mandate; your agent can pay within strict caps but physically can't overspend.

**Short (milestone / outline):**
> OneLink Pay is an on-chain spending limit for the agent economy. You sign one scoped mandate — per-charge, daily, and total caps, expiry, a single merchant, instant revoke — and your AI agent (or a merchant) can pay USDC but **physically cannot overspend**: over-limit charges revert on-chain at zero gas, and every payment ships a verifiable proof receipt. Built on **Particle Universal Accounts in EIP-7702 mode** + **Magic** walletless login: one balance across chains with **cross-chain settlement (no manual bridge)** and **zero-gas onboarding** (the one-time delegation is relayer-sponsored). Non-custodial — the limit lives on **your own EOA** (export your key, revert anytime), settling on **Arbitrum**, bounding **x402** agent payments.

**Long (final submission):**
> AI agents can now pay for anything over HTTP (x402) — but nothing stops a buggy or hijacked agent from draining the wallet. OneLink Pay is the missing leash: a **permission firewall for Universal Accounts**.
>
> You sign one EIP-712 mandate — per-charge / daily / total caps + expiry + a single merchant + instant revoke — and an on-chain `SpendPolicy` contract enforces it. Your AI agent (or a merchant) can charge USDC within those limits, but an over-cap, off-merchant, or post-revoke charge **reverts on-chain at zero gas**. Every payment ships a public, verifiable proof receipt.
>
> It runs on **Particle Universal Accounts in EIP-7702 mode**: one **Magic** login (email/Google, no seed phrase), one balance across chains, and **cross-chain settlement** — a merchant is paid on **Arbitrum** with USDC sourced from **Base** in one operation, no manual bridge. The agent demo runs the real x402 handshake (`402 → pay within the mandate → 200`), bounded by the on-chain caps.
>
> **Differentiator:** most agent-wallet products enforce limits in a custodial or MPC server you must trust. OneLink enforces them in an **auditable on-chain contract anyone can re-check**, on **your own EOA** (same address) — export your key or revert the delegation anytime, and onboard with **zero native gas** (the one-time delegation is relayer-sponsored, C23). *Policy you can audit, not policy you have to trust.*

---

## UA Track — requirements check (all met)

| Requirement | How we meet it |
|---|---|
| Use UA SDK in **EIP-7702 mode** | Magic EOA upgraded in place via Particle UA (`useEIP7702: true`); same address delegated on Base + Arbitrum (no new address, no smart-account deploy). |
| **≥1 cross-chain operation moving value via UA** | A merchant is paid 2 USDC on Arbitrum sourced cross-chain from Base, one operation, no bridge — proven live + RPC-verified on stable SDK 2.0.3 (C21). Receipt: `/receipt/fc5adc83…`. |
| Functional demo (deployed or runnable) | Deployed + live: https://onelink-pay.vercel.app (`/agent`, `/firewall`, `/pay`, `/receipt`, `/dashboard`, `/wallet`). |

---

## Rubric map — Universal Accounts Track (main)

**UX excellence — 40%**
- Walletless Magic login (email/Google, no seed phrase, no extension); session auto-detects on reload.
- Legible "card-limit" consent: a plain-English mandate card (per-charge / day / total / merchant / expiry / revoke) instead of a blind signature — EIP-712 hash behind a "show technical details" disclosure.
- Live budget HUD that drains from on-chain `SpendPolicy` state; one-click revoke.
- The visceral moment: an over-cap charge is **blocked on-chain — no funds moved, zero gas**, the HUD flashes "budget untouched".
- Fully chain-abstracted: the user never picks a network, holds gas on the settlement chain, or bridges. Public, shareable proof receipt (no account needed).

**Prominent / innovative use of Universal Accounts + EIP-7702 — 30%**
- UA in 7702 mode is the spine: one balance across chains, the EOA upgraded in place.
- **Cross-chain value movement via the UA** (Base→Arbitrum, no manual bridge) — the headline 7702 capability, proven live (C21).
- Account-level mandate enforcement is exactly the **privilege de-escalation** EIP-7702 names as a goal — and a direct answer to 7702's #1 documented risk (drainer delegation): here the delegated permission is *bounded and revocable*.

**Adoption potential — 20%**
- Plugs into the real agentic economy: x402 (Coinbase, now on AWS/Cloudflare) + AP2 (Google/FIDO). Concrete markets: AI-agent spending, subscriptions, B2B API billing.
- Integrate as a hosted pay link **or** a single API call — no contracts for the integrator (`docs/integrate.md`). Particle-incubation candidate.

**Technical quality / polish — 10%**
- `SpendPolicy.sol` + `ReceiptEmitter.sol` deployed on Base + Arbitrum; **22 Hardhat tests** pass.
- Typed end-to-end; the EIP-712 `PaymentMandate` is **byte-identical** between contract and frontend.
- Honest-claim ledger + risk register + verifiable proof pack; WCAG-AA contrast pass; reduced-motion respected.

---

## Rubric map — Arbitrum "Road to Open House London" ($2,000)

> Criteria: UX 30 / **Creativity 30** / Adoption 20 / Execution 20. Must run **primarily on Arbitrum**.

- **Primarily on Arbitrum:** settlement, `SpendPolicy` mandate enforcement, and the agent + firewall demos all run on **Arbitrum One**; Base is only the proof-anchor. Arbitrum is the home chain — and chain abstraction hides it from the user.
- **UX 30%:** the user never thinks about wallets, gas, bridges, or chains (see UA-Track UX above).
- **Creativity 30%:** "give your AI a *card*, not your wallet" — a permission firewall + an agent on a leash. A novel, legible framing of *bounded autonomous payments*, not another checkout.
- **Adoption 20%:** the agentic-economy fit above.
- **Execution 20%:** deployed, live, tested, and independently RPC-verified on Arbitrum.
- *Stretch:* apply to the Arbitrum Founder House London (Jul 10–12).

---

## Rubric map — Magic Labs bonus ($500)

> Best / most creative embedded-wallet onboarding UX.

- **Smooth onboarding/auth:** Magic email + Google OAuth; no seed phrase, no extension; "your wallet is your email"; session persists across reload. The whole first-use feels Web2.
- **Creative use:** Magic is the identity behind a **7702 Universal Account** that an AI agent can be *safely, revocably* delegated to spend from — embedded wallets powering agent commerce, not just login.
- **UX polish / accessibility / consumer-ready:** AA-contrast pass, reduced-motion respected, Google-primary one-click path on the pay flow.
- **Technical quality:** Magic EOA → Particle UA in 7702 mode, live across Base + Arbitrum.

---

## Key links

- **Live app:** https://onelink-pay.vercel.app
- **No login needed:** [`/demo-replay`](https://onelink-pay.vercel.app/demo-replay) · verifiable cross-chain receipt [`/receipt/fc5adc83…`](https://onelink-pay.vercel.app/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5) · honesty surface [`/trust`](https://onelink-pay.vercel.app/trust)
- **Live product:** `/agent` (agent on a leash) · `/firewall` (sign + enforce + revoke) · `/pay` (cross-chain checkout) · `/dashboard` · `/wallet`
- **Verify on-chain (60s):** `docs/proof-pack.md`
- **Talk track + pitch card:** `docs/demo-runbook.md`

## Honesty lines (keep in any public copy)

- x402 is the **pattern** (`onelink-mandate` scheme), not the Coinbase EIP-3009 facilitator — enforcement is real, wire-compat is not claimed.
- The agent is an **unattended deterministic** loop — **not** LLM-driven; no AI reasoning is claimed.
- **No general gas paymaster** is claimed — only the one-time 7702 delegation is sponsored (relayer-paid, C23), so a first-time payer needs **zero native gas**; the settlement fee is paid in USDC.
- Prod runs the pinned **stable** Particle SDK (`2.0.3`) — real EIP-7702 + cross-chain; same-chain and cross-chain (Arbitrum→Base) settlement live-verified on it, RPC-checked (2026-07-04).
