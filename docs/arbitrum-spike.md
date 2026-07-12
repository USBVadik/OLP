# Arbitrum Spike

> **HISTORICAL SPIKE (2026-05).** The exploratory decision below has been superseded. Arbitrum is
> now the primary settlement and SpendPolicy chain; cross-chain Particle UA value movement is proven
> live on stable SDK `2.0.3` (C21), and the Research Agent purchases/revoke are proven on Arbitrum
> (C25-C26). Keep this document only as the original probe record.

## Decision Context

Magic remains the active embedded wallet/auth path.

Particle Universal Accounts remain the active chain abstraction path.

Particle AuthKit is not being built in parallel.

Base remains the active working demo chain. Arbitrum is exploratory only until it shows a better Particle UA path than Base.

Carlos from Particle hinted that Magic is a good path and that Arbitrum may be worth testing. This spike checks whether Arbitrum behaves differently from Base for Particle UA transfer and custom-call rails.

## Arbitrum Config

- Chain: Arbitrum One
- Chain ID: `42161`
- Native USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- Explorer: `https://arbiscan.io`

Environment names:

```text
NEXT_PUBLIC_ARBITRUM_CHAIN_ID=42161
NEXT_PUBLIC_ARBITRUM_USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
ARBITRUM_MAINNET_RPC_URL=
NEXT_PUBLIC_ARBITRUM_RECEIPT_EMITTER_ADDRESS=
```

## Probe Page

Local-only debug page:

```text
http://localhost:3000/debug/particle-probe
```

Requires:

```text
NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true
```

The page does not send transactions. It only builds Particle transaction previews/rootHash unless a human explicitly approves a send elsewhere.

## Arbitrum Probes

1. Magic login.
2. Particle UA initialization.
3. `getPrimaryAssets()`.
4. `createTransferTransaction()` with Arbitrum USDC to merchant.
5. `createUniversalTransaction()` with single Arbitrum USDC `transfer`.
6. `createUniversalTransaction()` with single Arbitrum USDC `approve`.
7. Optional: `createUniversalTransaction()` with `approve + payInvoice` if a ReceiptEmitter is deployed on Arbitrum.

## Probe Result: 2026-05-06

Environment:

- Particle UA SDK: `1.1.1`
- Magic SDK: `29.4.2`
- Next.js: `14.2.35`
- Chain ID: `42161`
- USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- Owner address: `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`
- UA address: `0xeE1FB8b1d24d658F39D1AFEc50a82D0c306c0246`
- Merchant: `0x8C54783849A2C042544efc37c4657Ee98a411Fb7`
- `getPrimaryAssets()`: ok
- Arbitrum ReceiptEmitter: not deployed/configured

Balances checked directly on Arbitrum:

- Magic UA Arbitrum ETH: `0.0`
- Magic UA Arbitrum USDC: `0.0`
- Owner UA Arbitrum ETH: `0.0`
- Owner UA Arbitrum USDC: `0.0`
- Merchant Arbitrum ETH: `0.0`
- Merchant Arbitrum USDC: `0.0`

Probe results:

- `createTransferTransaction()` to merchant with Arbitrum USDC failed with `-32606 Failed to simulate user operation, please try again`.
- Retesting transfer amounts from `0.01` down to `0.000001` USDC produced the same `-32606` error.
- `createUniversalTransaction()` with single Arbitrum USDC `transfer` failed with `-32801 System maintanence...`.
- `createUniversalTransaction()` with single Arbitrum USDC `approve` failed with `-32801 System maintanence...`.
- `approve + payInvoice` was not run because no Arbitrum ReceiptEmitter is deployed/configured.

Interpretation:

- Arbitrum does not improve the custom `createUniversalTransaction` blocker; it returns the same maintenance error.
- Arbitrum transfer rail did not produce a preview in the current wallet state. The likely immediate factor is that none of the known UA/merchant addresses currently hold Arbitrum ETH or Arbitrum USDC, but the returned error is generic simulation failure rather than a clean insufficient-balance message.
- Base remains the stronger live demo target because Base `createTransferTransaction()` already produced and sent a real USDC payment.

## Base Comparison

Base probe result as of 2026-05-06:

- `createTransferTransaction`: works.
- `createUniversalTransaction` custom calls: blocked with `-32801 System maintanence...`.

## Acceptance Question

If Arbitrum transfer works but custom `createUniversalTransaction` is also blocked, the fallback remains:

Magic + Particle UA transfer rail -> server verifies USDC `Transfer` -> ReceiptEmitter records verified payment proof -> Supabase marks PAID.

If Arbitrum custom universal transactions work while Base custom calls are blocked, Arbitrum becomes a candidate final target chain for the strict `approve + payInvoice` path.
