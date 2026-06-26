# Product

## Register

product

> The marketing landing (`/`) and `/demo-replay` are **brand**-register surfaces (design IS the
> pitch). Every authenticated/task route — `/firewall`, `/agent`, `/pay`, `/wallet`, `/dashboard`,
> `/success`, `/receipt`, `/trust` — is **product**-register (design SERVES the task). Default is
> product; treat the landing as brand per-task.

## Users

Two audiences, one build:

- **Hackathon judges (primary audience right now).** Technical evaluators scoring UX (40%),
  prominent Universal Accounts + EIP-7702 (30%), adoption (20%), polish (10%). They evaluate in
  ~2 minutes and probe claims. They need the wow and the proof in seconds, and they reward honesty.
- **End users (the product's real audience).** A person paying via a link, or someone arming an AI
  agent / merchant with a scoped, revocable spending mandate. Non-crypto-native: must never face
  seed phrases, network-switching, or raw hex.

## Product Purpose

OneLink Pay is an on-chain, revocable **spending limit (Permission Firewall)** for the agent
economy. Sign one scoped mandate (per-charge / daily / total caps + expiry + single merchant) and
an AI agent or merchant can spend USDC only inside it: over-cap charges revert on-chain at zero gas,
every payment ships a verifiable proof receipt, and funds settle cross-chain through a Particle
Universal Account (EIP-7702) with no manual bridge. Success = a judge instantly grasps "give your AI
a card, not your wallet," watches it enforced live, and trusts every claim.

## Brand Personality

Premium, calm, trustworthy, precise. Not a crypto dashboard — an expensive-feeling consumer payment
product. Voice: plain-language confidence ("a debit card with a built-in limit, enforced on-chain,
not by trust"). Three words: **trustworthy, precise, premium.**

## Anti-references

- Generic crypto dashboards (dark, neon, dense tables, gas/hex everywhere).
- Dev-console aesthetics; raw JSON as the primary UI.
- Hype and overclaiming. The honesty discipline (a `/trust` page, a claim ledger) is part of the brand.
- AI-slop landing tropes: an eyebrow above every section, identical icon-card grids, gradient text,
  the big-number hero-metric template.

## Design Principles

1. **Show, don't tell.** Prove each advantage live (real tx, real revert, real receipt) instead of asserting it.
2. **Expensive simplicity.** One main idea per surface; technical depth lives in disclosures, never the headline.
3. **Plain language over jargon.** Glossary tooltips for crypto terms; a non-native must be able to follow.
4. **Honest by construction.** Real / pattern / future are labeled; no overclaim — trust is the moat.
5. **Located accent, not reskin.** Warm-premium paper/ink/gold base; iris (Particle violet) only around
   Universal-Account / EIP-7702 touchpoints.

## Accessibility & Inclusion

WCAG AA targets: body text ≥ 4.5:1, large text ≥ 3:1, placeholders ≥ 4.5:1; visible focus rings on
every interactive; `prefers-reduced-motion` honored (all signature motion has a reduced alternative);
keyboard-navigable; semantic HTML + ARIA; touch targets ≥ 44px.
