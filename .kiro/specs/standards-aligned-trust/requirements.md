# Spec: standards-aligned-trust — Requirements

> Epic: **Positioning & adoption narrative** (evolves `trust-layer-positioning`)
> Story: As a standards-literate judge/partner, on `/trust` I can see that the Ethereum ecosystem is
> now **drafting the exact shape OneLink already ships** (bounded, revocable, code-enforced agent
> spend) and that our **proof receipt is a verifiable record of the actual settlement** — the thing
> agent-reputation registries do not give you — so "is this real / is this just a hackathon toy"
> answers itself with public standards + on-chain proof.
> Priority: **P1** (Adoption-20; reads as mastery to a technical judge)
> Estimated effort: **S–M (typed data + 1 presentational component + 2 comparison rows, no risky logic)**
> Process: `.kiro/steering/methodology.md`
> Scores: **Adoption 20 · Polish 10 · (supports UX 40 comprehension)**

## 1. Why this exists

`trust-layer-positioning` shipped the stack map, the trust-gap data, and a fair "vs the giants"
comparison. Since then two things sharpened the field (verified June–Jul 2026, primary sources):

- **The primitive is being standardized.** The Ethereum standards community is actively drafting
  bounded, revocable, code-enforced agent mandates — **Asset-Enforced Spend Mandate**
  (ethereum-magicians), **ERC-8226 Regulated Agent Mandate** (EIP), **ERC-8312 Bounded Agent
  Actions** (ethereum-magicians). This is the same shape as our live `SpendPolicy`.
- **Agent identity/reputation is separate from proof-of-payment.** **ERC-8004 "Trustless Agents"**
  (EIP) gives agents identity + reputation + validation registries; reputation is attested and its
  reliability is under active empirical study. OneLink's proof receipt is the complementary piece:
  a verifiable record of the **actual on-chain settlement**, re-checkable by anyone with no account.

Plus more now-shipped competitors to place fairly: **AWS Bedrock AgentCore Payments** (session-level
spend limits) and **MetaMask Smart Accounts / ERC-7715 session keys** (the commoditizing primitive).

The value: arm a technical judge with "OneLink speaks the emerging standards vocabulary and already
implements the idea live" — without claiming to implement any single draft ERC.

## 2. Honesty constraints (this page IS the claim-discipline page — get this perfect)

- **Alignment, not implementation.** We must NEVER say "OneLink implements ERC-8226 / ERC-8312 /
  Asset-Enforced Spend Mandate." We say **aligned with / the same shape as / speaks the vocabulary
  of** these emerging drafts. Our own contract is `SpendPolicy` (byte-identical to the deployed
  struct — do not touch it), not a draft-ERC implementation.
- **Draft status must be visible.** Every standard renders a status chip (e.g. "Draft ERC",
  "Draft EIP", "Discussion") so nothing reads as a finalized/shipped standard.
- **ERC-8004 is complementary, not "broken."** Frame reputation vs proof fairly: reputation
  registries record attestations/scores; a proof receipt records the actual settlement. We may note
  reputation reliability is under study (cite the paper) — we do NOT declare it "broken."
- **Every standard entry carries source + url + asOf**, enforced by a unit test (honesty guard),
  exactly like `TRUST_STATS`.
- **Competitor framing fair, not strawman.** AWS AgentCore = managed session-level limits in a cloud
  agent runtime; ERC-7715 = wallet-granted session keys (now across Coinbase/ZeroDev/Safe/MetaMask).
  Our column maps only to existing ledger rows (C1–C21). No new capability claim. No superlatives.

## 3. Acceptance criteria (EARS)

### Ubiquitous
- The system shall present, on `/trust`, a **standards-alignment** block listing the emerging
  agent-mandate standards (Asset-Enforced Spend Mandate, ERC-8226, ERC-8312) and ERC-8004, each with
  a fair one-line description, OneLink's relation to it, a draft-status chip, and a source link.
- The system shall present, for each standard, whether OneLink is **aligned** (same shape as our
  live SpendPolicy) or **complements** it (proof receipt vs reputation) — never "implements".
- The system shall extend the existing comparison with **AWS AgentCore Payments** and **MetaMask /
  ERC-7715 session keys**, described fairly, our column mapping to existing ledger rows.

### State / data-driven
- The system shall source the standards + comparison content from the single typed data module
  `src/lib/positioning/landscape.ts` so copy is reviewable in one place.

### Unwanted-behavior
- **If** any standards entry is missing `source`/`url`/`asOf`, **then** the unit test shall fail
  (honesty guard) and the block shall not ship.
- **If** a standards entry would be labelled as "implemented/built" by OneLink, **then** it is
  invalid — the type permits only `relation: "aligned" | "complements"`, enforced by test.
- **If** a standard's secondary citation (e.g. the ERC-8004 study) is present, **then** it too must
  carry source/url/asOf (guarded).

## 4. Scope

### In scope
- `src/lib/positioning/landscape.ts` — new `Standard` type + `STANDARDS` array (sourced); generalize
  `assertAllSourced` to any `Sourced[]` (backward compatible); +2 `COMPARISON` rows.
- `src/lib/positioning/landscape.test.ts` — new honesty-guard tests (TDD, written first).
- `src/components/standards-alignment.tsx` — presentational server component (no client JS).
- `src/app/trust/page.tsx` — wire the new block in (after the comparison, before the receipt CTA).
- Docs: one-line note in `docs/honest-claim-ledger.md` (context is sourced, no new claim);
  cross-link `docs/competitive-landscape-2026.md`; optional demo-runbook beat.

### Out of scope (cut)
- Any new route / nav item (stays on `/trust`).
- Any product/payment/API/env/contract change; no touching `SpendPolicy` / EIP-712 struct.
- Implementing any draft ERC (alignment/narrative only).
- Changing the existing claim-discipline table, stack map, trust-gap, or existing comparison rows.

## 5. INVEST

Independent ✅ (additive) · Negotiable ✅ · Valuable (Adoption-20; standards-mastery signal) ✅ ·
Estimable (S–M) ✅ · Small ✅ · Testable (honesty-guard unit tests + `/trust` render-check) ✅

## 6. Definition of Done

- All EARS met; the standards block renders on `/trust`; each standard shows a draft-status chip,
  a fair description, our relation (aligned/complements), and a working source link; the two new
  comparison rows render fairly with ledger-mapped "ours".
- Honesty-guard tests pass (every standard + any secondary citation carries source+url+asOf;
  relation is only aligned/complements).
- Gate green: `typecheck` 0, `lint` 0, `test:unit` all pass (incl. new guards), `build` clean;
  `/trust` render-checked (200; block present; source links present; draft chips present).
- No new public capability claim; `docs/honest-claim-ledger.md` gets a one-line note.

## Status: DRAFT — implementing under user "приступай к списку" (item #3); commit awaits explicit "го"
