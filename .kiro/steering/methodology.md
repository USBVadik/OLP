# OneLink Pay — Working Methodology

> Locked 2026-06-21. Binding for every change to OneLink Pay until the UXmaxx submission ships.
> Always-on steering: every Kiro session reads this and enforces it.
> Pairs with `docs/master-tz.md` (epics + stories + specs) and `docs/honest-claim-ledger.md`.

## 0. North Star

We are building a real contender for at least one prize at UXmaxx. Every decision optimizes for
that single goal: a memorable demo, in front of specific judges, on a specific date. Not "good
engineering" in the abstract — engineering aimed at the rubric.

The rubric (best-known, confirm at Jun 22 kickoff): UX 40 / UA+7702 30 / Adoption 20 / Polish 10.
Every spec must declare which axes it scores against.

## 1. Working principles (non-negotiable)

1. **Test-Driven Development (TDD).** Red → green → refactor. No production code without a
   failing test first. Solidity via Hardhat (`contracts/test/*.test.ts`). TypeScript via `node:test`
   (`*.test.ts` next to source). UI via interaction-level tests where feasible, manual checklists
   in `tasks.md` otherwise. See §6 for the rhythm.
2. **Spec-driven development.** No code change without a spec. No spec without a user story.
   No user story without an epic. Hierarchy is enforced: `Epic → User Story → Spec → Tasks`.
   See §3.
3. **Demo-driven development.** Every change must visibly serve the 3-minute demo, the public
   receipt, the README pitch, or one of the bonus tracks (Arbitrum / Magic / ZeroDev / Openfort).
   If it doesn't, it's scope creep and goes on the cut list (§10).
4. **Vertical slices.** Each user story produces a thin end-to-end demoable result. No "build the
   whole backend, then the whole frontend." The simplest UI + simplest backend that demos the
   story end-to-end is shipped first, then iterated.
5. **Honesty above polish.** We never claim what isn't proven. The Honest Claim Ledger
   (`docs/honest-claim-ledger.md`) is the source of truth. Any claim in README, pitch, demo, or
   social must have a row with a proof artifact and a `last_verified` date ≤ 7 days. Stale →
   re-verify or remove from the public surface.
6. **Reversibility budget.** Anything risky (new payment rail, new login provider, new chain) is
   killswitchable via env flag (e.g. `NEXT_PUBLIC_PAYMENT_MODE`). If something flakes during
   final-week testing, we toggle, we don't refactor.
7. **Reproducibility.** Every deployment, transaction, or external dependency lookup gets a
   row in `docs/status.md` with the exact command and a date. If asked "is this still working?"
   we re-verify in <5 minutes.

## 2. Scope of this document

This file governs *how* we work. It does not contain product decisions — those live in the
master TZ (`docs/master-tz.md`). When the two conflict, the master TZ wins for product;
this file wins for process.

## 3. Hierarchy

```
Epic (strategic outcome aligned to rubric)
  └─ User Story (INVEST-format, vertical, demoable)
       └─ Spec (.kiro/specs/<spec-id>/)
            ├─ requirements.md  (what + why, EARS acceptance criteria)
            ├─ design.md        (how, modules, contracts/APIs, sequence)
            └─ tasks.md         (numbered checkboxes, TDD-ordered)
                 └─ Task (single checkbox, has Definition of Done — §5)
```

- **Epic** lives in `docs/master-tz.md` §2. Has an ID (`E1`..`E5`), a name, the rubric axes it
  scores against, and the user stories under it.
- **User Story** lives under its epic in `docs/master-tz.md` §3. Format:
  `As <persona>, I <action>, so that <value>.` Has an ID (`E1.S1`..) and an INVEST checkmark.
- **Spec** lives in `.kiro/specs/<kebab-case-id>/`. The spec ID is referenced from the master TZ.
- **Task** is a checkbox in the spec's `tasks.md`. Each task is small enough to commit (<2h work).

## 4. EARS notation for requirements

Every acceptance criterion in `requirements.md` uses Easy Approach to Requirements Syntax (EARS).
Five templates:

- **Ubiquitous:** `The <system> shall <response>.`
- **Event-driven:** `When <trigger>, the <system> shall <response>.`
- **State-driven:** `While <state>, the <system> shall <response>.`
- **Optional:** `Where <feature is enabled>, the <system> shall <response>.`
- **Unwanted-behavior:** `If <trigger>, then the <system> shall <response>.`

Why: removes ambiguity, gives a 1:1 mapping to test cases, matches the Kiro spec template.

## 5. INVEST for user stories

Every user story is checked against:

- **I**ndependent — buildable without blocking on another story
- **N**egotiable — scope can be discussed
- **V**aluable — visibly contributes to the rubric (declared axis)
- **E**stimable — small enough to estimate
- **S**mall — fits in ≤2 days of solo + AI work
- **T**estable — has a clear acceptance test

If a story violates a letter, split or rewrite it before scaffolding the spec.

## 6. Definition of Done (per task)

A task is Done when ALL of the following are true:

1. **Tests written first and now green.** Hardhat for contracts; `node:test` for TS modules; manual
   checklist for UI in `tasks.md` (with screenshots / tx hashes captured).
2. **TypeScript clean.** `corepack pnpm typecheck` exits 0.
3. **Lint clean.** `corepack pnpm lint` exits 0.
4. **Build clean.** `corepack pnpm build` succeeds. Run only with the dev server stopped (the
   Next.js build conflicts with `next dev`).
5. **Manually verified** on the running dev server. Screenshot or tx hash captured in the task
   row, or in the spec's `verification/` folder if too long.
