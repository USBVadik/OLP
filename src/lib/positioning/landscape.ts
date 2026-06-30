// Positioning data for the /trust "where we fit" section. Single source of reviewable copy.
//
// HONESTY RULES (this is judge-facing on the claim-discipline page):
//  - Every market stat is THIRD-PARTY (not our metric) and MUST carry source + url + asOf.
//    `assertAllSourced` + the unit test enforce this — an unsourced stat fails the build's tests.
//  - Competitor lines describe each approach fairly (not a strawman).
//  - Our column never claims more than the referenced honest-claim-ledger row (`ledgerRef`).
//  - `kind: "built"` = live today (maps to a ledger C-row). `kind: "directional"` = narrative
//    only (ledgerRef "—"); the UI must tag these so they never read as shipped integrations.

export type StackLayer = {
  layer: "Authorization" | "Checkout" | "Settlement" | "Enforcement & proof";
  examples: string;
  isOurs?: boolean;
};

export type Sourced = { source: string; url: string; asOf: string };

export type TrustStat = Sourced & { stat: string };

export type CompareRow = {
  player: string;
  approach: string; // fair description of THEIR approach
  ours: string; // our different approach
  ledgerRef: string; // honest-claim-ledger reference, or "—" for directional
  kind: "built" | "directional";
};

export const STACK_2026: StackLayer[] = [
  { layer: "Authorization", examples: "Google AP2 (→ FIDO) · Mastercard Verifiable Intent" },
  { layer: "Checkout", examples: "OpenAI ACP · Google UCP" },
  { layer: "Settlement", examples: "x402 · cards (Visa, Mastercard) · USDC (Circle)" },
  {
    layer: "Enforcement & proof",
    examples: "OneLink Pay — on-chain SpendPolicy + verifiable proof receipt",
    isOurs: true,
  },
];

export const TRUST_STATS: TrustStat[] = [
  {
    stat: "~3 in 4 are uncomfortable letting an AI pay autonomously — even with limits set in advance.",
    source: "Forrester",
    url: "https://www.forrester.com/blogs/consumers-arent-ready-to-delegate-payments-to-ai-agents/",
    asOf: "2026-06",
  },
  {
    stat: "Only ~14% would trust an AI agent to complete a purchase on their behalf.",
    source: "Ecommpay / The Paypers",
    url: "https://thepaypers.com/payments/thought-leader-insights/ecommpay-report-key-takeaways-trust-and-control-in-agentic-commerce",
    asOf: "2026-06",
  },
  {
    stat: "~2 in 3 will try agentic shopping — but demand human approval before the buy.",
    source: "Commerce + PayPal",
    url: "https://www.marketscreener.com/news/two-thirds-of-consumers-are-ready-to-try-agentic-shopping-but-many-demand-human-approval-before-ai-ce7f5fdadc8df220",
    asOf: "2026-06",
  },
];

// Our framing (a conclusion, NOT a stat) — rendered distinctly so it is never read as data.
export const TRUST_TAKEAWAY =
  "Everyone is building rails. The blocker is trust. That is the layer we are.";

export const COMPARISON: CompareRow[] = [
  {
    player: "Visa Intelligent Commerce + OpenAI",
    approach: "Tokenized card credential; spend limits enforced before authorization — on custodial card rails.",
    ours: "Same pre-authorization idea, but on-chain and non-custodial, on your own account.",
    ledgerRef: "C1–C6",
    kind: "built",
  },
  {
    player: "Coinbase Agentic Wallets",
    approach: "Vendor-managed embedded/MPC wallet plus spend permissions on Base.",
    ours: "Wallet-agnostic — the limit lives on your own EIP-7702 account, chain-abstracted.",
    ledgerRef: "C1, C7, C21",
    kind: "built",
  },
  {
    player: "Circle / Catena",
    approach: "Managed, custodial agent-payment rails (Catena is filing for a trust-bank charter to custody funds).",
    ours: "Non-custodial — you hold the keys; we enforce, we don't custody.",
    ledgerRef: "C1–C6",
    kind: "built",
  },
  {
    player: "Google AP2",
    approach: "Agent mandates as off-chain Verifiable Credentials.",
    ours: "Same intent, enforced on-chain at your account — a promise becomes a guarantee.",
    ledgerRef: "C1–C6, C11",
    kind: "built",
  },
  {
    player: "x402 (Coinbase)",
    approach: "HTTP-402 pay-per-call rail for agents — with no spend ceiling.",
    ours: "We bound x402 spend with the mandate (live).",
    ledgerRef: "C17",
    kind: "built",
  },
  {
    player: "Consumer crypto wallets (send-money apps)",
    approach: "Move money between people — send, request, split — chain-abstracted with a web2-smooth feel.",
    ours: "Not another wallet: we make app & agent payments safe — an on-chain limit they can't exceed + a proof anyone can verify.",
    ledgerRef: "C1–C6, C16, C20",
    kind: "built",
  },
  {
    player: "Other rails (cards · bank · PSP)",
    approach: "Settle off-chain, each with its own controls — or none — and nothing on-chain.",
    ours: "The same mandate is designed to front them too — one on-chain guardrail across rails.",
    ledgerRef: "—",
    kind: "directional",
  },
];

/** Honesty guard: every market stat must carry a non-empty source, url, and asOf. */
export function assertAllSourced(stats: TrustStat[]): void {
  for (const s of stats) {
    if (!s.source?.trim() || !s.url?.trim() || !s.asOf?.trim()) {
      throw new Error(`Unsourced trust stat: ${JSON.stringify(s.stat)} (source/url/asOf required)`);
    }
  }
}
