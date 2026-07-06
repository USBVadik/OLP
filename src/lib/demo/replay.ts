import { BASE_CHAIN, getExplorerTxUrl } from "@/lib/config/payment";

export const DEMO_REPLAY_MODE = "replay";

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
