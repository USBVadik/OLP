"use client";

import { useState, type SVGProps } from "react";
import { buildOauthCallbackUrl, storeReturnPath } from "@/lib/magic/redirect";
import { IconShield } from "@/components/ui";

type Props = {
  /** Magic instance with OAuthExtension already attached. May be null while still loading. */
  magic: any | null;
  /**
   * Same-origin path the user should land on after the OAuth round-trip completes.
   * Typically `window.location.pathname` of the page that mounts this button.
   */
  returnTo: string;
  /** Button emphasis. Default "secondary"; pass "primary" to make Google the fastest, headline path. */
  variant?: "primary" | "secondary";
  /** Optional outer className (margins / spacing). */
  className?: string;
};

/**
 * "Continue with Google" button. Hands off to Magic's `oauth2.loginWithRedirect`,
 * which leaves this page entirely and returns the browser to `/auth/callback`
 * after Google + Magic finish their round-trip.
 *
 * Relies on:
 *  - Magic publishable key (already wired by the parent page).
 *  - `OAuthExtension` from `@magic-ext/oauth2` being included in the parent's
 *    Magic init.
 *  - The Magic dashboard having Google OAuth enabled with a valid Client ID/Secret.
 */
export function LoginWithGoogleButton({ magic, returnTo, variant = "secondary", className = "" }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleClick = async () => {
    if (!magic || typeof window === "undefined") return;
    setBusy(true);
    setErr(null);
    try {
      // Persist where to land AFTER the OAuth round-trip so the redirectURI we hand
      // to Google stays clean (no query string -> single registered URI in Google Cloud).
      storeReturnPath(returnTo);
      const redirectURI = buildOauthCallbackUrl(window.location.origin);
      // This call leaves the page (full redirect to Google).
      await magic.oauth2.loginWithRedirect({
        provider: "google",
        redirectURI,
      });
      // If we reach here the SDK handed control back without redirecting;
      // re-enable the button so the user can retry.
      setBusy(false);
    } catch (e: any) {
      const message =
        typeof e?.message === "string"
          ? e.message
          : "Could not start Google sign-in. Try email instead.";
      setErr(message);
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={!magic || busy}
        aria-label="Continue with Google"
        className={`op-btn-${variant} w-full`}
      >
        <GoogleG className="h-4 w-4" />
        {busy ? "Redirecting…" : "Continue with Google"}
      </button>
      {err ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Consumer-friendly "Web2-feel" reassurance shown alongside the Magic sign-in options — no seed
 * phrase, no extension. The heart of Magic's embedded-wallet onboarding; reused on /pay + /firewall.
 */
export function MagicLoginReassurance({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "flex items-start gap-2 rounded-xl border border-line bg-paper2 px-3.5 py-3",
        className,
      ].join(" ")}
    >
      <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-verify" aria-hidden="true" />
      <p className="text-xs leading-relaxed text-muted">
        <span className="font-medium text-ink2">No seed phrase, no extension.</span> Sign in like any
        app — Magic creates and secures a wallet for you, and you stay in control.
      </p>
    </div>
  );
}

/**
 * Sign out of the current Magic session, then hard-reload so all in-memory wallet / Universal
 * Account state is dropped and the login screen renders fresh — lets a user switch accounts.
 * Renders nothing until Magic is ready.
 */
export function SignOutButton({ magic, className = "" }: { magic: any | null; className?: string }) {
  const [busy, setBusy] = useState(false);
  if (!magic) return null;
  const handleClick = async () => {
    setBusy(true);
    try {
      await magic.user.logout();
    } catch {
      // Even if the logout call fails, the reload drops in-memory session/wallet state.
    }
    window.location.reload();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label="Sign out"
      className={[
        "inline-flex items-center rounded-full border border-line bg-paper2 px-3 py-1.5 text-xs font-medium text-ink2 transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

function GoogleG(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.41 3.63v3.02h3.9c2.27-2.1 3.53-5.18 3.53-8.89z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.9-3.02c-1.08.72-2.46 1.16-4.05 1.16-3.11 0-5.74-2.1-6.69-4.92H1.29v3.09A11.997 11.997 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.3a7.18 7.18 0 0 1 0-4.6V6.61H1.29A11.99 11.99 0 0 0 0 12c0 1.94.46 3.78 1.29 5.39l4.02-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.78c1.76 0 3.34.61 4.59 1.79l3.43-3.43C17.96 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.61l4.02 3.09C6.26 6.88 8.89 4.78 12 4.78z"
      />
    </svg>
  );
}
