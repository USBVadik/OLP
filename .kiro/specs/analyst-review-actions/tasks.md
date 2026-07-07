# Spec: Analyst-Review Actions — judge-readiness hardening

## Context
An external deep-review (independent Claude analyst, on the public repo) ran alongside our own
in-code verification this session. It independently re-opened our headline on-chain proofs and
confirmed they are real (success, exact amounts, InvoicePaid attestor = relayer ≠ merchant, R26)
and that the anti-overclaim discipline holds everywhere. It surfaced a short list of concrete,
high-credibility improvements. This spec turns them into tracked modules so nothing is missed.

Every item below was re-checked against the actual code / chain (not accepted on the analyst's word).

## Guardrails (apply to every module)
- Honesty is sacred: verify every public claim independently; the denylist holds — x402 *pattern*
  (not Coinbase facilitator), *unattended deterministic* loop (not LLM), *sponsored one-time 7702
  delegation* (not a general settlement paymaster), Circle/ZeroDev/Openfort = prior-art only,
  ERC-7715 = "aligned with" (not "invented"), cross-chain only Base↔Arbitrum (no breadth claim).
- Do NOT touch payment execution / `SpendPolicy` contract / EIP-712 struct / API behavior unless a
  module explicitly scopes it (only M5/R16 touches server code).
- After any code change: gate = `rm -rf .next && corepack pnpm typecheck && lint && test:unit &&
  build`; contracts = `cd contracts && corepack pnpm test` (22). Commit + deploy only on explicit
  "го" per step.
- Verify-first: confirm current state on-chain / in-code before editing.

## Verified-closed (no action needed)
- [x] Landing overclaim "It pays — across any chain" — NOT present in current code (grep clean);
      the analyst reviewed a stale deploy. H1 is the containment hook; subhead is accurate. Closed.
- [x] Headline on-chain proofs + attestor-split (R26) — re-verified Success on arbiscan/basescan.
- [x] SpendPolicy real error set confirmed by reading the contract (9 errors) — feeds M1.

## Modules & checklist

### M1 — ARCHITECTURE error-name accuracy · docs · S · no risk · DO FIRST
Real Solidity identifiers (`contracts/contracts/SpendPolicy.sol`):
`BadSignature, WrongChain, InvalidAmount, MandateExpired, MandateIsRevoked, PerChargeExceeded,
DailyCapExceeded, TotalCapExceeded, NotPayer`.
- [x] Fix `ARCHITECTURE.md` core-loop list `(PerChargeExceeded / DailyCap / TotalCap / Expired /
      Revoked)` → `(PerChargeExceeded / DailyCapExceeded / TotalCapExceeded / MandateExpired /
      MandateIsRevoked)`. DONE.
- [x] Grep every doc for stray short forms — grep-audit found the drift was ONLY in ARCHITECTURE;
      all code (charge route POLICY_ERRORS, spend-policy ABI, tests, runbook, other specs) already
      uses the correct identifiers. No further changes needed.
- [x] Confirmed `docs/demo-runbook.md` uses `MandateIsRevoked` + `PerChargeExceeded` (no change).
- **Acceptance:** every error name in judge-facing docs matches a real `error` in SpendPolicy.sol; a
  grep for the short forms returns nothing.

### M2 — Verify contracts on Basescan/Arbiscan · config + operator · S–M · no flow risk · HIGHEST ROI
- [ ] Check current verification status on all 4 explorer pages first (may already be verified):
      SpendPolicy Base `0x73C8…3957`, SpendPolicy Arbitrum `0x9782…164E`,
      ReceiptEmitter Base `0x89CF…5bC3`, ReceiptEmitter Arbitrum `0xe4C6…D2A1`.
- [ ] Read `contracts/hardhat.config.*` for exact solc version (`0.8.24`) + optimizer settings.
- [ ] Confirm constructor args: `SpendPolicy` = none (`constructor() EIP712("OneLink Pay","1")`);
      `ReceiptEmitter` = read `ReceiptEmitter.sol` + deploy script.
- [ ] Add `@nomicfoundation/hardhat-verify` + etherscan config (Etherscan V2 unified key covers
      Base + Arbitrum, or per-explorer keys). **Needs API key — USER provides; store in
      `contracts/.env` / env, never commit.**
- [ ] Run verify for all 4 (or manual explorer "Verify & Publish" with flattened source + exact
      compiler settings).
- [ ] Add "verified source" explorer links to `README.md` + `docs/proof-pack.md`.
- **Acceptance:** all 4 contracts show a green verified-source tab; links resolve; a judge can read
  `SpendPolicy.charge` on-chain.
- **Blocker:** Etherscan/Arbiscan API key.

### M3 — README micro honesty/clarity · docs · S · no risk
- [ ] **DEFERRED (needs user knowledge — external):** README/ARCHITECTURE say `2026-07-04`
      ("R19 closed on stable" / cross-chain re-run), but the canonical public receipt `fc5adc83`
      settled `2026-07-06` on-chain (`0x65ef…f72d`, RPC-verified). If 07-04 was a distinct earlier
      stable run, both are correct — leave. If 07-04 is just an imprecise date for fc5adc83, align
      to 07-06. NOT changing blindly (would risk erasing a real milestone or keeping a stale one).
- [x] Trim/drop the "Historical P0 Proof" Base Sepolia footnote (same hex as the Arbitrum
      ReceiptEmitter → confusion). DONE — whole section removed from the judge-facing README.
- **Acceptance:** no date contradiction with proof-pack; no dual-chain-same-hex trap in README.

### M4 — Landing: block-moment reachable first · UX · S–M · DESIGN DECISION
- [ ] DECISION (user): (a) keep concept H1 "Give your AI a card. Not your wallet." and elevate
      "Trigger the block yourself" (`/try`) to the FIRST / primary CTA **[recommended]**; or
      (b) demo-first hero (autoplay block loop); or (c) leave as-is.
- [ ] Implement per the decision; presentational only, don't break existing links/anchors.
- **Acceptance:** the walletless block-moment is reachable in one click above the fold; the H1
  positioning is preserved; gate green; prod re-verified.

### M5 — P1: relayer hardening + adoption narrative · M · some flow risk (R16)
- [ ] **DEFERRED (external):** R16 — segregate `RELAYER_PRIVATE_KEY` from
      `RECEIPT_EMITTER_OWNER_PRIVATE_KEY` (needs a NEW funded relayer key) + shared/persistent rate
      limiter (needs Redis/Upstash). Currently both keys map to the same relayer `0x0AC0…629f41`
      (verified). Left for the external batch.
- [x] Adoption: added a concrete "Who adopts it" use case (x402 API vendor requires a mandate at
      agent sign-up; also SaaS metering / marketplace budgets) to the landing adoption section —
      honest capability framing, no fake customer.
- **Acceptance:** relayer signer distinct from the attestor (deferred); charge still works; adoption
  section names a concrete customer + GTM (done); gate green.

### M6 — Pitch ammo (verify-first) · docs · S
- [x] Verified trust-gap sources via web: the analyst's ACI/YouGov 19%/59% could NOT be confirmed —
      dropped. Verified + used instead: Forrester (Jun 2026, ~75% uncomfortable EVEN with limits) +
      Riskified (Apr 2026, 55% uncomfortable, vs ~30% late 2025), both with real URLs.
- [x] Added verified market-context + trust stats to the `demo-runbook` Skeptic Q&A (+ sharpened the
      Coinbase/MetaMask answer with Coinbase for Agents Jun-2026 + MetaMask Advanced Permissions
      shipped on ERC-7715).
- [ ] PROPOSED (needs "го" — public `/trust`): add Forrester "even with limits" + Riskified to the
      `/trust` TRUST_STATS with source + url + asOf (must pass `assertAllSourced`). Held for user
      sign-off — `/trust` is judge-facing curated copy.
- **Acceptance:** any new `/trust` stat passes `assertAllSourced`; runbook Q&A is current; nothing
  unsourced ships to the app.

## Recommended order
M1 → M3 (cheap docs, high credibility) → **M2** (verify contracts — highest ROI, needs API key) →
M4 (decide + implement) → M5 (P1) → M6 (pitch). Per module: build → gate → commit → deploy (if
app-facing) → prod-verify, each on an explicit "го".

## Done when
All boxes checked, gate green, prod re-verified for every app-facing module, and
README / ARCHITECTURE / proof-pack / /trust are mutually consistent with the on-chain + code reality.
