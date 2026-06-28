# Spec: trust-layer-positioning — Design

> Pairs with `requirements.md` and `tasks.md`. Content/positioning only — no product, payment, API,
> env, or contract change. Server components (no client JS). Honesty is the hard constraint.

## 1. Page layout (additive on /trust)

Existing `/trust` stays: claim-discipline table (real/pattern/future) + "don't take our word for
it" receipt link. We insert three new blocks **between** the claim table and the receipt CTA, so the
narrative reads:

```
What's real (claim table)                  ← unchanged
   ↓
Where OneLink fits the 2026 stack           ← NEW  <EcosystemStack/>
   ↓
The trust gap we close (sourced data)       ← NEW  <TrustGap/>
   ↓
A different approach (vs the giants)        ← NEW  <RailComparison/>
   ↓
Verify a real receipt yourself              ← unchanged
```

## 2. Data module — `src/lib/positioning/landscape.ts` (single source of copy)

```ts
export type StackLayer = {
  layer: "Authorization" | "Checkout" | "Settlement" | "Enforcement & proof";
  examples: string;            // e.g. "Google AP2 · Mastercard Verifiable Intent"
  isOurs?: boolean;            // true only for "Enforcement & proof"
};

export type Sourced = { source: string; url: string; asOf: string };   // honesty: required on every stat
export type TrustStat = Sourced & { stat: string; takeaway?: string };

export type CompareRow = {
  player: string;              // "Visa Intelligent Commerce + OpenAI"
  approach: string;            // fair description of THEIR approach
  ours: string;                // our different approach (maps to a ledger C-row)
  ledgerRef: string;           // e.g. "C1–C6, C21"
  kind: "built" | "directional"; // built = we have it live; directional = narrative only
};

export const STACK_2026: StackLayer[];
export const TRUST_STATS: TrustStat[];     // each MUST satisfy Sourced (guarded by test)
export const COMPARISON: CompareRow[];

export function assertAllSourced(stats: TrustStat[]): void; // throws if any missing source/url/asOf
```

### Seed content (review here, not in JSX)

`STACK_2026` (factual layering; ours highlighted):
- Authorization — "Google AP2 (→ FIDO) · Mastercard Verifiable Intent"
- Checkout — "OpenAI ACP · Google UCP"
- Settlement — "x402 · cards (Visa, Mastercard) · USDC (Circle)"
- **Enforcement & proof — "OneLink Pay — on-chain SpendPolicy + verifiable proof receipt"** (`isOurs`)

`TRUST_STATS` (third-party, mid-2026, each sourced):
- "~3 in 4 are uncomfortable letting an AI pay autonomously — even with limits set in advance" —
  Forrester, https://www.forrester.com/blogs/consumers-arent-ready-to-delegate-payments-to-ai-agents/ , 2026-06
- "Only ~14% would trust an agent to complete a purchase" — Ecommpay / The Paypers,
  https://thepaypers.com/payments/thought-leader-insights/ecommpay-report-key-takeaways-trust-and-control-in-agentic-commerce , 2026-06
- "~2 in 3 will try agentic shopping — but demand human approval before the buy" — Commerce + PayPal,
  https://www.marketscreener.com/news/two-thirds-of-consumers-are-ready-to-try-agentic-shopping-but-many-demand-human-approval-before-ai-ce7f5fdadc8df220 , 2026-06
- Takeaway line (ours, not a stat): "Everyone is building rails. The blocker is trust. That is the
  layer we are."

`COMPARISON` (fair; ours maps to ledger; kind labelled):
- Visa Intelligent Commerce + OpenAI — approach: "tokenized card credential, spend limits enforced
  before authorization, on custodial card rails"; ours: "same pre-authorization idea, but on-chain &
  non-custodial on your own account"; ledgerRef "C1–C6"; kind "built".
- Coinbase Agentic Wallets — approach: "vendor-managed embedded/MPC wallet + spend permissions on
  Base"; ours: "wallet-agnostic — the limit lives on your own EIP-7702 account, chain-abstracted";
  ledgerRef "C1, C7, C21"; kind "built".
- Circle / Catena — approach: "managed/custodial agent-payment rails (Catena even filing for a trust
  bank charter to custody funds)"; ours: "non-custodial — you hold the keys; we enforce, we don't
  custody"; ledgerRef "C1–C6"; kind "built".
- Google AP2 — approach: "agent mandates as off-chain Verifiable Credentials"; ours: "same intent,
  enforced on-chain at your account — a promise becomes a guarantee"; ledgerRef "C1–C6, C11"; kind "built".
- x402 (Coinbase) — approach: "HTTP-402 pay-per-call rail for agents — no spend ceiling"; ours: "we
  bound x402 spend with the mandate (live)"; ledgerRef "C17"; kind "built".
- "Front AP2 / card rails too" — approach: "—"; ours: "the same firewall is designed to sit in
  front of other rails"; ledgerRef "—"; kind **"directional"** (renders a "direction, not yet
  integrated" tag).

## 3. Components (server, no client JS)

- `EcosystemStack` — renders `STACK_2026` as 4 stacked rows/bands; the `isOurs` layer uses the
  iris/gold accent + a "you are here" marker. One caption: "We don't replace the rails — we're the
  consent + on-chain enforcement + proof layer on top."
- `TrustGap` — renders `TRUST_STATS` as cards; each shows the stat big, then a small
  "{source} · external research · {asOf}" line with the link. Ends with the takeaway line styled as
  the conclusion (clearly OUR framing, not a stat).
- `RailComparison` — a table (reuse the landing prior-art table styling): columns Player / Their
  approach / Where OneLink differs. `kind:"directional"` rows render a `ConceptTag`-style
  "directional" chip so a judge never reads it as a shipped integration.

Reuse: `Chip`, `ConceptTag`, `Term`, `op-card`, `op-eyebrow`, table styling from
`AgentEconomySection`. Match the warm-light premium theme; no new tokens.

## 4. Optional fold-in — proof-presentation polish

In `proof-receipt.tsx` / `/receipt`, add a one-line framing above the existing tx links:
"Three independent sources — verify any yourself, no account:" over the settlement (Arbiscan),
proof (Basescan), and UniversalX rows that already render. Pure copy/labelling; no logic. Clearly
optional (Phase 3) so it can be skipped.

## 5. Honesty rendering rules (enforced)

- Every `TrustGap` card MUST show source + link + "external research · {asOf}". The data module's
  `assertAllSourced` + a unit test guarantee no stat ships unsourced.
- `RailComparison` `directional` rows MUST show the "directional" chip.
- Our column never claims more than the referenced ledger C-row. (Reviewer checks `ledgerRef`.)

## 6. Risks

- **Honesty/fairness drift** (biggest): a competitor line could become a strawman, or a stat could
  read as ours. Mitigation: single reviewable data module, mandatory source fields + guard test,
  "external research" caption, "directional" chips. This page is the claim-discipline page — if it
  overclaims, it self-defeats.
- **Page length / density.** Mitigation: tight blocks, scannable, the claim table stays the hero.
- **Stat staleness.** Mitigation: `asOf` on every stat; doc cross-link so they can be refreshed.

## 7. References

- `docs/competitive-landscape-2026.md` (source synthesis + links), `docs/winning-strategy.md`
  (positioning + P2 rail-agnostic = narrative only), `docs/honest-claim-ledger.md` (C1–C21 our side).
- `src/app/trust/page.tsx` (host page), `src/app/page.tsx` `AgentEconomySection` (table styling to reuse).
- `src/components/ui.tsx` (`Chip`, `ConceptTag`, `Term`).
