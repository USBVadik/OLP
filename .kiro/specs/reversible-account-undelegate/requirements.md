# Spec: reversible-account-undelegate — Requirements

> Epic: **UA + EIP-7702 depth / non-custody differentiation**
> Story: As a user (or a judge trying the product), I can **revert my delegated account back to a
> plain wallet in one click** — proving the 7702 upgrade lives on *my own EOA* and is fully
> reversible, with no vendor lock-in.
> Priority: **P1** (sharpest differentiator vs the now-commoditized field — see below)
> Estimated effort: **S (one client helper + one `/wallet` panel; no contract change, no payment-path change)**
> Process: `.kiro/steering/methodology.md`
> Scores: **UA+7702 30 · Polish 10 · (supports UX 40 trust)**

## 1. Why this exists

Deep research (2026) shows on-chain agent **spend limits are now table stakes** — shipped by Coinbase
Agentic Wallets (MPC+TEE), AWS AgentCore Payments, Cobo, MetaMask (ERC-7715/7710), plus pure-plays
(Intent Layer). Those run on **vendor-managed / MPC / separate smart-account** custody perimeters.
OneLink's one un-copied wedge is that the mandate lives on the **user's own EOA via EIP-7702 (same
address), wallet-agnostic** — and is **reversible to a plain wallet**.

Today we can *delegate* (arm) but we have **no `undelegate`** (confirmed in `docs/workshop-insights.md`
§B, diff vs the reference repo `soos3d/workshop-demo-02`). The Particle workshop (Zambiasi) states
delegation is reversible by signing the 7702 authorization to the **zero address**. Adding it turns
"reversible / no lock-in" from a claim into a **live, demoable beat** and directly answers the skeptic
question the research surfaced: *"How is this different from Coinbase Agentic Wallets?"* → "it's YOUR
account — watch me turn it back into a plain wallet."

This is **additive** and does not touch the payment path we live-verified on SDK 2.0.3.

## 2. Honesty constraints (map every public line to the ledger)

- **Not gasless.** Undelegation is a **Type-4 transaction** that needs a little native gas **on that
  chain**, per chain — exactly like the one-time delegation. Never imply "free" or "gasless".
- **Per-chain.** The account can be delegated on several chains (Base, Arbitrum, …); undelegate acts
  **per chain**. State which chains are affected.
- **Reversible both ways.** After undelegate the EOA is a plain wallet again; a future payment simply
  re-delegates (the existing `/pay` flow already checks `isDelegated` and re-delegates if needed).
- **Undelegate ≠ mandate revoke.** Reverting the *account delegation* is **distinct** from revoking a
  *SpendPolicy mandate* (C-rows). Copy must not conflate them: one clears the 7702 upgrade, the other
  cancels a spend authorization. Both are "reversibility", different layers.
- **New public claim only after live-verify.** The "revert to a plain wallet" claim gets a
  `docs/honest-claim-ledger.md` row **only after** a real undelegate tx + `eth_getCode == 0x` is
  observed (user-run). Until then it is "implemented, live-verify pending".
- **No contract / struct change.** The deployed `SpendPolicy` and the EIP-712 `PaymentMandate` are
  **untouched** (protects C5/C6/C16/C17/C21).

## 3. Non-regression constraints (explicit — this must be pure progress)

- **Do NOT modify the verified payment path.** `delegateChain7702` and `sendVia7702` in
  `src/app/pay/[id]/page.tsx` stay byte-unchanged. The new helper is separate and additive.
- **Do NOT touch canonical positioning** (`Give your AI a card, not your wallet`), the hero, or any
  claim copy outside this feature's own UI.
- **Isolation:** a failure in undelegate (no gas, RPC flake, user cancel) must **not** affect login,
  balance, or payments — it is a self-contained action with its own error state.
- **Gate green before deploy:** `pnpm typecheck` + `pnpm lint` + `pnpm test:unit` + `pnpm build` pass;
  ship on the feature branch with per-commit rollback.

## 4. Acceptance criteria (EARS)

### Ubiquitous
- The system shall provide a client helper `undelegateChain(magic, ua, ownerAddress, chainId)` that
  signs a 7702 authorization to the **zero address** and broadcasts the Type-4 transaction, mirroring
  the proven `delegateChain7702` flow (same nonce/`switchChain`/poll logic, target = `0x0…0`).
- The system shall provide a client helper `getDelegationStatus(ua, chainIds)` returning, per chain,
  whether the owner EOA is currently delegated (via `getEIP7702Deployments()`), so the UI can render
  account mode without guessing.
- The `/wallet` page shall show an **"Account mode"** panel listing each supported chain (Base,
  Arbitrum) as either **"Smart account (delegated)"** or **"Plain wallet"**.

### Event-driven
- When the account is delegated on a chain and the user clicks **"Revert to a plain wallet"**, the
  system shall show a confirmation explaining: it sends a small on-chain transaction on that chain
  (native gas required), returns the address to a normal wallet, and can be re-armed later.
- When the user confirms, the system shall run `undelegateChain` for that chain, then re-read status
  and reflect **"Plain wallet"** on success.
- When undelegation succeeds, the system shall surface the transaction hash with an explorer link for
  that chain (so it is independently verifiable).
- When native gas is missing / the send fails / the user rejects, the system shall show a clear,
  non-alarming error and leave the account **unchanged** (still delegated), with a Retry affordance.

### State / verification
- Where an undelegation completed, `eth_getCode(ownerAddress)` on that chain shall return `0x`
  (no delegation), and this is the acceptance proof recorded at live-verify.
- Where the user later makes a payment after undelegating, the existing `/pay` flow shall
  transparently re-delegate (no code change needed) and settle normally.

### Accessibility / polish
- The panel shall meet AA contrast, be keyboard-operable, and announce status changes (aria-live);
  respect reduced-motion.

## 5. Out of scope
- De-duplicating the 7702 delegation logic across `/pay` and the debug pages (future refactor).
- Any change to `SpendPolicy`, mandate flow, or gas sponsorship.
- Optimism (only Base + Arbitrum are in-scope for the panel; the helper is chain-generic).
