# Spec: landing-narrative-prior-art — Design

> Pairs with requirements.md and tasks.md.

## 1. Prior-art facts (grounded in docs/RES research; neutral)

| System | What it is | Our differentiator |
|--------|-----------|--------------------|
| Coinbase / Base **Spend Permissions** | trusted-spender allowance (token, period, amount) + revoke for smart wallets; powers subscriptions, agent payments | wallet-agnostic — the mandate lives on the **7702-delegated EOA / Universal Account**, not a specific smart wallet; adds a **public proof receipt** + **x402 binding** |
| **ERC-7715 / ERC-7710** | emerging standard: wallet-granted scoped permissions + delegation | OneLink is a focused, auditable **payments-specific** mandate aligned to that vocabulary, shipping today |
| **ZeroDev / Kernel session keys** | low-level account-layer delegation (rate limits, allowed calls) | session keys are infra; OneLink enforces a **payment policy** (per-charge/day/total/merchant) with **legible consent + proof** |
| **Google AP2** | "mandates" as **off-chain** Verifiable Credentials for agent payments | same word "mandate", but **enforced on-chain at the user's account** — a promise becomes a guarantee |
| **x402** (Coinbase) | HTTP 402 pay-per-call rail for agents; no spend controls | OneLink is the **spending-limit layer** that bounds x402 spend |

**Wedge (one sentence):** OneLink Pay is the on-chain, revocable spending limit for the x402 agent
economy — built on Particle Universal Accounts + EIP-7702, with a public proof receipt for every
payment.

## 2. Landing edits (`src/app/page.tsx`)

- **Nav:** insert `<Link href="/agent">Agent</Link>` between Firewall and Merchant.
- **Hero CTAs:** keep primary "Try the live firewall" (`/firewall`); make the secondary
  **"See the x402 agent demo"** (`/agent`); keep ghost "View a proof receipt". (Demo replay stays
  in nav.)
- **New section `AgentEconomySection`** (after the three pillars, before "How it works"):
  - eyebrow "Built for the agent economy"; h2 "The spending limit x402 is missing".
  - one short paragraph: x402 (Coinbase/Cloudflare/AWS) lets agents pay per call; nothing bounds
    how much; OneLink is the on-chain leash, revocable, with a proof receipt.
  - `PriorArtTable` (the §1 table, compact: System | Our edge).
  - the wedge sentence as a closing line.
- **`SponsorStrip`** (after the agent section or near footer): "Built with" + three chips:
  - Particle — "Universal Accounts + EIP-7702: one balance, every chain"
  - Magic — "Email/Google login — your wallet is your email"
  - Arbitrum — "Low-fee settlement"

Keep all existing hero/pillar copy. Pure additive JSX + a small data array. No new files.

## 3. README edits

Add a "## How OneLink compares (prior art)" section after "Honest scope" with the §1 table in
markdown + linked sources:
- Coinbase Spend Permissions — https://docs.base.org/base-account/improve-ux/spend-permissions
- ERC-7715 — https://eips.ethereum.org/EIPS/eip-7715 ; ERC-7710 — https://eips.ethereum.org/EIPS/eip-7710
- ZeroDev session keys — https://docs.zerodev.app/smart-accounts/permissions/intro
- Google AP2 — https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol/
- x402 — https://docs.x402.org/
Plus the wedge sentence + a one-line "Built with Particle UA + EIP-7702, Magic, Arbitrum".

## 4. Risks

- **R-NEW-14:** comparison could read as dismissive of sponsors/peers. Mitigation: neutral phrasing,
  "build on" not "beat"; cite sources.

## 5. References

- `docs/RES/*` (prior-art facts + citations).
- `src/app/page.tsx` (current landing).
- `docs/honest-claim-ledger.md` (no claim beyond C1-C18; add C19 for the positioning/comparison).
