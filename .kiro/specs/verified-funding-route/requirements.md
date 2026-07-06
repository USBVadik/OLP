# Verified Funding Route — Requirements

> R22 #3 upgrade: "reported" → "verified" for the cross-chain funding source on the shareable
> receipt. L0 spike is GREEN — server `UniversalAccount.getTransaction(ua_transaction_id)` returns
> authoritative `fromChains` (verified empirically on `fc5adc83`: `status 7`, `fromChains
> [42161,8453]`, `sender`/`receiver`). Honesty risk R22 is ALREADY closed via the "reported by your
> wallet" label; this is an OPTIONAL strength upgrade, so it MUST NOT add risk to the proven payment
> path.

## Goal

On `/receipt/[id]`, when the funding route can be server-verified via Particle, upgrade the caption
from "funding source reported by your wallet" to "funding route verified by Particle activity" with
the real source → settlement chains. Otherwise keep today's honest "reported" label.

## Acceptance criteria

1. WHEN a completed payment has a `ua_transaction_id`, AND server `getTransaction` returns a FINISHED
   (`status == 7`) tx whose `sender == payer` and `receiver == merchant`, THEN the receipt SHALL show
   "verified by Particle activity" with the source-chain(s) derived from `tokenChanges.fromChains`
   minus the settlement chain.
2. IF there is no `ua_transaction_id`, OR `getTransaction` errors / times out / returns a
   non-FINISHED status / a sender-receiver mismatch, THEN the receipt SHALL fall back to the current
   "reported by your wallet" label — no error surfaced, render never blocked.
3. The funding-route label SHALL be described as VENDOR-verified (Particle activity), never
   "on-chain proven" (on-chain source-leg verification is L3, out of scope).
4. Settlement + InvoicePaid legs keep their existing independent on-chain "verified" labeling
   (unchanged), and the UniversalX activity link stays.

## Non-goals / guardrails

- MUST NOT modify `mark-paid`, the payment write path, or the DB schema.
- MUST NOT block or delay PAID / receipt render on Particle availability.
- MUST NOT use client-supplied `sourceChainIds` as the source for the "verified" label.
- MUST NOT claim x402 wire-compatibility or on-chain funding proof.
