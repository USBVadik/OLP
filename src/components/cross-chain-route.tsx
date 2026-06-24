import { Chip, IconArrowUpRight, IconCheck } from "@/components/ui";

/**
 * CrossChainRoute — the "money in motion" visualization for Particle Universal Account /
 * EIP-7702 payments. It makes the chain-abstraction superpower VISIBLE: USDC sourced from
 * one chain and settled on another, with no manual bridge.
 *
 * Three honest states:
 *  - "preview"  (before signing, in the /pay confirm card): the planned route, derived from the
 *               built transaction's real tokenChanges.fromChains -> toChains. Static (no "done"
 *               check, no animation) — it's a plan, not a settlement.
 *  - "routing"  (live, during /pay settling): the source chain is NOT yet resolved, so the left
 *               node is the Universal Account itself (chain-agnostic). Animated flow + a live
 *               phase label. No fabricated source chain.
 *  - "settled"  (success + shareable receipt): the left node(s) are the REAL chains the UA
 *               sourced from, the right node is the settlement chain, and the route is confirmed.
 *
 * Pure presentational + CSS — server-safe (no "use client"), so it renders inside both the
 * server `/receipt` page and the client `/pay` screens. All motion uses existing keyframes
 * (animate-shimmer / animate-pulse-glow) that globals.css already disables under
 * prefers-reduced-motion.
 */
export interface CrossChainRouteProps {
  status: "preview" | "routing" | "settled";
  /** Real source chain names (preview/settled). Empty/omitted => the Universal Account is the source. */
  fromNames?: string[];
  /** Settlement (destination) chain name. */
  toName: string;
  /** e.g. "1.00 USDC" — rides above the route. */
  amountLabel?: string;
  /** Optional fee note, e.g. "~$0.02 in USDC" — preview state only. */
  feeLabel?: string | null;
  /** Live phase text, routing state only. */
  phaseLabel?: string | null;
  /** UniversalX activity URL spanning the whole cross-chain orchestration (settled state). */
  activityHref?: string | null;
  className?: string;
}

const UNIVERSAL_ACCOUNT = "Universal Account";

function monogramFor(name: string): string {
  if (/universal account/i.test(name)) return "UA";
  const ch = name.trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function NodeBadge({
  name,
  variant,
  status,
}: {
  name: string;
  variant: "source" | "dest";
  status: "preview" | "routing" | "settled";
}) {
  const isUA = /universal account/i.test(name);
  const settledDest = variant === "dest" && status === "settled";
  const palette = settledDest
    ? "border-verify/30 bg-verify-soft text-verify"
    : variant === "dest" || isUA
      ? "border-iris/30 bg-iris-soft text-iris-ink"
      : "border-gold/30 bg-gold-soft text-gold";
  return (
    <span
      className={[
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border font-display text-sm font-semibold",
        palette,
        status === "routing" ? "animate-pulse-glow" : "",
      ].join(" ")}
      aria-hidden="true"
    >
      {settledDest ? <IconCheck className="h-5 w-5" /> : monogramFor(name)}
    </span>
  );
}

export function CrossChainRoute({
  status,
  fromNames,
  toName,
  amountLabel,
  feeLabel,
  phaseLabel,
  activityHref,
  className = "",
}: CrossChainRouteProps) {
  const routing = status === "routing";
  const preview = status === "preview";
  const settled = status === "settled";
  const sources = fromNames && fromNames.length ? fromNames : [UNIVERSAL_ACCOUNT];
  const sourceMain = sources[0];
  const sourceLabel = sources.length > 1 ? `${sourceMain} +${sources.length - 1}` : sourceMain;

  const eyebrow = routing
    ? "Universal Account · routing"
    : preview
      ? "Planned cross-chain route"
      : "Cross-chain settlement";

  const midLabel = routing ? "sourcing USDC" : preview ? "will route" : "USDC routed";

  const srText = routing
    ? `Routing your payment through the Universal Account and settling on ${toName}.`
    : preview
      ? `Planned cross-chain route: your USDC will be sourced from ${sources.join(" and ")} and settled on ${toName}, no manual bridge.`
      : `Funded from ${sources.join(" and ")} and settled on ${toName} with no manual bridge.`;

  return (
    <div
      className={[
        "rounded-2xl border p-4",
        routing ? "border-iris/25 bg-iris-soft/40" : preview ? "border-iris/20 bg-paper" : "border-line bg-paper2",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="op-eyebrow">{eyebrow}</span>
        {routing ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-iris">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-iris/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-iris" />
            </span>
            in motion
          </span>
        ) : (
          <Chip tone="gold">no manual bridge</Chip>
        )}
      </div>

      {/* Rail: source node -> track -> destination node */}
      <div className="relative mt-6">
        {amountLabel ? (
          <span
            className={[
              "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[150%] whitespace-nowrap rounded-full border bg-paper px-2.5 py-0.5 text-[11px] font-semibold tnum shadow-sm",
              settled ? "border-gold/30 text-gold" : "border-iris/30 text-iris-ink",
            ].join(" ")}
          >
            {amountLabel}
          </span>
        ) : null}

        <div className="flex items-center gap-2">
          <div className="flex w-16 shrink-0 justify-center">
            <NodeBadge name={sourceMain} variant="source" status={status} />
          </div>
          <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
            <span
              className={
                routing
                  ? "absolute inset-0 bg-gradient-to-r from-transparent via-iris to-transparent bg-[length:200%_100%] animate-shimmer"
                  : "absolute inset-0 bg-gradient-to-r from-iris/40 via-gold to-verify"
              }
              aria-hidden="true"
            />
          </div>
          <div className="flex w-16 shrink-0 justify-center">
            <NodeBadge name={toName} variant="dest" status={status} />
          </div>
        </div>

        {/* Labels, aligned under each node */}
        <div className="mt-2 flex items-start gap-2">
          <span className="w-16 shrink-0 text-center text-[11px] font-medium leading-tight text-ink2">
            {sourceLabel}
          </span>
          <span className="min-w-0 flex-1 text-center text-[10px] font-medium uppercase tracking-wide text-faint">
            {midLabel}
          </span>
          <span className="w-16 shrink-0 text-center text-[11px] font-medium leading-tight text-ink2">
            {toName}
          </span>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-4 text-xs leading-relaxed text-muted">
        {routing ? (
          phaseLabel ?? `The Universal Account is sourcing USDC across your chains and settling on ${toName}.`
        ) : preview ? (
          <>
            Your USDC will be sourced from <span className="font-medium text-ink2">{sources.join(" + ")}</span> and
            settled on <span className="font-medium text-ink2">{toName}</span> in one operation — no manual bridge.
            {feeLabel ? (
              <>
                {" "}
                Network fee <span className="font-medium text-ink2">{feeLabel}</span>, paid in USDC.
              </>
            ) : null}
          </>
        ) : (
          <>
            Funded from <span className="font-medium text-ink2">{sources.join(" + ")}</span> and
            delivered on <span className="font-medium text-ink2">{toName}</span> — no manual bridge;
            the Universal Account sourced the USDC across chains.
          </>
        )}
      </p>

      {settled && activityHref ? (
        <a
          href={activityHref}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-iris transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40"
        >
          Trace the route on UniversalX
          <IconArrowUpRight className="h-3.5 w-3.5" />
        </a>
      ) : null}

      <span className="sr-only">{srText}</span>
    </div>
  );
}
