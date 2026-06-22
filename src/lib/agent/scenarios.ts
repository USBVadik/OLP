import { formatUsdcAmount } from "@/lib/mandates/format";

export type AgentScenarioId = "within-cap" | "over-cap";

export type AgentScenario = {
  id: AgentScenarioId;
  /** Label for the button that triggers this scenario. */
  buttonLabel: string;
  /** Atomic USDC amount the agent will attempt to charge. */
  amountAtomic: bigint;
  /** Agent-voice narration appended to the terminal before calling the firewall. */
  preflight: string;
  /** Whether we expect SpendPolicy to block this (drives demo copy + a11y hints only). */
  expectBlocked: boolean;
};

/**
 * The two scripted moves of the "agent on a leash" demo, derived from the armed
 * mandate's per-charge cap so amounts always line up with the live limits:
 *   - within-cap: pays exactly the per-charge cap -> succeeds
 *   - over-cap:   attempts 2x the per-charge cap  -> reverts (PerChargeExceeded)
 */
export function buildAgentScenarios(maxPerCharge: bigint): AgentScenario[] {
  const within = maxPerCharge;
  const over = maxPerCharge * 2n;
  return [
    {
      id: "within-cap",
      buttonLabel: "Run agent (within budget)",
      amountAtomic: within,
      preflight: `Task received: pay invoice for ${formatUsdcAmount(within)}. Within budget — calling firewall…`,
      expectBlocked: false,
    },
    {
      id: "over-cap",
      buttonLabel: "Run agent (over cap → blocked)",
      amountAtomic: over,
      preflight: `Task received: premium upsell for ${formatUsdcAmount(over)}. Over the per-charge cap — calling firewall…`,
      expectBlocked: true,
    },
  ];
}
