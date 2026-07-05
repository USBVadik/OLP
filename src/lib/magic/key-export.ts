// Honest, capability-gated key export for Pro (self-custody) mode.
//
// Magic's client-side key export is `revealEVMPrivateKey` (or the legacy `revealPrivateKey`). It
// opens Magic's OWN hosted reveal UI where only the end user sees the key — neither Magic nor OneLink
// can read it (per Magic docs). So OneLink never handles, stores, logs, or transmits the key.
//
// We deliberately do NOT use `showSettings`: for our app config it opens a generic Account Settings
// modal with no export control (observed live), which would be a misleading dead-end. The probe fails
// closed: if no reveal method exists, Pro mode shows the honest exit path (revert to a plain wallet)
// instead. Note: even when the method exists, Magic may reject it if key export isn't enabled for the
// app plan — `openKeyExport` returns ok:false in that case so the UI can show the honest fallback.

export type KeyExportMethod = "revealEVMPrivateKey" | "revealPrivateKey";

export type KeyExportCapability = {
  available: boolean;
  /** The Magic reveal method to call; absent when unavailable. */
  method?: KeyExportMethod;
};

function userModule(magic: unknown): Record<string, unknown> | null {
  const user = (magic as { user?: unknown } | null | undefined)?.user;
  return user && typeof user === "object" ? (user as Record<string, unknown>) : null;
}

/** Detect Magic's key-reveal method (prefer the multichain `revealEVMPrivateKey`). Fail-closed. */
export function getKeyExportCapability(magic: unknown): KeyExportCapability {
  const user = userModule(magic);
  if (!user) return { available: false };
  if (typeof user.revealEVMPrivateKey === "function") {
    return { available: true, method: "revealEVMPrivateKey" };
  }
  if (typeof user.revealPrivateKey === "function") {
    return { available: true, method: "revealPrivateKey" };
  }
  return { available: false };
}

export type KeyExportResult = { ok: boolean; error?: string };

/**
 * Open Magic's hosted key-reveal UI so the user can export their key themselves. Returns ok=false
 * (never throws to the caller) when the capability is absent or Magic rejects it (e.g. export not
 * enabled for the app). Never handles, logs, or returns the private key — the reveal is entirely
 * inside Magic's UI.
 */
export async function openKeyExport(magic: unknown): Promise<KeyExportResult> {
  const cap = getKeyExportCapability(magic);
  const user = userModule(magic);
  if (!cap.available || !cap.method || !user) return { ok: false, error: "not-available" };
  try {
    await (user[cap.method] as () => Promise<unknown>)();
    return { ok: true };
  } catch (e) {
    // Never include any Magic payload in the message (defensive: never surface key material).
    return { ok: false, error: e instanceof Error ? e.name : "error" };
  }
}
