import { ARBITRUM_CHAIN, BASE_CHAIN, getExplorerTxUrl } from "@/lib/config/payment";
import {
  summarizeResearchTask,
  type ResearchResourceOutcome,
} from "@/lib/agent/research-task";

export const DEMO_REPLAY_MODE = "replay";

const RESEARCH_MARKET_TX =
  "0xbe1b718305fd60b228e27c44156678e2c13fd1714510d8b9a02aa161814d7eb3";
const RESEARCH_SENTIMENT_TX =
  "0xfaa29913ae64dd0731b21758d58529d5f08e7b007e306c282b05012661254aa8";
const RESEARCH_REVOKE_TX =
  "0xe01a85f70d25acbda2d54f1dbe4350a055c0cf567658b0dbe015e643a3cd5aea";

/**
 * Read-only replay of the live C25/C26 Research Agent run. Payloads are frozen evidence snapshots,
 * deliberately independent from today's mutable demo catalog. Importing this module never
 * initializes a wallet, calls an API, or sends a tx.
 */
export const DEMO_REPLAY_AGENT_OUTCOMES: ResearchResourceOutcome[] = [
  {
    resourceId: "market-insight",
    title: "Market insight snapshot",
    priceAtomic: 50_000n,
    status: "purchased",
    settled: true,
    data: {
      kind: "market-insight",
      asOf: "2026-06-21T00:00:00Z",
      summary: "ETH momentum neutral-to-positive; stablecoin flows rising on L2s.",
      signals: [
        { name: "l2_stablecoin_inflow", value: "rising", confidence: 0.71 },
        { name: "eth_funding", value: "neutral", confidence: 0.6 },
      ],
    },
    txUrl: getExplorerTxUrl(ARBITRUM_CHAIN, RESEARCH_MARKET_TX),
  },
  {
    resourceId: "sentiment-feed",
    title: "Live sentiment feed",
    priceAtomic: 80_000n,
    status: "purchased",
    settled: true,
    data: {
      kind: "sentiment-feed",
      window: "1h",
      score: 0.62,
      label: "mildly bullish",
      sources: 1284,
    },
    txUrl: getExplorerTxUrl(ARBITRUM_CHAIN, RESEARCH_SENTIMENT_TX),
  },
  {
    resourceId: "premium-dataset",
    title: "Premium dataset (full export)",
    priceAtomic: 200_000n,
    status: "blocked",
    settled: false,
    reason: "PerChargeExceeded: attempted 0.20 USDC, signed cap 0.10 USDC",
  },
];

export const DEMO_REPLAY_AGENT_SUMMARY = summarizeResearchTask(
  DEMO_REPLAY_AGENT_OUTCOMES,
  2_000_000n,
);

export const DEMO_REPLAY_AGENT = {
  mode: "verified_replay" as const,
  sendsTransactions: false as const,
  chain: ARBITRUM_CHAIN.name,
  perToolCapAtomic: 100_000n,
  dailyCapAtomic: 2_000_000n,
  merchant: "0x8C54783849A2C042544efc37c4657Ee98a411Fb7",
  revokeTxHash: RESEARCH_REVOKE_TX,
  revokeExplorer: getExplorerTxUrl(ARBITRUM_CHAIN, RESEARCH_REVOKE_TX),
};

export const DEMO_REPLAY_PAYMENT_LINK = {
  id: "7cfd444c-5308-4688-80c4-7e9c4def9149",
  merchant_id: "0x8C54783849A2C042544efc37c4657Ee98a411Fb7",
  merchant_address: "0x8C54783849A2C042544efc37c4657Ee98a411Fb7",
  amount: "100000",
  token: "USDC",
  destination_chain_id: 8453,
  destination_token_address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  label: "Demo replay: verified 0.10 USDC payment",
  status: "completed",
  contract_invoice_id: "0xa804ede9c169e3e9ae6003c5e1a3fa5531bd0d1955ea3e6466d434f6b8a94ee1",
  receipt_emitter_address: "0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3",
  registered_tx_hash: null,
  paid_tx_hash: "0xfb480ac9357e88d6a98f8e08fdf8a6a686cbcd8ee5e46aff20a56893615eb357",
  paid_at: "2026-05-06T00:00:00.000Z",
  error_message: null,
  created_at: "2026-05-06T00:00:00.000Z",
  expires_at: null,
};

export const DEMO_REPLAY_PAYMENT = {
  id: "demo-replay-payment",
  payment_link_id: DEMO_REPLAY_PAYMENT_LINK.id,
  payer_address: "0xeE1FB8b1d24d658F39D1AFEc50a82D0c306c0246",
  source_chain_id: 8453,
  destination_chain_id: 8453,
  token: "USDC",
  amount: "100000",
  tx_hash: DEMO_REPLAY_PAYMENT_LINK.paid_tx_hash,
  receipt_tx_hash: "0xb65cdcf3e7a6973c801b0f0da8a50c03f19fd99dee4693ba7e8861609428788b",
  preview_json: null,
  error_message: null,
  status: "completed",
  completed_at: DEMO_REPLAY_PAYMENT_LINK.paid_at,
  created_at: DEMO_REPLAY_PAYMENT_LINK.created_at,
};

export function isDemoReplayRequest(searchParams: URLSearchParams) {
  return searchParams.get("demo") === DEMO_REPLAY_MODE;
}

export function getDemoReplaySuccess(id: string) {
  if (id !== DEMO_REPLAY_PAYMENT_LINK.id) return null;
  // This canned replay is a Base same-chain 0.10 USDC payment (see the tx hashes above),
  // so its explorer links resolve on BaseScan.
  const chain = BASE_CHAIN;
  return {
    link: DEMO_REPLAY_PAYMENT_LINK,
    payment: DEMO_REPLAY_PAYMENT,
    paymentExplorer: getExplorerTxUrl(chain, DEMO_REPLAY_PAYMENT.tx_hash),
    proofExplorer: getExplorerTxUrl(chain, DEMO_REPLAY_PAYMENT.receipt_tx_hash),
  };
}
