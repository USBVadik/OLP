// Honest, capability-gated key export for Pro (self-custody) mode.
//
// We ONLY expose Magic's own hosted settings UI (`magic.user.showSettings()`), where the user can
// reveal/export their private key inside Magic's flow. The raw key NEVER enters OneLink's JS, is
// never logged, stored, or transmitted. We deliberately do NOT use `revealPrivateKey` (which would
// hand the raw key to our page). The probe fails closed: if the hosted UI isn't available for this
// Magic config/build, Pro mode shows the honest exit path (undelegate -> plain wallet) instead.

export type KeyExportCapability = {
  available: boolean;
  /** Only ever "showSettings" — the Magic-hosted UI. Absent when unavailable. */
  method?: "showSettings";
};

/** Detect whether Magic's hosted settings UI (the safe key-export surface) is callable. Fail-closed. */
export function getKeyExportCapability(magic: unknown): KeyExportCapability {
  const user = (magic as { user?: unknown } | null | undefined)?.user as
    | { showSettings?: unknown }
    | null
    | undefined;
  if (user && typeof user.showSettings === "function") {
    return { available: true, method: "showSettings" };
  }
  return { available: false };
}

export type KeyExportResult = { ok: boolean; error?: string };

/**
 * Open Magic's hosted settings UI so the user can export their key themselves. Returns ok=false
 * (never throws into the caller) when the capability is absent or the flow errors. Never handles,
 * logs, or returns the private key — the reveal happens entirely inside Magic's UI.
 */
export async function openKeyExport(magic: unknown): Promise<KeyExportResult> {
  const cap = getKeyExportCapability(magic);
  if (!cap.available) return { ok: false, error: "not-available" };
  try {
    await (magic as { user: { showSettings: () => Promise<unknown> } }).user.showSettings();
    return { ok: true };
  } catch (e) {
    // Deliberately do not include any Magic payload in the message (defensive: never surface key material).
    return { ok: false, error: e instanceof Error ? e.name : "error" };
  }
}
