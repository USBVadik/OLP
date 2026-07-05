"use client";

import { useProMode } from "@/hooks/use-pro-mode";

/**
 * Discreet "Expert (Pro) mode" switch. Off by default; opt-in overlay that reveals raw account
 * internals + self-custody controls elsewhere. Accessible: real <button role="switch">, aria-checked,
 * keyboard operable, visible focus ring. Purely a preference — never changes signing/settlement.
 */
export function ProModeToggle({ className = "" }: { className?: string }) {
  const [pro, setPro] = useProMode();
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`text-xs font-medium ${pro ? "text-muted" : "text-ink"}`}>Simple</span>
      <button
        type="button"
        role="switch"
        aria-checked={pro}
        aria-label="Expert (Pro) mode"
        onClick={() => setPro(!pro)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          pro ? "border-gold/40 bg-gold" : "border-line2 bg-paper2",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-3.5 w-3.5 rounded-full bg-cream shadow-sm transition-transform",
            pro ? "translate-x-[18px]" : "translate-x-[3px]",
          ].join(" ")}
          aria-hidden="true"
        />
      </button>
      <span className={`text-xs font-semibold ${pro ? "text-gold" : "text-muted"}`}>Pro</span>
    </div>
  );
}
