# Spec: particle-unified-balance — Requirements

> Epic: **E2/E5 bridge — Particle showcase** (makes Particle UA the visible hero)
> Stories: new **E6.S1, E6.S2**
> Priority: **P1** (user directive 2026-06-21: "the product must highlight the sponsors' tooling")
> Estimated effort: **3-5h**
> Process: `.kiro/steering/methodology.md`

## 1. Why this exists

Particle is the headline sponsor (UA Track), yet our differentiator (SpendPolicy) is a
chain-agnostic EIP-712 + allowance contract — it does not visibly use Particle's superpower.
All four research reports flagged this as the soft spot on the 30% "prominent/innovative UA+7702
usage" criterion. In checkout, the Universal Account balance is rendered as raw `JSON.stringify`.

Particle's real advantage is **chain abstraction**: one Universal Account holds a single balance
aggregated across chains; the user never picks a chain, bridges, or holds native gas. We must make
that visible and tie it to our agent narrative: *the agent has one balance and pays for x402 APIs
from it, while OneLink bounds the total.*

`getPrimaryAssets()` already returns this aggregated balance, is read-only, works today (NOT
affected by the V2 cross-chain settlement block), and costs no gas. This spec turns it into a
legible **Unified Balance HUD** on `/agent`.

## 2. Honesty constraints (binding)

- The aggregated balance shown is **real** (read from `getPrimaryAssets`).
- Settlement in the demo is **same-chain on Arbitrum** (where SpendPolicy + relayer live). We do
  NOT claim the payment sources cross-chain. The narration says: "your agent sees one balance
  across chains (Particle UA); today it settles on Arbitrum; Particle V2 extends the same flow to
  spend from every chain in one tx."
- No new on-chain spend; this is a read-only enhancement I can fully self-verify.

## 3. User stories

- **E6.S1** — As a demo viewer, I see the agent's Universal Account balance as ONE number across
  Base + Arbitrum (+ Optimism), so Particle's chain abstraction is obvious in <5s.
- **E6.S2** — As a judge, I see, per token, how the unified balance breaks down across chains, so
  I understand the UA is aggregating real cross-chain liquidity, not a single-chain wallet.

## 4. Acceptance criteria (EARS)

### Ubiquitous
- The system shall summarize a `getPrimaryAssets()` result into: total USD, a per-token list
  (symbol, total amount, total USD), and the set of chain ids the balance spans.
- The Unified Balance HUD shall display the total USD prominently and a per-token, per-chain
  breakdown.
- The HUD shall carry a "Powered by Particle Universal Accounts" attribution.

### Event-driven
- **When** the agent page has an initialized Universal Account, **the system shall** fetch
  `getPrimaryAssets()` and render the unified balance within a few seconds.
- **When** the balance spans more than one chain, **the system shall** show each contributing
  chain (e.g. Base, Arbitrum) with its amount.

### State-driven
- **While** the balance is loading, **the system shall** show a non-blocking loading state.
- **While** no Universal Account is initialized (not logged in), **the system shall** not render
  the HUD.

### Unwanted-behavior
- **If** `getPrimaryAssets()` fails or returns an unexpected shape, **then the system shall** show
  a graceful "balance unavailable" state, never a crash or `500`.
- **If** the result has zero assets, **then the system shall** show a "$0.00" empty state, not a
  broken layout.

## 5. Scope

### In scope
- `src/lib/particle/assets.ts` — pure `summarizeUniversalBalance(raw)` + types.
- `src/components/universal-balance-card.tsx` — the HUD.
- Read-only Particle UA init on `/agent` (mirror `/pay/[id]` loadSDKs + UniversalAccount) calling
  only `getPrimaryAssets()`.
- Optional: replace the raw-JSON balance block in checkout with the same card (only if low-risk).
- Honest sponsor-showcase framing (badges + captions) on `/agent`.

### Out of scope (cut)
- Any new on-chain transaction / cross-chain settlement.
- Token icons / price charts.
- Refactoring the proven checkout UA init.
- Replacing `/firewall` balance (it has the on-chain BudgetHud already).

## 6. INVEST check

- **I**ndependent — additive; read-only; does not touch settlement. ✅
- **N**egotiable — card layout open. ✅
- **V**aluable — fixes the 30% UA soft spot; sponsor showcase. ✅
- **E**stimable — 3-5h. ✅
- **S**mall — one pure lib + one component + read-only wiring. ✅
- **T**estable — summarizer is pure (fixture-tested); the HUD render + live read self-verifiable. ✅

## 7. Definition of Done

- EARS criteria covered by tests or documented manual checks.
- typecheck + lint + test:unit + build green; `/agent` + `/firewall` + checkout unregressed.
- Live read self-verified (real cross-chain balance shows for the payer wallet).
- Claim ledger row added (read-only unified balance); master-tz + demo-runbook updated.
