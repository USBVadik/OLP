/**
 * Validates a return path read from a URL query parameter (e.g. `/auth/callback?return=...`)
 * and returns either the same path (if safe) or `/` (if not).
 *
 * Used after the OAuth round-trip to send the user back where they started without
 * letting an attacker forge a phishing destination via the `return` query string
 * (open-redirect attack).
 *
 * Accepts: clean same-origin paths starting with a single `/`, including query string
 * and hash. Whitespace is trimmed.
 *
 * Rejects: absolute URLs (http/https), protocol-relative URLs (`//attacker.com`),
 * pseudo-schemes (`javascript:`, `data:`), Windows-style backslash paths, and anything
 * else that does not begin with a single `/`.
 */
export function sanitizeReturnPath(raw: string | null | undefined): string {
  if (raw == null) return "/";
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "/";
  // Must start with a single slash.
  if (trimmed[0] !== "/") return "/";
  // Reject protocol-relative URLs (e.g. //attacker.com/...).
  if (trimmed.length > 1 && trimmed[1] === "/") return "/";
  // Reject backslash-starting paths (some browsers treat them as absolute).
  if (trimmed.includes("\\")) return "/";
  return trimmed;
}

/**
 * Builds the absolute URL we hand to Magic's `loginWithRedirect({ redirectURI })`.
 * Google sees this exact URI and matches it against the registered "Authorized redirect
 * URIs" in Google Cloud Console (exact match, including query string).
 *
 * We intentionally **omit any query string** here so the registered URI in Google Cloud
 * is a single fixed value. The "where to send the user back" path is preserved across
 * the OAuth round-trip via `storeReturnPath` / `consumeReturnPath` (sessionStorage).
 */
export function buildOauthCallbackUrl(origin: string): string {
  return new URL("/auth/callback", origin).href;
}

const RETURN_PATH_KEY = "onelink:oauth:returnTo";

/**
 * Save the same-origin path the user should land on after the OAuth round-trip.
 * Browser-only; safely no-ops on the server. Tolerates strict-storage browsers
 * (incognito + cookies-blocked) so a denied write does not crash the click handler.
 */
export function storeReturnPath(returnTo: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RETURN_PATH_KEY, returnTo);
  } catch {
    /* ignore — strict storage; the callback page will fall back to "/" */
  }
}

/**
 * Retrieve and clear the stored return path. Always returns a safe value via
 * `sanitizeReturnPath` so an attacker cannot inject a phishing destination by writing
 * to sessionStorage under our key.
 */
export function consumeReturnPath(): string {
  if (typeof window === "undefined") return "/";
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(RETURN_PATH_KEY);
    window.sessionStorage.removeItem(RETURN_PATH_KEY);
  } catch {
    return "/";
  }
  return sanitizeReturnPath(raw);
}
