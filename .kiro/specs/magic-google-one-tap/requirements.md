# Magic Google One Tap — Requirements

## Goal

Improve the Magic bounty and first-use UX by using Magic's official Google ID-token login path when
available, while preserving the already-proven redirect OAuth and email login as fail-safe paths.

## Acceptance criteria

1. One Tap SHALL be active only when both `NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP=true` and a non-empty
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` are present.
2. The helper SHALL load Google Identity Services from the official
   `https://accounts.google.com/gsi/client` script and request a Google-issued ID token.
3. The token SHALL be passed directly to Magic `loginWithGoogleIdToken`; OneLink must not decode,
   persist, log, or send it to its own backend.
4. A successful One Tap login SHALL return to the same safe in-app route and refresh the page so the
   existing Magic session auto-detection takes over.
5. If One Tap is unavailable, dismissed, times out, throws, or Magic lacks
   `loginWithGoogleIdToken`, the same click SHALL fall back to the proven
   `loginWithRedirect` flow.
6. Existing email OTP login SHALL remain unchanged.
7. The feature SHALL be default-off and require no dependency upgrade.
8. No Particle UA, payment, API, contract, database, or blockchain behavior changes.

## Non-goals

- No silent account linking claim beyond Magic's documented behavior.
- No Google access/refresh token storage.
- No backend Google authentication.
- No replacement of the redirect fallback.
- No automatic production enablement before Google/Magic origin configuration and clean-browser QA.
