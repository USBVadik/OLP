# Spec: pitch-positioning-rewrite — Tasks

> No TDD red/green here — pure content rewrite. DoD per `methodology.md` §6 (typecheck + lint
> + manual visual verify, plus claim ledger + verification trail updates).
> Branch: `feat/pitch-positioning-rewrite` (or direct on main given the surface is markdown +
> JSX strings only — operator's choice).

## Phase 1 — Landing (`src/app/page.tsx`)

- [x] **T1. Replace hero eyebrow.**
  - Old: `Consent, proof & on-chain spend limits for Universal Accounts`
  - New: `On-chain spending limits for the agent era`
  - **DoD:** edit applied; typecheck green.

- [x] **T2. Replace hero h1.**
  - Per `design.md` §2.2.
  - **DoD:** edit applied; the gold span class still wraps the punchline.

- [x] **T3. Replace hero subhead.**
  - Per `design.md` §2.3.
  - **DoD:** edit applied; word count ≤60.

- [x] **T4. Sharpen hero check bullets (middle one).**
  - Old: `On-chain spend mandates (EIP-7702)`
  - New: `EIP-712 mandates · enforced by SpendPolicy`
  - **DoD:** edit applied.

- [x] **T5. Update pillar 3 (Permission Firewall) eyebrow + body.**
  - Eyebrow: `Before future automation` → `While agents run`
  - Body: per `design.md` §2.5
  - **DoD:** edit applied.

- [x] **T6. Micro-sharpen honest-scope footer.**
  - Per `design.md` §2.7. Adds "22 contract tests" + "same-chain checkout proven end-to-end".
  - **DoD:** edit applied; no new claim that's not already in the ledger.

## Phase 2 — README

- [x] **T7. Replace opening section** (title through the end of "Active Milestone B Fallback
      Path").
  - New content per `design.md` §3.1.
  - **DoD:** edit applied; the rendered preview shows the new opener and the honest-scope
    block with ✅/🚧/❌ markers.

- [x] **T8. Fix SDK version listing.**
  - `magic-sdk: 29.4.2` → `magic-sdk: 33.7.1`; add `@magic-ext/evm: 1.5.0`.
  - **DoD:** value matches `package.json`.

## Phase 3 — Verify

- [x] **T9. Typecheck + lint clean.**
  - Run: `corepack pnpm typecheck && corepack pnpm lint`
  - **DoD:** both exit 0.

- [x] **T10. Visual check on `/`.**
  - Dev server is already running per `docs/agent-context.md`. Open `http://localhost:3000`
    in a clean browser tab. Confirm:
    - Hero reads "Give your AI a card. / Not your wallet." with gold on the second line.
    - Eyebrow reads "On-chain spending limits for the agent era".
    - Subhead is the new copy.
    - Pillar 3 reads "While agents run / Permission Firewall / Scoped mandates…".
    - Honest-scope footer is the new wording.
  - **DoD:** screenshot saved at
    `.kiro/specs/pitch-positioning-rewrite/verification/landing-1280.png`.

- [x] **T11. Visual check at 360px width.**
  - Use Chrome devtools or Firefox responsive design mode.
  - **DoD:** no horizontal overflow; hero fits without truncation; screenshot saved at
    `.kiro/specs/pitch-positioning-rewrite/verification/landing-360.png`.

## Phase 4 — Wrap-up

- [x] **T12. Add claim ledger row C12.**
  - File: `docs/honest-claim-ledger.md`.
  - Claim: `OneLink Pay is positioned as "on-chain spending limits for the agent era — give your AI a card, not your wallet."`
  - Proof artifact: `src/app/page.tsx` hero section + T10 screenshot.
  - Risk: `low`.
  - **DoD:** row added.

- [x] **T13. Update master TZ verification trail.** `docs/master-tz.md` §7.
  - Row: spec_id=`pitch-positioning-rewrite`, completed=<today>, demo_path=`/`,
    proof_artifact=T10 screenshot path, claim_ledger_rows=`C12`, tests_added=`(none — copy
    rewrite)`.
  - **DoD:** row exists.

- [x] **T14. Mark spec_mapping status in master TZ §4** as `closed` for
      `pitch-positioning-rewrite`.
  - **DoD:** row updated.

- [ ] **T15. Commit and (optionally) merge.** _(deferred — no git commits made this session)_
  - Commit: `feat(E1): rewrite landing + README to AI-safe-card positioning (E1.S4)`.
  - **DoD:** main builds clean if merging direct; otherwise PR opened.

## Acceptance for the spec

This spec is closed when:

- All EARS criteria in `requirements.md` §3 are met.
- T9-T11 pass.
- C12 is in the ledger.
- Master TZ §7 has the verification row and §4 shows `closed`.
- The dev server URL `/` shows the new copy without regression.
