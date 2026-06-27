"use client";

import { useEffect, useMemo, useState } from "react";
import { chainLabel, type UniversalBalanceSummary } from "@/lib/particle/assets";
import {
  planWithdrawal,
  destinationTier,
  WITHDRAW_DESTINATIONS,
  type WithdrawForecast,
} from "@/lib/particle/withdraw-forecast";
import { ConceptTag, IconBolt, IconChevronDown, Term } from "@/components/ui";

function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Fees can be tiny on L2s — keep them honest without faking precision. */
function usdFee(n: number): string {
  if (n <= 0) return "$0.00";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

/** Compact "where the money comes from" line: a few named legs, then a +N more tail. */
function sourceSummary(forecast: WithdrawForecast): string {
  if (forecast.legs.length === 0) return "—";
  const named = forecast.legs.slice(0, 3).map((l) => `${chainLabel(l.chainId)} ${usd(l.amountUsd)}`);
  const extra = forecast.legs.length - 3;
  return extra > 0 ? `${named.join(" · ")} · +${extra} more` : named.join(" · ");
}

const TIER_NOTE: Record<string, string> = {
  high: "Ethereum L1 settles slower and costs the most — an L2 destination keeps far more of your money.",
  medium: "A mid-cost chain — cheaper than Ethereum L1, pricier than an L2.",
  low: "A low-cost L2/destination — most of your balance arrives.",
};

type Props = {
  summary: UniversalBalanceSummary;
};

/**
 * WithdrawForecastCard — the "cash out, clearly" face of the Universal Account.
 *
 * A single balance can be spread thin across many chains. Before withdrawing, this previews:
 *   • which chains the funds are pulled from (scattered = more routing legs),
 *   • the estimated network cost (routing across legs + destination settlement), and
 *   • how much actually arrives at the chosen destination — and why a chain like Ethereum L1 costs
 *     more than an L2.
 *
 * It is a forecast only: clearly labelled as an estimate, it never moves funds and makes no live
 * cross-chain claim. The exact cost is quoted at execution.
 */
export function WithdrawForecastCard({ summary }: Props) {
  const available = summary.totalUsd;

  // Default destination = the chain holding the most (cheapest path), else Base.
  const dominantChain = summary.tokens
    .flatMap((t) => t.byChain)
    .filter((c) => c.amountInUSD > 0)
    .sort((a, b) => b.amountInUSD - a.amountInUSD)[0]?.chainId;
  const defaultDest =
    dominantChain && WITHDRAW_DESTINATIONS.some((d) => d.chainId === dominantChain)
      ? dominantChain
      : WITHDRAW_DESTINATIONS[0].chainId;

  const [destChainId, setDestChainId] = useState<number>(defaultDest);
  const [amountStr, setAmountStr] = useState<string>("");
  const [edited, setEdited] = useState(false);

  // Prefill the amount with the full balance (withdraw-all default) until the user edits it.
  useEffect(() => {
    if (!edited && available > 0) setAmountStr(available.toFixed(2));
  }, [available, edited]);

  const requested = Number.parseFloat(amountStr);
  const forecast = useMemo(
    () => planWithdrawal(summary, destChainId, Number.isFinite(requested) ? requested : 0),
    [summary, destChainId, requested]
  );

  const tier = destinationTier(destChainId);
  const destName = chainLabel(destChainId);
  const hasAmount = forecast.requestedUsd > 0;

  return (
    <div className="op-card-quiet p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="op-eyebrow">Withdraw</p>
        <span className="inline-flex items-center gap-1.5">
          <ConceptTag>Forecast</ConceptTag>
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Cash out to any chain. See what you{"\u2019"}ll actually receive before you withdraw — your
        balance is spread across chains, so the{" "}
        <Term def="The chain you withdraw to. Ethereum L1 gas is far higher than an L2 like Base or Arbitrum.">
          destination
        </Term>{" "}
        and how scattered the funds are both move the cost.
      </p>

      {/* Inputs: amount + destination */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="wd-amount" className="op-eyebrow">
            Amount (USD)
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-faint">
              $
            </span>
            <input
              id="wd-amount"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => {
                setEdited(true);
                // keep digits + a single dot
                setAmountStr(e.target.value.replace(/[^0-9.]/g, ""));
              }}
              placeholder="0.00"
              aria-label="Amount to withdraw in US dollars"
              className="op-input pl-7 pr-16"
            />
            <button
              type="button"
              onClick={() => {
                setEdited(true);
                setAmountStr(available.toFixed(2));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-line2 bg-paper px-2 py-1 text-[11px] font-semibold text-ink2 transition-colors hover:border-gold/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              Max
            </button>
          </div>
          <p className="mt-1 text-[11px] text-faint">{usd(available)} available across {summary.chainIds.length} {summary.chainIds.length === 1 ? "chain" : "chains"}</p>
        </div>

        <div>
          <label htmlFor="wd-dest" className="op-eyebrow">
            To chain
          </label>
          <div className="relative mt-1.5">
            <select
              id="wd-dest"
              value={destChainId}
              onChange={(e) => setDestChainId(Number(e.target.value))}
              aria-label="Destination chain"
              className="op-input appearance-none pr-9"
            >
              {WITHDRAW_DESTINATIONS.map((d) => (
                <option key={d.chainId} value={d.chainId}>
                  {chainLabel(d.chainId)}
                  {d.tier === "high" ? " — highest fees" : d.tier === "medium" ? " — mid fees" : ""}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
          </div>
          <p className="mt-1 text-[11px] text-faint">{TIER_NOTE[tier]}</p>
        </div>
      </div>

      {/* Forecast */}
      <div className="mt-4 rounded-2xl border border-line bg-paper p-4">
        <dl className="space-y-0 divide-y divide-line">
          <div className="flex items-start justify-between gap-3 pb-3">
            <dt className="text-sm text-muted">You withdraw</dt>
            <dd className="text-sm font-medium text-ink">{hasAmount ? usd(forecast.requestedUsd) : "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-3 py-3">
            <dt className="text-sm text-muted">
              Pulled from{" "}
              <span className="font-medium text-ink2">
                {forecast.legCount} {forecast.legCount === 1 ? "chain" : "chains"}
              </span>
            </dt>
            <dd className="min-w-0 text-right text-xs leading-relaxed text-muted">{sourceSummary(forecast)}</dd>
          </div>

          <div className="flex items-start justify-between gap-3 py-3">
            <dt className="text-sm text-muted">
              Network cost <span className="text-faint">(est.)</span>
            </dt>
            <dd className="text-right">
              <p className="text-sm font-medium text-ink">≈ {usdFee(forecast.totalCostUsd)}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
                {usdFee(forecast.routingCostUsd)} routing · {forecast.routedLegCount} {forecast.routedLegCount === 1 ? "leg" : "legs"}
                <br />
                {usdFee(forecast.settlementCostUsd)} {destName} settlement
              </p>
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            <dt className="text-sm font-medium text-ink">Arrives at your {destName} address</dt>
            <dd className="text-right">
              <p className="font-display text-lg font-semibold text-ink">
                {hasAmount ? usd(forecast.netReceivedUsd) : "—"}
              </p>
              {hasAmount ? (
                <p className="mt-0.5 text-[11px] text-faint">
                  {(forecast.effectivePct * 100).toFixed(forecast.effectivePct > 0.999 ? 0 : 1)}% of your withdrawal
                </p>
              ) : null}
            </dd>
          </div>
        </dl>

        {forecast.clamped ? (
          <p className="mt-3 rounded-lg border border-gold/25 bg-gold-soft/40 px-3 py-2 text-[11px] text-ink2">
            Capped to your available balance of {usd(available)}.
          </p>
        ) : null}
      </div>

      {/* Honest, non-executing CTA */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button type="button" disabled className="op-btn-primary flex-1 justify-center sm:flex-none">
          Withdraw to {destName}
        </button>
        <span className="inline-flex items-center gap-1.5">
          <ConceptTag>Preview only</ConceptTag>
        </span>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-faint">
        <IconBolt className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
        Estimate based on typical network costs — the exact fee is quoted when you withdraw. This
        preview never moves funds.
      </p>
    </div>
  );
}
