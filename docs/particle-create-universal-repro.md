# Particle createUniversalTransaction Repro

Hi Particle / Encode team,

We are building OneLink Pay for UXmaxx. Our intended qualifying path was:

Magic embedded wallet -> Particle Universal Account -> `createUniversalTransaction` on Base -> USDC `approve` + `ReceiptEmitter.payInvoice` -> `InvoicePaid` event.

The wallet, UA, balance, transfer, and contract registration pieces work. The blocker is isolated to custom `createUniversalTransaction` calls.

## Working State

- Magic login works.
- Particle UA initialization works.
- `getPrimaryAssets()` works.
- `createTransferTransaction()` works and returns `rootHash`, fee quotes, and token changes.
- `ReceiptEmitter v1` is deployed on Base mainnet.
- Invoice registration works on-chain.

## Exact Error

```text
-32801 System maintanence, please use SEND/TRANSFER/SELL feature to transfer your assets immediately
```

The error happens before preview/signing.

## Probe Matrix

1. `createTransferTransaction` with Base USDC: works.
2. `createUniversalTransaction` with single `USDC.transfer`: fails with `-32801`.
3. `createUniversalTransaction` with single `USDC.approve`: fails with `-32801`.
4. `createUniversalTransaction` with `USDC.approve + ReceiptEmitter.payInvoice`: fails with `-32801`.

## Environment

- Particle UA SDK: `1.1.1`
- Magic SDK: `29.4.2`
- Next.js: `14.2.35`
- Chain: Base mainnet `8453`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- ReceiptEmitter: `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`

## Questions

1. Is custom `createUniversalTransaction` currently disabled, under maintenance, or behind an allowlist for this SDK/project?
2. For UXmaxx, if `createUniversalTransaction` remains unavailable, is a Particle SEND/TRANSFER flow acceptable for the cross-chain value movement requirement if we verify the payment server-side and record an on-chain payment proof separately?
