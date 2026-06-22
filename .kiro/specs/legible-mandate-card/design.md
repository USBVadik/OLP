# Spec: legible-mandate-card — Design

> Pairs with `requirements.md` and `tasks.md`.

## 1. Module breakdown

```
src/
├── lib/
│   └── mandates/
│       ├── format.ts             (new)  pure helpers
│       └── format.test.ts        (new)  vitest
├── hooks/
│   ├── use-mandate-state.ts      (new)  reads SpendPolicy.getMandateState; refetch interface
│   └── use-mandate-state.test.ts (new)
├── components/
│   ├── mandate-card.tsx          (new)
│   ├── mandate-card.test.tsx     (new)
│   ├── budget-hud.tsx            (new)
│   └── budget-hud.test.tsx       (new)
└── components/
    └── permission-firewall.tsx   (modify) consume both
```

## 2. Format helpers — contracts

```ts
// src/lib/mandates/format.ts

/**
 * Render an atomic USDC amount (6-decimal bigint) as human-readable.
 *   100_000n  -> "0.10 USDC"
 *   123_456n  -> "0.123456 USDC"  (preserve precision when significant)
 *   1_000_000n -> "1.00 USDC"
 */
export function formatUsdcAmount(atomic: bigint): string;

/**
 * Truncate an EVM address for display.
 *   0x8C54783849A2C042544efc37c4657Ee98a411Fb7 -> "0x8C54…1Fb7"
 */
export function formatMerchant(addr: `0x${string}`): string;

/**
 * Render an expiry as a localized date + relative countdown.
 *   ts in 4h    -> "Jun 22, 23:59 (in 4h 12m)"
 *   ts past now -> "Jun 22, 23:59 (expired)"
 */
export function formatExpiry(unixSeconds: number, now?: number): string;

/**
 * Render a "remaining / cap" pair.
 *   used=15_000n cap=100_000n  -> { display: "0.085 / 0.10 USDC", percent: 85 }
 */
export function formatRemaining(used: bigint, cap: bigint): {
  display: string;
  percent: number;            // 0..100
};

/**
 * Render a countdown.
 *   secondsRemaining=14400  -> "4h 0m"
 *   secondsRemaining=120    -> "2m 0s"
 *   secondsRemaining<=0     -> "expired"
 */
export function formatCountdown(secondsRemaining: number): string;
```

All pure functions. No DOM. No timing. Caller passes `now` for testability.

## 3. `useMandateState` hook contract

```ts
// src/hooks/use-mandate-state.ts

type MandateState = {
  payer: `0x${string}`;
  merchant: `0x${string}`;
  maxPerCharge: bigint;
  maxPerDay: bigint;
  totalCap: bigint;
  expiry: number;             // unix seconds
  usedToday: bigint;
  usedTotal: bigint;
  revoked: boolean;
  /** convenience */
  status: "armed" | "revoked" | "expired" | "exhausted";
};

export function useMandateState(opts: {
  chainId: number;
  mandateHash: `0x${string}` | null;
}): {
  state: MandateState | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};
```

Behavior:
- Polls every 8s while `mandateHash` is set and `status === "armed"`.
- Stops polling when `revoked` or `expired`.
- Exposes `refetch()` so consumers (the agent demo) can force-refresh after a charge.
- Reads via `getSpendPolicyAddress(chainId)` from `src/lib/mandates/mandate.ts` (existing).

## 4. `MandateCard` component

```tsx
// src/components/mandate-card.tsx
type MandateCardProps = {
  mandate: PaymentMandate;
  /** when true, show the technical-details disclosure */
  expanded?: boolean;
  onToggleExpanded?: (next: boolean) => void;
};
```

Render layout:
```
┌────────────────────────────────────────────────────────┐
│  Permission to be granted                              │
│                                                        │
│  Merchant       0x8C54…1Fb7  [copy]                    │
│  Max per charge 0.10 USDC                              │
│  Daily limit    2.00 USDC                              │
│  Total cap      10.00 USDC                             │
│  Expires        Jun 22, 23:59 (in 4h 12m)              │
│                                                        │
│  [revocable anytime · enforced on-chain]               │
│                                                        │
│  ▸ Show technical details                              │
└────────────────────────────────────────────────────────┘
```

