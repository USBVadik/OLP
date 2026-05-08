# Operator Checklist

Use this when running the pre-hackathon prototype locally.

## Run Locally

From the repo root:

```bash
corepack pnpm install
corepack pnpm dev
```

Open:

```text
http://localhost:3000
```

Useful pages:

- Checkout: `http://localhost:3000/pay/<payment_link_id>`
- Dashboard: `http://localhost:3000/dashboard`
- Demo replay success: `http://localhost:3000/success/7cfd444c-5308-4688-80c4-7e9c4def9149`
- Demo replay dashboard: `http://localhost:3000/dashboard?demo=replay&merchantId=0x8C54783849A2C042544efc37c4657Ee98a411Fb7`
- Probe page: `http://localhost:3000/debug/particle-probe`

## Demo Replay

Demo replay mode uses existing successful Base transactions. It does not execute a new payment.

Existing payment tx:

```text
0xfb480ac9357e88d6a98f8e08fdf8a6a686cbcd8ee5e46aff20a56893615eb357
```

Existing proof tx:

```text
0xb65cdcf3e7a6973c801b0f0da8a50c03f19fd99dee4693ba7e8861609428788b
```

Run:

```text
http://localhost:3000/success/7cfd444c-5308-4688-80c4-7e9c4def9149
```

Then open:

```text
http://localhost:3000/dashboard?demo=replay&merchantId=0x8C54783849A2C042544efc37c4657Ee98a411Fb7
```

Expected result:

- Success page clearly says `Demo replay mode`.
- Payment tx link is shown.
- Proof tx link is shown.
- Merchant, amount, and invoice id are shown.
- Dashboard shows `PAID` and `proof ok`.

## Live Payment Test

Only run this if explicitly approved.

Before starting:

- Confirm `NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback`.
- Confirm Base mainnet is still the active chain.
- Confirm the payer Particle UA has enough Base USDC.
- Confirm the server owner wallet has enough Base ETH for `registerInvoice` and `recordVerifiedPayment`.
- Use a tiny amount, such as `0.10 USDC`.
- Do not test `universal_invoice` with mainnet gas unless explicitly approved.

Steps:

1. Start local dev server.
2. Open dashboard.
3. Enter merchant address.
4. Enter `ADMIN_CREATE_TOKEN`.
5. Create a USDC payment link.
6. Confirm the created link has `registered_tx_hash`.
7. Open `/pay/<id>`.
8. Login with Magic.
9. Wait for Particle UA balance.
10. Create transaction preview.
11. Confirm mode badge says `transfer_fallback`.
12. Confirm chain badge says `Base 8453`.
13. Click pay only after explicit approval.
14. Wait for payment tx.
15. Wait for backend mark-paid verification.
16. Confirm success page shows payment tx and proof tx.
17. Refresh dashboard and confirm `PAID / proof ok`.

If the payment fails, record:

- stage
- exact error message
- payment link id
- payer address
- payment tx if present
- proof tx if present
- diagnostic log entry

## Env Checklist

Required public env:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PARTICLE_PROJECT_ID=
NEXT_PUBLIC_PARTICLE_CLIENT_KEY=
NEXT_PUBLIC_PARTICLE_APP_ID=
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_DESTINATION_CHAIN_ID=8453
NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback
NEXT_PUBLIC_RECEIPT_EMITTER_ADDRESS=
NEXT_PUBLIC_ENABLE_DEBUG_PROBES=false
```

Required server-only env:

```text
SUPABASE_SERVICE_ROLE_KEY=
BASE_MAINNET_RPC_URL=
RECEIPT_EMITTER_OWNER_PRIVATE_KEY=
ADMIN_CREATE_TOKEN=
```

Exploratory Arbitrum env:

```text
NEXT_PUBLIC_ARBITRUM_CHAIN_ID=42161
NEXT_PUBLIC_ARBITRUM_USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
ARBITRUM_MAINNET_RPC_URL=
NEXT_PUBLIC_ARBITRUM_RECEIPT_EMITTER_ADDRESS=
```

Secret handling:

- Keep `.env.local` local only.
- Keep `.secrets` local only.
- Do not paste private keys into chat, docs, scripts, screenshots, or commits.

## Known Blockers

- Particle `createUniversalTransaction()` custom calls have returned:

```text
-32801 System maintanence, please use SEND/TRANSFER/SELL feature to transfer your assets immediately
```

- `universal_invoice` is available but blocked until Particle custom calls work.
- Active live path is `transfer_fallback`.
- Arbitrum is exploratory only.
- Particle AuthKit is not active in checkout.
- Cross-chain proof is not final until final rules define and accept the path.

## What Not To Touch Before Kickoff

- Do not add ZeroDev.
- Do not build Repeat-Pay Caps.
- Do not migrate to Particle AuthKit checkout.
- Do not activate Arbitrum as the product chain.
- Do not add QR links.
- Do not add merchant auth.
- Do not add broad token support.
- Do not add UI polish or landing-page work.
- Do not deploy new contracts.
- Do not send new mainnet payments.
- Do not change the default payment mode away from `transfer_fallback`.
