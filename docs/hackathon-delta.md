# OneLink Pay — Hackathon Build Delta

Purpose: preserve an honest, auditable account of what was lightweight preparation and what became
the UXmaxx submission during the hackathon. This document is an eligibility aid, not a claim that
the organizers have formally approved every historical commit.

## Organizer context

Before kickoff, Particle/Carlos indicated that lightweight preparation and prototyping were fine.
The final rules also say submitted work must be original and created during the hackathon. Keep the
original written organizer message privately available and request explicit clarification if the
submission form asks about pre-existing work.

Do not hide the prototype history. Explain the delta plainly.

## Before kickoff: prototype foundation

The May and June 19–20 checkpoints contained a prototype foundation:

- a single Next.js application and early visual shell;
- Magic email login experiments;
- Particle legacy/fallback transfer experiments;
- early ReceiptEmitter, Supabase payment-link, and dashboard scaffolding;
- EIP-7702 and Particle V2 probes;
- pre-hackathon strategy and readiness documents.

Representative history:

- `7cd715b` (2026-05-06) — explicitly named pre-hackathon baseline;
- `1607a70` (2026-05-07) — prototype hardening;
- `ea4586c` (2026-05-08) — early clarity pass;
- `4134690` / `f46bdad` / `fac85f7` (2026-06-19–20) — initial EIP-7702 mode, Magic address
  resolution, and pre-kickoff polish.

This foundation was not the final submitted product and did not yet contain the complete winning
case described below.

## During the hackathon: material submission work

### Particle UA + EIP-7702 product rail

- `b5e042b` — moved to the Particle V2 SDK required for the real 7702 path.
- `68480ab` — built the cross-chain proof lab and solved per-chain V2 pre-delegation.
- `c3c4621` — recorded the first independently verified Base-to-Arbitrum UA payment.
- `d87fed6` — integrated the proven `createUniversalTransaction` recipe into `/pay`.
- `c1d4056` / `2ec34ce` / `30fc008` — proved the product checkout end-to-end, deployed it, and
  surfaced the cross-chain route on the public receipt.
- `2ba0dd4` / `62295bd` — moved to stable Particle SDK `2.0.3` and re-verified same-chain plus
  cross-chain settlement.

### Consent, enforcement, and proof

- SpendPolicy was first checkpointed on kickoff day (`473637b`) and subsequently exercised,
  hardened, deployed, and proven on Base and Arbitrum during the event.
- `dec94d5` — turned the mandate into a legible card-limit consent surface.
- `e51044d` / `a2c1b8c` — made budget depletion and the hard refusal visible.
- `5b042ce` / `1e1b231` — added server-verified Particle funding-route evidence and linked the
  source-chain debit.
- `a31433a` / `0442ea4` / `f34aeed` — implemented and live-verified sponsored 7702 delegation.
- `ee52143` / `4023d17` — added and live-verified reversible EIP-7702 undelegation.

### Research Agent Expense Card

- `5e308a7` — created the concrete paid-research task and task-first UX.
- `cf140b4` — added the live one-click on-chain revoke.
- `c1f051a` / `61b0f72` — aligned the public product and submission around the use case.
- `c0d4b7b` — shipped the verified no-wallet Research Agent replay.
- `3305a5e` — attached that public artifact to the honest claim ledger.

The live evidence was produced during the event:

- two real Arbitrum data purchases (`0.05 + 0.08 USDC`);
- a live `PerChargeExceeded` refusal for the unexpected `0.20 USDC` request;
- a mined `MandateRevoked` transaction;
- multiple real Particle UA cross-chain settlements and public proof receipts.

## Submission-safe explanation

> We entered kickoff with a lightweight Magic/Particle checkout scaffold. During the hackathon we
> built and proved the actual submission: Particle UA V2 in EIP-7702 mode, live cross-chain value
> movement, the deployed SpendPolicy permission firewall, sponsored and reversible delegation,
> the Research Agent Expense Card, x402-pattern paid resources, server-verified funding evidence,
> public receipts, and the final judge-facing UX. The repository keeps the full history rather than
> hiding the prototype.

## Before submission

- [ ] Preserve the original organizer message allowing lightweight preparation.
- [ ] Ask for written confirmation if the final form interprets “created during the hackathon” as
  prohibiting all pre-kickoff scaffolding.
- [ ] Link this delta only if the form or judges ask; do not make eligibility caveats the product
  pitch opener.
- [ ] Ensure every final claim still maps to `docs/honest-claim-ledger.md`.
- [ ] Keep the repository history intact.
