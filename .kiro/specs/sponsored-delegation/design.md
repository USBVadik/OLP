# Spec: sponsored-delegation — Design

> Pairs with `requirements.md` + `tasks.md`. TDD the pure core; live-verify the relayer/RPC glue.
> No change to settlement, SpendPolicy, or the EIP-712 mandate.

## 1. Mechanism (EIP-7702 sponsored delegation)

```
Payer (Magic EOA, 0 native gas)                Relayer (0x0AC0…, funded)
  1. sign7702Authorization({addr, chainId, nonce})   ── auth tuple (r,s,yParity) ──▶  POST /api/delegate/sponsor
                                                       2. validate + gas-budget check
                                                       3. submit type-4 tx:
                                                          to = payer EOA, data = 0x,
                                                          authorizationList = [auth]   (relayer pays gas)
                                                       4. wait receipt ─────────────▶  { delegationTxHash }
  5. proceed with the normal payment (build → sign → settle) — unchanged
```

Nonce (verified, EIP-7702 §Behavior): the tx increments the **sender** nonce first, then checks
`authority.nonce == auth.nonce`.
- self-submit (EOA sends): `auth.nonce = eoaNonce + 1` (today's `delegateChain7702`).
- sponsor-submit (relayer sends): `auth.nonce = eoaNonce` (this feature).

`sign7702Authorization` is chain-specific (Magic can't sign chain-agnostic `chainId 0`) — pass the
concrete `chainId`, matching the reference repo + our existing flow.

## 2. Pure module — `src/lib/particle/sponsored-delegation.ts` (TDD)

```ts
export const SUPPORTED_SPONSOR_CHAINS: readonly number[]; // Base, Arbitrum, Optimism (relayer-funded)

/** EIP-7702 authorization nonce for the given submitter. self = authorityNonce+1, sponsor = authorityNonce. */
export function authorizationNonce(authorityNonce: bigint, submitter: "self" | "sponsor"): bigint;

/** Flag gate — default OFF; shipping is a no-op until a live spike verifies the path. */
export function isSponsoredDelegationEnabled(env?: Record<string, string | undefined>): boolean;
//   reads NEXT_PUBLIC_SPONSORED_DELEGATION === "true"

/** Validate a sponsor request before the relayer spends any gas. Returns {ok} | {ok:false,error}. */
export function validateSponsorRequest(req: unknown): SponsorRequestResult;
//   guards: payer is a 0x…40-hex EOA; chainId ∈ SUPPORTED_SPONSOR_CHAINS; authorization tuple well-formed
//   (address 20-byte, chainId matches, nonce ≥ 0, r/s 32-byte hex, yParity 0|1). Fail-closed.
```

All fail-closed and side-effect-free → unit-tested. No key material, no network here.

## 3. Relayer route — `src/app/api/delegate/sponsor/route.ts` (live-verify glue)

- Parse + `validateSponsorRequest`; 400 on failure.
- Reuse the R16 dedicated `RELAYER_PRIVATE_KEY` + the in-memory rolling-window gas-budget guard
  (a sponsored delegation is a gas-spending send → counts against the window; reject when exhausted).
- Build the type-4 tx with viem: `walletClient.sendTransaction({ to: payer, data: "0x",
  authorizationList: [{ address, chainId, nonce, r, s, yParity }] })` on the payer's chain RPC.
- `waitForTransactionReceipt`; return `{ delegationTxHash, chainId }` (or 5xx with a clean message).
- Never logs key material; the authorization is the user's (scoped to the delegate contract).

## 4. Client wiring — `src/lib/particle/delegation.ts` / `/pay`

- New `sponsoredDelegateChain(magic, ua, ownerAddress, chainId, log)`: `getEIP7702Auth([chainId])` →
  `sign7702Authorization({ contractAddress, chainId, nonce: <authorityNonce> })` (sponsor nonce = N) →
  POST `/api/delegate/sponsor` → poll `getEIP7702Deployments` until delegated (as today).
- In the delegation step: `if (isSponsoredDelegationEnabled()) sponsoredDelegateChain(...) else
  delegateChain7702(...)`. On any sponsor error → fall back to `delegateChain7702` (self-paid). The
  existing path is untouched and remains the default.

## 5. Honesty + risk

- Relayer pays real gas → bounded by the R16 window guard; document the ops cost. New risk entry.
- "Gas sponsorship" claim stays denylisted until the live spike verifies a relayer-paid delegation
  on-chain; then add a ledger row (`last_verified`, med risk — depends on relayer funding + Magic auth).
- Flag OFF by default → no behavior change on ship; two-path fallback = no regression to the proven
  self-paid delegation.

## 6. Testing

- **Unit (TDD):** `authorizationNonce` (self=+1, sponsor=+0, bigint, nonce 0 edge); `isSponsoredDelegationEnabled`
  (true only for "true", fail-closed); `validateSponsorRequest` (valid tuple; rejects bad EOA / unsupported
  chain / malformed r,s,yParity / chainId mismatch).
- **Live spike (user):** a zero-gas payer delegates one chain via the relayer; RPC `eth_getCode(EOA)` ==
  `0xef0100 || delegate`; payment then completes. Gate before flipping the flag + adding the claim.

## 7. References

- EIP-7702 spec (nonce/sponsor semantics), `src/lib/particle/delegation.ts` (self-paid path),
  `src/app/api/mandates/charge/route.ts` (R16 relayer key + gas-budget guard to reuse),
  `docs/workshop-insights.md` §F (sponsor-blessed gas-sponsorship path), `docs/risk-register.md` R16.
