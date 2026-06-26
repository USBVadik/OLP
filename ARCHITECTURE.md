# OneLink Pay — Architecture & Roadmap

> Reflects the current build (2026-06-21). Claims map to `docs/honest-claim-ledger.md`
> (`C…` ids below). The earlier MVP framing — an embeddable checkout with spend caps as a
> "ZeroDev stretch" — is superseded: the **on-chain spend mandate (`SpendPolicy.sol`) is the
> core**, and we deliberately do NOT use ZeroDev/session keys (our own auditable contract instead).

## What OneLink Pay is

A USDC payment layer where the recipient can only take what the payer explicitly authorized,
and every charge is provable on-chain. One foundation, three uses:

1. **Pay** — a one-time checkout / payment link (cross-chain via Particle UA).
2. **Authorize bounded spending** — sign one revocable mandate with hard caps; a merchant *or*
   an agent can then charge repeatedly, but only inside it (the Permission Firewall).
3. **Agent on a leash** — an x402-pattern HTTP gateway whose per-call settlement is bounded by
   that mandate.

On top of all three: walletless login (Magic), chain abstraction (Particle Universal Accounts +
EIP-7702), and a public proof receipt per payment.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js)                              │
├───────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│  /pay/[id]    │  /firewall   │  /agent      │  /dashboard  │ /receipt/[id]│
│  checkout     │  sign mandate│ x402 agent   │ create links │  proof (pub) │
│  (UA / 7702)  │  + budget HUD│ on a leash   │ + status     │  + share/QR  │
└──────┬────────┴──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘
       │               │              │              │              │
       ▼               ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          API ROUTES (Next.js)                              │
│  POST /api/payment-links        — create link (admin-token gated)          │
│  POST /api/payments/[id]/mark-paid — verify on-chain Transfer → InvoicePaid │
│  POST /api/mandates/charge      — relayer simulates → charges SpendPolicy   │
│  GET  /api/x402/[resource]      — 402 Payment Required → serve on proof     │
└──────┬─────────────────────────────────────────────────┬───────────────────┘
       │                                                 │
       ▼                                                 ▼
┌──────────────┐                          ┌──────────────────────────────────┐
│   Supabase   │                          │          BLOCKCHAIN LAYER         │
│  (Postgres)  │                          │  Magic embedded wallet (EOA)      │
│  - merchants │                          │      │  EIP-7702 delegation        │
│  - links     │                          │      ▼                            │
│  - payments  │                          │  Particle Universal Account       │
│  (+ source_  │                          │  (cross-chain sourcing + gas)     │
│  chain_id,   │                          │      │                            │
│  ua_tx_id)   │                          │      ├─▶ SpendPolicy.sol (mandate) │
└──────────────┘                          │      └─▶ ReceiptEmitter.sol (proof)│
                                          │  Base + Arbitrum One (USDC)        │
                                          └──────────────────────────────────┘
```

## Core loops

### 1. Permission Firewall — sign once, charge within limits (C1–C6, C14, C15)

```
Payer signs an EIP-712 PaymentMandate (per-charge / daily / total caps + expiry + merchant)
  → approves USDC allowance to SpendPolicy (one tx)
Merchant or agent requests a charge
  → POST /api/mandates/charge → relayer SIMULATES SpendPolicy.charge(...)
     ├─ within caps  → relayer submits; USDC pulled payer → merchant; MandateCharged
     └─ outside caps → reverts (PerChargeExceeded / DailyCap / TotalCap / Expired / Revoked)
                       in simulation — NO funds move, ZERO gas
Budget HUD drains from live on-chain state; payer can revoke at any time (kills future charges)
```

### 2. Agent on a leash — x402-pattern, mandate-settled (C16, C17)

```
Agent: GET /api/x402/<resource>            → 402 Payment Required + requirements
Agent: pay within the mandate              → POST /api/mandates/charge (loop 1)
       ├─ within cap → charged + settled    → retry GET with X-PAYMENT proof → 200 + data
       └─ over cap   → BLOCKED on-chain      → resource withheld (no funds moved)
