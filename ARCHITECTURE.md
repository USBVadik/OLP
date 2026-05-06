# OneLink Pay — Architecture & Roadmap

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├──────────────┬──────────────────┬───────────────────────────────┤
│  /dashboard  │  /checkout/[id]  │  /merchant (create links)     │
└──────┬───────┴────────┬─────────┴───────────────┬───────────────┘
       │                │                         │
       ▼                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API ROUTES (Next.js)                         │
│  POST /api/payment-links   — create payment link                │
│  GET  /api/payment-links   — list merchant links                │
│  GET  /api/payments        — payment history + stats            │
│  POST /api/payments/[id]/attempt   — store preview attempt      │
│  POST /api/payments/[id]/mark-paid — verify InvoicePaid         │
└──────┬──────────────────────────────┬───────────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────┐          ┌───────────────────────────────────────┐
│   Supabase   │          │         BLOCKCHAIN LAYER              │
│  (Postgres)  │          │                                       │
│  - merchants │          │  Magic Wallet (embedded, EIP-7702)    │
│  - links     │          │         │                             │
│  - payments  │          │         ▼                             │
└──────────────┘          │  Particle Universal Accounts          │
                          │  (transfer rail + gas abstraction)    │
                          │         │                             │
                          │         ▼                             │
                          │  Destination Chain (Base)             │
                          │  ReceiptEmitter.sol → InvoicePaid      │
                          └───────────────────────────────────────┘
```

## Core Loop (MVP)

```
Merchant creates payment link
  → POST /api/payment-links → Supabase row + registerInvoice()
Customer opens checkout URL
  → Login with Magic embedded wallet
  → Particle UA reads balances
  → Human-readable transfer preview shown
Customer confirms
  → Particle UA createTransferTransaction sends Base USDC to merchant
  → Backend verifies the Base USDC Transfer in mark-paid
  → Backend records ReceiptEmitter.InvoicePaid proof on-chain
  → Payment status → "completed" in Supabase
Dashboard shows PAID
  → Polls DB state and proof tx status
```

## File Structure

```
OneLink-Pay/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Tailwind
│   │   ├── checkout/[linkId]/page.tsx  # Customer checkout
│   │   ├── dashboard/page.tsx          # Merchant dashboard
│   │   └── api/
│   │       ├── payment-links/route.ts  # CRUD payment links
│   │       ├── payments/route.ts       # Payment history
│   │       └── webhooks/route.ts       # Chain callbacks
│   ├── components/                     # Shared UI
│   ├── lib/
│   │   ├── magic/client.ts            # Magic SDK wrapper
│   │   ├── particle/universal-account.ts # Particle UA integration
│   │   ├── supabase/client.ts         # DB client
│   │   ├── contracts/receipt-emitter.ts # ABI + helpers
│   │   └── zerodev/repeat-pay.ts      # [STRETCH] Session keys
│   ├── contracts/
│   │   └── ReceiptEmitter.sol         # On-chain receipt
│   └── types/
│       └── supabase.ts                # DB types
├── supabase/
│   └── schema.sql                     # DB schema
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── .gitignore
```

## Roadmap

### Phase 1: Core Loop (Week 1-2)
- [ ] Setup Supabase project, run schema.sql
- [ ] Implement Magic login in checkout flow
- [ ] Integrate Particle UA SDK (`createTransferTransaction` fallback active)
- [ ] Build transaction preview UI (human-readable)
- [ ] Deploy ReceiptEmitter.sol v1.1 to Base mainnet
- [ ] Wire up end-to-end: pay → receipt → dashboard PAID
- [ ] Merchant dashboard: list links, show payment status

### Phase 2: Polish (Week 2-3)
- [ ] Error handling and edge cases
- [ ] Loading states and UX polish
- [ ] Mobile responsive checkout
- [ ] Payment link expiration logic
- [ ] Real-time dashboard updates (Supabase realtime or polling)
- [ ] Basic merchant auth (wallet-based)

### Phase 3: Stretch — Repeat-Pay Caps (Week 3-4)
- [ ] ZeroDev SDK integration
- [ ] Session key creation with merchant/amount/time limits
- [ ] Repeat payment execution via session keys
- [ ] Revocation UI
- [ ] Dashboard: recurring payment management

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Wallet | Magic (default) | Most reliable for demo; Particle Auth as spike |
| Chain abstraction | Particle UA (EIP-7702) | Core requirement; transfer fallback active while custom calls are blocked |
| Destination chain | Base | Low fees, good Particle support |
| DB | Supabase | Fast setup, realtime, auth built-in |
| Receipt | On-chain event | Verifiable proof, queryable |
| Stretch | ZeroDev session keys | Strict caps without full wallet access |
