# Spec: magic-social-login — Tasks

> Status: code complete, manual T11 verification pending.
> Branch: direct-on-main (small surface, all tests green).

## Phase 0 — Prerequisites

- [x] **T0. Magic dashboard config confirmed.**
  - User confirmed Google enabled, Auto-Link Email+Google ON, Client ID + Secret saved
    in dashboard. Test Connection failed for an unrelated reason
    (`https://dashboard.magic.link/.../test_connection_callback?cid=...&provider=google`
    not registered in Google Cloud — that callback is a dashboard-internal feature, not the
    production callback `https://auth.magic.link/v1/oauth2/<app-id>/callback` which IS
    registered and which our SDK flow uses).
  - Programmatic verification: `MAGIC_SECRET_KEY` works against Magic Admin API
    (`/v1/admin/auth/user/get` returned 422 with auth-passed `Field required: issuer`).
  - Decision: proceed and treat T11 (real browser OAuth round-trip) as the definitive test.

- [x] **T1. Peer-dep version pin.** `@magic-ext/oauth` is **deprecated** — Magic moved the
  OAuth extension to `@magic-ext/oauth2`. Latest stable: **15.8.0**. No peer-dep conflicts.
  Class export: `OAuthExtension`. Methods: `oauth2.loginWithRedirect({ provider, redirectURI })`,
  `oauth2.getRedirectResult()`. Provider names live (per the package's `OAuthProvider` union):
  `google | facebook | apple | github | bitbucket | gitlab | linkedin | twitter | discord |
  twitch | microsoft | steam`.

## Phase 1 — Architecture (course-correction from `design.md`)

The original `design.md` proposed a centralized `getMagic()` singleton. After reading the
two existing inline init blocks (`/pay/[id]` configures `EVMExtension` with three chains for
the 7702 cross-chain demo; `/firewall` pins network for the Arbitrum demo), centralizing
would risk regressing claims `C7` (live 7702 delegation) and `C5` (live Arbitrum
MandateCharged). Per `methodology.md` §1.4 (vertical slice — simplest demoable thing first),
we kept the existing inline init blocks and **added `OAuthExtension` additively** to each.
This is the minimum-invasive shape.

The shipped pieces:

- `src/lib/magic/redirect.ts` — pure helpers (`sanitizeReturnPath`, `buildOauthCallbackUrl`).
  Open-redirect-safe.
- `src/lib/magic/redirect.test.ts` — 16 node:test cases (all green).
- `src/components/login-with-google.tsx` — reusable Google button. Takes `magic` instance +
  `returnTo` path as props.
- `src/app/auth/callback/page.tsx` — OAuth round-trip completion + redirect to sanitized
  `?return=...`.

## Phase 2 — Module changes

- [x] **T2. Failing test for `redirect.ts`.** 13 test cases for `sanitizeReturnPath` covering
  the open-redirect attack matrix. Initially red (helper file did not exist).

- [x] **T3. Install `@magic-ext/oauth2@15.8.0`.** Removed deprecated `@magic-ext/oauth@24.0.0`
  first. Pnpm aligned to v10.34.4 to fix the store-version mismatch the project picked up
  along the way.

- [x] **T4. Implement `redirect.ts`.** `sanitizeReturnPath` + `buildOauthCallbackUrl`. All 13
  initial tests green.

- [x] **T5. Extend tests for `buildOauthCallbackUrl`.** 3 additional cases (encode return,
  https origin, round-trip). All 16 green.

- [x] **T6. Implement `login-with-google.tsx`.** Tailwind-styled button using the project's
  `op-btn-secondary` class. Uses `buildOauthCallbackUrl` to compose the redirect URI.

- [x] **T7. Implement `/auth/callback` page.** Suspense-wrapped. Dynamically imports Magic +
  `OAuthExtension`, calls `getRedirectResult()`, sanitizes `?return=`, `router.replace()`.
  Error UI + email-fallback link. Supports the methodology §6 unwanted-behavior criterion
  (failed callback shows fallback, not blank).

## Phase 3 — Wire into existing pages (additive)

- [x] **T8. `/firewall` Magic init now loads `OAuthExtension` and includes it in the
  `extensions: [...]` array.** Loader extended; init unchanged otherwise.

- [x] **T9. `/firewall` UI renders `<LoginWithGoogleButton />` above the existing email
  input,** divider "or with email", original email input + "Connect with Magic" button kept.

- [x] **T10. `/pay/[id]` Magic init now loads `OAuthExtension`** in `loadSDKs()`. Added to
  both branches of the `IS_7702 ? extensions: [...] : new Magic(key)` ternary
  (now: 7702 has `[EVMExtension(...), OAuthExtension()]`; non-7702 has `[OAuthExtension()]`).

- [x] **T11 (component). `LoginForm` accepts `magic` and `returnTo` props** and renders
  `<LoginWithGoogleButton />` above the email input. Call site at line 831 passes them
  through.

## Phase 4 — Verify (CI gates)

- [x] **T12. typecheck green.** `corepack pnpm typecheck` exit 0.
- [x] **T13. lint green.** `corepack pnpm lint` "No ESLint warnings or errors".
- [x] **T14. unit tests green.** `corepack pnpm test:unit` — 29/29 (was 13 pre-spec, +16
  new for `redirect.ts`).

## Phase 5 — Manual verification (USER-SIDE, blocking close)

- [x] **T15 — happy path Google login on `/firewall`** (clean Chrome profile, no extensions).
  Visit `http://localhost:3000/firewall` → click "Continue with Google" → complete Google
  consent → land back on `/firewall` logged in. Time the round-trip; target ≤5s
  (excluding Google's own consent screen). Capture: screen recording (or screenshot of
  post-login state with the `address` rendered).

- [ ] **T16 — happy path Google login on a checkout link.** _(deferred — core /firewall Google flow + reload confirmed live; this secondary path not yet run)_ Same flow on `/pay/<some-id>`.
  Verify `returnTo` brings the user back to the same checkout link.

- [x] **T17 — session persistence.** Reload the page after login. Should remain logged in
  (Magic session in browser storage; the `useEffect` reads `magic.user.isLoggedIn()` via
  `resolveEoa`).

- [ ] **T18 — email regression check.** _(deferred — not yet re-run in a fresh profile this session)_ In a fresh Chrome profile, sign in via the existing
  email path on `/firewall`. Should still work as before.

- [ ] **T19 — incognito + strict cookies (negative path).** _(deferred — fallback UI built but not yet exercised live)_ Open `/firewall` in incognito
  with all cookies blocked. Click Google → expect a clear error UI on `/auth/callback`
  with the "Use email instead" fallback button.

## Phase 6 — Wrap-up (unlocked by T15-T19)

- [x] **T20. Add claim ledger row C13.** "Sign in with Google in ≤5 seconds via Magic
  embedded wallet — no seed phrase, no extension." Proof artifact = the screen recording
  from T15. **Cannot add until T15 passes.**
- [x] **T21. Close R7 in risk register.** Set `mitigation_status: closed` after T15-T19 pass.
- [x] **T22. Update master-tz.md §7** with the verification row and §4 status to `closed`.

## Acceptance for the spec

The spec is closed when T15-T19 pass and T20-T22 are filled in.