```

Settlement scheme is `onelink-mandate` (the x402 *pattern*, not the Coinbase EIP-3009 facilitator).
The agent runs a real unattended deterministic loop over the real firewall (one click, then no
human per-step) — not an LLM that reasons.

### 3. Checkout + cross-chain settlement via Particle UA (C7, C8, C21)

```
Merchant creates a payment link → Supabase row + on-chain registerInvoice()
Customer opens /pay/[id] → Magic login (email / Google) → Particle UA reads one balance
  → human-readable preview → confirm
  → createUniversalTransaction + usePrimaryTokens:[USDC] + per-chain 7702 pre-delegation
  → merchant paid on the settlement chain (e.g. Arbitrum), USDC sourced cross-chain (e.g. Base)
  → mark-paid verifies the on-chain USDC Transfer (sender, amount, merchant) → InvoicePaid proof
  → status → completed; source_chain_id + ua_transaction_id persisted
```

### 4. Proof receipt — public + verifiable (C9, C20)

```
/receipt/[id] (no account): settlement leg + InvoicePaid attestation, matched against the invoice,
  with explorer links per chain, a "Cross-chain: Base → Arbitrum" badge + animated route, a
  UniversalX activity link, and copy-link + QR to share. "How is this verified?" disclosure
  distinguishes trustless settlement from the attested proof.
