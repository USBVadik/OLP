# Partner Bounty Decision Tree

Use this after final UXmaxx partner bounties are published. The goal is to choose the smallest honest path that strengthens OneLink Pay.

## Starting State

- Magic: active wallet/auth path.
- Particle UA: active chain abstraction.
- Base: active working chain.
- Arbitrum: exploratory only.
- Particle AuthKit: inactive.
- `transfer_fallback`: default working mode.
- `universal_invoice`: gated strict path, currently blocked by Particle `-32801` for custom calls.
- ZeroDev / Repeat-Pay Caps: not implemented.
- Openfort: not implemented.

## First Decision: Is Particle UA Custom Call Support Working?

Run the probe matrix before changing product code.

If `createUniversalTransaction(approve + payInvoice)` works:

- Set candidate mode to `universal_invoice`.
- Verify Magic signing and any EIP-7702 authorization handling.
- Run one tiny live payment only with explicit approval.
- If successful, make strict invoice mode the final demo path.

If all custom `createUniversalTransaction` probes still return `-32801`:

- Keep `transfer_fallback`.
- Use Particle SEND/TRANSFER rail.
- Keep server-side USDC `Transfer` verification.
- Keep ReceiptEmitter proof transaction.
- Ask Particle/Encode whether this satisfies the bounty while custom calls are unavailable.

If transfer also fails:

- Stop product work.
- Collect exact errors.
- Ask Particle/Encode for supported chain, SDK version, and project settings.

## Magic Decision

If Magic is accepted or recommended:

- Keep Magic.
- Do not build Openfort or AuthKit in parallel.

If Magic is not accepted:

- Check whether Openfort is explicitly accepted.
- Timebox Openfort spike.
- Keep the same payment abstraction and proof model if possible.

If Particle AuthKit becomes mandatory:

- Timebox AuthKit spike.
- Compare it against Magic only after the spike.
- Do not migrate the checkout until login, UA init, balance, preview, and send all work.

## Arbitrum Decision

If Arbitrum is required:

- Rerun Arbitrum probes.
- Confirm native USDC address: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`.
- Confirm transfer preview/rootHash.
- Deploy ReceiptEmitter on Arbitrum only after explicit approval.
- Switch active chain only after one tiny proof path succeeds.

If Arbitrum is preferred but not required:

- Compare it against Base:
  - transfer rail reliability;
  - custom universal call support;
  - available wallet funds;
  - demo repeatability;
  - final bounty upside.
- Keep Base unless Arbitrum clearly improves prize alignment or reliability.

If Arbitrum custom calls still return `-32801`:

- Do not migrate for custom invoice mode.
- Keep Arbitrum documented as explored.

## ZeroDev Decision

Add ZeroDev only if all are true:

- Core payment path works repeatedly.
- Final rules or bounties make permission/session keys valuable.
- There is enough time for a real demo.
- The implementation can be honestly described as working.

If any condition fails:

- Keep Repeat-Pay Caps as planned stretch.
- Do not mention ZeroDev as implemented.
- Do not risk the core checkout for caps.

## Openfort Decision

Use Openfort only if:

- Final bounty explicitly rewards or requires it; or
- Magic becomes disallowed; or
- Openfort has a clearly working Particle UA path that Magic cannot provide.

Do not use Openfort if:

- Magic remains accepted.
- The core issue is Particle `createUniversalTransaction` maintenance.
- It would duplicate wallet work without improving payment execution.

## SEND/TRANSFER Fallback Decision

Keep `transfer_fallback` as final path if:

- Particle transfer preview works.
- Payment tx reaches the merchant.
- Backend verifies USDC `Transfer` server-side.
- ReceiptEmitter proof tx is recorded.
- Dashboard shows `PAID / proof ok`.
- Final rules accept this as a qualifying Particle-powered payment path.

Do not overclaim:

- This is not direct `payInvoice`.
- This is not cross-chain proof unless final-rule-compliant cross-chain transfer is demonstrated.
- This is not `universal_invoice`.

## Universal Invoice Decision

Switch to `universal_invoice` only if:

- Base or chosen chain custom universal calls work.
- `approve + payInvoice` returns preview/rootHash.
- `userOps` and EIP-7702 authorization requirements are understood.
- Magic signing works.
- `sendTransaction` returns a tx hash.
- ReceiptEmitter emits `InvoicePaid`.
- Dashboard marks `PAID` after server verification.

If `universal_invoice` fails with `-32801`:

- Show exact diagnostic.
- Do not silently fallback.
- Return to `transfer_fallback` only as an explicit product decision.

## Final Selection Rule

Choose the path with the highest score:

1. Satisfies final rules.
2. Works repeatedly.
3. Uses Particle UA honestly.
4. Shows a clear judge-facing checkout.
5. Has explorer proof.
6. Does not require risky last-minute architecture migration.

Reliability beats optional bounty breadth.
