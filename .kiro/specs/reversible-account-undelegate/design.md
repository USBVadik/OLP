# Spec: reversible-account-undelegate — Design

> Process: `.kiro/steering/methodology.md` · Requirements: `./requirements.md`
> Principle: **additive + isolated.** New helper + one `/wallet` panel. The live-verified payment
> path (`src/app/pay/[id]/page.tsx`) is not edited.

## 1. Background (grounded in the current code)

7702 delegation logic today is **duplicated, not shared**: `delegateChain7702` lives in
`src/app/pay/[id]/page.tsx` (the canonical, live-verified flow) and again in the two `/debug/*`
pages. `src/lib/particle/universal-account.ts` only exposes account **factories**
(`createUniversal7702Account`), not the delegate flow.

On-chain reality (verified via `eth_getCode`, 2026-07-04): the payer EOA is delegated to the V2
delegate `0x13E00E08…89A5A` on Base + Arbitrum (Optimism still on the old V1 `0x6640…`). Undelegation
must clear whichever delegate is set, so it targets the **zero address** regardless of the current
delegate.

The reference repo `soos3d/workshop-demo-02` implements delegate + undelegate with one function
toggled by a `resolveTarget` closure: delegate → `auth.address`, undelegate → `ZERO_ADDRESS`. We
adopt that shape.

## 2. New module: `src/lib/particle/delegation.ts` (client)

Pure client helper (SDK typed as `any`, per `src/types/particle.d.ts`). No import from the pay page;
the pay page keeps its own copy untouched.

```
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Read: per-chain delegation status from the SDK.
async function getDelegationStatus(ua, chainIds: number[]):
  Promise<Record<number, { isDelegated: boolean; delegate?: string }>>
  // -> ua.getEIP7702Deployments(); map by chainId.

// Write: clear the 7702 delegation on one chain (Type-4 tx to zero address).
async function undelegateChain(magic, ua, ownerAddress, chainId, log?) {
  const status = await getDelegationStatus(ua, [chainId]);
  if (!status[chainId]?.isDelegated) return { alreadyPlain: true };
  await magic.evm.switchChain(chainId);
  const [auth] = await ua.getEIP7702Auth([chainId]);        // for the current nonce
  const authorization = await magic.wallet.sign7702Authorization({
    contractAddress: ZERO_ADDRESS,                          // <-- the only diff vs delegate
    chainId,
    nonce: auth.nonce + 1,                                  // EOA sends its own Type-4 tx
  });
  const txHash = await magic.wallet.send7702Transaction({
    to: ownerAddress, data: "0x", authorizationList: [authorization],
  });
  // poll getEIP7702Deployments until !isDelegated (or timeout), like delegateChain7702
  return { txHash };
}
```

Mirrors `delegateChain7702` beat-for-beat (switchChain → getEIP7702Auth → sign7702Authorization →
send7702Transaction → poll), so it inherits the proven nonce/auth semantics. Only `contractAddress`
differs (zero vs delegate).

## 3. UI: "Account mode" panel on `/wallet`

`/wallet` is the account-management face (read-only balance today). Add a panel below the balance:

- For each of **Base, Arbitrum**: a row with chain name + a status chip:
  - delegated → **"Smart account · active"** (gold/iris) + a subtle "Revert to plain wallet" link.
  - not delegated → **"Plain wallet"** (muted) + a subtle "Arm on next payment" hint (no action here).
- Clicking **Revert to plain wallet** opens a small confirm (native-gas note + reversible note),
  then calls `undelegateChain`, shows a spinner, then re-reads status + shows the tx hash + explorer
  link.

**Magic init change (scoped to `/wallet`):** `/wallet` currently inits Magic with OAuth only. Undelegate
needs Magic's **EVM extension** (`sign7702Authorization` / `send7702Transaction` / `evm.switchChain`)
— mirror the `/pay` init (EVMExtension configured for Base + Arbitrum RPCs + OAuthExtension). This is
additive to `/wallet` and does not affect other pages.

Reuse existing UI atoms (`op-card`, `Chip`, `Disclosure`, `IconShield`, explorer-link helper
`getExplorerTxUrl`). No new design system.

## 4. Verification (acceptance proof)

- After a successful undelegate on a chain, an independent `eth_getCode(ownerAddress)` on that chain
  returns `0x`. This is captured at live-verify (user-run) and pasted into the ledger row.
- After undelegating, a subsequent `/pay` re-delegates transparently (existing flow) → confirms
  reversibility both ways. Verified in the live-verify checklist, not in code.

## 5. Honesty & security

- Confirm dialog states plainly: "sends a small transaction on <chain> (needs a little native gas),
  turns this address back into a normal wallet, re-armable anytime."
- No claim of gasless/free. No change to SpendPolicy/mandate. Undelegate copy never says it "revokes
  the mandate" (separate layer).
- Ledger: add a row **only after** live-verify (undelegate tx + `eth_getCode 0x`), phrased as
  "the 7702 delegation is reversible to a plain EOA — proven live (tx …, code 0x)".

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| No native gas on the chain → send fails | Detect + clear error ("needs a little native gas on <chain>"); account stays delegated; Retry. Never brick the UI. |
| User undelegates then can't pay | Existing `/pay` re-delegates on next payment (checks `isDelegated`); call this out in the confirm ("re-armable anytime"). |
| SDK `any` typing hides shape drift | Guard reads (`?.`), fail-closed on missing fields; helper isolated so failure can't touch payments. |
| Touching `/wallet` Magic init regresses balance read | Additive extension only; keep the read-only balance path intact; gate + manual smoke on `/wallet`. |
| Poll never confirms (RPC lag) | Timeout with an honest "submitted; refresh to confirm" + the tx hash, like `delegateChain7702`. |

## 7. Out of scope
- Refactoring `delegateChain7702` into the shared helper (future de-dup; keep payment path frozen now).
- Optimism panel row (V1 delegate); helper is generic if needed later.
- Any gas-sponsorship of the undelegate tx (future, Pimlico/RV Fuel).
