# Spec: pitch-positioning-rewrite — Design

> Pairs with `requirements.md` and `tasks.md`.

## 1. Tone guide (binding for this spec)

- Concrete > abstract. Verb > noun stack.
- Hero is two short lines, scannable in <2s.
- Subhead front-loads the action ("Sign one scoped mandate.") then the constraints
  ("…over-cap, off-merchant, or post-revoke charges revert.").
- Use **"AI agent"**, **"mandate"**, **"on-chain"**, **"revert"**, **"revoke"** — judge
  vocabulary that maps to the rubric.
- Avoid: "trust layer", "consent layer", "permission-safety", "primitive", "infra", "chain
  abstraction" (in user-facing copy; the README technical section can keep them).
- Honesty: never say "cross-chain via UA is live" until ledger row says so.

## 2. Exact copy decisions — landing (`src/app/page.tsx`)

### 2.1 Hero eyebrow
**Old:** `Consent, proof & on-chain spend limits for Universal Accounts`
**New:** `On-chain spending limits for the agent era`
- 7 words, ≤8 cap satisfied.

### 2.2 Hero h1
**Old:**
```
Trust before you pay.
<br />
<span className="text-gold">Proof</span> after it settles.
```
**New:**
```
Give your AI a card.
<br />
<span className="text-gold">Not your wallet.</span>
```
- Two beats. Gold accent on the punchline ("Not your wallet.") so the contrast lands.
- Keeps existing line-break structure, font-display, gold span class — minimal layout risk.

### 2.3 Hero subhead
**Old (~50 words):**
> OneLink Pay shows exactly what you are approving, enforces your limits on-chain with
> EIP-7702, and hands back a verifiable receipt. Give a merchant — or an AI agent — a
> scoped mandate it cannot overspend.

**New (~55 words):**
> Sign one scoped mandate. Your AI agent (or a merchant) can charge USDC — but only inside
> the per-charge, daily, and total caps you approved. Over-cap, off-merchant, or post-revoke
> charges revert on-chain at zero gas. Every payment ships a public, verifiable proof
> receipt.

- Action-first sentence; constraints second; proof third. Maps to the demo's three beats.
- Keeps under 60-word EARS limit.

### 2.4 Hero check bullets
**Old:**
- Live on Base + Arbitrum
- On-chain spend mandates (EIP-7702)
- Verifiable proof receipts

**New:**
- Live on Base + Arbitrum
- EIP-712 mandates · enforced by SpendPolicy
- On-chain proof receipts

- Sharpened middle bullet to name the contract (judges look for naming).

### 2.5 Pillar 3 body ("Permission Firewall")
**Old:**
> Scoped spend mandates — per-charge, daily, and total caps with an expiry — enforced
> on-chain by an EIP-7702 SpendPolicy. Arm once; overcharges and off-scope payments revert.
> Revoke anytime.

**New:**
> Scoped mandates with per-charge, daily, and total caps + expiry, enforced on-chain by
> SpendPolicy. Sign once; over-cap charges revert at zero gas. Revoke anytime.

- Slightly tighter; keeps "zero gas" as the proof point.

### 2.6 Pillar 3 eyebrow
**Old:** `Before future automation`
**New:** `While agents run`

- More present-tense; matches the agentic framing.

### 2.7 Honest-scope footer (micro-sharpen)
**Old:**
> Honest scope: the Permission Firewall enforces scoped spend mandates on-chain via an
> EIP-712 SpendPolicy (covered by tests). Cross-chain settlement via Universal Accounts is
> in progress — Particle UA as the primary rail, Circle Gateway as backup. No gas
> sponsorship is claimed.

**New:**
> Honest scope: the on-chain firewall (SpendPolicy) is live on Base + Arbitrum and tested
> (22 contract tests). Same-chain checkout is proven end-to-end. Cross-chain value movement
> via Universal Accounts is in progress — Particle UA as the primary rail, Circle Gateway
> as backup. No gas sponsorship is claimed.

- Adds the "22 contract tests" detail (claim ledger C10 covers it).
- Adds "same-chain checkout proven end-to-end" (claim C8 covers it).

