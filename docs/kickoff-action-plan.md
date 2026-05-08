# Kickoff Action Plan

Use this on day one of the hackathon. Follow the steps in order. Do not add product features before the final chain and payment mode are chosen.

## 0. Start From Current Baseline

Current repo state:

- Magic active.
- Particle Universal Accounts active.
- Base fallback works.
- Arbitrum exploratory.
- AuthKit inactive.
- `transfer_fallback` default.
- `universal_invoice` gated and blocked by Particle `-32801` for now.
- Demo replay exists for safe judge walkthroughs.

Do not spend mainnet gas unless explicitly approved.

## 1. Check Final Rules

Open the final UXmaxx / Encode page and fill in:

- final deadline;
- final judging criteria;
- allowed pre-work policy;
- required Particle usage;
- required wallet/auth providers;
- required chains;
- cross-chain wording;
- required demo artifacts;
- video or deployment requirements.

Update:

- `docs/status.md`
- `docs/final-rules-checklist.md`
- README claims if needed

Stop if the rules conflict with the current architecture.

## 2. Check Final Partner Bounties

For each partner, write:

- required SDK;
- required chain;
- required transaction type;
- required proof;
- minimum demo expectation;
- risk level;
- prize upside.

Use `docs/partner-bounty-decision-tree.md` to decide:

- keep Magic or spike Openfort/AuthKit;
- keep Base or activate Arbitrum;
- keep `transfer_fallback` or switch to `universal_invoice`;
- add or cut ZeroDev.

Do not add a partner integration unless it has a direct reason from final rules or a clear bounty payoff.

## 3. Check Particle UA Status

Before touching checkout code, confirm whether Particle custom universal calls are still under maintenance.

Check:

- Particle docs/changelog.
- Discord/Encode/Particle guidance.
- Any reply from Carlos or Particle team.
- Whether the project needs allowlisting or dashboard settings.
- Whether a newer SDK is recommended.

If there is no clear answer, rerun probes before changing code.

## 4. Rerun Probe Matrix

Set locally:

```text
NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true
```

Run:

```bash
corepack pnpm dev
```

Open:

```text
http://localhost:3000/debug/particle-probe
```

Run probes:

1. Base transfer:
   - `createTransferTransaction`
   - Base USDC
   - merchant recipient

2. Base universal USDC.transfer:
   - `createUniversalTransaction`
   - single USDC `transfer`

3. Base universal approve:
   - `createUniversalTransaction`
   - single USDC `approve`

4. Base approve + payInvoice:
   - `createUniversalTransaction`
   - USDC `approve`
   - ReceiptEmitter `payInvoice`

5. Arbitrum transfer:
   - `createTransferTransaction`
   - Arbitrum native USDC
   - merchant recipient

6. Arbitrum universal call:
   - `createUniversalTransaction`
   - single USDC call
   - optional `approve + payInvoice` only if ReceiptEmitter exists there

Record for each:

- success/failure;
- rootHash present;
- fee quote present;
- token changes present;
- userOps count;
- `eip7702Auth` present;
- `eip7702Delegated`;
- exact error code/message;
- whether error is `-32801`.

Do not send transactions from the probe page.

## 5. Choose Chain

Default: keep Base.

Choose Base if:

- final rules allow it;
- transfer rail still works;
- proof path still works;
- no partner requires Arbitrum.

Activate Arbitrum only if:

- final rules or bounties prefer/require it; or
- Arbitrum probes are materially better; or
- Arbitrum is the smallest way to satisfy final cross-chain wording.

Before activating Arbitrum:

- confirm funds;
- confirm RPC;
- confirm ReceiptEmitter deployment need;
- get explicit approval before any deployment or live payment.

## 6. Choose Payment Mode

Default:

```text
NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback
```

Keep `transfer_fallback` if:

- transfer preview works;
- final rules accept SEND/TRANSFER;
- custom universal calls still return `-32801`;
- server verification and ReceiptEmitter proof remain stable.

Switch to:

```text
NEXT_PUBLIC_PAYMENT_MODE=universal_invoice
```

Only if:

- `approve + payInvoice` previews successfully;
- rootHash is present;
- EIP-7702 authorization handling is known;
- Magic signing works;
- tiny live payment succeeds with explicit approval;
- ReceiptEmitter emits `InvoicePaid`.

Never silently fallback. If strict mode fails, show the exact diagnostic and choose a mode deliberately.

## 7. Decide Whether To Add ZeroDev

Add ZeroDev only after:

- final chosen payment path works repeatedly;
- final bounties reward permissions/session keys;
- there is enough time for a real working repeat-pay cap demo.

Cut ZeroDev if:

- core payment path is unstable;
- final rules do not reward it;
- implementation would be UI-only;
- it risks breaking demo reliability.

## 8. Run Tests And Build

After any SDK/config/code change:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test:unit
cd contracts && corepack pnpm test
```

Before demo packaging:

```bash
corepack pnpm build
```

If any command fails:

- fix before adding features;
- record blocker in `docs/status.md`;
- do not move to demo polish.

## 9. Prepare Final Demo Path

Final demo path must show:

- merchant creates or opens invoice;
- customer signs in with Magic or final chosen wallet;
- Particle UA initializes;
- human-readable preview appears before payment;
- payment executes through chosen mode;
- explorer payment tx is visible;
- proof tx or direct `InvoicePaid` event is visible;
- dashboard refresh shows `PAID / proof ok`;
- limitations are stated honestly.

Keep demo replay as fallback, clearly labeled as replay.

## 10. Do Not Do On Day One

- Do not migrate to AuthKit unless final rules require it.
- Do not activate Arbitrum without rule/probe reason.
- Do not add ZeroDev before core payment is stable.
- Do not build Repeat-Pay Caps.
- Do not add QR.
- Do not add analytics.
- Do not add merchant auth.
- Do not add broad token support.
- Do not spend mainnet gas without explicit approval.
- Do not claim cross-chain proof until final-rule-compliant proof exists.
