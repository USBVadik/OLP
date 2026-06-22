# Spec: magic-social-login — Requirements

> Epic: **E3. Walletless onboarding**
> Stories: **E3.S1, E3.S2**
> Priority: **P1** (Block A, target close: 2026-06-23 EOD)
> Estimated effort: **4h**
> Process: `.kiro/steering/methodology.md`

## 1. Why this exists

Magic Google OAuth is the highest impact / lowest effort move on the board. All four
deep-research reports list this as a top-3 priority. It does three things at once:

1. Unlocks the Magic bonus (~$500) — Magic explicitly judges on social-login UX.
2. Materially improves the demo's UX score (no seed phrase, no extension, opens with a
   recognized brand).
3. Removes "Web3 friction" cues from the live demo, which the rubric weights at 40%.

## 2. User stories covered

- **E3.S1** — As a new user, I sign in with Google in ≤5s and never see a seed phrase, so
  onboarding feels Web2.
- **E3.S2** — As a returning user, my session persists across page reload, so onboarding is
  one-shot.

## 3. Acceptance criteria (EARS)

### Ubiquitous
- The system shall offer two login options on `/pay/[id]` and `/firewall`: "Continue with
  Google" and "Continue with email".
- The system shall NOT display a seed phrase, mnemonic, or extension prompt at any point.

### Event-driven
- **When** a logged-out user clicks **"Continue with Google"** on `/pay/[id]` or `/firewall`,
  **the system shall** initiate Magic OAuth with provider `google` and a `redirectURI` that
  preserves the originating page.
- **When** the OAuth provider redirects back to `/auth/callback`, **the system shall** call
  `magic.oauth.getRedirectResult()`, resolve the EVM address, and `router.replace` to the
  preserved originating page within 1500ms.
- **When** the OAuth callback fails (timeout, denied, network), **the system shall** display a
  human-readable error and a button to retry with email.

### State-driven
- **While** a Magic session exists (`magic.user.isLoggedIn() === true`) on mount, **the
  system shall** restore the session and resolve the EVM address without prompting login again.
- **While** the OAuth redirect is in progress, **the system shall** show a non-disruptive
  spinner and prevent navigation to login UIs.

### Optional
- **Where** Magic Google OAuth is configured in the dashboard with `localhost:3000` whitelisted,
  **the system shall** allow Google login during local development.

### Unwanted-behavior
- **If** Magic returns an unauthorized provider error (Google not enabled in the dashboard),
  **the system shall** log a clear console diagnostic and silently fall back to email-only
  login UI without a confusing modal.
- **If** AdBlock or strict privacy settings block third-party cookies and the OAuth callback
  fails to resolve, **the system shall** present an inline message: "Try email login or open in
  a clean Chrome profile."

## 4. Scope

### In scope
- Adding `@magic-ext/oauth` dependency, pinned.
- A central Magic init module so initialization is consistent across `/pay/[id]` and
  `/firewall` (currently the init is duplicated/inline).
- A reusable `<LoginButtons />` component with Google + email options.
- A new `/auth/callback` page that completes the OAuth flow.
- Session-persistence behavior across reload (already largely free with Magic; we just consume
  `isLoggedIn`).
- Demo runbook update so the demo opens with the Google login shot.

### Out of scope (cut)
- Other OAuth providers (Apple, Twitter, Discord) — only Google for the demo.
- Multi-account UX (account switching).
- Server-side session.
- Particle AuthKit (`master-tz.md` §6 cut list — we keep the active stack).

## 5. Dependencies

- ✅ Magic SDK already installed (`magic-sdk@33.7.1`).
- ✅ `@magic-ext/evm@1.5.0` already installed.
- ↪ `@magic-ext/oauth@^24.0.0` to add. Verify peer-dep compatibility before install
  (T1 below).
- ↪ User must have enabled Google + whitelisted `http://localhost:3000` (and the deployed
  origin) in the Magic dashboard. This is a manual prerequisite — flagged in T0.

## 6. INVEST check

- **I**ndependent — does not block on E1, E2, E4, E5. ✅
- **N**egotiable — visual treatment of buttons is open. ✅
- **V**aluable — Magic bonus + UX 40% directly. ✅
- **E**stimable — 4h. ✅
- **S**mall — single feature; touches 4-5 files. ✅
- **T**estable — has unit tests for init + manual checklist for OAuth round-trip. ✅

## 7. Definition of Done

Spec is closed when:

- All EARS criteria are testable and have either a green test or a manual checklist tick in
  `tasks.md` T8-T10.
- Claim ledger row `C13` "Sign in with Google in ≤5 seconds (no seed phrase)" added with proof
  artifact = a recorded screen capture of the round-trip.
- Risk register R7 ("Magic Google OAuth fails in target browser") `mitigation_status` updated
  to `closed` after manual incognito verification.
- Verification trail row in `master-tz.md` §7 filled.
- Existing email login flow on `/pay/[id]` is verified to still work.
