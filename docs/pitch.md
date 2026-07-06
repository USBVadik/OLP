# OneLink Pay — Pitch Kit

> For the UXmaxx submission + live demo. Every claim here is honest and traceable to
> `docs/honest-claim-ledger.md` and `docs/risk-register.md`. Primary track: Universal Accounts.
> Stacked: Arbitrum bounty + Magic bonus. Cross-chain value movement via UA is **proven live** (C21);
> zero-gas onboarding via sponsored 7702 delegation is live (C23).

## One-liner

**Give your AI agent a card, not your wallet.** OneLink Pay is the on-chain spending limit for the
agent economy.

## Elevator (≈20s)

AI agents are starting to pay for things over HTTP (x402) — but you can't hand a bot your wallet.
OneLink Pay lets you sign one scoped mandate, and your Universal Account can be charged only inside
it: per-charge, daily and total caps, expiry, a single merchant, instant revoke. The agent can pay,
but it physically cannot overpay — over-limit charges revert on-chain at zero gas — and every
payment ships a verifiable proof receipt. Particle handles execution; OneLink Pay handles consent,
limits, and proof.

## The problem

Three 2026 rails are converging and none of them enforce the limit at the user's account:

- **x402** (Coinbase, now wired into AWS) gives agents a way to pay over HTTP in USDC.
- **AP2** (Google, donated to FIDO) defines signed agent "mandates" — but as off-chain credentials.
- **EIP-7702** upgrades an EOA in place; its #1 documented risk is signing a delegation to malicious
  code (drainer phishing).

The missing piece: **nothing enforces the mandate on-chain, at the user's own account.**

## The solution

Sign one scoped mandate. The Universal Account can be charged only inside it; everything else
reverts; you can revoke instantly; every payment is provable. It's the on-chain guardrail that makes
agentic payments safe — an "AI-safe card", not a blank-cheque wallet.

## 90-second demo script (the wow)

| Time | On screen (do) | Say |
|------|----------------|-----|
| 0:00–0:12 | `/firewall` → **Continue with Google** | "You can't give an AI agent your wallet. So we give it a card. I sign in with Google — no seed phrase, no extension." |
| 0:12–0:30 | Pick **Agent budget** preset → sign + approve; Budget HUD lights up | "One signature arms a mandate: 0.10 per charge, 2.00/day, 10.00 total, expires in 24h, one merchant, revocable. This isn't a promise — it's enforced on-chain by my account via EIP-7702." |
| 0:30–0:48 | **Run agent (within budget)** → `Charged 0.10. Settled. view tx`; HUD drains 2.00→1.90 | "The agent pays inside the budget — real USDC, settled on Arbitrum. Here's the transaction." |
| 0:48–1:06 | **Run agent (over cap, 0.20)** → red `BLOCKED: PerChargeExceeded. No funds moved, zero gas.` | "Now it tries to overspend. It physically can't. The charge reverts on-chain — no funds move, zero gas. The seatbelt holds, on camera." |
| 1:06–1:18 | **Revoke** → run again → `BLOCKED: MandateIsRevoked` | "And I hold the kill switch. Revoke, and the agent is disarmed instantly — 7702 reversibility as a safety feature." |
| 1:18–1:30 | Open `/receipt/<id>` | "Every payment ships a verifiable receipt: the settlement is trustless, the proof is an on-chain attestation anyone can re-check. Particle makes execution invisible — we make consent visible, limits unbreakable, and every payment provable." |

Optional Part C (`/agent`): the same mandate bounding an **x402** agent purchase — buy a $0.05 API,
then a $0.20 one gets blocked. "x402 gives agents a wallet; we give them a leash."

## Why it wins (rubric 40 / 30 / 20 / 10)

- **UX excellence (40%)** — Google/email onboarding, no seed phrase or extension; a *legible* mandate
  card (plain-English caps, EIP-712 hash tucked behind "show technical details") instead of a blind
  signature; a live draining budget HUD; the visceral "overcharge blocked on-chain" moment; one-tap
  revoke; a shareable proof receipt (screen-reader-announced).
- **Universal Accounts + EIP-7702 (30%)** — a Magic EOA upgraded in place via EIP-7702 (same address
  across Base/Arbitrum/Optimism); account-level mandate enforcement (`SpendPolicy`, 22 passing tests,
  deployed on Base + Arbitrum); one unified balance across chains via Particle `getPrimaryAssets`;
  directly answers the documented 7702 drainer risk with a scoped, revocable delegation.
  *(Cross-chain value movement via UA: proven live — C21.)*
- **Adoption potential (20%)** — plugs into the real agent economy: x402 (Coinbase + AWS) and AP2
  (Google/FIDO); concrete markets in subscriptions and autonomous-agent spend; an x402-pattern
  gateway already shipped, settled by the on-chain mandate.
- **Technical quality / polish (10%)** — 22 passing contract tests; typed end-to-end; the EIP-712
  mandate is byte-identical between contract and frontend; clean production build; honest claim
  ledger + risk register discipline.

## Tracks claimed

- **Universal Accounts Track (primary):** prominently uses Particle Universal Accounts in EIP-7702
  mode with Magic, for a chain-agnostic UX (meets the track requirement as written) + legible
  consent + on-chain enforcement + proof. Cross-chain value movement via UA is **proven live** (C21)
  — a merchant paid on Arbitrum with USDC sourced from Base, no manual bridge.
- **Arbitrum "Road to Open House London" Bounty:** SpendPolicy + ReceiptEmitter live on Arbitrum
  One; the firewall demo and default settlement run on Arbitrum (proven on-chain).
- **Magic Labs Bonus:** Google OAuth + email onboarding live; session persists across reload.

## Honest status (state this plainly to judges)

- **Live & proven on-chain (operator-verified):** EIP-7702 delegation; on-chain mandate enforcement +
  over-cap revert (`PerChargeExceeded`, zero gas); same-chain USDC checkout on Arbitrum; **cross-chain
  value movement via UA — a merchant paid on Arbitrum with USDC sourced from Base, no manual bridge
  (C21)**; **zero-gas onboarding — the one-time 7702 delegation is relayer-sponsored (C23)**; proof
  receipt (payer bound to the real on-chain sender); Magic Google + email login; unified cross-chain
  balance read; x402-pattern purchase, mandate-settled.
- **Not claimed:** a general gas paymaster — only the one-time 7702 delegation is sponsored (the
  settlement fee is paid in USDC). And this is the **x402 HTTP pattern** with a custom
  `onelink-mandate` settlement scheme — **not** Coinbase-facilitator wire-compatible. We say so.

## Verifiable on-chain (drop these in the submission)

- SpendPolicy (Arbitrum): `0x9782e3724859469fbBAC5085EA8bf8E70724164E`
- `MandateCharged` (Arbitrum, 0.10 USDC): `0x33a4e69e2d4f0a2a9269bf9fb758b3043cbae4c5e146e3e16cf9c75d439b9ced`
- SpendPolicy (Base): `0x73C862a8312c12C764487a9a484f1d1ad44E3957`
- ReceiptEmitter (Base): `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`
- EIP-7702 delegation (Base): `0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`

## Stack (one line)

Next.js 14 + TypeScript · Magic (email/Google, EIP-7702) · Particle Universal Accounts SDK ·
Solidity 0.8.28 + OpenZeppelin (`SpendPolicy`, `ReceiptEmitter`) · Arbitrum + Base · Supabase.
