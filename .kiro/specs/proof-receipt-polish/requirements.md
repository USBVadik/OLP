# Spec: proof-receipt-polish — Requirements

> Epic: **E4. Proof + trust layer**
> Story: **E4.S1**
> Priority: **P3** (last buildable spec before the cross-chain gate)
> Estimated effort: **2-3h**
> Process: `.kiro/steering/methodology.md`

## 1. Why this exists

The public proof receipt (`/receipt/[id]`) already shows a verified → matched → recorded trail
with explorer links and a "anyone can verify" note. The remaining polish is **shareability**: make
a paid receipt easy to share and verify from anywhere — a copy-link affordance and a scannable QR
that points at the public receipt URL. This boosts trust + virality (Adoption 20 / Polish 10) and
makes a great demo beat ("scan this, verify the payment on-chain yourself").

## 2. Honesty constraints

- Only render the share affordances for a **completed** receipt (nothing to verify otherwise).
- The QR encodes the public receipt URL only — no secrets, no PII.
- No new on-chain claims.

## 3. Acceptance criteria (EARS)

### Ubiquitous
- The system shall expose a pure helper that builds the absolute public receipt URL from the app
  base URL and an invoice id.
- A completed receipt shall offer a "copy receipt link" affordance and a QR encoding the public
  receipt URL.

### Event-driven
- **When** a visitor views a completed receipt, **the system shall** show a Share section (copy
  link + QR + "scan to verify" caption).
- **When** a visitor views an unpaid receipt, **the system shall NOT** show the Share section.

### Unwanted-behavior
- **If** QR generation fails, **then the system shall** still render the receipt and the copy-link
  (QR is best-effort, never a crash).

## 4. Scope

### In scope
- `src/lib/receipts/share.ts` — pure `receiptShareUrl(appUrl, id)` (+ test).
- QR generation (server-side SVG) on the receipt page via a small dependency.
- A Share section on `/receipt/[id]` (reuse `CopyLinkButton`).

### Out of scope (cut)
- Mandate-hash snapshot on the receipt (not reliably stored server-side; defer).
- Social-card / OG image generation.
- Receipt PDF export.

## 5. INVEST

Independent ✅ · Negotiable ✅ · Valuable (trust + virality + demo beat) ✅ · Estimable (2-3h) ✅ ·
Small ✅ · Testable (pure URL helper unit-tested; QR + section render-checked) ✅

## 6. Definition of Done

- EARS met; Share section on completed receipts only; QR best-effort.
- typecheck + lint + test:unit + build green; `/receipt/[id]` renders.
- master-tz + claim ledger (C20) updated; `prior-art-readme` row marked superseded.

## Status: CLOSED 2026-06-21

- `src/lib/receipts/share.ts` `receiptShareUrl` — 5 node:test cases green.
- `qrcode@1.5.4` (+ `@types/qrcode`) added; server-side SVG QR generated in `/receipt/[id]`
  (best-effort try/catch). QR generation verified via a standalone node run (valid `<svg>`).
- Share & verify section (QR + `CopyLinkButton` + "Open public link" + "scan to verify" caption)
  renders for completed receipts only.
- Gate: typecheck 0, lint 0, 110 unit tests, production build clean.
- Open: live completed-branch visual not captured (no completed invoice in the DB at build time);
  logic verified by build + QR run + the unit-tested URL helper. Confirm on a real completed
  receipt during demo dress rehearsal.
