"use client";

import { useEffect, useRef } from "react";
import { formatClockTime, type LogEntry } from "@/lib/agent/log-formatter";

type Props = {
  entries: LogEntry[];
  /** Autoscroll to the newest line unless the user has scrolled up to read history. */
  autoScroll?: boolean;
};

const SOURCE_COLOR: Record<LogEntry["source"], string> = {
  AGENT: "text-cyan-300",
  FIREWALL: "text-amber-300",
  USER: "text-fuchsia-300",
};

const TONE_COLOR: Record<LogEntry["tone"], string> = {
  info: "text-zinc-300",
  ok: "text-emerald-300",
  blocked: "text-red-400",
  error: "text-red-400",
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-card">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        <span className="ml-2 font-mono text-xs text-zinc-400">ai-agent — sandbox</span>
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
          <p className="text-zinc-600">
            Idle. Trigger the agent to watch it pay inside the mandate — and get blocked when it
            tries to break out.
          </p>
        ) : (
          entries.map((e, i) => (
            <div
              key={`${e.ts}-${i}`}
              className={`mb-1.5 rounded ${
                e.tone === "blocked" ? "animate-block-pulse bg-red-500/10 px-1.5 py-0.5" : ""
              }`}
            >
              <span className="text-zinc-600">{formatClockTime(e.ts)} </span>
              <span className={SOURCE_COLOR[e.source]}>[{e.source}]</span>{" "}
              <span className={TONE_COLOR[e.tone]}>{e.message}</span>
              {e.txUrl ? (
                <a
                  href={e.txUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 underline decoration-dotted underline-offset-2 text-zinc-400 hover:text-zinc-200"
                >
                  view tx ↗
                </a>
              ) : null}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
