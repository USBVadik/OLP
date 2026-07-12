# Magic Google One Tap — Tasks

## M1 — TDD core

- [x] M1.1 Add failing tests for the feature-gate matrix.
- [x] M1.2 Add failing tests for credential success, missing credential, not displayed, and timeout.
- [x] M1.3 Implement the minimum helper.

## M2 — Login integration

- [x] M2.1 Integrate One Tap behind the exact public flag and client id.
- [x] M2.2 Preserve redirect fallback on every One Tap failure.
- [x] M2.3 Preserve email login unchanged.
- [x] M2.4 Add source guard for the fallback contract.

## M3 — Config and documentation

- [x] M3.1 Add default-off placeholders to `.env.example`.
- [x] M3.2 Document Google/Magic dashboard prerequisites and rollback.

## M4 — Verification

- [x] M4.1 Typecheck and lint.
- [x] M4.2 Full unit and contract tests.
- [x] M4.3 Production build.
- [ ] M4.4 Browser sanity with flag off.
- [ ] M4.5 Browser One Tap run only after the operator configures the matching Google Client ID.
