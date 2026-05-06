# OneLink Pay

OneLink Pay is a pre-hackathon checkout prototype: a merchant creates a USDC invoice, a customer signs in with Magic, Particle Universal Accounts builds a transfer preview, the merchant receives Base USDC, and the backend records an on-chain `InvoicePaid` proof after server-side verification.

## Active Milestone B Fallback Path

- Wallet/auth: Magic embedded wallet.
- Chain abstraction: Particle Universal Account SDK in EIP-7702 Universal Account mode.
- Payment execution: `createTransferTransaction()` to send Base mainnet USDC to the merchant.
- Backend verification: Base mainnet USDC `Transfer` log must match merchant and invoice amount.
- Contract proof: backend calls `ReceiptEmitter.recordVerifiedPayment()` and emits `InvoicePaid`.
- Database/status: Supabase `payment_links` and `payments`.
- Token policy: Base mainnet USDC only.
- Default payment mode: `transfer_fallback`.
- Active ReceiptEmitter v1.1: `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3` on Base mainnet.
- Deploy tx: `0x6148c0780797c91210c62650b5f4d79316995ff21112616e04d4b18c626afc57`.
- Explorer: `https://basescan.org/address/0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`.

The strict `createUniversalTransaction(approve + payInvoice)` path remains in code behind `NEXT_PUBLIC_PAYMENT_MODE=universal_invoice`, but the default is `transfer_fallback` while Particle returns `-32801 System maintanence...` for custom universal calls.

Arbitrum config exists for exploration only. It is not the active product chain.

`@particle-network/authkit` is installed, but it is not used in the active flow. AuthKit should not be described as the live demo wallet/auth path.

## Security Notes

`POST /api/payment-links` registers invoices on-chain from the server-side ReceiptEmitter owner wallet. To avoid public gas-drain, it requires:

```text
x-admin-create-token: <ADMIN_CREATE_TOKEN>
```

`POST /api/payments/[id]/mark-paid` does not trust a frontend tx hash by itself. It fetches the Base mainnet receipt, parses Base USDC `Transfer`, verifies merchant and amount, then records `InvoicePaid` through the ReceiptEmitter owner key before marking Supabase as paid.

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
NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback
NEXT_PUBLIC_RECEIPT_EMITTER_ADDRESS=
BASE_MAINNET_RPC_URL=
NEXT_PUBLIC_ARBITRUM_CHAIN_ID=42161
NEXT_PUBLIC_ARBITRUM_USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
ARBITRUM_MAINNET_RPC_URL=
NEXT_PUBLIC_ARBITRUM_RECEIPT_EMITTER_ADDRESS=
RECEIPT_EMITTER_OWNER_PRIVATE_KEY=
ADMIN_CREATE_TOKEN=
```

Never commit `.env.local`, private keys, seed phrases, or admin tokens.

## Local Commands

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm lint
cd contracts && corepack pnpm test
```

Deploy ReceiptEmitter v1.1 to Base mainnet:

```bash
cd contracts
BASE_MAINNET_RPC_URL=... RECEIPT_EMITTER_OWNER_PRIVATE_KEY=... corepack pnpm hardhat run scripts/deploy.ts --network base
```

## Historical P0 Proof

The previous transfer-only P0 proved Magic + Particle UA can move real USDC on Base, but it did not call the receipt contract. That path is now historical.

Historical Base Sepolia ReceiptEmitter v0:

- Address: `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`
- Explorer: `https://sepolia.basescan.org/address/0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`
- Deploy tx: `0x351db8dfa40cd5c70423510524133b186fe995b5ac7f52d6704ce09ea4d64fcc`

This is the same hex address as the previous Base mainnet v1 deployment, but it is a different contract on a different chain.

## SDK Versions

- `@particle-network/universal-account-sdk`: `1.1.1`
- `magic-sdk`: `29.4.2`
- `viem`: `2.48.8`
- `ethers`: `6.16.0`
- `next`: `14.2.35`
- `@openzeppelin/contracts`: `5.6.1`

Known risk: Particle `createUniversalTransaction()` currently returns maintenance errors for custom calls in this project. The active fallback uses the working Particle transfer rail plus strict server-side verification and on-chain proof.
