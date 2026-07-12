# Partner Bounty Decision Record

Last updated: 2026-07-12.

This is the final UXmaxx track decision for OneLink Pay. It replaces the pre-kickoff decision tree.

## Selected Prize Surfaces

1. **Universal Accounts Track (main).** Particle UA SDK in EIP-7702 mode is the load-bearing payment
   rail. Cross-chain value movement is proven live in-product (C21).
2. **Arbitrum bonus.** Arbitrum is the primary settlement and policy chain: SpendPolicy, agent
   purchases, revoke, and merchant settlement are deployed and live there.
3. **Magic bonus.** Magic provides email/Google onboarding and signs the EOA's EIP-7702/Particle UA
   flow. It is not a decorative login integration.

These bonus bounties are independently judged and strengthen the same architecture.

## Not Selected: General Track

Participants choose one main track. General Track also requires one of its subtracks:

- **ZeroDev:** meaningful Smart Routing Address integration as a core component.
- **Openfort:** meaningful use of Openfort backend wallets and its x402 agentic-payments stack.

OneLink uses Particle UA for chain abstraction, Magic for wallet/signing, and a custom
`onelink-mandate` x402-pattern settlement. Adding ZeroDev or Openfort now would create a second core
architecture or a shallow checkbox integration. Do not switch from the stronger UA submission.

## Active Technical Decisions

- Wallet/signing: **Magic**.
- Chain abstraction: **Particle Universal Accounts**, stable SDK `2.0.3`.
- Payment mode: **`universal_7702_transfer`**.
- Primary chain: **Arbitrum One**.
- Source/proof chain: **Base mainnet**.
- Policy: deployed **SpendPolicy** with per-charge/daily/total/merchant/expiry/revoke limits.
- Proof: server-verified USDC transfer + **ReceiptEmitter** + public receipt.
- Primary use case: **Research Agent Expense Card** (C25-C26).

## Inactive Paths

- `transfer_fallback`: legacy fallback only.
- `universal_invoice`: inactive `approve + payInvoice` experiment; not required for the qualifying
  Particle rail.
- Particle AuthKit: not installed or used.
- ZeroDev/Openfort: not integrated and must not be claimed.
- Additional settlement chains: out of scope before submission.

The old `-32801` maintenance result belongs to SDK `1.1.1` during the UA V2 migration. It is not a
current blocker for the stable cross-chain universal transaction path.

## Submission Evidence

### Universal Accounts Track

- Magic EOA upgraded in place through EIP-7702.
- Particle unified balance and `createUniversalTransaction` are live.
- Base -> Arbitrum value movement through the UA is publicly verifiable (C21).
- Functional production demo and public proof receipt.

### Arbitrum Bonus

- SpendPolicy and ReceiptEmitter deployed on Arbitrum.
- Research-agent purchases and `MandateRevoked` proven on Arbitrum (C25-C26).
- Merchant settlement on Arbitrum with Base-funded USDC proven live.
- User sees no chain switch or manual bridge.

### Magic Bonus

- Email/Google login, no extension or seed phrase.
- Magic EOA is the actual Particle UA owner and signer.
- Session continuity, EIP-7702 authorization, key export through Magic UI, and reversible account
  story are documented and proven where claimed.

## Reopen Rule

Do not reopen architecture selection before submission. Reconsider a partner only if:

1. the organizer changes eligibility in writing; or
2. the active payment path develops a reproducible blocker that cannot be fixed safely.

Otherwise spend remaining time on the recorded demo, exact submission copy, fresh-browser checks,
and claim re-verification.
