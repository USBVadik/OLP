# UA-Funded Expense Card — Requirements

> Goal: determine whether Particle Universal Accounts can prepare the Arbitrum Research Agent
> Expense Card from a unified USDC balance, so the winning use case and the required cross-chain
> UA rail become one coherent story.

## Product hypothesis

Today the two strongest proofs are separate:

- `/agent` proves a useful task, bounded on-chain spending, an over-cap refusal, and revoke;
- `/pay` proves Particle UA cross-chain settlement in EIP-7702 mode.

The intended product path is:

`Magic EOA -> Particle UA preview -> Arbitrum USDC available -> SpendPolicy allowance -> bounded agent charges`.

The first step is a build-only probe. It must answer whether a Universal Account transaction with
`expectTokens: USDC` and an Arbitrum `USDC.approve(SpendPolicy, cap)` produces a valid preview and,
when the settlement-chain balance is insufficient, a cross-chain funding route.

## Acceptance criteria

1. A pure builder SHALL encode exactly one `USDC.approve(SpendPolicy, amountAtomic)` call on
   Arbitrum and pair it with an `expectTokens` USDC amount expressed in human units.
2. The builder SHALL reject zero/negative amounts, malformed token/policy addresses, unsupported
   chains, and an approval amount larger than the signed total cap supplied by the caller.
3. A debug-only browser page SHALL initialize the same Magic EOA + Particle UA EIP-7702 account as
   the active checkout and call `createUniversalTransaction` for preview only.
4. The page SHALL display rootHash presence, user-op chains, token-change source/destination chains,
   fee quote presence, and EIP-7702 authorization/delegation state.
5. The page SHALL never call `sendTransaction`, sign `rootHash`, sign a 7702 authorization, send a
   type-4 transaction, approve USDC directly, or mutate SpendPolicy state.
6. The page SHALL be unavailable unless `NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true`.
7. No active checkout, agent, API, contract, database, or env behavior changes in this spike.
8. A cross-chain product integration is allowed only after a browser run returns a valid preview
   whose Particle token changes show a source chain different from Arbitrum.

## Kill rule

Stop this path after one focused probe cycle if:

- Particle rejects the approve-only custom call;
- `expectTokens` does not make USDC available for the approval flow;
- the preview requires an extra user signature that breaks the one-consent product story; or
- the route cannot be represented honestly as UA-funded card preparation.

In that case, keep the proven `/agent` and `/pay` paths separate and invest in onboarding, demo
reliability, and submission packaging instead.

## Non-goals

- No mainnet transaction.
- No gas spend.
- No automatic agent payment.
- No new contract or token allowance.
- No modification to `SpendPolicy` or the active Particle payment path.
- No claim that the Expense Card is cross-chain until a funded live run is separately approved and
  verified.
