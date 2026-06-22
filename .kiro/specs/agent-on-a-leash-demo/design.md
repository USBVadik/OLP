# Spec: agent-on-a-leash-demo — Design

> Pairs with `requirements.md` (acceptance) and `tasks.md` (TDD-ordered checkboxes).

## 1. Architecture decision

The "agent" is **client-side**, not a Node bot. Three reasons:

1. **Reliability** — running a Node CLI live during a demo introduces a separate failure surface
   (terminal multiplexing, auth, host machine quirks). Reducing live moving parts is core to
   `methodology.md` §1.6 (Reversibility budget).
2. **Visual fidelity** — judges see one screen. A real CLI window would split attention.
3. **Honesty** — calling it an "agent" stylistically is acceptable as long as the firewall is
   the truth. The firewall genuinely doesn't know whether the caller is human or code.

The result: a stylized **agent terminal panel** in the browser that emits agent-flavored log
lines while invoking the same `/api/mandates/charge` route as the existing manual buttons.

## 2. Module breakdown

```
src/
├── lib/
│   └── agent/
│       ├── scenarios.ts          (new)  pure: scenario definitions
│       ├── scenarios.test.ts     (new)  vitest
│       ├── log-formatter.ts      (new)  pure: timestamp + prefix formatting
│       └── log-formatter.test.ts (new)  vitest
├── components/
│   ├── agent-terminal.tsx        (new)  presentational + ref-based scroll
│   ├── agent-terminal.test.tsx   (new)  interaction test
│   └── permission-firewall.tsx   (modify) add agent panel slot + run buttons
└── app/
    └── firewall/
        └── page.tsx              (modify) split-screen layout + state plumbing
```

No backend changes. The existing `/api/mandates/charge` route already returns enough info
(simulation revert reason, tx hash) for our terminal output.

## 3. Data model

```ts
// src/lib/agent/scenarios.ts
export type AgentOutcome = "success" | "blocked-cap" | "blocked-revoked" | "error";

export type AgentScenario = {
  id: "within-cap" | "over-cap";
  label: string;                  // button label
  amountAtomic: bigint;            // USDC in 6-decimals
  amountDisplay: string;           // "0.10 USDC"
  preflightLog: string;            // "Detected offer: 0.10 USDC. Calling firewall..."
  expectedHappy: AgentOutcome;     // for tooltip / aria-label only
};

export const SCENARIOS: readonly AgentScenario[] = [
  {
    id: "within-cap",
    label: "Run agent (within cap)",
    amountAtomic: 100_000n,        // 0.10 USDC
    amountDisplay: "0.10 USDC",
    preflightLog: "Detected offer: 0.10 USDC. Calling firewall...",
    expectedHappy: "success",
  },
  {
    id: "over-cap",
    label: "Run agent (over cap)",
    amountAtomic: 200_000n,        // 0.20 USDC, > the 0.10 maxPerCharge
    amountDisplay: "0.20 USDC",
    preflightLog: "Attempting 0.20 USDC. Calling firewall...",
    expectedHappy: "blocked-cap",
  },
] as const;
```

```ts
// src/lib/agent/log-formatter.ts
export type LogSource = "AGENT" | "FIREWALL" | "USER";

export type LogEntry = {
  ts: number;       // ms epoch
  source: LogSource;
  message: string;
  // optional structured tail rendered as monospaced details under the line
  details?: { txHash?: string; chainId?: number; code?: string };
};

export function formatLogLine(entry: LogEntry): string {
  // "15:34:01 [AGENT] Detected offer: 0.10 USDC. Calling firewall..."
}
```

## 4. Component contract

```tsx
// src/components/agent-terminal.tsx
type AgentTerminalProps = {
  entries: LogEntry[];
  /** when true, autoscroll on new entry */
  autoScroll?: boolean;
};
```

Render:
- Dark terminal container (`bg-zinc-900 text-zinc-100 font-mono`).
- Each entry on its own line, source prefix color-coded:
  - `AGENT` → cyan
  - `FIREWALL` → amber for OK, red for `BLOCKED:`/`ERROR:`
  - `USER` → magenta
- If `entry.details.txHash` present, render a small "tx: 0x…abc → explorer" row.
- Auto-scroll to bottom on new entry (when `autoScroll` true and user hasn't manually scrolled
  up; minimal heuristic acceptable).

## 5. Sequence (within-cap success)

```
operator clicks "Run agent (within cap)"
  └─ permission-firewall.tsx
       ├─ logs `[AGENT] Detected offer: 0.10 USDC. Calling firewall...`
       ├─ disables both Run-agent buttons
       ├─ POST /api/mandates/charge { mandate, signature, amountAtomic: 100000n }
       │     └─ relayer simulates → ok → submits
       ├─ on response.ok:
       │     └─ logs `[FIREWALL] Charged 0.10 USDC. Tx: 0x…abc` (with explorer link)
       │     └─ triggers budget HUD refetch (existing behavior)
       └─ re-enables buttons
```

## 6. Sequence (over-cap blocked)

