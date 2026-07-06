"use client";

import { useState } from "react";
import { Chip, IconShield, IconBan, IconBolt, IconCheck } from "@/components/ui";

type BlockResult = {
  armed: boolean;
  blocked?: boolean;
  reason?: string;
  attempted: string;
  cap: string;
  chainId?: number;
  message?: string;
};

/**
 * Walletless "guided live" firewall block. One button → the server simulates a real over-cap
 * `SpendPolicy.charge` on Arbitrum and returns the on-chain revert. No login, no funds, no gas.
 */
export function FirewallBlockDemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlockResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/demo/firewall-block", { method: "POST" });
      setResult((await res.json()) as BlockResult);
    } catch {
      setError("Couldn't reach the chain just now — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="op-card p-6 sm:p-7">
      <div className="flex items-center justify-between gap-2">
        <span className="op-eyebrow">Live firewall · no wallet</span>
        <Chip tone="gold">
          <IconShield className="h-3.5 w-3.5" /> On-chain
        </Chip>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink2">
        A signed demo mandate caps the agent at <span className="font-medium text-ink">0.10 USDC</span>{" "}
        per charge. Press the button and the agent attempts{" "}
        <span className="font-medium text-ink">0.50 USDC</span> — 5&times; over the cap — against the
        real SpendPolicy contract on Arbitrum.
      </p>

      <button onClick={run} disabled={loading} className="op-btn-primary mt-5 w-full justify-center">
        {loading ? (
          "Asking the chain…"
        ) : (
          <>
            <IconBolt className="h-4 w-4" /> Make the agent overspend
          </>
        )}
      </button>

      {result?.blocked ? (
        <div className="op-animate-rise mt-5 rounded-2xl border border-danger/30 bg-danger-soft p-4">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <IconBan className="h-4 w-4" /> Blocked on-chain
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink2">
            The charge reverted (<span className="font-mono text-xs">{result.reason}</span>) —
            attempted <span className="font-medium text-ink">{result.attempted} USDC</span> against a{" "}
            <span className="font-medium text-ink">{result.cap} USDC</span> cap.{" "}
            <span className="font-semibold text-ink">No funds moved. Zero gas.</span>
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-verify">
            <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Refused by SpendPolicy on the
            payer&rsquo;s own account — not by a server you have to trust.
          </p>
        </div>
      ) : result && !result.armed ? (
        <p className="mt-4 rounded-xl border border-line bg-paper2 p-3 text-sm text-muted">
          {result.message ?? "The walletless demo isn't armed yet."}
        </p>
      ) : result ? (
        <p className="mt-4 text-sm text-muted">
          Unexpected: {result.reason ?? result.message ?? "no revert"}.
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
