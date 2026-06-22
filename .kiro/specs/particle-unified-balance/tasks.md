# Spec: particle-unified-balance — Tasks

> TDD-ordered. DoD per `methodology.md` §6. Read-only — fully self-verifiable (no gas).
> Branch: direct-on-main acceptable (additive, all green before each step ends).

## Phase 1 — pure summarizer (TDD)

- [x] **T1. Failing tests `assets.test.ts`.** Against a realistic `getPrimaryAssets` fixture:
  - summarizes total USD, tokens (symbol upper-cased, amount, USD), byChain breakdown;
  - chainIds = sorted unique across tokens;
  - accepts bare array OR `{ assets: [...] }`;
  - unknown/garbage shape -> `{ totalUsd: 0, tokens: [], chainIds: [] }` (never throws);
  - empty assets -> zero summary;
  - tokens sorted by USD desc;
  - `chainLabel` maps 8453/42161/10 and falls back to `Chain <id>`.
- [x] **T2. Implement `assets.ts`.** Green; typecheck + lint.

## Phase 2 — component

- [x] **T3. Build `universal-balance-card.tsx`.** Total USD prominent, chain chips, per-token
  per-chain breakdown, Particle attribution, loading/error/empty states. Tailwind only.

## Phase 3 — wire read-only UA into /agent

- [x] **T4. Inline `loadParticle()` + UA init on `/agent`.** After login, init UniversalAccount
  (ownerAddress = Magic EOA, useEIP7702) and call `getPrimaryAssets()`; summarize into state.
  try/catch -> error state. NO transaction.
- [x] **T5. Render `UniversalBalanceCard`** prominently on `/agent` (top of the armed view AND the
  pre-arm view so it shows right after login).

## Phase 4 — sponsor framing

- [x] **T6. Sponsor badges + honest balance caption** per design §5.

## Phase 5 — verify + docs

- [x] **T7. Full gate.** typecheck + lint + test:unit + build (dev stopped) green. Restart dev.
- [x] **T8. Render-check + live read.** `curl /agent` 200; after login the card shows the real
  aggregated balance (self-verify in browser — read-only, no gas). Capture the summary.
- [x] **T9. Docs.** master-tz (new E6 stories + spec row + §7); demo-runbook (mention unified
  balance in Part C); honest-claim-ledger (C18 — read-only unified balance, real cross-chain read);
  risk register (R-NEW-12/13).

## Acceptance

Closes when T1-T9 done and the live read shows a real multi-chain balance on `/agent`.

## Notes / progress log

- (2026-06-21) SHIPPED + closed. `summarizeUniversalBalance` + `chainLabel` (11 node:test) →
  `UniversalBalanceCard` → read-only Particle UA `getPrimaryAssets` wired into `/agent` (no tx, no
  gas). Sponsor badges (Particle/Magic/Arbitrum) + honest cross-chain caption added. Gate green:
  typecheck 0, lint 0, 105 unit tests, production build clean (19 routes), `/agent` renders 200.
  Docs: master-tz E6 + spec row + §7; demo-runbook Part C; honest-claim C18; risk R12/R13.
- Self-verifiable (read-only) — the live multi-chain balance shows for the payer wallet on `/agent`
  after login. User can confirm in the browser; no spend required.

## Status: CLOSED 2026-06-21 (read-only showcase; self-verifiable, no gas).
