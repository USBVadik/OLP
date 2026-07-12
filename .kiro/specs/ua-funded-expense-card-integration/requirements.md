# UA-Funded Expense Card Integration — Requirements

## Goal

Turn the successful build-only Particle probe into one coherent Research Agent consent flow:

`Magic EOA -> Particle UA route preview -> fund Arbitrum daily budget -> approve SpendPolicy -> agent charges within the signed mandate`.

The integration is experimental and default-off until one explicitly approved live run verifies it.

## Acceptance criteria

1. The integration SHALL be enabled only when `NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT=true` exactly.
2. When disabled, `/agent` SHALL preserve the existing direct Arbitrum USDC approval behavior.
3. The Particle path SHALL fund/approve the smaller of `maxPerDay` and `totalCap`, not the full
   lifetime cap by default.
4. Before the user signs, `/agent` SHALL show a read-only Particle preview containing the funding
   amount, real source chains, Arbitrum destination, and quoted fee when available.
5. One `Fund and arm` action MAY require explicit wallet signatures for the EIP-712 mandate and
   Particle transaction. The UI SHALL not call this one signature or hide wallet prompts.
6. The execution path SHALL ensure every routed user-op chain is delegated, rebuild the Particle
   transaction after delegation, sign the fresh root hash, and send it once.
7. The app SHALL not enter the armed state until Particle reports status `7` (`FINISHED`) and
   read-only Arbitrum checks confirm both the expected USDC balance and SpendPolicy allowance.
8. Particle failure/refund statuses, missing root hashes, and polling timeouts SHALL fail closed.
9. No API, contract, database, x402 charge, revoke, or active checkout behavior changes.
10. No transaction SHALL be executed as part of development or automated verification.

## Claim discipline

Allowed before a live run:

> The Research Agent can show a real Particle preview for funding its Arbitrum daily budget from a
> Universal Account balance. The execution path is feature-gated and awaiting a live verification.

Not allowed before a live run:

- The Expense Card was funded cross-chain.
- A Particle approval completed on-chain.
- The Research Agent spent funds sourced cross-chain through this integrated path.
