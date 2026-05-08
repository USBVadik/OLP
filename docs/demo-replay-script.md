# Demo Replay Script

Use this when we need to show the current prototype without spending gas or sending a new payment.

## 60-second flow

1. Open `/`.
2. Say: OneLink Pay is a pre-hackathon checkout prototype. The active stack is Magic + Particle Universal Accounts + Base + `transfer_fallback` + ReceiptEmitter proof.
3. Click `Open Demo Replay`.
4. Point to the paid receipt:
   - amount: `0.10 USDC`
   - merchant: `0x8C54783849A2C042544efc37c4657Ee98a411Fb7`
   - payment tx: existing Base USDC transfer
   - proof tx: existing ReceiptEmitter `InvoicePaid` proof
5. Open the receipt page and show `PAID`, invoice id, payment tx link, and proof tx link.
6. Open the dashboard replay and show `PAID / proof ok`.
7. Explain the current limitation: this replay does not execute a new payment. It reuses a real successful payment/proof pair so judges can inspect the proof path safely.

## Current Working Fallback

The working live path is:

Magic login -> Particle Universal Account -> `createTransferTransaction` -> Base USDC reaches merchant -> backend verifies USDC `Transfer` -> backend calls `ReceiptEmitter.recordVerifiedPayment` -> dashboard shows `PAID`.

This proves a verified Base payment plus on-chain proof. Do not describe it as proven cross-chain routing unless a final live test demonstrates that after kickoff.

## Strict Future Path

The intended strict invoice path is:

Magic login -> Particle Universal Account -> `createUniversalTransaction` with `USDC.approve` + `ReceiptEmitter.payInvoice` -> ReceiptEmitter pulls exact USDC -> `InvoicePaid` emitted.

This stays behind `NEXT_PUBLIC_PAYMENT_MODE=universal_invoice`.

## Known Particle Maintenance Blocker

Current probe matrix:

- `createTransferTransaction`: works.
- `createUniversalTransaction` with `USDC.transfer`: blocked.
- `createUniversalTransaction` with `USDC.approve`: blocked.
- `createUniversalTransaction` with `approve + payInvoice`: blocked.

Exact blocker: Particle returns `-32801 System maintanence, please use SEND/TRANSFER/SELL feature to transfer your assets immediately`.

## After Kickoff

1. Read final Encode/UXmaxx rules and partner bounties.
2. Check Particle UA maintenance status and SDK docs.
3. Rerun the probe matrix from `docs/hackathon-start-runbook.md`.
4. Choose final chain: keep Base unless rules or probes make Arbitrum clearly better.
5. Choose final payment mode:
   - keep `transfer_fallback` if custom universal calls are still blocked;
   - switch to `universal_invoice` only after `approve + payInvoice` previews and sends successfully.
6. Add ZeroDev or Repeat-Pay Caps only after the final required payment path is stable.
