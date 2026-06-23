"use client";

import { useEffect, useRef } from "react";
import { formatClockTime, type LogEntry } from "@/lib/agent/log-formatter";
import { IconShield } from "@/components/ui";

type Props = {
  entries: LogEntry[];
  /** Autoscroll to the newest line unless the user has scrolled up to read history. */
  autoScroll?: boolean;
};

// Brand-aligned hues tuned for the dark terminal surface. The light-canvas
// tokens (gold/verify/danger) are too dark for text on near-black, so these are
// lightened variants of the same brand hues — keeping the console on-system.
const SOURCE_COLOR: Record<LogEntry["source"], string> = {
  AGENT: "text-[#9B86FF]", // iris-2 — the agent's voice
  FIREWALL: "text-[#E0B25C]", // brand gold, lightened — the on-chain enforcer
  USER: "text-[#E6DDCD]", // warm cream — the human
};

const TONE_COLOR: Record<LogEntry["tone"], string> = {
  info: "text-[#C9C0B2]", // warm neutral
  ok: "text-[#45BE88]", // verify hue, lightened
  blocked: "text-[#E86A4C]", // danger hue, lightened
  error: "text-[#E86A4C]",
};

/**
 * A stylized read-only terminal showing the AI agent's actions and the firewall's
 * on-chain responses. Presentational only — all state lives in the parent.
 */
export function AgentTerminal({ entries, autoScroll = true }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;
    // Only stick to the bottom if the user is already near it (within 48px),
    // so scrolling up to read history isn't yanked back on each new line.
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (nearBottom) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, autoScroll]);

  return (
    <div className="rounded-2xl border border-[#2E2820] bg-[#18140E] shadow-card">
      <div className="flex items-center gap-2 border-b border-[#2E2820] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E86A4C]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E0B25C]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#45BE88]/80" />
        <span className="ml-2 font-mono text-xs text-[#8A8174]">ai-agent · sandbox</span>
      </div>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="AI agent activity and on-chain firewall verdicts"
        className="h-72 overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed"
      >
        {entries.length === 0 ? (
          <p className="text-[#7A7165]">
            Idle. Trigger the agent to watch it pay inside the mandate — and get blocked when it
            tries to break out.
          </p>
        ) : (
          entries.map((e, i) => {
            const isBlocked = e.tone === "blocked";
            return (
              <div
                key={`${e.ts}-${i}`}
                className={`mb-1.5 rounded ${
                  isBlocked
                    ? "animate-block-pulse border-l-2 border-[#E86A4C] bg-[#E86A4C]/12 px-2 py-1"
                    : "px-1.5"
                }`}
              >
                <span className="text-[#7A7165]">{formatClockTime(e.ts)} </span>
                {isBlocked ? (
                  <IconShield className="mb-0.5 mr-0.5 inline h-3.5 w-3.5 text-[#E86A4C]" aria-hidden="true" />
                ) : null}
                <span className={SOURCE_COLOR[e.source]}>[{e.source}]</span>{" "}
                <span className={`${TONE_COLOR[e.tone]} ${isBlocked ? "font-semibold" : ""}`}>{e.message}</span>
                {e.txUrl ? (
                  <a
                    href={e.txUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 underline decoration-dotted underline-offset-2 text-[#8A8174] hover:text-[#C9C0B2]"
                  >
                    view tx ↗
                  </a>
                ) : null}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
