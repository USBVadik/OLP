"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { chainLabel, type UniversalBalanceSummary } from "@/lib/particle/assets";

// Cold-start helper: when a connected account has little/no USDC, nudge toward funding.
// Two honest paths:
//   1. Empty account  -> receive USDC (or any token) on any chain (one balance).
//   2. Holds other tokens -> a LIVE, build-only convert estimate via Particle.
//
// The estimate calls `createBuyTransaction` in *build* mode only: it computes a quote
// (expected USDC out, fee, source chains) and is NEVER signed or sent. No funds move.
// Everything is capability-gated + wrapped so a flaky beta read degrades to the receive
// guidance instead of throwing. This component is additive and touches no core flow.

let UniversalAccount: any = null;
let UNIVERSAL_ACCOUNT_VERSION: any = null;
async function loadParticle() {
  if (!UniversalAccount) {
    const p = await import("@particle-network/universal-account-sdk");
    UniversalAccount = p.UniversalAccount;
    UNIVERSAL_ACCOUNT_VERSION = p.UNIVERSAL_ACCOUNT_VERSION;
  }
}

const USDC_LOW_USD = 0.1; // below the per-charge cap -> the agent can't even run one call
const EMPTY_USD = 0.01;
const MIN_CONVERT_USD = 1;
const MAX_CONVERT_USD = 5;

function num(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

type Estimate = {
  target: number;
  receiveUsd: number;
  feeUsd: number;
  fromChains: number[];
  fromSymbols: string[];
};

export function FundUsdcNotice({
  summary,
  ownerAddress,
  targetChainId,
  targetUsdcAddress,
  walletHref = "/wallet",
}: {
  summary: UniversalBalanceSummary | null;
  ownerAddress: string;
  targetChainId: number;
  targetUsdcAddress: string;
  walletHref?: string;
}) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const runEstimate = useCallback(async () => {
    if (!summary) return;
    const usdcUsd = summary.tokens.find((t) => t.symbol === "USDC")?.amountInUSD ?? 0;
    const otherUsd = Math.max(0, summary.totalUsd - usdcUsd);
    const target = Math.min(MAX_CONVERT_USD, Math.floor(otherUsd));
    if (target < MIN_CONVERT_USD) return;

    setEstimating(true);
    setEstimateError(null);
    try {
      await loadParticle();
      if (typeof UniversalAccount !== "function") throw new Error("sdk unavailable");
      const ua = new UniversalAccount({
        projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
        projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
        projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
        smartAccountOptions: {
          useEIP7702: true,
          name: "UNIVERSAL",
          version: UNIVERSAL_ACCOUNT_VERSION,
          ownerAddress,
        },
        tradeConfig: { slippageBps: 100, universalGas: false },
      });
      if (typeof ua.createBuyTransaction !== "function") throw new Error("convert unavailable");

      // Build only — produces a quote (rootHash/fees/tokenChanges). We never sign or send it.
      const tx = await ua.createBuyTransaction({
        token: { chainId: targetChainId, address: targetUsdcAddress },
        amountInUSD: String(target),
      });
      const tc = (tx?.tokenChanges ?? {}) as Record<string, unknown>;
      const receiveUsd = num(tc.totalIncrAmountInUSD) || num(tc.minReceiveAmountInUSD);
      const feeUsd = num(tc.totalFeeInUSD);
      const fromChains = Array.isArray(tc.fromChains)
        ? (tc.fromChains as unknown[]).map(num).filter((c) => c > 0)
        : [];
      const fromSymbols = Array.isArray(tc.decr)
        ? (tc.decr as any[])
            .map((d) => String(d?.token?.symbol ?? d?.token?.type ?? "").toUpperCase())
            .filter(Boolean)
        : [];
      setEstimate({ target, receiveUsd, feeUsd, fromChains, fromSymbols });
    } catch {
      setEstimateError("Estimate unavailable right now — you can still receive USDC below.");
    } finally {
      setEstimating(false);
    }
  }, [summary, ownerAddress, targetChainId, targetUsdcAddress]);

  if (!summary) return null;
  const usdcUsd = summary.tokens.find((t) => t.symbol === "USDC")?.amountInUSD ?? 0;
  if (usdcUsd >= USDC_LOW_USD) return null; // enough USDC — no nudge needed

  const totalUsd = summary.totalUsd;
  const otherUsd = Math.max(0, totalUsd - usdcUsd);
  const isEmpty = totalUsd < EMPTY_USD;
  const canConvert = otherUsd >= MIN_CONVERT_USD;

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold-soft/40 p-4 text-sm">
      <p className="font-semibold text-ink">Need USDC to fund the agent?</p>
      {isEmpty ? (
        <p className="mt-1 text-muted">
          Your account is empty. Receive USDC — or any token — on any chain; Particle shows it as one
          balance, no bridge.
        </p>
      ) : (
        <p className="mt-1 text-muted">
          You hold about ${otherUsd.toFixed(2)} across other tokens. Particle can convert it into
          spendable USDC — one balance, no bridge.
        </p>
      )}

      {canConvert ? (
        <div className="mt-3">
          {estimate ? (
            <div className="rounded-xl border border-line bg-paper p-3 text-ink2">
              <p className="text-[11px] uppercase tracking-wider text-faint">
                Live estimate · no funds move
              </p>
              <p className="mt-1">
                Convert ~${estimate.target} →{" "}
                <span className="font-semibold text-ink">≈ {estimate.receiveUsd.toFixed(2)} USDC</span>
                {estimate.feeUsd > 0 ? <> · fee ≈ ${estimate.feeUsd.toFixed(2)}</> : null}
              </p>
              {estimate.fromChains.length ? (
                <p className="mt-0.5 text-xs text-muted">
                  sourced from {estimate.fromSymbols.slice(0, 3).join(", ") || "your tokens"} on{" "}
                  {estimate.fromChains.map(chainLabel).slice(0, 3).join(", ")} — no bridge
                </p>
              ) : null}
            </div>
          ) : (
            <button
              onClick={runEstimate}
              disabled={estimating}
              className="op-btn-secondary w-full justify-center"
            >
              {estimating ? "Computing estimate…" : "Show convert estimate"}
            </button>
          )}
          {estimateError ? <p className="mt-2 text-xs text-danger">{estimateError}</p> : null}
        </div>
      ) : null}

      <Link href={walletHref} className="op-btn-ghost mt-3 inline-flex px-3 py-2">
        Receive USDC →
      </Link>
    </div>
  );
}
