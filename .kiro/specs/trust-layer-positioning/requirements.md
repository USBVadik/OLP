# Spec: trust-layer-positioning — Requirements

> Epic: **Positioning & adoption narrative** (cf. `pitch-positioning-rewrite`, `landing-narrative-prior-art`)
> Story: As a judge/partner, on `/trust` I can see in 15 seconds **where OneLink fits the 2026
> agentic-payments stack** and **why the real bottleneck (trust) is the thing we solve** — so the
> "why you, vs Visa/Coinbase/Circle" question answers itself.
> Priority: **P1** (fills the Adoption-20 gap the core demo doesn't directly cover)
> Estimated effort: **S–M (content + 3 small presentational components, no risky logic)**
> Process: `.kiro/steering/methodology.md`
> Scores: **Adoption 20 · Polish 10 · (supports UX 40 comprehension)**

## 1. Why this exists

`docs/competitive-landscape-2026.md`: the field is flooded with *rails* (x402, AP2, Visa/OpenAI,
Coinbase Agentic Wallets, Circle, Catena). Fresh consumer research says the blocker is **trust /
control / provability**, not rails. The core demo proves our enforcement live (C1–C21) but does not
explicitly place us in the ecosystem or arm a judge with the "why we win vs the giants" framing.

This spec adds, on `/trust`, three honest, sourced context blocks: (1) where OneLink sits in the
2026 stack, (2) the consumer-trust gap we close (third-party data), (3) a fair "different approach"
comparison vs the current giants. Optionally folds in a small proof-presentation polish on the
receipt (the "three independent explorers — verify any yourself" framing the user asked for).

## 2. Honesty constraints (this page IS the claim-discipline page — get this perfect)

- **Market stats are THIRD-PARTY, not our metrics.** Every stat must render with an inline source
  name + link + an "external research · ~mid-2026" caption. Never imply they are OneLink's numbers.
- **Competitor framing must be fair, not a strawman.** Describe each accurately (e.g. Coinbase
  Agentic Wallets = vendor-managed embedded/MPC wallet; Visa = tokenized card credential on
  custodial rails; Circle/Catena = managed/custodial). Frame as "a different approach
  (non-custodial, on-chain, public proof)", not "they are worse".
- **Built vs directional must be labelled.** We bound **x402** spend today (live, C17). We have NOT
  integrated AP2 or card rails — the "sits in front of any rail" idea is **directional**, and must
  be labelled as such (consistent with winning-strategy P2). Never claim integrations we don't have.
- **No new capability claim.** Our side of every comparison maps to existing ledger rows (C1–C21).
  This spec adds context, not capabilities. No superlatives.
- **Sourcing is enforced by a test** (see tasks): every market-stat entry must carry a non-empty
  `source`, `url`, and `asOf`, or the unit test fails.

## 3. Acceptance criteria (EARS)

### Ubiquitous
- The system shall present, on `/trust`, an **ecosystem-stack** block showing the layers
  Authorization → Checkout → Settlement → **Enforcement & proof (OneLink)**, with OneLink's layer
  visually distinguished.
- The system shall present a **trust-gap** block of third-party consumer-research data points, each
  rendered with its source name, link, and an "external research" caption.
- The system shall present a **comparison** block contrasting OneLink's approach (non-custodial,
  on-chain enforcement on the user's own account, public proof) with current approaches (Visa/OpenAI,
  Coinbase Agentic Wallets, Circle/Catena, AP2), described fairly.

### State / data-driven
- The system shall source every comparison row and stat from a single typed data module so copy is
  reviewable in one place.

### Optional (fold-in polish)
- **Where** the proof receipt shows the settlement, proof, and UniversalX links, **the system shall
  (optionally)** frame them as "three independent sources — verify any yourself, no account."

### Unwanted-behavior
- **If** any market-stat entry is missing a `source`/`url`/`asOf`, **then** the unit test shall fail
  (honesty guard) and the block shall not ship.
- **If** a comparison row would assert an integration we don't have, **then** it must be labelled
  "directional" — the build must not present x402-only capability as AP2/card integration.

## 4. Scope

### In scope
- `src/lib/positioning/landscape.ts` — typed data: stack layers, comparison rows, sourced stats
  (`{ stat, source, url, asOf }`), + tiny pure helpers (+ honesty-guard tests).
- `src/components/ecosystem-stack.tsx`, `src/components/trust-gap.tsx`,
  `src/components/rail-comparison.tsx` — presentational (server components, no client JS needed).
- Wire the three blocks into `src/app/trust/page.tsx` below the existing claim table.
- (Optional Phase) proof-presentation framing on `src/app/receipt/[id]/page.tsx` /
  `src/components/proof-receipt.tsx`.

### Out of scope (cut)
- Any new nav item / new route (keep it on `/trust` to avoid nav bloat).
- Duplicating the landing `AgentEconomySection` / PRIOR_ART table (link/complement, don't repeat).
- Any actual AP2 / card-rail integration (directional only).
- Changing the existing claim-discipline table rows.
- Any product/payment logic, API, env, or contract change.

## 5. INVEST

Independent ✅ (additive content blocks) · Negotiable ✅ · Valuable (Adoption-20 + arms the pitch
vs giants) ✅ · Estimable (S–M) ✅ · Small ✅ · Testable (honesty-guard unit test on the data module;
render-check `/trust`) ✅

## 6. Definition of Done

- All EARS met; the three blocks render on `/trust`; every stat shows source + link + "external
  research" caption; comparison is fair; x402=built vs AP2/cards=directional clearly labelled.
- Honesty-guard test passes (every stat/row carries source+url+asOf).
- Gate green: `typecheck` 0, `lint` 0, `test:unit` all pass (incl. new guard test), `build` clean.
- No new public capability claim; `docs/honest-claim-ledger.md` gets a one-line note that the
  ecosystem/trust-gap context is third-party-sourced (not our metrics). `docs/demo-runbook.md`:
  add the "where we fit + the trust gap" pitch beat. Cross-link `docs/competitive-landscape-2026.md`.

## Status: DRAFT — awaiting go to implement tasks
