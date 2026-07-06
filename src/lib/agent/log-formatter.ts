export type LogSource = "AGENT" | "FIREWALL" | "USER";
export type LogTone = "info" | "ok" | "blocked" | "error";

export type LogEntry = {
  /** ms epoch — rendered as a local clock time in the terminal. */
  ts: number;
  source: LogSource;
  message: string;
  tone: LogTone;
  /** Optional block-explorer link rendered under the line. */
  txUrl?: string;
};

/** Result of a firewall charge attempt, normalized from the relayer route response. */
export type ChargeResult =
  | { kind: "ok"; amountDisplay: string; txUrl?: string }
  | { kind: "blocked"; reason: string; attemptedDisplay?: string; capDisplay?: string }
  | { kind: "error"; message: string };

/**
 * Turn a charge result into the FIREWALL log line shown in the agent terminal.
 * The "blocked" branch is the demo's punchline, so it is explicit about the two
 * guarantees simulate-first gives us: no funds moved, zero gas.
 */
export function firewallResultLine(r: ChargeResult): {
  message: string;
  tone: LogTone;
  txUrl?: string;
} {
  switch (r.kind) {
    case "ok":
      return {
        message: `Charged ${r.amountDisplay}. Settled to merchant.`,
        tone: "ok",
        txUrl: r.txUrl,
      };
    case "blocked": {
      // When the caller knows the numbers (a per-charge cap breach), name them: seeing
      // "attempted 0.20 USDC, cap 0.10 USDC" makes the block legible in one glance. For
      // non-quantitative blocks (revoked / expired) the caller omits them and we stay qualitative.
      const detail =
        r.attemptedDisplay && r.capDisplay
          ? `${r.reason} — attempted ${r.attemptedDisplay}, cap ${r.capDisplay}`
          : r.reason;
      return {
        message: `BLOCKED: ${detail}. No funds moved, zero gas.`,
        tone: "blocked",
      };
    }
    case "error":
      return {
        message: `ERROR: ${r.message}`,
        tone: "error",
      };
  }
}

/** Render an entry's clock time as HH:MM:SS in the viewer's locale. */
export function formatClockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}