### 2.8 Things explicitly NOT changing
- `<Wordmark />`, nav links.
- The `PreviewPeek` card markup, copy, and chips.
- The "How a payment flows" 5-step list — already factual; do not edit in this spec.
- The "approve + payInvoice" universal_invoice paragraph — keeps technical context for
  judges who read it.

## 3. Exact copy decisions — README

### 3.1 Replace lines 1-25 (everything from the title down to the end of the
"Active Milestone B Fallback Path" section).

**New opening (~150 words):**

```markdown
# OneLink Pay

**On-chain spending limits for the agent era.** Sign one scoped mandate; your AI agent (or
a merchant) can charge USDC — but only inside the per-charge, daily, and total caps you
approved. Over-cap, off-merchant, or post-revoke charges revert on-chain at zero gas. Every
payment ships a public, verifiable proof receipt.

Built for the [UXmaxx Hackathon](https://www.encodeclub.com/programmes/uxmaxx-hackathon)
(Encode Club + 7702 Collective).

## What's live

- **Permission Firewall** — `SpendPolicy.sol` enforces an EIP-712 `PaymentMandate`
  (per-charge / daily / total caps + expiry + single-merchant + revoke). Deployed on Base
  (`0x73C8…3957`) and Arbitrum One (`0x9782…164E`). Over-cap charges revert with
  `PerChargeExceeded` at zero gas. 22 Hardhat tests pass.
- **Proof receipts** — `ReceiptEmitter.sol` emits an `InvoicePaid` event after server-side
  verification of the on-chain USDC `Transfer`. Public receipt page at `/receipt/[id]`.
  Deployed on Base (`0x89CF…5bC3`) and Arbitrum One (`0xe4C6…D2A1`).
- **Walletless onboarding** — Magic embedded wallet (email today; Google OAuth shipping
  next).
- **EIP-7702 delegation** — Magic EOA delegated in-place via Particle UA
  (`useEIP7702: true`), proven on Base
  (tx `0x4ca6…cef0`).

## Honest scope

- ✅ The on-chain firewall is live and tested (22 Hardhat tests pass).
- ✅ Same-chain USDC checkout is proven end-to-end on Arbitrum, with proof anchored on Base.
- 🚧 Cross-chain value movement via the Universal Account is in progress. The strict
  `createUniversalTransaction` custom-call path returns `-32801 System maintenance` during
  Particle's V2 migration; the active rail is `createTransferTransaction` + server-verified
  proof. Circle Gateway is the documented backup rail.
- ❌ No gas sponsorship is claimed. Particle AuthKit is installed but not on the live path.
```

### 3.2 Keep unchanged
- `## Security Notes`
- `## Required Env`
- `## Local Commands`
- `## Historical P0 Proof`

### 3.3 Fix the SDK versions section

**Old:**
```
- `magic-sdk`: `29.4.2`
```

**New:**
```
- `magic-sdk`: `33.7.1`
- `@magic-ext/evm`: `1.5.0`
```

(Per `package.json` and `docs/status.md`.)

## 4. File diff plan

| file | type | edits |
|------|------|-------|
| `src/app/page.tsx` | str_replace × 6 | eyebrow, hero h1, subhead, bullets, pillar 3 body+eyebrow, footer |
| `README.md` | str_replace × 2 | first section (title→Active Milestone B), SDK versions block |

No new files, no new dependencies, no new components.

## 5. Risks introduced

- **R-NEW-6:** copy may overflow on narrow viewports if the hero h1 is significantly longer
  than the old one. Mitigation: the new h1 is shorter ("Give your AI a card." vs "Trust
  before you pay."). Visual check at 1280px and 360px in T8.

## 6. References

- `docs/master-tz.md` §1 (north-star sentence — the new copy is its public-facing
  expression).
- `docs/honest-claim-ledger.md` rows C1-C11 (the on-chain firewall claims).
- `docs/RES/deep-research-onelink-pay-uxmaxx.md` §2 (positioning recommendations).
- `docs/RES/deep-research-report  onelink.md` §2 ("AI-safe card" alternative).
