# Hackathon Start Runbook

> **SUPERSEDED / HISTORICAL (kickoff-era planning, 2026-05).** This file reflects
> the early Base-active / Arbitrum-exploratory / `transfer_fallback` plan that was
> later reversed. Current reality: Arbitrum-first settlement,
> `universal_7702_transfer`, and cross-chain payment proven live in ledger C21.
> Source of truth: `docs/status.md`, `docs/agent-context.md`,
> `docs/honest-claim-ledger.md`, and `docs/demo-runbook.md`. Kept for trace only;
> do not act on the chain or payment-mode directives below.

Use this after the official Encode/UXmaxx kickoff. Until final rules are live, do not add product features, spend mainnet gas, or migrate the architecture.

## 1. Read Final Encode/UXmaxx Page

Open the final competition page and record in `docs/status.md`:

- Final judging criteria.
- Final submission deadline.
- Whether pre-hackathon prototypes are allowed.
- Whether code must be written after kickoff.
- Required demo format: deployed app, local app, video, GitHub repo, or all of these.
- Exact wording around Particle Universal Accounts, EIP-7702, and cross-chain operations.

Do not continue implementation until this is written down.

## 2. Read Final Partner Bounties

Check all final sponsor/partner bounties and write down:

- Required SDKs.
- Required chain(s).
- Required transaction type(s).
- Required proof or explorer links.
- Any mandatory wallet/auth provider.
- Whether ZeroDev, Arbitrum, Magic, Openfort, Particle AuthKit, or other partners are explicitly required.

Decision rule:

- If a partner requirement conflicts with the current working path, timebox a spike before migrating.
- If a partner is optional, do not add it until the core checkout still works.

## 3. Check Particle UA Maintenance Status

Before touching code, check whether Particle custom universal calls are still blocked.

Confirm:

- Is `createUniversalTransaction()` custom-call support active for this project?
- Is `-32801 System maintanence...` still returned?
- Is the feature behind project allowlist, SDK version, chain support, or dashboard setting?
- Is Base supported differently from Arbitrum?
- Are there new EIP-7702 authorization requirements for Magic signing?

If the answer is unclear, rerun the probe matrix and keep `transfer_fallback` active until proven otherwise.

## 4. Update Particle SDK Only If Needed

Do not upgrade SDKs just because a newer version exists.

Upgrade only if:

- Particle docs/changelog says the target issue is fixed.
- Carlos/Particle/Encode recommends a specific version.
- The final rules require a newer version.
- Probe matrix suggests current SDK is the blocker.

After any SDK change:

```bash
corepack pnpm install
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test:unit
cd contracts && corepack pnpm test
```

Then rerun the probe matrix.

## 5. Rerun Probe Matrix

Start the app:

```bash
corepack pnpm dev
```

Open:

```text
http://localhost:3000/debug/particle-probe
```

Enable:

```text
NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true
```

Run probes in this order:

1. Base transfer:
   - `createTransferTransaction()`
   - Base USDC
   - merchant recipient

2. Base universal USDC.transfer:
   - `createUniversalTransaction()`
   - one custom USDC `transfer`

3. Base universal approve:
   - `createUniversalTransaction()`
   - one custom USDC `approve`

4. Base approve + payInvoice:
   - `createUniversalTransaction()`
   - USDC `approve`
   - `ReceiptEmitter.payInvoice`

5. Arbitrum transfer:
   - `createTransferTransaction()`
   - Arbitrum native USDC
   - merchant recipient

6. Arbitrum universal call:
   - `createUniversalTransaction()`
   - at least one custom USDC call
   - optional `approve + payInvoice` only if ReceiptEmitter is deployed there

For every probe, record:

- result: success/failure
- rootHash present: yes/no
- userOps present: yes/no
- eip7702Auth present: yes/no
- eip7702Delegated value
- exact error code/message
- whether the error is Particle `-32801`

Do not send transactions from the probe page unless explicitly approved.

## 6. Choose Final Chain

Default:

```text
Base mainnet, chainId 8453
```

Activate Arbitrum only if at least one of these is true:

- Final partner bounty explicitly prefers/requires Arbitrum.
- Arbitrum probes work materially better than Base.
- Arbitrum is the smallest way to satisfy the final cross-chain requirement.

Do not activate Arbitrum if:

- Arbitrum custom calls still return `-32801`.
- Arbitrum transfer still fails simulation.
- There is no funded test wallet/UA and no explicit approval to spend gas.
- Base already satisfies the final rules.

## 7. Choose Final Payment Mode

Default:

```text
NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback
```

Keep `transfer_fallback` if:

- Base transfer works.
- Custom universal calls still return `-32801`.
- Final rules accept Particle SEND/TRANSFER plus server-side USDC `Transfer` verification and ReceiptEmitter proof.

Switch to:

```text
NEXT_PUBLIC_PAYMENT_MODE=universal_invoice
```

Only if:

- `createUniversalTransaction(approve + payInvoice)` returns preview/rootHash.
- EIP-7702 authorization handling is understood.
- Magic signing path works.
- One full tiny payment can complete without manual fallback.

Never silently fallback from `universal_invoice` to `transfer_fallback`. If strict mode fails, show the exact diagnostic and choose mode deliberately.

## 8. Build Only Final Chosen Path

After choosing chain and payment mode:

- Update `docs/status.md`.
- Update README wording.
- Keep only the selected path in the primary demo script.
- Keep alternate paths documented as fallback/probe paths.
- Do not broaden token support before the selected path is stable.
- Do not add UI polish until the selected path works end-to-end.

## 9. When To Add ZeroDev

Add ZeroDev only if all are true:

- Core checkout path works repeatedly.
- Final partner bounties make ZeroDev strategically useful.
- There is enough time for a real permission/session-key demo.
- The implementation can be honestly demonstrated.

If any condition fails:

- Keep ZeroDev as stretch/planned.
- Do not claim Repeat-Pay Caps are implemented.

## 10. Prepare Final Demo And Submission

After the final path is stable:

- Create one fresh demo invoice.
- Use the smallest safe USDC amount.
- Capture payment tx explorer link.
- Capture proof tx explorer link.
- Confirm dashboard shows PAID/proof status after refresh.
- Prepare fallback demo replay page.
- Write final limitations honestly.
- Prepare 30-second pitch, 60-second pitch, README run steps, and submission text.

## Do Not Do Before Final Rules Are Live

- Do not add ZeroDev.
- Do not build Repeat-Pay Caps.
- Do not build QR links.
- Do not build merchant auth.
- Do not migrate to Particle AuthKit checkout.
- Do not activate Arbitrum as product chain.
- Do not add multi-token support.
- Do not do UI polish/branding/landing-page work.
- Do not spend mainnet gas.
- Do not claim cross-chain proof is final.
- Do not claim `universal_invoice` works while Particle returns `-32801`.
