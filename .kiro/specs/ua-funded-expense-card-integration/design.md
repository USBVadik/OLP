# UA-Funded Expense Card Integration — Design

## Rollout boundary

`NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT=false` is the rollback position. In that state, the existing
`USDC.approve` arm path is byte-for-byte behaviorally unchanged.

When enabled, the connected state builds an unsigned Particle preview. The preview is consent
material only. Sending happens only after the user presses `Fund and arm agent` and accepts the
wallet prompts.

## Pure orchestration module

`src/lib/particle/expense-card-funding.ts` owns testable rules:

- exact feature-flag parsing;
- daily funding amount selection;
- defensive Particle preview summarization;
- unique routed-chain extraction;
- delegate-then-rebuild ordering;
- inline 7702 authorization signing through injected callbacks;
- root-hash signing and one send call;
- FINISHED/failure/timeout polling.

Wallet and SDK dependencies are injected, so unit tests cannot touch a provider or network.

## UI flow

1. Restore/login with Magic.
2. Read Particle primary assets.
3. Build an unsigned `USDC.approve(SpendPolicy, dailyCap)` route.
4. Show the signed permission and funding route together.
5. On the single primary action:
   - sign the EIP-712 mandate;
   - ensure routed chains are delegated;
   - rebuild fresh;
   - sign any remaining 7702 authorizations and the root hash;
   - send once;
   - wait for Particle `FINISHED`;
   - read-verify the Arbitrum USDC balance and SpendPolicy allowance;
   - enter armed state.

The action is one consent moment, not a claim of one cryptographic signature.

## Safety

- No automatic send on page load.
- No silent fallback from a failed Particle send to direct approval.
- No armed state on ambiguous settlement.
- The direct path is selected only by the default-off feature flag, never as a failure fallback.
