export type GoogleLoginMode = "one_tap" | "redirect";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GooglePromptNotification {
  isNotDisplayed?: () => boolean;
  getNotDisplayedReason?: () => string;
  isSkippedMoment?: () => boolean;
  getSkippedReason?: () => string;
  isDismissedMoment?: () => boolean;
  getDismissedReason?: () => string;
}

export interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  prompt(callback?: (notification: GooglePromptNotification) => void): void;
}

interface GoogleLoginModeInput {
  enabled: string | undefined;
  clientId: string | undefined;
  supportsIdTokenLogin: boolean;
}

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GSI_LOAD_TIMEOUT_MS = 5_000;
let gsiPromise: Promise<GoogleAccountsId> | null = null;

export function selectGoogleLoginMode(input: GoogleLoginModeInput): GoogleLoginMode {
  return input.enabled === "true" &&
    Boolean(input.clientId?.trim()) &&
    input.supportsIdTokenLogin
    ? "one_tap"
    : "redirect";
}

/**
 * Wrap the callback-based Google Identity Services prompt in a bounded promise.
 * The credential is returned directly to the caller and is never logged or persisted here.
 */
export function requestGoogleCredential(
  accountsId: GoogleAccountsId,
  clientId: string,
  timeoutMs = 8_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error("Google One Tap timed out"))),
      timeoutMs
    );

    accountsId.initialize({
      client_id: clientId,
      callback: (response) => {
        const credential = response?.credential?.trim();
        if (!credential) {
          finish(() => reject(new Error("Google One Tap returned no credential")));
          return;
        }
        finish(() => resolve(credential));
      },
    });

    accountsId.prompt((notification) => {
      if (notification.isNotDisplayed?.()) {
        const reason = notification.getNotDisplayedReason?.() ?? "not displayed";
        finish(() => reject(new Error(`Google One Tap not displayed: ${reason}`)));
      } else if (notification.isSkippedMoment?.()) {
        const reason = notification.getSkippedReason?.() ?? "skipped";
        finish(() => reject(new Error(`Google One Tap skipped: ${reason}`)));
      } else if (notification.isDismissedMoment?.()) {
        const reason = notification.getDismissedReason?.() ?? "dismissed";
        finish(() => reject(new Error(`Google One Tap dismissed: ${reason}`)));
      }
    });
  });
}

async function loadGoogleIdentityServices(): Promise<GoogleAccountsId> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Google One Tap requires a browser");
  }

  const existing = (window as any).google?.accounts?.id as GoogleAccountsId | undefined;
  if (existing) return existing;
  if (gsiPromise) return gsiPromise;

  gsiPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(loadTimer);
      callback();
    };
    const finishLoad = () => {
      const accountsId = (window as any).google?.accounts?.id as GoogleAccountsId | undefined;
      if (accountsId) finish(() => resolve(accountsId));
      else finish(() => reject(new Error("Google Identity Services loaded without accounts.id")));
    };
    const failLoad = () =>
      finish(() => reject(new Error("Could not load Google Identity Services")));
    const loadTimer = setTimeout(
      () => finish(() => reject(new Error("Google Identity Services load timed out"))),
      GSI_LOAD_TIMEOUT_MS
    );

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SCRIPT_SRC}"]`
    );
    if (existingScript) {
      existingScript.addEventListener("load", finishLoad, { once: true });
      existingScript.addEventListener("error", failLoad, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", finishLoad, { once: true });
    script.addEventListener("error", failLoad, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    gsiPromise = null;
    throw error;
  });

  return gsiPromise;
}

export async function promptGoogleOneTap(clientId: string): Promise<string> {
  const normalizedClientId = clientId.trim();
  if (!normalizedClientId) throw new Error("Missing Google Client ID");
  const accountsId = await loadGoogleIdentityServices();
  return requestGoogleCredential(accountsId, normalizedClientId);
}
