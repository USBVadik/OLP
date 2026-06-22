"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { consumeReturnPath } from "@/lib/magic/redirect";

/**
 * Module-level guard against React Strict Mode's double-mount in dev. The Magic SDK
 * consumes its PKCE state on the first `getRedirectResult` call, so a second call
 * would fail with `MISSING_PKCE_METADATA` even though the first one already
 * succeeded — and the second mount's error state would visibly overwrite the first
 * mount's success. A module-level flag ensures only one OAuth completion runs per
 * page load. Reset to `false` only on error, so a failed flow can be retried by
 * clicking "Use email instead" or returning home and re-initiating.
 */
let oauthCallbackStarted = false;

/**
 * OAuth callback landing page. Magic redirects the browser here after Google
 * has confirmed the user. We complete the round-trip by calling
 * `magic.oauth2.getRedirectResult()`, then router.replace to the same-origin
 * path the user was on before sign-in.
 *
 * Wrapped in `<Suspense>` because `useSearchParams` requires it under Next 14
 * App Router strict mode.
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell title="Signing you in…" />}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const [phase, setPhase] = useState<"running" | "error">("running");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Strict Mode double-mount guard. See the comment on `oauthCallbackStarted`.
    if (oauthCallbackStarted) return;
    oauthCallbackStarted = true;

    (async () => {
      try {
        const [{ Magic }, { OAuthExtension }] = await Promise.all([
          import("magic-sdk"),
          import("@magic-ext/oauth2"),
        ]);
        const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
        if (!key) throw new Error("NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not set");
        const magic = new Magic(key, { extensions: [new OAuthExtension()] });
        // Read whatever state Google + Magic left on the URL and finish login.
        await magic.oauth2.getRedirectResult();
        // The originating page stashed where we should land in sessionStorage,
        // so the OAuth redirect URI itself can stay clean.
        const returnTo = consumeReturnPath();
        router.replace(returnTo);
      } catch (e: any) {
        // Reset the guard so the user can retry the OAuth round-trip after fixing
        // whatever caused this failure (e.g. starting the flow fresh).
        oauthCallbackStarted = false;
        const message =
          typeof e?.message === "string"
            ? e.message
            : "Sign-in didn't complete. Try email login instead.";
        setErrorMsg(message);
        setPhase("error");
      }
    })();
    // Run exactly once on mount. The OAuth completion is keyed to URL state and
    // the stored returnTo, neither of which is a React dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "error") {
    return (
      <CallbackShell title="Sign-in didn't complete">
        <p className="mt-3 text-sm text-ink2" role="alert">
          {errorMsg}
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => router.replace("/")} className="op-btn-secondary">
            Back to home
          </button>
          <button onClick={() => router.replace("/firewall")} className="op-btn-primary">
            Use email instead
          </button>
        </div>
      </CallbackShell>
    );
  }

  return <CallbackShell title="Signing you in…" />;
}

function CallbackShell({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="op-card p-8">
          <p className="op-eyebrow">Magic OAuth</p>
          <h1 className="mt-2 text-xl font-semibold text-ink">{title}</h1>
          {children ?? (
            <p className="mt-3 text-sm text-ink2">
              Completing the round-trip with Magic.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