```
operator clicks "Run agent (over cap)"
  └─ permission-firewall.tsx
       ├─ logs `[AGENT] Attempting 0.20 USDC. Calling firewall...`
       ├─ disables both Run-agent buttons
       ├─ POST /api/mandates/charge { mandate, signature, amountAtomic: 200000n }
       │     └─ relayer simulates → revert: PerChargeExceeded → does NOT submit
       │     └─ returns 200 with { ok: false, blocked: true, code: "PerChargeExceeded" }
       ├─ logs `[FIREWALL] BLOCKED: PerChargeExceeded. No funds moved. Zero gas.`
       └─ re-enables buttons
```

The relayer route already does simulate-first per `methodology.md` lineage and the
existing `route.ts`. We must verify the response shape matches what we render. If the route
currently returns a different shape on simulation revert, **adjust the route** (small tweak,
preserve compatibility with existing manual-charge buttons).

## 7. Layout

`/firewall` page becomes a CSS grid:

```
┌──────────────────────────────────┬──────────────────────────────────┐
│   firewall dashboard (existing)  │   agent terminal                 │
│   - mandate card                 │   - log entries                  │
│   - budget HUD                   │                                  │
│   - manual charge buttons        │                                  │
│   - run-agent buttons (NEW)      │                                  │
│   - revoke                       │                                  │
└──────────────────────────────────┴──────────────────────────────────┘
```

- Desktop: `grid-cols-2 gap-6`.
- Mobile: stack (`grid-cols-1`); agent terminal collapses to a smaller height with
  scroll-within. We are not optimizing for mobile demo (`master-tz.md` §6 cuts mobile-first).

## 8. State plumbing

State lives in `firewall/page.tsx` and is passed down. No new global state.

```ts
const [entries, setEntries] = useState<LogEntry[]>([]);
const [running, setRunning] = useState(false);

const append = (e: Omit<LogEntry, "ts">) =>
  setEntries(prev => [...prev, { ts: Date.now(), ...e }]);

const runScenario = async (s: AgentScenario) => {
  setRunning(true);
  append({ source: "AGENT", message: s.preflightLog });
  try {
    const res = await fetch("/api/mandates/charge", { /* ... */ });
    const json = await res.json();
    if (json.ok) {
      append({
        source: "FIREWALL",
        message: `Charged ${s.amountDisplay}.`,
        details: { txHash: json.txHash, chainId: json.chainId },
      });
      // budget HUD will refetch via existing hook
    } else if (json.blocked) {
      append({
        source: "FIREWALL",
        message: `BLOCKED: ${json.code}. No funds moved. Zero gas.`,
        details: { code: json.code },
      });
    } else {
      append({
        source: "FIREWALL",
        message: `ERROR: ${json.code ?? "UNKNOWN"}. ${json.message ?? ""}`,
      });
    }
  } catch (err) {
    append({ source: "FIREWALL", message: `ERROR: NETWORK. ${String(err)}` });
  } finally {
    setRunning(false);
  }
};
```

## 9. Existing-route compatibility note

We must read `src/app/api/mandates/charge/route.ts` before implementing T7 to confirm the
response shape. Two possibilities:

1. **It already differentiates** simulation revert from network error → no route changes,
   just adapt our consumer.
2. **It returns a generic error** on simulate-revert → we add a minimal change: detect
   `code: "PerChargeExceeded" | "DailyCapExceeded" | ...` and return `{ blocked: true, code }`.

Either way: contract-test the route response shape (vitest with mocked viem) BEFORE wiring the
consumer. This is the TDD entry point for T2.

## 10. Edge cases

- **No mandate armed:** Run-agent buttons disabled, tooltip in design above.
- **Mandate armed on Base, but UI is showing Arbitrum (or vice versa):** the existing
  permission-firewall.tsx already targets the active chain via `getSpendPolicyAddress(chainId)`
  (`src/lib/mandates/mandate.ts`). No change here.
- **Charge succeeds but indexer lag:** the budget HUD is the legible-mandate-card spec's
  responsibility. This spec only logs the tx hash and trusts the HUD to refresh.
- **User clicks Run-agent rapidly:** `running` state + button disable prevents double-fire.

## 11. Risks introduced

- **R-NEW-1:** terminal autoscroll heuristic could be wrong (user scrolls up to read history;
  new entry steals scroll). Mitigation: only autoscroll if `scrollTop` is within 32px of the
  bottom. Documented in component comments.
- **R-NEW-2:** running on Arbitrum at 0.10 USDC each iteration during testing burns ~$0.30
  cumulative across many runs. Mitigation: cap testing to ~5 runs total per session, reuse the
  in-cap path.

Add R-NEW-1 and R-NEW-2 to `docs/risk-register.md` as part of T11.

## 12. References

- `src/components/permission-firewall.tsx` — the existing arm/charge/revoke surface.
- `src/app/firewall/page.tsx` — current page layout (to be split).
- `src/app/api/mandates/charge/route.ts` — relayer route.
- `src/lib/mandates/mandate.ts` and `src/lib/mandates/types.ts` — mandate model + chain
  resolver.
- `src/lib/contracts/spend-policy.ts` — ABI + EIP-712 helpers.
