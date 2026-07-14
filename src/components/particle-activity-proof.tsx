import React from "react";
import { Chip, IconArrowUpRight } from "@/components/ui";

export interface ParticleActivityProofProps {
  activityId: string | null | undefined;
  href: string | null | undefined;
  sourceNames?: string[];
  settlementName?: string;
  verified?: boolean;
  variant?: "band" | "inline";
  summary?: string;
}

function shortActivityId(value: string): string {
  if (value.length <= 22) return value;
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

/**
 * Judge-facing proof that Particle Universal Accounts coordinated the payment route.
 * This is deliberately separate from block-explorer settlement proof: UniversalX is
 * Particle's view of the whole UA activity, while the receipt still links every mined leg.
 */
export function ParticleActivityProof({
  activityId,
  href,
  sourceNames = [],
  settlementName,
  verified = false,
  variant = "band",
  summary,
}: ParticleActivityProofProps) {
  if (!activityId) return null;

  const routeLabel =
    sourceNames.length && settlementName
      ? `${sourceNames.join(" + ")} source leg${sourceNames.length > 1 ? "s" : ""} → ${settlementName} settlement`
      : settlementName
        ? `${settlementName} settlement`
        : "Universal Account activity";
  const detail = summary ?? `EIP-7702 · ${routeLabel} · one Particle activity`;
  const containerClass =
    variant === "band"
      ? "mt-6 border-y border-iris/20 bg-iris-soft/35 px-6 py-4 sm:px-8"
      : "mt-4 border-t border-verify/20 pt-4";

  return (
    <section className={containerClass} aria-label="Particle Universal Account execution proof">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-iris/25 bg-paper font-display text-xs font-semibold text-iris shadow-sm"
            aria-hidden="true"
          >
            UA
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase text-iris">Particle Network proof</p>
              <Chip tone={verified ? "verify" : "default"}>
                {verified ? "FINISHED" : "Activity linked"}
              </Chip>
            </div>
            <p className="mt-1 font-display text-base font-semibold text-ink">
              Executed by Particle Universal Account
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>
          </div>
        </div>

        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-xl border border-iris/25 bg-paper px-3.5 py-2.5 text-left transition-colors hover:border-iris/45 hover:bg-iris-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 sm:min-w-48"
          >
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-iris">
                Open Particle explorer
              </span>
              <span className="block break-all font-mono text-xs font-medium text-ink2 group-hover:text-iris">
                {shortActivityId(activityId)}
              </span>
            </span>
            <IconArrowUpRight className="h-4 w-4 shrink-0 text-iris" />
            <span className="sr-only">Opens UniversalX in a new tab; sign-in may be required.</span>
          </a>
        ) : (
          <div className="break-all font-mono text-xs text-ink2">{shortActivityId(activityId)}</div>
        )}
      </div>
    </section>
  );
}
