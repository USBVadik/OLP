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

// Emerging Ethereum standards for bounded, revocable, code-enforced agent spend. OneLink is a
// working implementation of the SAME IDEA today (our own SpendPolicy) — `relation` may only be
// "aligned" (same shape as our live mandate) or "complements" (e.g. proof receipt vs reputation).
// It is NEVER "implements": we do not ship any single draft ERC. `study` is an optional secondary
// citation (e.g. an empirical paper) and, when present, must itself be fully sourced.
export type Standard = Sourced & {
  name: string;
  status: string; // "Draft ERC · discussion" | "Draft EIP" — must read as not-yet-final
  what: string; // fair one-line description of the standard
  ours: string; // how OneLink relates (maps to a ledger C-row)
  relation: "aligned" | "complements";
  study?: Sourced;
};

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
    stat: "Only 13.9% would trust an AI agent to complete a purchase on their behalf.",
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
    player: "AWS Bedrock AgentCore Payments",
    approach: "Managed, session-level spend limits inside a cloud agent runtime (with Coinbase + Stripe).",
    ours: "Non-custodial and on your own on-chain account — the limit is a public contract anyone can re-check, with a proof receipt per payment.",
    ledgerRef: "C1–C6, C16",
    kind: "built",
  },
  {
    player: "MetaMask Smart Accounts · ERC-7715 session keys",
    approach: "Wallet-granted session keys with granular permissions — now across Coinbase, ZeroDev, Safe and MetaMask.",
    ours: "We don't reinvent the primitive — we package it as a legible, revocable payments mandate with a public proof receipt, on your own EIP-7702 account.",
    ledgerRef: "C7, C14, C21",
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

// Emerging Ethereum standards for bounded/revocable agent spend. OneLink is aligned (same shape as
// our live SpendPolicy) or complementary (proof receipt vs reputation) — it implements NONE of these
// draft ERCs. Every entry is third-party sourced (guarded by the unit test). Primary sources
// verified 2026-07.
export const STANDARDS: Standard[] = [
  {
    name: "Asset-Enforced Spend Mandate",
    status: "Draft ERC · discussion",
    what: "Per-charge cap, expiry, allowed token and instant revoke enforced by the asset itself — not by the agent behaving well.",
    ours: "The same shape, live today: our SpendPolicy enforces per-charge / daily / total caps + expiry + revoke on-chain (C1–C6). The draft explores the token layer; we enforce at the account layer.",
    relation: "aligned",
    source: "Ethereum Magicians",
    url: "https://ethereum-magicians.org/t/erc-asset-enforced-spend-mandate/28831",
    asOf: "2026-06",
  },
  {
    name: "ERC-8226 · Regulated Agent Mandate",
    status: "Draft EIP",
    what: "A compliance-layer mandate for regulated tokenized assets: a verified principal delegates scoped, time-bounded, financially capped authority to an on-chain agent, checked before each transfer.",
    ours: "Same mandate shape (scoped / capped / expiring / revocable), a different domain — 8226 targets regulated tokenized assets, while OneLink applies the pattern to general USDC agent spend on-chain today (SpendPolicy — C1–C6, C16).",
    relation: "aligned",
    source: "Ethereum Improvement Proposals",
    url: "https://eips.ethereum.org/EIPS/eip-8226",
    asOf: "2026-06",
  },
  {
    name: "ERC-8312 · Bounded Agent Actions",
    status: "Draft ERC · discussion",
    what: "Track how much of a bounded mandate an agent has already spent, so a contract can see the room that is left.",
    ours: "Our SpendPolicy already accounts spend against the caps and reverts over-budget charges at zero gas (C3).",
    relation: "aligned",
    source: "Ethereum Magicians",
    url: "https://ethereum-magicians.org/t/erc-8312-bounded-agent-actions/28851",
    asOf: "2026-06",
  },
  {
    name: "ERC-8004 · Trustless Agents",
    status: "Draft EIP",
    what: "On-chain registries for agent identity, reputation and validation.",
    ours: "Complementary, not competing: reputation is attested, and its reliability is under active study; our proof receipt is a verifiable record of the actual settlement — proof of the interaction, re-checkable with no account (C20).",
    relation: "complements",
    source: "Ethereum Improvement Proposals",
    url: "https://eips.ethereum.org/EIPS/eip-8004",
    asOf: "2026-06",
    study: {
      source: "arXiv 2606.26028 · empirical study",
      url: "https://arxiv.org/html/2606.26028v1",
      asOf: "2026-06",
    },
  },
];

/** Honesty guard: every sourced entry must carry a non-empty source, url, and asOf. Generic over
 * any `Sourced` (trust stats, standards). `label` shapes the error message per content type. */
export function assertAllSourced<T extends Sourced>(items: T[], label = "trust stat"): void {
  for (const s of items) {
    if (!s.source?.trim() || !s.url?.trim() || !s.asOf?.trim()) {
      const id = (s as { stat?: string }).stat ?? (s as { name?: string }).name ?? s.source ?? "";
      throw new Error(`Unsourced ${label}: ${JSON.stringify(id)} (source/url/asOf required)`);
    }
  }
}
