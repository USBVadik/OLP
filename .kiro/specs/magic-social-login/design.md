# Spec: magic-social-login — Design

> Pairs with `requirements.md` and `tasks.md`.

## 1. Architecture decision

Currently Magic is initialized inline (in the page components for `/pay/[id]` and
`/firewall`). This duplicates code and risks divergent configuration. Centralize:

```
src/lib/magic/
├── client.ts        (new)  exports `getMagic()` — singleton, browser-only, with OAuthExtension
└── client.test.ts   (new)  vitest: factory respects browser/server boundary
```

`getMagic()` returns the shared `Magic` instance. Server-side render must NOT instantiate it
(Magic SDK requires `window`). We guard with `typeof window === "undefined"` and return a
narrow stub-or-throw.

## 2. Module breakdown

```
src/
├── lib/
│   └── magic/
│       ├── client.ts             (new)
│       └── client.test.ts        (new)
├── components/
│   ├── login-buttons.tsx         (new)
│   └── login-buttons.test.tsx    (new)
└── app/
    ├── auth/
    │   └── callback/
    │       └── page.tsx          (new)
    ├── pay/
    │   └── [id]/page.tsx         (modify) replace inline login UI; consume getMagic()
    └── firewall/
        └── page.tsx              (modify) consume LoginButtons
```

## 3. Magic client contract

```ts
// src/lib/magic/client.ts
import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth";
import { EVMExtension } from "@magic-ext/evm";

let _magic: Magic | null = null;

export function getMagic(): Magic {
  if (typeof window === "undefined") {
    throw new Error("getMagic() must be called in the browser");
  }
  if (_magic) return _magic;
  _magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!, {
    network: { rpcUrl: "https://...", chainId: 8453 },     // align to existing config
    extensions: [new OAuthExtension(), new EVMExtension()],
  });
  return _magic;
}
```

Notes:
- The exact RPC + chain config must match what's currently inlined in `pay/[id]/page.tsx`.
  T0 in `tasks.md` requires reading and copying it verbatim to avoid silent drift.
- `OAuthExtension` is from `@magic-ext/oauth` — version pinned at install.

## 4. LoginButtons component

```tsx
// src/components/login-buttons.tsx
type LoginButtonsProps = {
  /** path to return to after OAuth round-trip */
  returnTo: string;
  /** called once email login completes (delegated to existing flow) */
  onEmailLogin: () => void;
  /** "compact" omits descriptive copy; for the firewall page where space is tighter */
  variant?: "default" | "compact";
};
```

UX:
- Primary button: "Continue with Google" — Google G icon, white background per Google brand
  guidelines (we already use Tailwind, so simple SVG).
- Secondary button: "Continue with email" — opens existing email flow (delegate via
  `onEmailLogin`; do not duplicate that logic here).
- Tertiary microcopy: "No seed phrase, no extension. Magic embedded wallet."

Behavior:
- On Google click:
  ```ts
  await getMagic().oauth.loginWithRedirect({
    provider: "google",
    redirectURI: `${window.location.origin}/auth/callback?return=${encodeURIComponent(returnTo)}`,
  });
  ```

## 5. /auth/callback page

```tsx
// src/app/auth/callback/page.tsx
"use client";

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getMagic().oauth.getRedirectResult();
        // result.magic.idToken / result.oauth.userHandle / result.magic.userMetadata
        if (cancelled) return;
        const returnTo = params.get("return") ?? "/";
        router.replace(returnTo);
      } catch (err) {
        // show error UI; offer email fallback link
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <div>Signing you in…</div>;
}
```

- Page is `"use client"` (Magic SDK requires window).
- Suspense boundary for `useSearchParams` per Next.js 14 conventions.
- Error UI is intentionally light: a single line + a "Use email instead" link to
  `?return=` page.

## 6. Sequence (happy path)

```
user on /pay/abc123 (logged out)
  └─ <LoginButtons returnTo="/pay/abc123" />
       └─ click "Continue with Google"
            └─ getMagic().oauth.loginWithRedirect({ provider:"google", redirectURI:".../auth/callback?return=/pay/abc123" })
                 └─ Magic redirects to Google
                      └─ Google → /auth/callback?return=/pay/abc123
                           └─ getMagic().oauth.getRedirectResult()
                                └─ session created
                           └─ router.replace("/pay/abc123")
                                └─ /pay/abc123 mounts; getMagic().user.isLoggedIn() === true
                                └─ resolves EVM address; existing checkout proceeds
```

## 7. Session persistence (E3.S2)

`magic.user.isLoggedIn()` returns true across reloads as long as Magic's session cookie /
storage is intact (Magic handles this internally). Consumer code on `/pay/[id]` and
`/firewall`:

```ts
useEffect(() => {
  let cancelled = false;
  (async () => {
    if (typeof window === "undefined") return;
    const magic = getMagic();
    if (await magic.user.isLoggedIn()) {
      const addr = await magic.wallet.getInfo().then(i => i.publicAddress);
      if (!cancelled) setAddress(addr);
    }
  })();
  return () => { cancelled = true; };
}, []);
```

Don't duplicate this in every page — extract a `useMagicSession()` hook (small, a few lines)
in `src/lib/magic/use-magic-session.ts` (covered by T6 if it falls out of T5 implementation).

## 8. Edge cases

- **AdBlock / strict third-party cookies:** Magic OAuth may fail to resolve on the callback.
  Mitigation: detect via try/catch, show inline message + email fallback link. Recorded in
  `requirements.md` unwanted-behavior.
- **Google not enabled in Magic dashboard:** `loginWithRedirect` will reject with a specific
  error string. Mitigation: console.error in dev, silently hide the Google button in prod
  builds via a feature flag `NEXT_PUBLIC_MAGIC_GOOGLE_ENABLED` (default `true`; flip if the
  dashboard config drifts).
- **User signs in with Google then with email:** Magic treats them as different identities.
  We don't handle account-merging — out of scope.

## 9. Backwards compatibility

The existing email login flow MUST keep working. The migration:

1. Keep the email login UI; just route it through `<LoginButtons />`'s `onEmailLogin` callback.
2. Centralize the Magic instance — but keep the same publishable key and same network config.
3. Roll out to `/pay/[id]` and `/firewall` simultaneously; if either regresses, revert via
   feature flag (`NEXT_PUBLIC_MAGIC_LOGIN_BUTTONS=false`).

## 10. Demo path

The demo opens with `/pay/[id]` already logged out, then a single Google click. Time budget
in the demo runbook: 5 seconds end-to-end (Google's own consent screen takes most of that —
acceptable; users recognize it). Capture screen-recording for backup.

## 11. Risks introduced

- **R-NEW-3:** Magic Google requires user-side dashboard config (Google enabled +
  `localhost:3000` and prod origin whitelisted). If the dashboard isn't configured, the demo
  silently fails. Mitigation: T1 in tasks.md asks the user to confirm dashboard state before
  install. Documented in `docs/risk-register.md` as a parameterized R7 child.

## 12. References

- Magic OAuth docs (verify version compatibility before install).
- Existing inline init in `src/app/pay/[id]/page.tsx` (to be deduped).
- `methodology.md` §1.6 (Reversibility budget — feature flag pattern).
