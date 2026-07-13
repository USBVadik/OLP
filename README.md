# OneLink Pay

**Give your AI a card, not your wallet.** OneLink Pay is a permission firewall for Universal Accounts: sign one scoped mandate, and an app, script, or AI agent can spend USDC only inside the per-charge, daily, and total caps you set — to a single merchant, until it expires, revocable anytime. Invalid charges are caught against the live on-chain policy during preflight simulation, before broadcast, so no funds move and no gas is spent. Completed checkout payments produce a public, verifiable proof receipt; agent charges expose their on-chain evidence.

Particle makes execution chain-abstracted; OneLink makes consent visible, limits enforceable, and every settlement provable.

Built for the [UXmaxx Hackathon](https://www.encodeclub.com/programmes/uxmaxx-hackathon) (Encode Club + 7702 Collective).

## Evaluate in 2 minutes (for judges)

**Live app:** https://onelink-pay.vercel.app

**No login or wallet needed — verify the core claims right now:**

1. **Trigger the on-chain block yourself — no wallet, no gas** → [`/try`](https://onelink-pay.vercel.app/try): one tap simulates the charge against the live Arbitrum `SpendPolicy`; an over-cap request returns `PerChargeExceeded` before broadcast, with no funds moved. The firewall, driven by you.
2. **Verify the cross-chain payment (~60s)** → open the live receipt [`/receipt/fc5adc83…`](https://onelink-pay.vercel.app/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5); every tx is on arbiscan/basescan (settled on Arbitrum, USDC sourced from Base, InvoicePaid on Base). Full evidence: [`docs/proof-pack.md`](docs/proof-pack.md).
3. **Replay the winning use case** → [`/demo-replay`](https://onelink-pay.vercel.app/demo-replay): inspect how Particle funded the card from Base to Arbitrum, then see `0.13 USDC` of useful inputs, an unexpected `0.20 USDC` request blocked, and the on-chain revoke — with real explorer evidence and no wallet.
4. **What's real vs pattern vs future** is stated plainly in-app at [`/trust`](https://onelink-pay.vercel.app/trust).

**Explore the live product** (the live buttons run on our funded demo account — we can drive it on stage):

- **Research Agent Expense Card** → `/agent`: arm a `0.10 USDC/tool` budget → **Run task with my budget** → the deterministic workflow buys two paid inputs, produces an ETH market-risk brief, blocks an unexpected `0.20 USDC` export before settlement, then lets the user revoke the budget on-chain.
- **Cross-chain checkout** → `/pay`: Magic login → a merchant is paid on Arbitrum with USDC sourced from Base (no manual bridge) → public proof receipt.

**Prize fit:** Particle Universal Accounts + EIP-7702 (cross-chain, chain-abstracted UX) · Magic (walletless Google/email login) · Arbitrum (USDC settlement + on-chain mandate enforcement).

Full talk track, judging-criteria map, and dry-run checklist: [`docs/demo-runbook.md`](docs/demo-runbook.md).

## What's live

- **Permission Firewall** — `SpendPolicy.sol` enforces an EIP-712 `PaymentMandate` (per-charge / daily / total caps + expiry + single-merchant + revoke). Deployed on Base (`0x73C8…3957`) and Arbitrum One (`0x9782…164E`). Over-cap charges revert with `PerChargeExceeded` — caught in simulation before broadcast, so no funds move and zero gas is spent. 22 Hardhat tests pass. **Source verified on-chain — read the enforcement contract on [Basescan](https://basescan.org/address/0x73C862a8312c12C764487a9a484f1d1ad44E3957#code) and [Arbiscan](https://arbiscan.io/address/0x9782e3724859469fbBAC5085EA8bf8E70724164E#code).**
- **Cross-chain settlement via Particle Universal Account (EIP-7702)** — a Magic-signed UA pays a merchant on Arbitrum with USDC sourced cross-chain from Base in one operation — no manual bridge. Proven live (Arbitrum settle `0x85d8…4911`, Base source `0x8b85…4a2e`, UniversalX `0x0654e81cfea86a`) and wired into `/pay` (`NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer`, live in prod). Same-chain checkout runs on the same path.
- **Research Agent Expense Card (x402-pattern)** — `/agent` runs the real HTTP payment handshake (`GET → 402 → pay → retry-with-proof → 200`) through the on-chain mandate. In the verified run it bought market insight for `0.05 USDC` and sentiment for `0.08 USDC`, produced a readable brief, and refused an unexpected `0.20 USDC` premium export because it exceeded the signed `0.10 USDC/tool` cap. The workflow is deterministic, the payment and block are real, and the settlement scheme is `onelink-mandate` (not the Coinbase facilitator).
- **UA-funded Expense Card (feature-gated, live-verified)** — `NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT=true` connects `/agent` consent to Particle UA funding. On 2026-07-13, one completed Particle operation used a successful Base source leg to make the `2 USDC` daily budget available on Arbitrum and approve the exact amount to SpendPolicy. OneLink waited for `FINISHED`, verified every reported operation receipt plus Arbitrum balance and allowance server-side, then stored immutable evidence before arming. [Inspect the Particle activity](https://universalx.app/activity/details?id=0x06567b3a8eed3a). The repository default remains `false` as a rollback; the stable production demo has the verified path enabled.
- **Legible consent** — a plain-English mandate card before signing (EIP-712 hash behind a disclosure) and a live budget HUD that drains from on-chain `SpendPolicy` state.
- **Proof receipts** — `ReceiptEmitter.sol` emits an `InvoicePaid` event after server-side verification of the on-chain USDC `Transfer`. Public, shareable receipt at `/receipt/[id]` (copy-link + QR) with a "Cross-chain: Base → Arbitrum" badge and a UniversalX activity link. Deployed on Base (`0x89CF…5bC3`) and Arbitrum One (`0xe4C6…D2A1`).
- **Walletless onboarding** — Magic embedded wallet, email + Google OAuth (live, with auto-detect on reload).
- **EIP-7702 delegation** — Magic EOA delegated in-place via Particle UA (`useEIP7702: true`), proven on Base (tx `0x4ca6…cef0`).

## Honest scope

- ✅ The on-chain firewall is live and tested (22 Hardhat tests pass).
- ✅ Same-chain USDC checkout is proven end-to-end on Arbitrum, with proof anchored on Base.
- ✅ Cross-chain value movement via the Universal Account is **proven live** on `@particle-network/universal-account-sdk@2.0.3` (stable): a merchant is paid on Arbitrum with USDC sourced cross-chain from Base in one operation. The active `/pay` rail is `createUniversalTransaction` + `usePrimaryTokens:[USDC]` + per-chain pre-delegation to the V2 7702 delegate; `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer` is live in prod.
- ✅ The integrated Research Agent card funding is **proven live** (C27): its 2 USDC Arbitrum budget was assembled through a completed Particle activity with a Base source leg, exact Arbitrum SpendPolicy approval, and fail-closed server verification before arming. The later `0.05 + 0.08 USDC` resource purchases are separately proven same-chain Arbitrum settlements.
- ✅ Zero-native-gas delegation is proven live on Arbitrum: the one-time EIP-7702 delegation is relayer-sponsored (C23). This is scoped to that delegation step only (no general settlement paymaster; the Particle settlement fee is paid in USDC). Particle AuthKit is not installed or used; Magic is the live wallet and signer.

**Honesty caveats:**

- Both cross-chain value legs are independently inspectable on-chain and linked by the completed Particle activity; the flow was re-run through prod `/pay` on stable `2.0.3`. The zero-native-gas delegation proof is scoped to the live Arbitrum C23 run.
- Prod runs the pinned **stable** Particle SDK (`2.0.3`) — real EIP-7702 + cross-chain, with same-chain and cross-chain settlement live-verified on it (RPC-checked, 2026-07-04).
- `/agent` uses the x402 **pattern** with a custom `onelink-mandate` settlement scheme — not the Coinbase EIP-3009 facilitator. The on-chain enforcement is real; the "agent" runs a real **unattended deterministic** loop over the same firewall (one click, then no human per-step) — not an LLM that reasons, so no AI decision-making is claimed.
- Particle AuthKit is not installed and is not part of the live path. Magic is the embedded wallet and signer used by the demo.

## How OneLink compares (prior art)

Scoped spend permissions are not new — OneLink builds on the wave rather than reinventing it. The wedge is the packaging: an on-chain, revocable mandate bound to the **x402** agent-payment rail, entered through a **Particle Universal Account + EIP-7702**, with a public proof receipt.

| Prior art | What it is | Where OneLink differs |
|-----------|-----------|------------------------|
| [Coinbase / Base Spend Permissions](https://docs.base.org/base-account/improve-ux/spend-permissions) | Allowance (token, period, amount) + revoke for smart wallets | Wallet-agnostic — the mandate is signed by the user's 7702 EOA and enforced by our auditable SpendPolicy; adds a public proof receipt + x402 binding |
| [ERC-7715](https://eips.ethereum.org/EIPS/eip-7715) / [ERC-7710](https://eips.ethereum.org/EIPS/eip-7710) | Emerging standard: wallet-granted scoped permissions + delegation | A focused, auditable payments-specific mandate aligned to that vocabulary, shipping today |
| [ZeroDev session keys](https://docs.zerodev.app/smart-accounts/permissions/intro) | Low-level account-layer delegation (rate limits, allowed calls) | We enforce a payment policy (per-charge / daily / total / merchant) with legible consent + on-chain proof |
| [Google AP2](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol/) | Agent "mandates" as off-chain Verifiable Credentials | Same word "mandate", but enforced on-chain at the user's account — a promise becomes a guarantee |
| [x402 (Coinbase)](https://docs.x402.org/) | HTTP 402 pay-per-call rail for agents; no spend controls | OneLink is the spending-limit layer that bounds x402 spend |

**The wedge:** OneLink Pay is the on-chain, revocable spending limit for the x402 agent economy — built on Particle Universal Accounts + EIP-7702, with a public proof receipt for every payment.

Built with **Particle** (Universal Accounts + EIP-7702), **Magic** (email/Google embedded wallet), and **Arbitrum** (settlement).

## Security Notes

`POST /api/payment-links` registers invoices on-chain from the server-side ReceiptEmitter owner wallet. To avoid public gas-drain, it requires:

```text
x-admin-create-token: <ADMIN_CREATE_TOKEN>
```

`POST /api/payments/[id]/mark-paid` does not trust a frontend tx hash by itself. It fetches the settlement-chain receipt (Base or Arbitrum, per the invoice), parses the USDC `Transfer`, verifies merchant and amount, then records `InvoicePaid` through the ReceiptEmitter owner key — using the **actual on-chain sender** as the payer, never a client-supplied address — before marking Supabase as paid.

`POST /api/mandates/charge` is public but gas-safe: funds are bounded by the EIP-712 mandate signature plus the on-chain caps, and the relayer is protected by an optional dedicated `RELAYER_PRIVATE_KEY` and a rolling-window budget on gas-spending sends. Over-cap charges are caught in simulation and cost zero gas.

## Required Env

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PARTICLE_PROJECT_ID=
NEXT_PUBLIC_PARTICLE_CLIENT_KEY=
NEXT_PUBLIC_PARTICLE_APP_ID=
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DESTINATION_CHAIN_ID=8453
NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer
NEXT_PUBLIC_RECEIPT_EMITTER_ADDRESS=
# Permission Firewall (SpendPolicy) — REQUIRED for /firewall + /agent
NEXT_PUBLIC_SPEND_POLICY_ADDRESS=
NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM=
BASE_MAINNET_RPC_URL=
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_ARBITRUM_CHAIN_ID=42161
NEXT_PUBLIC_ARBITRUM_USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
ARBITRUM_MAINNET_RPC_URL=
NEXT_PUBLIC_ARBITRUM_RECEIPT_EMITTER_ADDRESS=
RECEIPT_EMITTER_OWNER_PRIVATE_KEY=
RELAYER_PRIVATE_KEY=
ADMIN_CREATE_TOKEN=
# "true" = relayer pays the one-time 7702 delegation (zero-gas onboarding, C23)
NEXT_PUBLIC_SPONSORED_DELEGATION=false
# Default-off until the integrated Particle funding send is live-verified
NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT=false
NEXT_PUBLIC_ENABLE_DEBUG_PROBES=false
```

The values above are safe local defaults (Base + `universal_7702_transfer`); the live prod demo is **Arbitrum-first** — set `NEXT_PUBLIC_DESTINATION_CHAIN_ID=42161` to mirror it. `NEXT_PUBLIC_SPEND_POLICY_ADDRESS*` must be set for the firewall/agent demos. Never commit `.env.local`, private keys, seed phrases, or admin tokens. `RELAYER_PRIVATE_KEY` is optional (falls back to the ReceiptEmitter owner key). Keep `NEXT_PUBLIC_ENABLE_DEBUG_PROBES=false` in any deployed build — it gates the `/debug/*` lab routes and is inlined at build time.

## Local Commands

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test:unit          # 284 unit checks (node:test)
corepack pnpm build
cd contracts && corepack pnpm test   # 22 Hardhat contract tests
```

Deploy ReceiptEmitter v1.1 to Base mainnet:

```bash
cd contracts
BASE_MAINNET_RPC_URL=... RECEIPT_EMITTER_OWNER_PRIVATE_KEY=... corepack pnpm hardhat run scripts/deploy.ts --network base
```

## SDK Versions

Pinned to what's installed (verified against the lockfile). The Universal Account SDK is on the pinned **stable** release (`2.0.3`) — real EIP-7702 + cross-chain; the other crypto SDKs are on their latest releases.

- `@particle-network/universal-account-sdk`: `2.0.3` (pinned exact; stable — real EIP-7702 + cross-chain)
- `@particle-network/chains`: `1.8.3` (latest)
- `magic-sdk`: `33.7.1` (pinned; latest 33.9.0, upgrade deferred until after submission)
- `@magic-ext/evm`: `1.5.1` (latest)
- `@magic-ext/oauth2`: `15.8.0` (latest) — Google OAuth
- `viem`: `2.53.1`
- `ethers`: `6.17.0`
- `next`: `14.2.35`
- `@openzeppelin/contracts`: `5.6.1` (latest)
- `hardhat`: `2.28.6`

Intentionally held back (major upgrades require code changes; out of scope mid-hackathon): `next` 14 → 16, `zod` 3 → 4, `hardhat` 2 → 3.

SDK note: prod runs the pinned **stable** Particle SDK (`2.0.3`) for real EIP-7702 + cross-chain. The earlier `-32801`/`-32613` maintenance errors on custom universal calls are resolved (cross-chain payment proven live on stable); the version is pinned exact, so prod cannot float to a new release unreviewed.
