# Spec: reversible-account-undelegate — Tasks

> Process: `.kiro/steering/methodology.md` · Requirements: `./requirements.md` · Design: `./design.md`
> Rule: check a box only when verifiably true (build/gate/RPC). Payment path stays untouched.

## Implementation

- [ ] **T1 — Helper module** `src/lib/particle/delegation.ts`
  - [ ] `ZERO_ADDRESS` const + `getDelegationStatus(ua, chainIds)` (reads `getEIP7702Deployments()`).
  - [ ] `undelegateChain(magic, ua, ownerAddress, chainId, log?)` — switchChain → getEIP7702Auth →
        `sign7702Authorization({ contractAddress: ZERO_ADDRESS, chainId, nonce: auth.nonce+1 })` →
        `send7702Transaction` → poll until `!isDelegated` (timeout-safe). Early-return if already plain.
  - [ ] No import from `pay/[id]/page.tsx`; SDK reads guarded (`?.`), fail-closed.

- [ ] **T2 — `/wallet` Magic init (additive)**
  - [ ] Add `EVMExtension` (Base + Arbitrum RPCs) alongside the existing `OAuthExtension` so
        `sign7702Authorization` / `send7702Transaction` / `evm.switchChain` are available.
  - [ ] Confirm the existing read-only balance path still works (no regression).

- [ ] **T3 — "Account mode" panel** (new component, e.g. `src/components/account-mode-card.tsx`)
  - [ ] Per-chain rows (Base, Arbitrum) with status chip: "Smart account · active" | "Plain wallet".
  - [ ] "Revert to a plain wallet" action on delegated rows → confirm dialog (native-gas + reversible
        copy) → `undelegateChain` → spinner → re-read status → show tx hash + `getExplorerTxUrl` link.
  - [ ] Error state (no gas / reject / RPC) is isolated, non-alarming, with Retry; account unchanged.
  - [ ] AA contrast, keyboard-operable, `aria-live` on status change, reduced-motion respected.
  - [ ] Mount the panel on `/wallet` below the balance (only when logged in).

## Gate (before any deploy)

- [ ] `corepack pnpm typecheck` green.
- [ ] `corepack pnpm lint` green.
- [ ] `corepack pnpm test:unit` green (add a small unit test for `getDelegationStatus` mapping if cheap).
- [ ] `corepack pnpm build` green (ignore the known benign ox/viem "Critical dependency" warning).
- [ ] Manual smoke: `/wallet` loads, balance still reads, panel renders correct status; `/pay`
      unaffected (payment path unchanged).

## Live-verify (user-run — fund-moving / on-chain)

- [ ] On the funded demo wallet, `/wallet` shows Base + Arbitrum as delegated.
- [ ] Click "Revert to plain wallet" on **one** chain (e.g. Base) → tx confirms → panel flips to
      "Plain wallet"; record the undelegate tx hash.
- [ ] Independently confirm `eth_getCode(payer, Base) == 0x` (RPC).
- [ ] Make a small `/pay` on that chain → confirm it **re-delegates** and settles (reversibility both
      ways). Record the settle tx.
- [ ] (optional) Re-run for Arbitrum.

## Record (only after live-verify)

- [ ] Add a `docs/honest-claim-ledger.md` row: "7702 delegation is reversible to a plain EOA — proven
      live (undelegate tx …, `eth_getCode 0x`, then re-delegated on next pay …)."
- [ ] Add a demo-runbook beat: "arm → agent bounded → revoke mandate → **revert account to a plain
      wallet** (undelegate) — the close no vendor MPC wallet can show."
- [ ] Update `/trust` (or fold into Spec C): "delegation is reversible — your own account, no lock-in"
      (maps to the new ledger row).

## Non-regression checklist (confirm at PR)

- [ ] `delegateChain7702` / `sendVia7702` in `pay/[id]/page.tsx` unchanged (git diff shows no edits there).
- [ ] No change to `SpendPolicy` / EIP-712 `PaymentMandate` / mandate flow.
- [ ] Canonical positioning + hero untouched.
- [ ] Feature is behind its own `/wallet` panel; failure isolated from login/balance/payments.
