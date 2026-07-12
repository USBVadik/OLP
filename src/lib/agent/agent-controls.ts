// Pure UI-state for the /agent armed panel: what the user may do given the run / revoke state.
// Extracted so the "no run after revoke", "no double revoke", and "no action mid-charge" rules are
// unit-tested and out of the component. The on-chain revoke itself is enforced by SpendPolicy and
// covered by the contract tests (revoke -> subsequent charges revert with MandateIsRevoked).

export type AgentControlTone = "armed" | "working" | "revoked";

export interface AgentControlState {
  /** May the user start the research task? */
  canRun: boolean;
  /** May the user revoke the budget now? */
  canRevoke: boolean;
  /** Short human status for the armed panel. */
  statusLabel: string;
  statusTone: AgentControlTone;
}

/**
 * Decide the armed-panel controls. `revoked` wins over `running`: once the mandate is revoked, both
 * actions are off. While a charge is in flight (`running`) we also block revoke to avoid racing an
 * in-flight settlement.
 */
export function agentControls(input: { running: boolean; revoked: boolean }): AgentControlState {
  if (input.revoked) {
    return {
      canRun: false,
      canRevoke: false,
      statusLabel: "Budget revoked — further charges revert on-chain",
      statusTone: "revoked",
    };
  }
  if (input.running) {
    return {
      canRun: false,
      canRevoke: false,
      statusLabel: "Working…",
      statusTone: "working",
    };
  }
  return {
    canRun: true,
    canRevoke: true,
    statusLabel: "Armed — ready to run",
    statusTone: "armed",
  };
}