6. **Honest Claim Ledger updated** if the task adds a new public claim
   (`docs/honest-claim-ledger.md`).
7. **Risk Register updated** if the task changes the risk surface
   (`docs/risk-register.md`).
8. **Demo path checked.** If the task touches the 3-minute demo flow, run the relevant scene
   end-to-end and tick the demo runbook (`docs/demo-runbook.md`).

If any item is yellow, the task is yellow — not done. No "we'll fix it later." Later does not
exist.

## 7. TDD rhythm (concrete commands)

**Solidity (contracts):**
```
# 1. Write failing test in contracts/test/<feature>.test.ts
cd contracts && npx hardhat test --grep "<your description>"   # red

# 2. Implement contract code; rerun
cd contracts && npx hardhat test --grep "<your description>"   # green

# 3. Refactor; rerun all
cd contracts && npx hardhat test
```

**TypeScript (modules / API routes / lib):**
```
# 1. Write failing test next to source: src/lib/foo/bar.test.ts
corepack pnpm test:unit -- bar.test.ts   # red

# 2. Implement; rerun
corepack pnpm test:unit -- bar.test.ts   # green

# 3. Full suite + types + lint
corepack pnpm test:unit && corepack pnpm typecheck && corepack pnpm lint
```

**UI components / pages:**
- Behavior test (interaction-level) before visual polish.
- For pages where component-level tests are heavy, a manual checklist in `tasks.md` with
  screenshots / tx hashes is acceptable, *as long as* the user-visible behavior is asserted at
  least once via the dev server (recorded in the verification trail).

When in doubt: write the smallest possible failing test that captures the next missing
capability, then write the smallest code that makes it pass. No code without an assertion that
it is required.

## 8. Honest Claim Ledger (`docs/honest-claim-ledger.md`)

Every public claim has a row:

| claim | proof_artifact | last_verified | risk |
|-------|----------------|---------------|------|

Rules:

- A claim cannot appear in README, pitch deck, demo voiceover, or social posts unless its row
  exists in the ledger.
- `proof_artifact` is a tx hash (with explorer link), a test file path, or a deployed URL.
- `last_verified` is the date someone re-ran the proof. If >7 days old, re-verify or remove the
  claim from the public surface.
- `risk` is `low` / `med` / `high` based on dependency on external infra (e.g. Particle V2 = high).

## 9. Pre-Demo Risk Register (`docs/risk-register.md`)

Single source of truth for what could blow up the demo. Reviewed daily in the last 72 hours
before submission. Each row: `id | risk | likelihood | impact | mitigation | mitigation_status |
owner`.

A risk in `mitigation_status: open` blocks submission until closed (or accepted with a written
fallback).

## 10. Scope discipline

- The cut list (`docs/master-tz.md` §6) is sacred. Anything proposed mid-stream gets
  RICE-evaluated (Reach × Impact × Confidence ÷ Effort) against the rubric. Below the threshold
  → cut.
- Time-box each P1 spec to ≤2 days. Overrun → escalate (re-prioritize, kill, or scope cut).
- "Nice to have" is a forbidden phrase. Every change is either P1/P2/P3 with a clear axis, or
  it's cut.

## 11. Commit + branch hygiene

- **Conventional Commits** format: `<type>(<scope>): <subject>`.
  - Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `perf`, `style`.
  - Scopes match epic IDs or spec IDs. Examples:
    - `test(E1): failing test for over-cap revert in agent demo`
    - `feat(magic-social-login): wire @magic-ext/oauth Google flow`
    - `docs(claim-ledger): re-verified Arbitrum MandateCharged tx`
- **Verify before every commit.** `corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test:unit` (and `cd contracts && npx hardhat test` if contracts changed). No commit ships
  red.
- **Branching.** Feature branches for any spec >2 tasks: `feat/<spec-id>`. Squash-merge on spec
  completion. Direct commits to main only for `docs/*` and trivial fixes.
- **Push only to a new branch on first push** (`git push -u origin feat/<spec-id>`); never push
  directly to main without explicit user approval.
- **Pre-commit hook (recommended, P3):** husky + lint-staged running typecheck + lint on staged
  files. Implement only if not already in place.

## 12. Verification trail

Every spec ends with a verification entry in `docs/master-tz.md` §7:

| spec_id | completed | demo_path | proof_artifact | claim_ledger_rows | tests_added |

A spec is not closed until its verification row is filled.

## 13. The cut philosophy (for the AI agents reading this)

You will be tempted to:
- add multi-token support (cut),
- add a merchant dashboard (cut),
- add admin features (cut),
- "improve" working code (cut unless it's blocking the demo),
- add more chains (cut),
- add tests for already-shipped infra (defer to post-submission).

The only acceptable refactors during the hackathon push are those that unblock a P1 spec.
Everything else waits.

## 14. Pre-mortem (run weekly until submission)

Imagine the demo failed. Why? List the top 5 reasons. For each, check: does the Risk Register
have an open mitigation? If not, add one. This is mandatory weekly until submission week, then
daily.

## 15. References

- `docs/master-tz.md` — north star, epics, user stories, specs index, priorities, cut list.
- `docs/honest-claim-ledger.md` — what we're allowed to claim publicly.
- `docs/risk-register.md` — what could blow up.
- `docs/demo-runbook.md` — the 3-minute demo script and verification path.
- `docs/status.md` — reproducibility log (deployments, tx hashes, env state).
- `docs/agent-context.md` — short orientation for new agent sessions.
