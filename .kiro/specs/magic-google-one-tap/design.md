# Magic Google One Tap — Design

## Decision core

`selectGoogleLoginMode({ enabled, clientId, supportsIdTokenLogin })` is pure and fail-closed:

- exact flag + client id + SDK method -> `one_tap`;
- every other combination -> `redirect`.

## Google Identity Services helper

`src/lib/magic/google-one-tap.ts` contains:

- a single cached loader for the official GSI script;
- an injectable `requestGoogleCredential` promise wrapper for deterministic tests;
- a short timeout so a hidden/stalled prompt cannot leave the button busy forever;
- no token logging or persistence.

## Component integration

`LoginWithGoogleButton` keeps one user action:

1. If One Tap is eligible, request the Google credential and pass it to Magic.
2. On success, navigate to the sanitized `returnTo` route.
3. On any failure, immediately start the existing redirect flow.
4. Surface an error only when both One Tap and redirect fail.

The button label stays `Continue with Google`; the implementation detail is invisible to users.

## Operations

Before enabling:

- the Google Client ID must match the one configured in the Magic dashboard;
- production and localhost origins must be registered as Authorized JavaScript origins;
- existing `/auth/callback` redirect URI remains configured for fallback;
- run a clean Chrome test and an incognito/privacy-mode fallback test.

## Tests

- exact feature-gate matrix;
- Google credential resolves from a valid callback;
- missing credential and not-displayed prompt reject;
- timeout rejects;
- source guard verifies the redirect fallback remains in the component;
- full typecheck/lint/unit/build gate.
