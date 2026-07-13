# UA-Funded Expense Card Probe Results

Status: build-only preview succeeded; no transaction sent

Run date: 2026-07-12

SDK: `@particle-network/universal-account-sdk@2.0.3`

## Question

Can Particle Universal Accounts prepare the Arbitrum Research Agent Expense Card from unified USDC,
so the cross-chain UA rail and the on-chain SpendPolicy story can become one product flow?

## Unsigned intent

- Owner / EIP-7702 UA: `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`
- Destination chain: Arbitrum One (`42161`)
- Token: native Arbitrum USDC (`0xaf88…5831`)
- Custom call: `USDC.approve(SpendPolicy, 2_000_000)`
- SpendPolicy: `0x9782…164E`
- Expected token: `2 USDC`
- Routing options: `usePrimaryTokens:[USDC]`, `slippageBps:100`

The calldata is produced by the unit-tested pure builder in
`src/lib/particle/expense-card-arm.ts`. The debug route contains no signing or send path.

## Browser-runtime result

| Check | Result |
|---|---|
| `createUniversalTransaction` | created |
| `rootHash` | present |
| `tokenChanges` | present |
| `feeQuotes` | present |
| Funding source chains | Arbitrum + Base (`[42161, 8453]`) |
| Destination chain | Arbitrum (`[42161]`) |
| User-op chains | Base + Arbitrum |
| Base delegated | yes |
| Arbitrum delegated | yes |
| New `eip7702Auth` required | no |
| Transaction signed | no |
| Transaction broadcast | no |
| Gas spent / state changed | no |

Read-only `getPrimaryAssets()` at quote time showed approximately:

- Base USDC: `4.194672`
- Arbitrum USDC: `1.84`
- Unified USDC: `6.034672`

Particle therefore previewed a real cross-chain candidate: use the local Arbitrum balance plus Base
USDC to make `2 USDC` available on Arbitrum before executing the approval call.

## Economics warning

The unsigned quote reported a total fee of approximately **$0.353** for this 2 USDC preparation.
That is acceptable for proving the architecture but too expensive for a production micropayment
story. Fee behavior must be measured again with the final amount and immediately before any approved
live run; quote values are time-sensitive.

## Decision

The build-only technical gate is **green**. A default-off product integration is now implemented;
live execution remains gated.

Implemented safe step:

1. `NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT=false` keeps the current direct Arbitrum approval as rollback.
2. When enabled, `/agent` shows one legible funding + permission consent using the live unsigned
   Particle route and fee quote.
3. The explicit action keeps the mandate and Particle root signatures distinct, delegates routed
   chains, rebuilds fresh, and refuses to arm until Particle reports `FINISHED` plus read-only
   Arbitrum balance and allowance verification.
4. A material route/fee change after rebuild stops before send and asks the user to review again.
5. A default-off server gate now re-fetches the Particle activity, verifies successful source legs
   plus sufficient source debits, the exact destination USDC Approval, and the resulting Arbitrum
   balance on-chain, then stores immutable evidence keyed by `ua_transaction_id` plus the exact
   EIP-712 `mandate_id`. Preview fields are never accepted as proof.

Next live gate (not run): apply the `agent_funding_evidence` Supabase migration, keep the product
flag off until review, request explicit approval for one small mainnet run, then verify the Particle
activity, every source receipt, exact Approval, stored evidence row, post-transaction Arbitrum USDC
balance, and exact allowance before running the agent.

## Claim discipline

Allowed now:

> Particle successfully built an unsigned Base + Arbitrum preview for preparing an Arbitrum
> SpendPolicy allowance from the Universal Account's unified USDC balance.

Not allowed yet:

- The live Expense Card is cross-chain funded.
- The approval executed successfully.
- The agent spent cross-chain funds through the mandate.
- This is economical for production micropayments.
