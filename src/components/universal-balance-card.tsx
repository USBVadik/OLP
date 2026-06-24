"use client";

import { useEffect, useRef, useState } from "react";
import {
  chainLabel,
  type ChainBalance,
  type UniversalBalanceSummary,
} from "@/lib/particle/assets";
import { IconBolt } from "@/components/ui";

type Props = {
  summary: UniversalBalanceSummary | null;
  loading?: boolean;
  error?: string | null;
  /** Re-trigger the balance read (Particle reads can flake — let the demo recover in one click). */
  onRetry?: () => void;
};

function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/**
 * Count the total up from zero on mount/change — the balance feels "aggregated" live.
 * Respects reduced motion (snaps to the final value).
 */
function useCountUp(target: number, ms = 900): number {
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target <= 0) {
      setVal(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, ms]);
  return val;
}

function amt(n: number): string {
  // Trim to a sensible precision: integers clean, else up to 4 sig decimals.
  if (n === 0) return "0";
  if (Number.isInteger(n)) return n.toString();
  return n < 0.01 ? n.toPrecision(2) : n.toFixed(n < 1 ? 4 : 2);
}

/**
 * Per-token chain breakdown: lead with the chains that actually hold a balance (named), and
 * collapse the long tail of $0 chains into "+N more at $0" so the card stays clean while still
 * conveying the cross-chain breadth. Falls back to the USD total when nothing is held.
 */
function breakdown(byChain: ChainBalance[], fallbackUsd: number): string {
  const nonZero = byChain.filter((c) => c.amount > 0);
  if (nonZero.length === 0) return usd(fallbackUsd);
  const named = nonZero.map((c) => `${chainLabel(c.chainId)} ${amt(c.amount)}`);
  const zeros = byChain.length - nonZero.length;
  return zeros > 0 ? `${named.join(" · ")} · +${zeros} more at $0` : named.join(" · ");
}

/**
 * The Unified Balance HUD: shows the Particle Universal Account's single balance aggregated
 * across chains. This is the visible expression of Particle's chain-abstraction superpower —
 * one balance, many chains, no bridging, no gas juggling.
 */
export function UniversalBalanceCard({ summary, loading = false, error = null, onRetry }: Props) {
  const animatedTotal = useCountUp(summary?.totalUsd ?? 0);
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold-soft/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="op-eyebrow">Universal Account balance</p>
        {summary && summary.chainIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {summary.chainIds.map((id) => (
              <span
                key={id}
                className="rounded-full border border-line2 bg-paper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
              >
                {chainLabel(id)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Balance unavailable — the rest of the demo still works.</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded-lg border border-line2 bg-paper px-2.5 py-1 text-xs font-medium text-ink2 transition-colors hover:border-gold/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : loading && !summary ? (
        <p className="mt-3 animate-pulse text-sm text-muted">Loading balance…</p>
      ) : summary ? (
        <>
          <div className="mt-2">
            <p className="font-display text-3xl font-semibold text-ink">{usd(animatedTotal)}</p>
            <p className="mt-0.5 text-xs text-muted">
              {summary.chainIds.length > 1
                ? `one balance across ${summary.chainIds.length} chains`
                : summary.chainIds.length === 1
                ? `on ${chainLabel(summary.chainIds[0])}`
                : "no balance yet"}
            </p>
          </div>

          {summary.tokens.length > 0 ? (
            <dl className="mt-3 space-y-1.5">
              {summary.tokens.map((t) => (
                <div key={t.symbol} className="flex items-baseline justify-between gap-3 text-sm">
                  <dt className="font-medium text-ink">
                    {amt(t.amount)} <span className="text-muted">{t.symbol}</span>
                  </dt>
                  <dd className="text-right text-xs text-muted">
                    {breakdown(t.byChain, t.amountInUSD)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">Connect to load your Universal Account balance.</p>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
        <IconBolt className="h-3 w-3 text-gold" />
        Powered by Particle Universal Accounts — one balance, every chain.
      </p>
    </div>
  );
}
