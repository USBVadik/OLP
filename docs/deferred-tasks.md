# Deferred Tasks

Tasks parked deliberately, to return to later. Owned by the Kiro agent thread.

## 1. Particle workshop questions (Jun 22 kickoff)

- **Status:** deferred (user asked to remember; revisit when prepping for the workshop).
- **Goal:** prepare a sharp, prioritized list of questions to ask Particle at the Jun 22 kickoff.
- **Most important question:** ETA for Universal Accounts **V2 GA** and the status of **true cross-chain VALUE settlement** (currently failing: `REFUND_FAILED` status 10 on zero-balance destination; `-32613` with top-up + `universalGas:true`). Custom calls `createUniversalTransaction` are blocked by `-32801` (V2 migration) on both Base and Arbitrum, both modes.
- **Secondary questions:** which `createTransferTransaction` cross-chain routes are live today; whether the public SDK 1.1.1 (pins version `1.0.3`) will ship the V2 account class; whether transfer-rail + server-verified proof qualifies for the UA Track cross-chain requirement while custom calls are down; recommended path to demo one qualifying cross-chain UA value op before submission.
- **Related backup:** Circle Gateway workshop Jun 25 (deposit -> unified balance -> burn intent -> attestation -> Gateway Minter; pairs with 7702 EOAs). Code not yet written; needs Circle API creds.
- See also: `docs/particle-create-universal-repro.md`, `docs/cross-chain-proof-runbook.md`.
