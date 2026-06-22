# Spec: agent-on-a-leash-demo — Tasks

> TDD-ordered. Each task: write failing test → implement → green → refactor.
> Definition of Done per task per `.kiro/steering/methodology.md` §6.

Branch: `feat/agent-on-a-leash-demo`.

## Phase 0 — Read before writing

- [x] **T0. Read the existing surface.**
  - Read `src/app/api/mandates/charge/route.ts` end-to-end. Note the exact response shape on:
    success, simulation-revert (over-cap), simulation-revert (revoked), network/RPC error.
  - Read `src/components/permission-firewall.tsx` and `src/app/firewall/page.tsx` to see how
    arm/charge/revoke is currently wired and where the agent panel slots in.
  - **DoD:** notes captured in this task as a comment row below.
  - Notes (fill in):
    - Route returns: `…`
    - On simulate-revert: `…`
    - On RPC error: `…`

## Phase 1 — Pure helpers (no UI)

- [x] **T1. Failing test: scenarios shape.** `src/lib/agent/scenarios.test.ts`. Asserts
      `SCENARIOS` has exactly 2 entries, ids `"within-cap"` and `"over-cap"`, and that
      `over-cap.amountAtomic > within-cap.amountAtomic`. Run: `corepack pnpm test:unit -- agent`.
      Should be **red** (file does not exist).
  - **DoD:** test file committed; `test:unit` shows the test failing for the right reason.

- [x] **T2. Implement scenarios.** Create `src/lib/agent/scenarios.ts` per `design.md` §3. Re-run
      `corepack pnpm test:unit -- agent` — green.
  - **DoD:** test green; `corepack pnpm typecheck && corepack pnpm lint` green.

- [x] **T3. Failing test: log formatter.** `src/lib/agent/log-formatter.test.ts`. Cases:
  - Formats AGENT line with `HH:MM:SS [AGENT] message`.
  - Formats FIREWALL OK with green-marked source.
  - Formats FIREWALL BLOCKED prefixing the message with `BLOCKED:`.
  - When `details.txHash` present, second-line monospace `tx: 0x…<short>`.
  - **DoD:** red for the right reason.

- [x] **T4. Implement log formatter.** Create `src/lib/agent/log-formatter.ts`. Pure functions
      only — no React.
  - **DoD:** T3 green; lint/typecheck green.

## Phase 2 — Route response contract (if T0 finds gaps)

- [x] **T5. Confirm or extend `/api/mandates/charge` response shape.**
  - If the route already returns `{ ok: false, blocked: true, code: "PerChargeExceeded" }` on
    simulation revert → SKIP T5 (mark as N/A).
  - Else: add a vitest in `src/app/api/mandates/charge/route.test.ts` (mock viem) that asserts
    the new response shape on a forced simulation revert, then extend the route minimally to
    return that shape WITHOUT breaking the existing manual-charge consumer in
    `permission-firewall.tsx`.
  - **DoD:** test green; manual smoke of the existing manual-charge buttons on `/firewall`
    confirms no regression.

## Phase 3 — Component (presentational)

- [x] **T6. Failing test: agent-terminal renders entries in order.**
      `src/components/agent-terminal.test.tsx`. Renders 3 entries; asserts they appear in DOM
      in insertion order; asserts BLOCKED entry has the right red marker.
  - **DoD:** red for the right reason.

- [x] **T7. Implement `agent-terminal.tsx`.** Per `design.md` §4. No state of its own beyond
      the autoscroll ref behavior. Tailwind classes only.
  - **DoD:** T6 green; storybook-style page or temporary mount in `/firewall` confirms it
    renders cleanly.

## Phase 4 — Wire into firewall page

- [x] **T8. Add Run-agent buttons to `permission-firewall.tsx`.** Two buttons, disabled when
      no mandate is armed or when `running` is true. Tooltip on disabled state.
  - **DoD:** typecheck/lint green; manual: buttons appear, are disabled before arming.

- [x] **T9. Wire `runScenario` in `firewall/page.tsx`.** Implement the state plumbing per
      `design.md` §8. Append entries; consume route response per `design.md` §6.
  - **DoD:** typecheck/lint green; manual: clicking a Run-agent button appends an `[AGENT]`
      entry within 100ms.

- [x] **T10. Split-screen layout in `firewall/page.tsx`.** CSS grid 2-col on desktop;
      stacked on mobile. Mount `agent-terminal` in the right column.
  - **DoD:** lighthouse-style visual check passes; existing dashboard not regressed.

## Phase 5 — Manual end-to-end verification (the thing that matters)

- [x] **T11. Full demo scene on Arbitrum.** With dev server running:
  1. Sign in (existing email or Magic flow).
  2. Arm mandate (existing `/firewall` flow).
  3. Click "Run agent (within cap)" → expect a new `MandateCharged` tx and the FIREWALL OK log
     entry.
  4. Click "Run agent (over cap)" → expect simulation revert; FIREWALL BLOCKED log entry; no
     tx on Arbiscan.
  5. Click "Revoke" → revoke tx.
  6. Click "Run agent (within cap)" again → BLOCKED: MandateIsRevoked.
  - **DoD:**
    - Within-cap tx hash: `<paste>`
    - Over-cap simulation rejection: log + screenshot saved at
      `.kiro/specs/agent-on-a-leash-demo/verification/over-cap.png`.
    - Revoke tx hash: `<paste>`
    - Post-revoke blocked: log + screenshot saved.
    - Add `C12` row to `docs/honest-claim-ledger.md`: "An autonomous-style agent run is blocked
      on-chain when it exceeds the mandate." Proof artifact = the screenshots and the
      Arbiscan-confirmed-no-over-cap-tx.

## Phase 6 — Wrap-up

- [x] **T12. Update demo runbook.** Edit `docs/demo-runbook.md`: insert the agent-on-a-leash
      scene between the existing "arm mandate" and "revoke" beats. Include exact button click
      order and the expected log output.
  - **DoD:** runbook reads end-to-end, dry-run rehearsal once.

- [x] **T13. Update master TZ verification trail.** Add a row to
      `docs/master-tz.md` §7 with: spec_id=`agent-on-a-leash-demo`, completed=<today>,
      demo_path="/firewall", proof_artifact=`<within-cap tx hash>`, claim_ledger_rows=`C12`,
      tests_added=`T1, T3, T6 (+ T5 if applied)`.
  - **DoD:** row exists; commit `docs(master-tz): close agent-on-a-leash-demo`.

- [x] **T14. Update risk register.** Close R2 ("Judges don't grok the firewall in <30s")
      mitigation status to `closed` (this spec ships the visceral moment). Add R-NEW-1 and
      R-NEW-2 from `design.md` §11.
  - **DoD:** `docs/risk-register.md` updated; commit `docs(risk): agent demo shipped`.

- [ ] **T15. Squash-merge `feat/agent-on-a-leash-demo` to main** _(deferred — no git commits made this session)_ with a single commit:
      `feat(E1): agent-on-a-leash demo (E1.S1, E1.S2, E1.S3, E1.S5)`.
  - **DoD:** main branch builds clean (`corepack pnpm typecheck && corepack pnpm lint &&
      corepack pnpm test:unit && corepack pnpm build` — last with dev server stopped).

## Acceptance for the spec

This spec is closed when:

- All EARS criteria in `requirements.md` §3 are testable AND have either a green test or a
  ticked manual checklist row in T11.
- The verification trail row in `master-tz.md` §7 is filled.
- Claim ledger row `C12` is added with proof artifact paths.
- The 3-minute demo can be rehearsed end-to-end on `/firewall` without operator improvisation.
