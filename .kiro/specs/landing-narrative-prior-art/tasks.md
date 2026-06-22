# Spec: landing-narrative-prior-art — Tasks

> DoD per methodology §6 (typecheck + lint + build + visual). Copy change — no unit tests.
> Branch: direct-on-main acceptable (additive landing/README).

- [x] **T1. Nav + hero CTA → /agent.** Add nav link; make the hero secondary CTA "See the x402
  agent demo" → `/agent`.
- [x] **T2. AgentEconomySection + PriorArtTable.** Add the section (x402 wedge + compact prior-art
  table + wedge line) after the three pillars.
- [x] **T3. SponsorStrip.** Particle / Magic / Arbitrum chips with one-line advantages.
- [x] **T4. README prior-art section.** Add "How OneLink compares (prior art)" with the table +
  linked sources + wedge.
- [x] **T5. Gate.** typecheck + lint + build (dev stopped) green; restart dev; `curl /` 200 and
  contains an `/agent` link + "agent economy" copy.
- [x] **T6. Docs.** master-tz §3 (E4.S3) + §4 (spec row) + §7; claim ledger C19 (positioning +
  prior-art comparison); risk R-NEW-14.

## Acceptance

Closes when `/agent` is one click from the landing, the prior-art comparison is on the landing +
README, the sponsor strip is visible, and the gate is green.

## Notes / progress log

- (2026-06-21) SHIPPED + closed. Landing: `/agent` added to nav + hero secondary CTA ("See the
  x402 agent demo"); new AgentEconomySection (x402 wedge + 5-row prior-art table + wedge line);
  SponsorStrip (Particle/Magic/Arbitrum). README: "How OneLink compares (prior art)" table with
  linked sources + wedge. Gate green: typecheck 0, lint 0, 105 unit tests, build clean; `/` renders
  200 with the `/agent` link + agent-economy copy. Fixes the #1 discoverability gap (the agent demo
  was unlinked) + the #1 credibility risk ("you reinvented spend permissions"). Docs: master-tz
  E4.S3 + spec row + §7; claim C19; risk R-NEW-14.

## Status: CLOSED 2026-06-21.
