# Spec: pitch-positioning-rewrite — Requirements

> Epic: **E1. AI-safe card narrative + agent-on-a-leash demo**
> Story: **E1.S4**
> Priority: **P1** (Block A, target close: 2026-06-21 EOD — same day as scaffold)
> Estimated effort: **1-2h**
> Process: `.kiro/steering/methodology.md`

## 1. Why this exists

All four deep-research reports converge on the same finding: the current public-facing
positioning ("consent + proof + permission-safety layer for Universal Accounts") is too
abstract to land in <30 seconds. Three abstract nouns before any verb. Judges will understand
us and forget us.

This spec rewrites the landing page and the README first section to a punchier, agent-first
narrative. No new components. No new code. Pure copy change with a typecheck + lint gate.

Highest impact-to-effort ratio on the board: ~1-2h of work shifts the hero, the meta-tag, and
the README opener — every public touchpoint.

## 2. User story covered

- **E1.S4** — As a visitor to the landing page, I see "AI-safe card" framing within 2 seconds,
  so I understand the product without scrolling.

## 3. Acceptance criteria (EARS)

### Ubiquitous
- The landing page hero shall not contain the phrase
  `"consent + proof + permission-safety"` or any equivalent triple-abstract-noun construction.
- The landing page eyebrow shall be ≤8 words.
- The landing page hero subhead shall be ≤60 words.
- The README first 100 words shall position the project as a hackathon contender (UXmaxx),
  not a "prototype".
- Every claim made in the new copy shall be backed by a row in
  `docs/honest-claim-ledger.md` (existing rows are sufficient if they cover the claim).
- The honest-scope footer on the landing shall remain present and shall NOT claim that
  cross-chain value movement via the Universal Account is live.
- The README's listed dependency versions shall match `package.json`.

### Event-driven
- **When** a visitor arrives at `/` without scrolling, **the system shall** display a
  positioning sentence framing the product as a spending limit for AI agents within the
  hero region (≤300px from top on a 1280×800 viewport).
- **When** a visitor reads the README first section, **the system shall** state the
  product's honest scope (firewall live on Base + Arbitrum; cross-chain via UA in progress).

### State-driven
- **While** Particle's V2 migration blocks `createUniversalTransaction`, **the system
  shall** describe the active payment rail honestly (transfer rail + server-verified proof),
  with no claims that custom calls are live.

### Unwanted-behavior
- **If** any new copy contradicts an existing claim ledger row, **the system shall** treat
  the contradiction as a release blocker — fix or remove the copy before merge.
- **If** the rewrite breaks an existing component prop or import, **the rewrite shall** be
  reverted and the spec re-scoped before retry.

## 4. Scope

### In scope
- `src/app/page.tsx`: hero eyebrow, hero h1, hero subhead, hero check bullets, pillar 3
  body, honest-scope footer micro-sharpen.
- `README.md`: replace first ~25 lines with the new positioning + honest-scope block; fix
  any version drift.
- `docs/honest-claim-ledger.md`: add row `C12` for the new positioning sentence so it can be
  reused in the pitch deck and demo voiceover.

### Out of scope (cut)
- Receipt component (`proof-receipt.tsx`) — already on-message after the prior honesty fix.
- Firewall hero (`src/app/firewall/page.tsx`) — already on-message
  ("Consent your AI agent can't break").
- Prior-art comparison table (covered by separate spec `prior-art-readme`).
- Logo / icon / typography changes.
- New components or new sections.
- Demo runbook update — folded into `agent-on-a-leash-demo` later.

## 5. Dependencies

- ✅ The honest claim ledger covers everything we will say about the firewall, proof
  receipts, EIP-7702, dual-chain deployment.
- ↪ The new positioning sentence itself becomes claim row `C12` and must point to this
  spec as proof artifact + the rendered landing page on the running dev server.

## 6. INVEST check

- **I**ndependent — does not block on or from any other spec. ✅
- **N**egotiable — final wording is open. ✅
- **V**aluable — UX 40 (positioning lands in <2s) + UA 30 (agent-first framing). ✅
- **E**stimable — 1-2h. ✅
- **S**mall — 2 files; pure copy. ✅
- **T**estable — typecheck + lint + a 5-second visual check on `/`. ✅

## 7. Definition of Done

Spec is closed when:

- All EARS criteria are met.
- `corepack pnpm typecheck` and `corepack pnpm lint` exit 0.
- A visual check on the running dev server confirms the new hero on `/` and the new opening
  on the rendered README (GitHub-flavored or VS Code preview).
- Claim ledger row `C12` is added.
- Verification trail row in `docs/master-tz.md` §7 is filled.