```

## Settlement routes (rail-agnostic by design)

The Permission Firewall enforces the mandate **above** the settlement rail — the limit logic in
`SpendPolicy` / the charge flow does not care *how* the money ultimately moves. The active rail is
selected by `PaymentMode` in `src/lib/config/payment.ts` (today: `universal_7702_transfer` —
cross-chain settlement via Particle UA; plus `universal_invoice` and a `transfer_fallback` path).

That selector is the natural extension point. New rails — more chains, a different on-chain
settlement path, or a **TradFi / PSP connector** (cards, bank rails, fiat on/off-ramp) — would plug
in as additional routes under the *same* mandate, without touching the enforcement contract.

**Honesty boundary (important).** Our differentiator is that enforcement lives **on-chain**
("policy you can audit, not policy you have to trust"). That guarantee holds for on-chain rails. A
TradFi/PSP rail settles off-chain, so for that rail the limit would be **server-enforced** (back to
"by trust") unless it is backed by an on-chain pre-authorization / escrow. We do **not** claim
crypto-grade enforcement on a fiat leg.

**Status:** only the on-chain Universal Account route is implemented and verified today (C21).
TradFi/PSP connectors are a documented design direction — **not built**.

## File structure (representative)

```
OneLink-Pay/
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Landing (positioning + prior-art)
│   │   ├── pay/[id]/page.tsx              # Checkout (UA / EIP-7702, cross-chain)
│   │   ├── firewall/page.tsx             # Sign mandate + budget HUD + agent demo
│   │   ├── agent/page.tsx               # x402 agent-on-a-leash + unified balance
│   │   ├── dashboard/page.tsx           # Merchant links + payment status
│   │   ├── receipt/[id]/page.tsx        # Public, shareable proof receipt
│   │   ├── success/[id]/page.tsx        # Post-pay success + proof
│   │   └── api/
│   │       ├── payment-links/route.ts   # Create link (admin-token gated)
│   │       ├── payments/[id]/mark-paid/route.ts  # On-chain verify → InvoicePaid
│   │       ├── mandates/charge/route.ts # Relayer: simulate → charge SpendPolicy
│   │       └── x402/[resource]/route.ts # x402 402 → serve on proof
│   ├── components/                       # ui, mandate-card, budget-hud, agent-terminal,
│   │                                     #   proof-receipt, cross-chain-route, …
│   ├── lib/
│   │   ├── mandates/                    # PaymentMandate type, derive, EIP-712 typed data
│   │   ├── contracts/spend-policy.ts    # SpendPolicy ABI + tuple helpers
│   │   ├── contracts/receipt-emitter.ts # ReceiptEmitter ABI + helpers
│   │   ├── agent/                       # x402 scenarios + log formatter
│   │   ├── x402/catalog.ts              # Paid resources (priced around the cap)
│   │   ├── particle/assets.ts           # getPrimaryAssets aggregation (read-only)
│   │   ├── config/payment.ts            # Chains, USDC, explorer, payment mode
│   │   └── supabase/client.ts           # DB client (admin = no-store)
│   └── hooks/use-mandate-state.ts       # Live on-chain remaining() / state polling
├── contracts/
│   └── contracts/
│       ├── SpendPolicy.sol              # On-chain mandate enforcement (22 Hardhat tests)
│       └── ReceiptEmitter.sol           # On-chain InvoicePaid proof
├── docs/                                # honest-claim-ledger, risk-register, methodology
└── supabase/schema.sql
```

## Roadmap

### Shipped

- [x] Magic walletless login (email + Google OAuth, auto-detect on reload) — C13
- [x] `SpendPolicy.sol` mandate enforcement on Base + Arbitrum; 22 Hardhat tests — C1–C3, C6, C10
- [x] Live within-cap charge + over-cap block + revoke, both chains — C3–C6, C16
- [x] Legible mandate card + draining budget HUD from on-chain state — C14, C15
- [x] x402-pattern gateway, mandate-settled; live buy + over-cap block — C17
- [x] Particle UA unified balance (read-only, cross-chain aggregation) — C18
- [x] EIP-7702 delegation of the Magic EOA — C7
- [x] Checkout + `ReceiptEmitter` InvoicePaid proof; public shareable `/receipt/[id]` — C8, C9, C20
- [x] **Cross-chain settlement via Particle UA** (Base → Arbitrum, no manual bridge); live in prod — C21
- [x] Prior-art positioning (landing + README) — C19

### In progress / known risk

- [ ] Re-run one live 7702 + cross-chain payment through the prod `/pay` UI on the beta SDK (R19)
- [ ] Pre-recorded backup video of every demo beat (R4)
- [ ] Distinct `RELAYER_PRIVATE_KEY` + shared rate limiter before any non-demo public deploy (R16)

### Out of scope (deliberately)

- ZeroDev / Openfort session keys — cited prior-art. Enforcement today is our own auditable
  `SpendPolicy` contract (the differentiator). Session keys are the production primitive we'd
  adopt to *arm* unattended / recurring pulls (see `docs/risk-register.md` R6).
- Circle Gateway — not built; cross-chain is proven via Particle UA (no second rail as primary).
- Gas *sponsorship* / paymaster — not claimed. (Gas *abstraction* — the network fee is paid in
  USDC from the UA, no destination-chain gas to hold — IS live; sponsorship, where a paymaster
  covers the fee, is the deliberately-deferred part. The account is paymaster-compatible.)
- A fully autonomous LLM agent loop — the demo is agent-initiated over the real firewall.

## Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Wallet / auth | Magic embedded (email + Google) | Walletless onboarding; no seed phrase. AuthKit installed but not on the live path. |
| Chain abstraction | Particle Universal Accounts (EIP-7702) | One balance across chains; cross-chain sourcing + gas from the stablecoin on the `/pay` path. |
| Spend enforcement | **Our `SpendPolicy.sol` mandate** (NOT ZeroDev) | A focused, auditable, payments-specific policy (per-charge / daily / total / merchant / expiry / revoke) with legible consent + on-chain proof. |
| Agent rail | x402 **pattern**, `onelink-mandate` scheme | Bounds x402 per-call spend by the mandate; honest framing (not facilitator-compatible). |
| Settlement chains | Base + Arbitrum One | Low fees, good Particle support; proof anchored on Base. |
| DB | Supabase (Postgres) | Fast setup; server-only admin client forces `no-store` for fresh receipts. |
| Receipt | On-chain `InvoicePaid` event | Verifiable, queryable, shareable proof. |

## SDK / deployment notes

- Particle UA SDK pinned **exact** at `2.0.0-beta.3` (real EIP-7702 + cross-chain). Beta API can
  drift; pinned exact so prod cannot float unreviewed (R19).
- Prod deploys via the Vercel CLI; `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer` enables the
  cross-chain UA checkout. `NEXT_PUBLIC_ENABLE_DEBUG_PROBES` MUST be off in any deployed build.
- Contract addresses + proof tx hashes live in `README.md` and the honest-claim ledger.
