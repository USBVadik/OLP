# Verified Funding Route — Design

## Approach: read-time enrichment (off the settlement path)

`/receipt/[id]` is already a server component (`force-dynamic`, async). Verify the funding route at
RENDER time — nothing in `mark-paid` or the DB changes. If verification is unavailable, the receipt
renders exactly as today.

## Pieces

1. **Pure mapper (unit-tested):**
   `deriveFundingRoute(activity, ctx) -> { verified: boolean; crossChain: boolean; sourceChainIds: number[]; reason: string }`
   - `ctx = { payer, merchant, settlementChainId }`.
   - Guards: `activity.status === 7` (FINISHED), `eqAddr(activity.sender, payer)`,
     `eqAddr(activity.receiver, merchant)`. Any fail → `{ verified: false, reason }`.
   - `sourceChainIds = unique(activity.tokenChanges.fromChains).filter(c => c !== settlementChainId)`.
   - `crossChain = sourceChainIds.length > 0`.
   - Pure + deterministic → tested against a captured `fc5adc83` activity fixture.

2. **Server helper:** `verifyFundingRoute(uaTransactionId, ctx) -> Promise<Route>`
   - No id → `{ status: "client_reported" }`.
   - Build a SERVER-side `UniversalAccount` (project creds + `ownerAddress = payer`, EIP-7702 opts).
     NOTE: the existing `createUniversal7702Account` is `"use client"` — add a server-safe
     constructor (or a shared credentials helper usable server-side).
   - `Promise.race([getTransaction(id), timeout(~2.5s)])`, wrapped in try/catch.
   - Feed the result to `deriveFundingRoute`; return `{ status: "particle_verified", sourceChainIds }`
     when `verified`, else `{ status: "client_reported" }`. NEVER throws into render.

3. **UI:** thread `verification: "particle_verified" | "client_reported"` into `CrossChainRoute` /
   the receipt caption. Wording:
   - `particle_verified` → "Funding route verified by Particle activity: {sources} → {settlement}".
   - `client_reported` → today's "funding source reported by your wallet" (unchanged).
   - Settlement/proof "verified on-chain" + the UniversalX activity link stay as-is.

## Failure / latency

Any throw, timeout, non-FINISHED status, or sender/receiver mismatch → silent fallback to
`client_reported`. The receipt MUST render fully even if Particle is down.

## Honesty

Vendor-verified (Particle backend) only — never "on-chain proven" for the funding route. L3 (verify
the source-chain USDC debit tx on-chain) stays a separate future step, contingent on the
`*UserOperations` legs exposing usable source-chain tx hashes.

## Test plan

- Unit: `deriveFundingRoute` with (a) real `fc5adc83` fixture → crossChain, sources `[8453]`,
  verified; (b) same-chain fixture → not crossChain; (c) sender/receiver mismatch → not verified;
  (d) `status != 7` → not verified.
- Live: after wiring, re-render `/receipt/fc5adc83…` and confirm "verified by Particle activity" +
  Base → Arbitrum; confirm a bogus/missing id still renders "reported".
- Gate: typecheck / lint / unit / build green; `mark-paid` + payment tests untouched.