Technical-details disclosure shows: EIP-712 mandate hash, EIP-712 domain (chainId,
verifyingContract, name, version), raw struct.

A11y:
- Card is a `<section aria-label="Permission preview">`.
- Disclosure is a `<button aria-expanded>` toggling a `<dl>` of technical fields.
- Copy button has visible label `Copy address`.

## 5. `BudgetHud` component

```tsx
// src/components/budget-hud.tsx
type BudgetHudProps = {
  state: MandateState;
  /** for testability */
  now?: number;
};
```

Render layout:
```
┌────────────────────────────────────────────────────────┐
│  Remaining                                             │
│                                                        │
│  Today    0.85 / 2.00 USDC          ▓▓▓▓▓▓░░░░  42%    │
│  Lifetime 9.85 / 10.00 USDC         ▓▓▓▓▓▓▓▓▓░  98%    │
│                                                        │
│  Expires in 3h 47m                                     │
└────────────────────────────────────────────────────────┘
```

Status overlays:
- `revoked` → grey scrim, label "Revoked"; controls disabled.
- `expired` → grey scrim, label "Expired".
- `exhausted` → amber scrim, label "Cap reached".

Countdown ticks at 1Hz via internal `setInterval`; cleared on unmount or status transition.

## 6. Sequence: arm → charge → HUD update

```
operator clicks "Arm permission" on /firewall
  └─ permission-firewall.tsx
       ├─ build PaymentMandate (existing)
       ├─ render <MandateCard mandate={...} />     ← new
       ├─ on user "Confirm & sign" click:
       │     └─ EIP-712 signature (existing)
       │     └─ call SpendPolicy.arm/permit (existing)
       ├─ now armed → mount <BudgetHud state={useMandateState(...)} />   ← new
       └─ when agent charge succeeds:
             └─ refetch() triggered → HUD updates within ~1s
```

## 7. Wiring into `permission-firewall.tsx`

Before this spec, `permission-firewall.tsx` shows raw cap numbers and a sign button. After:

1. **Pre-sign:** show `<MandateCard>` between the inputs (max/daily/total/expiry) and the
   sign button. The card is the "preview" of what the user is about to sign.
2. **Post-sign:** show `<BudgetHud>` instead of (or alongside) the existing cap display.
3. **On charge success** (agent-on-a-leash spec calls into the hook): trigger `refetch()`.

To minimize coupling between this spec and the agent-on-a-leash spec, expose a single shared
hook (`useMandateState`) and a tiny imperative `refetch()` that the agent spec consumes.

## 8. Edge cases

- **`getMandateState` revert because mandate hash hasn't been touched yet:** treat as "armed,
  no usage" (used=0, total=0). The contract may not actually revert; verify in T0.
- **Time drift between client clock and chain time:** use `Date.now() / 1000` for the
  countdown, but show the absolute date too — judges trust absolute dates more than relative.
- **Polling overlaps with manual refetch:** use a simple in-flight guard (`isFetchingRef`)
  to avoid double-fetch.
- **Format precision:** when `formatUsdcAmount` would round to `0.00`, fall back to the full
  6-decimal display so we never show a misleading zero.

## 9. Testability

- All formatting helpers are pure → 100% covered by `format.test.ts`.
- HUD/Card components: snapshot-light, behavior-heavy. Avoid pixel snapshots; assert text
  content + ARIA attributes.
- `useMandateState`: tested with a viem mock (read returns canned values; check polling stops
  on revoked/expired transitions).

## 10. Risks introduced

- **R-NEW-4:** countdown causes a re-render every second; on a low-end machine this could
  feel janky. Mitigation: countdown is a child component with a memoized parent; tested.
- **R-NEW-5:** if the user's wallet clock is drifted, the relative time may be off by minutes.
  Mitigation: show absolute time alongside relative.

Add R-NEW-4 / R-NEW-5 to `docs/risk-register.md` as part of T16.

## 11. References

- `src/lib/contracts/spend-policy.ts` — ABI + helpers.
- `src/lib/mandates/types.ts` — `PaymentMandate`.
- `src/components/permission-firewall.tsx` — current arm/charge/revoke surface.
- `methodology.md` §1.4 (vertical slice — ship pure helpers first, then components, then
  wire-in).
