"use client";

import { useCallback, useEffect, useState } from "react";
import { PRO_MODE_KEY, readProModeFrom, serializeProMode } from "@/lib/prefs/pro-mode";

// Same-tab sync: components that read Pro mode (account card, /pay preview) update instantly when the
// toggle flips, without a global store. `storage` covers cross-tab; a custom event covers same-tab.
const PRO_MODE_EVENT = "olp:promodechange";

/**
 * Opt-in Pro (expert) mode preference, persisted in localStorage. Off by default and SSR-safe
 * (starts false, hydrates from storage after mount). `set` writes storage + notifies listeners so
 * every mounted reader stays in sync. Reading/serialization is the unit-tested pure core.
 */
export function useProMode(): [boolean, (on: boolean) => void] {
  const [pro, setProState] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setProState(readProModeFrom(window.localStorage));
    sync();
    window.addEventListener(PRO_MODE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PRO_MODE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const set = useCallback((on: boolean) => {
    setProState(on);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PRO_MODE_KEY, serializeProMode(on));
    } catch {
      /* storage may be blocked (private mode / sandboxed frame) — keep the in-memory state */
    }
    try {
      window.dispatchEvent(new Event(PRO_MODE_EVENT));
    } catch {
      /* no-op */
    }
  }, []);

  return [pro, set];
}
