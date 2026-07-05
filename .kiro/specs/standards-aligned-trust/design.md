# Spec: standards-aligned-trust — Design

> Pairs with `requirements.md` + `tasks.md`. Content/positioning only — no product, payment, API,
> env, or contract change. Server component (no client JS). Honesty is the hard constraint.

## 1. Page layout (additive on /trust)

Insert one new block between the existing `<RailComparison/>` and the "don't take our word for it"
receipt CTA:

```
What's real (claim table)                    ← unchanged
Where OneLink fits the 2026 stack            ← unchanged  <EcosystemStack/>
The trust gap we close                       ← unchanged  <TrustGap/>
How OneLink is different (vs the giants)     ← unchanged  <RailComparison/>  (+2 rows)
Built for the emerging standards             ← NEW        <StandardsAlignment/>
Verify a real receipt yourself               ← unchanged
```

## 2. Data module — `src/lib/positioning/landscape.ts`

### 2a. Generalize the honesty guard (backward compatible)

`assertAllSourced` currently types `TrustStat[]`. Generalize to any `Sourced[]` and add an optional
label (default keeps the existing "trust stat" message so the existing test still matches):

```ts
export function assertAllSourced<T extends Sourced>(items: T[], label = "trust stat"): void {
  for (const s of items) {
    if (!s.source?.trim() || !s.url?.trim() || !s.asOf?.trim()) {
      const id = (s as { stat?: string; name?: string }).stat
        ?? (s as { name?: string }).name ?? s.source ?? "";
      throw new Error(`Unsourced ${label}: ${JSON.stringify(id)} (source/url/asOf required)`);
    }
  }
}
```

### 2b. New `Standard` type + `STANDARDS`

```ts
export type Standard = Sourced & {
  name: string;                       // "Asset-Enforced Spend Mandate"
  status: string;                     // "Draft ERC · discussion" | "Draft EIP"
  what: string;                       // fair one-line description of the standard
  ours: string;                       // how OneLink relates (maps to a ledger C-row)
  relation: "aligned" | "complements"; // NEVER "implements"/"built"
  study?: Sourced;                    // optional secondary citation (e.g. ERC-8004 empirical study)
};

export const STANDARDS: Standard[];
```

Seed content (review here, not in JSX) — all primary sources verified Jul 2026:

- **Asset-Enforced Spend Mandate** — status "Draft ERC · discussion"; what: "Caps, expiry, allowed
  token and instant revoke enforced by the asset itself — not the agent's good behavior."; ours:
  "The same shape, live today: our SpendPolicy enforces per-charge/daily/total caps + expiry +
  revoke on-chain (C1–C6). The draft explores the token layer; we enforce at the account/contract
  layer."; relation "aligned"; source "Ethereum Magicians",
  url `https://ethereum-magicians.org/t/erc-asset-enforced-spend-mandate/28831`, asOf "2026-06".
- **ERC-8226 Regulated Agent Mandate** — status "Draft EIP"; what: "Scoped, time-bounded, financially
  capped delegation to an on-chain agent, checked before each transfer."; ours: "OneLink already
  enforces scoped, capped, expiring, revocable mandates on-chain today (SpendPolicy, C1–C6, C16)."
  ; relation "aligned"; source "Ethereum Improvement Proposals",
  url `https://eips.ethereum.org/EIPS/eip-8226`, asOf "2026-06".
- **ERC-8312 Bounded Agent Actions** — status "Draft ERC · discussion"; what: "Track how much of a
  bounded mandate an agent has already spent, so a contract can see the room left."; ours: "Our
  SpendPolicy already accounts spend against the caps and reverts over-budget charges at zero gas
  (C3)."; relation "aligned"; source "Ethereum Magicians",
  url `https://ethereum-magicians.org/t/erc-8312-bounded-agent-actions/28851`, asOf "2026-06".
