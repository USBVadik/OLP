// Pro (expert) mode preference — pure, storage-agnostic core so it's unit-testable in Node.
//
// Pro mode is an OPT-IN overlay that only changes what expert surfaces render (raw address, delegate
// contract, EIP-712 details, key-custody/exit). It never changes signing or settlement. It must fail
// closed to the simple default (off): a normal user should never land in Pro mode by accident.

export const PRO_MODE_KEY = "olp:proMode";

// The exact stored token that means "on". Anything else (null, "0", "true", whitespace, garbage)
// reads as off. Keeping it a single exact token avoids legacy/typo values silently enabling Pro.
const ON_TOKEN = "1";
const OFF_TOKEN = "0";

/** Serialize a boolean to the stored token. */
export function serializeProMode(on: boolean): string {
  return on ? ON_TOKEN : OFF_TOKEN;
}

/**
 * Read Pro mode from a Storage-like object. Fail-closed: returns false for a missing/absent value,
 * any non-exact token, or a storage that throws (e.g. localStorage blocked in a sandboxed frame).
 */
export function readProModeFrom(
  storage: { getItem(key: string): string | null } | null | undefined,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(PRO_MODE_KEY) === ON_TOKEN;
  } catch {
    return false;
  }
}
