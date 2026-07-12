# Research Agent Expense Card - Winning Use Case Spec

Status: implemented and verified live
Owner: OneLink Pay
Target: UXmaxx Universal Accounts Track

## Product Goal

Turn the existing x402 payment demo into one legible user story:

> A research agent can buy the paid data it needs to finish a task, but a buggy workflow cannot
> exceed the budget its owner signed.

The judge should understand, without reading technical logs:

- what task the agent was given;
- what permission the owner granted;
- what useful result the agent delivered;
- how much was spent;
- which unexpected purchase was blocked;
- where the on-chain evidence can be inspected.

## Guardrails

- Do not change payment execution, API contracts, SpendPolicy, ReceiptEmitter, Supabase, or env.
- Do not add an LLM or claim AI reasoning. The demo remains an unattended deterministic workflow.
- Keep x402 framed as the `onelink-mandate` pattern, not Coinbase facilitator compatibility.
- Do not claim the x402 purchases themselves were cross-chain. Link the separate canonical Particle
  UA Base-to-Arbitrum receipt as the track proof.
- Do not add dependencies or spend mainnet gas during implementation or QA.

## Modules

### M1 - Research task domain

File: `src/lib/agent/research-task.ts`

Responsibilities:

- define the fixed research mission;
- define the intended ordered resource plan;
- summarize successful, blocked, and failed outcomes;
- calculate atomic USDC spent/protected totals;
- create a deterministic human-readable brief from purchased payloads;
- remain pure and independently unit-testable.

### M2 - Mission card

File: `src/components/agent-mission-card.tsx`

Responsibilities:

- show the task before execution;
- show the signed per-tool and daily constraints;
- make the primary action `Run task with my budget`;
- state that the workflow is deterministic.

### M3 - Task result

File: `src/components/agent-task-result.tsx`

Responsibilities:

- show `Brief ready` as the primary outcome;
- show useful data purchased, unexpected spend blocked, and remaining daily budget;
- render the generated brief before technical evidence;
- show settlement links when available;
- expose raw payloads and agent activity only through a disclosure.

### M4 - Agent orchestration

File: `src/app/agent/page.tsx`

Responsibilities:

- execute the domain plan instead of sorting every catalog item by price;
- record one outcome per resource;
- preserve the existing real x402 and SpendPolicy calls unchanged;
- render Mission Card and Task Result around the existing wallet/mandate states.

### M5 - Judge-facing copy

Files: `src/app/page.tsx`, `src/app/pitch/page.tsx`

Responsibilities:

- name the concrete use case in one sentence;
- lead with completed work, not payment plumbing;
- keep Particle, Magic, EIP-7702, x402, and Arbitrum as supporting proof.

## Epics And Stories

### Epic E1 - Make the task obvious

- [x] E1.S1 Write this scoped specification and guardrails.
- [x] E1.S2 Show a fixed mission: prepare a short ETH market-risk brief.
- [x] E1.S3 Show the budget before execution: one provider, 0.10 USDC per tool, daily cap, revoke.
- [x] E1.S4 Replace `Send the agent` with `Run task with my budget`.

### Epic E2 - Produce a useful artifact

- [x] E2.S1 Define the intended resource plan explicitly.
- [x] E2.S2 Build a deterministic brief from the market and sentiment payloads.
- [x] E2.S3 Show total spent and blocked spend in atomic-safe calculations.
- [x] E2.S4 Show a clear incomplete state when required data was not delivered.

### Epic E3 - Make protection visible

- [x] E3.S1 Distinguish a policy block from an infrastructure error.
- [x] E3.S2 Explain that the premium export was an unexpected workflow request.
- [x] E3.S3 Keep `no funds moved` attached only to a genuine simulation block.
- [x] E3.S4 Preserve revoke, merchant scope, and remaining-budget visibility.

### Epic E4 - Reduce technical noise

- [x] E4.S1 Place task and outcome above x402 terminology and chain badges.
- [x] E4.S2 Move raw API payloads and terminal activity into `Technical activity`.
- [x] E4.S3 Keep proof links available without making hashes the primary result.
- [x] E4.S4 Verify the result at 320 px and desktop widths without overflow.

### Epic E5 - Make the use case discoverable

- [x] E5.S1 Add a concrete landing sentence about a research-agent tool budget.
- [x] E5.S2 Make `/agent` the primary use-case CTA while preserving the walletless `/try` fallback.
- [x] E5.S3 Update the pitch page so the task outcome precedes integration details.
- [x] E5.S4 Preserve all honesty boundaries in public copy.

### Epic E6 - TDD And Regression Safety

- [x] E6.S1 Add failing tests for mission identity and resource order.
- [x] E6.S2 Add failing tests for successful/blocked/error outcome classification.
- [x] E6.S3 Add failing tests for spent, protected, and remaining totals.
- [x] E6.S4 Add failing tests for complete and incomplete brief generation.
- [x] E6.S5 Run typecheck, lint, all unit tests, 22 contract tests, build, and live smoke.

## Acceptance Criteria

- [x] A judge can state the agent's task and result within 10 seconds after a live run.
- [x] The live task completes after two allowed paid calls.
- [x] The live 0.20 USDC premium export is visibly blocked by the 0.10 per-tool limit.
- [x] The result says exactly how much was spent and protected.
- [x] No raw JSON or terminal dominates the primary experience.
- [x] The deterministic-demo limitation is visible.
- [x] No payment, API, contract, database, or env behavior changes.
- [x] No mainnet transaction is sent during implementation or QA.
- [x] All automated gates pass with no regression.

## Live Acceptance Evidence

Verified on Arbitrum One on 2026-07-12 after explicit approval for a funded run.

- Payer: `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`
- Merchant: `0x8C54783849A2C042544efc37c4657Ee98a411Fb7`
- SpendPolicy: `0x9782e3724859469fbBAC5085EA8bf8E70724164E`
- Mandate ID: `0x67286b29643d9afabceca01c8b5c68c2b5808e8a3ba96e7f85f32f2da8bbd3b0`
- Market insight, `0.05 USDC`: [Arbiscan transaction](https://arbiscan.io/tx/0xbe1b718305fd60b228e27c44156678e2c13fd1714510d8b9a02aa161814d7eb3)
- Sentiment feed, `0.08 USDC`: [Arbiscan transaction](https://arbiscan.io/tx/0xfaa29913ae64dd0731b21758d58529d5f08e7b007e306c282b05012661254aa8)
- RPC verification: both receipts succeeded and contain matching `MandateCharged` plus Arbitrum
  USDC `Transfer` events from payer to merchant.
- On-chain mandate state after both purchases: `spentTotal=130000`, `spentToday=130000`,
  `revoked=false`.
- The `0.20 USDC` premium export returned `PerChargeExceeded` through the charge API before a
  transaction was submitted; state remained at `0.13 USDC` spent.