- **ERC-8004 Trustless Agents** — status "Draft EIP"; what: "On-chain registries for agent identity,
  reputation and validation."; ours: "Complementary, not competing: reputation is attested; our
  proof receipt is a verifiable record of the actual settlement — proof of the interaction, no
  account needed to re-check (C20)."; relation "complements"; source "Ethereum Improvement
  Proposals", url `https://eips.ethereum.org/EIPS/eip-8004`, asOf "2026-06"; study: {source:
  "arXiv 2606.26028 (empirical study)", url `https://arxiv.org/html/2606.26028v1`, asOf "2026-06"}.

### 2c. Two new `COMPARISON` rows (fair; ours maps to ledger; kind "built")

- **AWS Bedrock AgentCore Payments** — approach: "Managed, session-level spend limits inside a cloud
  agent runtime (with Coinbase + Stripe)."; ours: "Non-custodial and on your own on-chain account —
  the limit is a public contract anyone can re-check, with a proof receipt per payment."; ledgerRef
  "C1–C6, C16"; kind "built".
- **MetaMask Smart Accounts · ERC-7715 session keys** — approach: "Wallet-granted session keys with
  granular permissions — now across Coinbase, ZeroDev, Safe, MetaMask."; ours: "We don't reinvent
  the primitive — we package it as a legible, revocable payments mandate with a public proof
  receipt, on your own EIP-7702 account (C7, C14, C21)."; ledgerRef "C7, C14, C21"; kind "built".

## 3. Component — `src/components/standards-alignment.tsx` (server, no client JS)

- Header: "Built for the emerging standards" + one honest caption: the ecosystem is drafting exactly
  this shape; OneLink is a working implementation of the idea today, aligned with the vocabulary —
  not an implementation of any single draft ERC.
- Renders `STANDARDS` as cards/rows: `name` + a status chip (`op-chip-concept`), `what` (muted),
  `ours` (ink) with a small relation chip ("aligned" gold / "complements" iris), a source link
  ("{source} · emerging standard · {asOf}"), and, if `study` present, a secondary "empirical study"
  link.
- Reuse `Chip`, `ConceptTag`, `IconArrowUpRight`, `op-card`, `op-eyebrow`. Warm-light theme; no new
  tokens. Matches `TrustGap` / `RailComparison` styling.

## 4. Honesty rendering rules (enforced)

- Every standard shows a draft-status chip + a working source link. `assertAllSourced(STANDARDS,
  "standard")` + the unit test guarantee no unsourced entry ships; a present `study` is guarded too.
- The relation chip can only render "aligned" or "complements" (type-enforced) — never
  "implemented"/"built"; the section caption states we implement our own SpendPolicy, not the ERC.
- New comparison rows' "ours" map to existing ledger rows (reviewer checks `ledgerRef`).

## 5. Risks

- **Overclaim: "we implement ERC-XXXX".** Mitigation: `relation` type excludes "implements"; caption
  is explicit; copy uses "aligned/same shape/complements".
- **ERC-8004 framed as "broken".** Mitigation: "complements", neutral wording, study cited as
  "empirical study", not "proof it's broken".
- **Stat/standard staleness.** Mitigation: `asOf` on every entry; cross-link the competitive doc.
- **Page density.** Mitigation: one tight block; claim table stays the hero.

## 6. References

- Primary sources (verified Jul 2026): ethereum-magicians.org (Asset-Enforced Spend Mandate #28831,
  ERC-8312 #28851), eips.ethereum.org (EIP-8226, EIP-8004), arxiv.org/html/2606.26028v1.
- `docs/competitive-landscape-2026.md` (AWS AgentCore, ERC-7715 commoditization + sources),
  `docs/winning-strategy.md` (positioning), `docs/honest-claim-ledger.md` (C1–C21 for our side).
- `src/app/trust/page.tsx`, `src/lib/positioning/landscape.ts`, `src/components/ui.tsx`.
