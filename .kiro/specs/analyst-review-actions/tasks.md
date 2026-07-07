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
- [x] Landing overclaim "It pays — across any chain" — WAS present after all (in
      `scroll-narrative.tsx` + "every/any chain" chips in agent/sponsor/receive/balance). My earlier
      "not present" call was a FALSE NEGATIVE from a flaky grep — the analyst was RIGHT. Found + fixed
      in the mobile-QA pass: "any/every chain" → "supported chains", "It pays across any chain" → "It
      routes across supported chains", "exact cross-chain flow" → "exact Base → Arbitrum flow". Honest now.
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

### M2 — Verify contracts on Basescan/Arbiscan · config + operator · DONE 3/4 · HIGHEST ROI
- [x] hardhat-verify already ships in `hardhat-toolbox` (v2.1.3); added an `etherscan` block to
      `hardhat.config.ts` reading `ETHERSCAN_API_KEY` from `contracts/.env` (Etherscan V2 single key
      covers Base + Arbitrum). `contracts/.env` gitignored + key salvaged from a TextEdit RTF.
- [x] Solc confirmed **0.8.28** (opt 200, cancun) for the primary deploys. Constructor args:
      SpendPolicy = none; ReceiptEmitter = `initialOwner` = deployer = relayer `0x0AC0…629f41`.
- [x] **SpendPolicy verified — Base + Arbitrum** (the enforcement contract, both chains). ✅
- [x] **ReceiptEmitter verified — Arbitrum** (`0xe4C6…D2A1`). ✅
- [ ] ReceiptEmitter **Base** (`0x89CF…5bC3`) NOT matched — it's an earlier **v1.1** build on solc
      **0.8.24** whose source/settings differ from the current repo (tried 0.8.24+cancun and
      0.8.24+shanghai — bytecode mismatch → different source, not reconstructable). Accepted: its
      source is readable via the byte-identical verified Arbitrum deployment.
- [x] Added "verified source (read the contract)" links to `README.md` + `docs/proof-pack.md`.
- **Acceptance:** the enforcement contract (SpendPolicy) is judge-readable on both chains; 3/4
  verified; config reverted to 0.8.28 + 22 contract tests green.

### M3 — README micro honesty/clarity · docs · S · no risk
- [x] **RESOLVED — no change (honesty over agreement).** risk-register R19 shows `2026-07-04` was a
      REAL distinct stable re-verify (invoices `580a1fd4` + `2cbb6ff6`), separate from `fc5adc83`
      (07-06). Both dates are correct; no contradiction. User guessed "same run" but the ledger
      disproves it — left the dates unchanged rather than erase a real milestone.
- [x] Trim/drop the "Historical P0 Proof" Base Sepolia footnote (same hex as the Arbitrum
      ReceiptEmitter → confusion). DONE — whole section removed from the judge-facing README.
- **Acceptance:** no date contradiction with proof-pack; no dual-chain-same-hex trap in README.

### M4 — Landing: block-moment reachable first · UX · DONE (a)
- [x] DECISION (a): kept the concept H1 "Give your AI a card. Not your wallet." and elevated the
      walletless block `/try` to the PRIMARY CTA ("Watch an AI get blocked — no wallet"); firewall
      demoted to secondary; note copy updated (block above needs no wallet).
- [x] Gate green; deployed; prod-verified — "Watch an AI get blocked" live on the landing.
- **Acceptance:** the block-moment is the first CTA above the fold; H1 preserved. ✅

### M5 — P1: relayer hardening + adoption narrative · DONE (light)
- [x] **R16 (light — done, user chose light):** honest documentation instead of full hardening.
      Corrected the STALE "distinct relayer key deployed" claim in risk-register R16 + the ledger
      closed-trace — after R26 (07-06) the relayer key == the proof/attestor key `0x0AC0…629f41`
      (NOT distinct); the in-memory rolling-window guard bounds public charge/delegation gas; prod
      needs a THIRD dedicated key + shared/Redis limiter. Full R16 (new funded key + Redis) deferred
      to a non-demo public deploy.
- [x] Adoption: added a concrete "Who adopts it" use case (x402 API vendor requires a mandate at
      agent sign-up; also SaaS metering / marketplace budgets) to the landing adoption section —
      honest capability framing, no fake customer.
- **Acceptance:** R16 honestly documented; charge still works; adoption names a concrete GTM. ✅

### M6 — Pitch ammo (verify-first) · docs · S
- [x] Verified trust-gap sources via web: the analyst's ACI/YouGov 19%/59% could NOT be confirmed —
      dropped. Verified + used instead: Forrester (Jun 2026, ~75% uncomfortable EVEN with limits) +
      Riskified (Apr 2026, 55% uncomfortable, vs ~30% late 2025), both with real URLs.
- [x] Added verified market-context + trust stats to the `demo-runbook` Skeptic Q&A (+ sharpened the
      Coinbase/MetaMask answer with Coinbase for Agents Jun-2026 + MetaMask Advanced Permissions
      shipped on ERC-7715).
- [x] `/trust` DONE (user "go"): Forrester "even with limits" was ALREADY the top TRUST_STAT; added
      Riskified (2026-04, "distrust is rising" trend) — sourced, passed `assertAllSourced`, deployed
      + prod-verified ("Distrust is rising" live on `/trust`).
- **Acceptance:** any new `/trust` stat passes `assertAllSourced`; runbook Q&A is current; nothing
  unsourced ships to the app.

## Recommended order
M1 → M3 (cheap docs, high credibility) → **M2** (verify contracts — highest ROI, needs API key) →
M4 (decide + implement) → M5 (P1) → M6 (pitch). Per module: build → gate → commit → deploy (if
app-facing) → prod-verify, each on an explicit "го".

## Done when
All boxes checked, gate green, prod re-verified for every app-facing module, and
README / ARCHITECTURE / proof-pack / /trust are mutually consistent with the on-chain + code reality.
