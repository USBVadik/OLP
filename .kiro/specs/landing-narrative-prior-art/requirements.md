# Spec: landing-narrative-prior-art — Requirements

> Epic: **E4. Proof + trust layer** (+ discoverability)
> Stories: **E4.S2** (prior-art) + new **E4.S3** (surface the agent/x402 demo on the landing)
> Priority: **P1** (judge first-impression + credibility; user directive "усиляем")
> Estimated effort: **2-3h**
> Process: `.kiro/steering/methodology.md`

## 1. Why this exists

Two gaps weaken the win case:

1. **Discoverability:** our most original, proven demo — `/agent` (x402 spending-limit gateway) —
   is NOT linked anywhere from the landing. A judge opening the site would never find it. The
   `/agent` and the Particle Unified Balance showcase are our strongest assets and are invisible.
2. **"You reinvented spend permissions":** all four research reports flagged this as the #1
   credibility risk. The landing + README do not position OneLink against the prior art
   (Coinbase Spend Permissions, ERC-7715/7710, ZeroDev session keys, Google AP2, x402). Naming the
   prior art and our wedge defuses it and signals ecosystem awareness.

## 2. Honesty constraints

- Prior-art descriptions must be accurate and neutral (no strawmanning competitors).
- Our differentiator is **packaging + wedge** (on-chain revocable mandate + x402 binding + public
  proof + UA/7702 entry), NOT "we invented spend permissions". Say exactly that.
- No new claims beyond the ledger (C1-C18). No superlatives ("first/only").

## 3. User stories

- **E4.S2** — As a judge, I see a concise comparison of OneLink vs Coinbase Spend Permissions /
  ERC-7715 / ZeroDev / AP2 / x402, so I understand we build on the ecosystem, not reinvent it.
- **E4.S3** — As a visitor to the landing, I can reach the x402 agent demo in one click and see
  the agent-economy framing + sponsor tooling, so our strongest, most original work is front and
  center.

## 4. Acceptance criteria (EARS)

### Ubiquitous
- The landing nav and hero shall link to `/agent`.
- The landing shall contain an "agent economy" section that states the x402 wedge (x402 lets
  agents pay; nothing bounds spend; OneLink is the on-chain spending limit) and a prior-art
  comparison.
- The landing shall display a sponsor strip naming Particle, Magic, and Arbitrum with a one-line
  advantage each.
- The README shall contain a prior-art comparison section with linked sources.

### Event-driven
- **When** a visitor clicks the agent CTA, **the system shall** navigate to `/agent`.

### Unwanted-behavior
- **If** the new copy would assert something not in the claim ledger, **then** it must be removed
  or softened before merge.

## 5. Scope

### In scope
- `src/app/page.tsx`: add `/agent` to nav + a hero CTA; add an "agent economy + prior-art" section;
  add a sponsor strip.
- `README.md`: add a "How OneLink compares (prior art)" section with sources.

### Out of scope (cut)
- Restyling the hero / pillars (keep proven copy).
- New routes or components beyond inline landing sections.
- Logos / brand assets for sponsors (text chips only).

## 6. INVEST

- Independent ✅ · Negotiable ✅ · Valuable (discoverability + credibility) ✅ · Estimable (2-3h) ✅
  · Small ✅ · Testable (typecheck/lint/build + visual + link present) ✅

## 7. Definition of Done

- EARS criteria met; `/agent` reachable from the landing in one click.
- Prior-art section on landing + README; sources linked in README.
- typecheck + lint + build green; landing renders; no claim beyond the ledger.
- master-tz + claim ledger (C19) updated.
