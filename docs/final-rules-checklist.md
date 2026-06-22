# Final Rules Checklist

Use this to keep the final UXmaxx / Encode rules aligned with implementation decisions. Do not change the product path until the relevant checklist item is complete.

## Current Prototype Baseline

- Wallet/auth: Magic active.
- Chain abstraction: Particle Universal Accounts active.
- Active chain: Base mainnet.
- Exploratory chain: Arbitrum One.
- AuthKit checkout: inactive.
- Stable fallback mode: `transfer_fallback`.
- Active Universal Accounts Track candidate: `universal_7702_transfer`.
- Strict payment mode: `universal_invoice`, gated and currently blocked by Particle `-32801`.
- Working proof path: Particle transfer -> server verifies Base USDC `Transfer` -> ReceiptEmitter proof -> dashboard `PAID`.

## Captured UXmaxx Rules

Current main-track choice:

- Universal Accounts Track: build a dApp that prominently uses Particle Universal Accounts in EIP-7702 mode with a supported wallet provider for a chain-agnostic UX.
- General Track: build a Web3 application with exceptional UX in any domain.

Universal Accounts Track requirements:

- Must use Universal Accounts SDK in EIP-7702 mode.
- Must include at least one cross-chain operation moving value via UA.
- Must have a functional demo, deployed or runnable locally.

Universal Accounts Track judging:

- UX excellence: 40%.
- Prominent / innovative Universal Accounts + EIP-7702 usage: 30%.
- Adoption potential: 20%.
- Technical quality / polish: 10%.

Bonus opportunities:

- Magic Labs bonus: embedded-wallet onboarding and wallet UX. This aligns with the current Magic path.
- Arbitrum bounty: app and components must run primarily on Arbitrum. This is not active by default; treat as a separate decision.
- ZeroDev subtrack: meaningful ZeroDev infrastructure integration. This is not active; do not present Spend Caps Concept Mode as ZeroDev.
- Openfort subtrack: backend wallets + x402. Inactive unless the final strategy pivots.

Known gap:

- Base EIP-7702 delegation is proven.
- Same-chain Base payment/proof is proven.
- A live final-rule-compliant cross-chain UA value movement is still pending.
- Use `docs/cross-chain-proof-runbook.md` for the safe execution path.

## Rule Source Capture

Record or confirm these in `docs/status.md` before final submission work:

- Final competition URL.
- Final deadline and timezone.
- Final judging criteria and weights.
- Whether pre-hackathon prototype work is allowed.
- Whether code must be created after kickoff.
- Required submission artifacts: repo, video, deployed app, local app, pitch deck, or all of these.
- Required public demo length.
- Whether testnet or mainnet is required.
- Whether demo replay is acceptable as fallback evidence.

## Particle / Universal Account Requirements

Check exact wording:

- Is Particle Universal Accounts SDK required?
- Is EIP-7702 explicitly required?
- Is `createUniversalTransaction()` required, or is Particle SEND/TRANSFER acceptable?
- Is cross-chain value movement required?
- If cross-chain is required, what qualifies?
- Are custom calls behind allowlist, maintenance, or specific SDK versions?
- Is a human-readable Particle preview required before payment?
- Is wallet signing expected through Magic, Openfort, AuthKit, or any embedded wallet?

Decision:

- If EIP-7702 SEND/TRANSFER with cross-chain sourcing is accepted, use `universal_7702_transfer`.
- If custom UA calls are required and probes work, switch to `universal_invoice`.
- If custom UA calls are required and still blocked by `-32801`, document blocker immediately and ask Particle/Encode for guidance.

## Wallet / Auth Requirements

Check:

- Is Magic accepted?
- Is Openfort required or only suggested?
- Is Particle AuthKit required?
- Are server-side wallets allowed?
- Are embedded wallets mandatory?
- Is email login acceptable?

Decision:

- Keep Magic unless final rules explicitly require another wallet.
- Do not migrate to AuthKit just because it exists.
- Timebox Openfort only if it is required or has a high-value bounty.

## Chain Requirements

Check:

- Is Base allowed?
- Is Arbitrum required, preferred, or bounty-weighted?
- Are both source and destination chains specified?
- Is mainnet required?
- Are testnets allowed?
- Is USDC required or can any token qualify?

Decision:

- Keep Base if it satisfies the rules.
- Activate Arbitrum only if rules or probes make it materially better.
- Do not support both chains in product UX until the final chosen path is stable.

## Partner Bounties

For every partner bounty, write:

- Required integration.
- Required chain.
- Required transaction type.
- Required proof.
- Demo expectation.
- Risk level.
- Whether it strengthens the core checkout or distracts from it.

Decision:

- Add only partner integrations that directly help the final chosen payment path.
- Cut optional integrations if they risk breaking the core demo.

## Claims Safety

Before updating README, pitch, or demo script, confirm:

- We do not claim cross-chain proof unless a final-rule-compliant cross-chain transaction exists.
- We do not claim `universal_invoice` works while Particle returns `-32801`.
- We do not claim AuthKit is active.
- We do not claim Arbitrum is active unless it is the selected product chain.
- We do not claim ZeroDev or Repeat-Pay Caps are implemented unless they are live and demoable.
- We clearly label demo replay as replay.
- We clearly label `transfer_fallback` as verified transfer plus proof, not the same thing as direct `payInvoice`.

## Go / No-Go

Proceed with implementation only after:

- Final rules are captured in `docs/status.md`.
- Payment mode decision is recorded.
- Chain decision is recorded.
- Required partner integrations are ranked.
- Probe matrix is rerun or explicitly deferred with a reason.
- No mainnet spend is needed without explicit approval.
