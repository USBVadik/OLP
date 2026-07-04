"use client";

import { useState, useEffect, useCallback } from "react";
import { encodeFunctionData, type Address } from "viem";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";
import {
  ERC20_APPROVE_ABI,
  RECEIPT_EMITTER_ABI,
} from "@/lib/contracts/receipt-emitter";
import {
  ARBITRUM_CHAIN,
  BASE_CHAIN,
  OPTIMISM_CHAIN,
  getActivePaymentChain,
  getConfiguredPaymentMode,
  getExplorerTxUrl,
  getPaymentChainById,
  getPaymentModeLabel,
  getProofChain,
  getPublicRpcUrl,
  getUniversalXActivityUrl,
} from "@/lib/config/payment";
import {
  Wordmark,
  Chip,
  Dot,
  Disclosure,
  VerifiedSeal,
  Field,
  IconShield,
  IconLock,
  IconCheck,
  IconArrowUpRight,
} from "@/components/ui";
import { PermissionFirewall } from "@/components/permission-firewall";
import { ProofReceiptCard } from "@/components/proof-receipt";
import { CrossChainRoute } from "@/components/cross-chain-route";
import { LoginWithGoogleButton, MagicLoginReassurance, SignOutButton } from "@/components/login-with-google";

// Dynamic imports for browser-only SDKs
let Magic: any = null;
let EVMExtension: any = null;
let OAuthExtension: any = null;
let UniversalAccount: any = null;
let SUPPORTED_TOKEN_TYPE: any = null;
let UNIVERSAL_ACCOUNT_VERSION: any = null;

async function loadSDKs() {
  if (!Magic || !EVMExtension) {
    const magicMod = await import("magic-sdk");
    Magic = magicMod.Magic;
    const evmMod = await import("@magic-ext/evm");
    EVMExtension = evmMod.EVMExtension;
  }
  if (!OAuthExtension) {
    const oauthMod = await import("@magic-ext/oauth2");
    OAuthExtension = oauthMod.OAuthExtension;
  }
  if (!UniversalAccount) {
    const particleMod = await import("@particle-network/universal-account-sdk");
    UniversalAccount = particleMod.UniversalAccount;
    SUPPORTED_TOKEN_TYPE = particleMod.SUPPORTED_TOKEN_TYPE;
    UNIVERSAL_ACCOUNT_VERSION = particleMod.UNIVERSAL_ACCOUNT_VERSION;
  }
}

async function loadEthers() {
  const ethersMod = await import("ethers");
  return {
    BrowserProvider: ethersMod.BrowserProvider,
    getBytes: ethersMod.getBytes,
    Signature: ethersMod.Signature,
  };
}

// Magic v33 removed top-level metadata.publicAddress; the EVM address now lives under
// wallets.ethereum. Fall back to the EIP-1193 provider for maximum version robustness.
async function resolveMagicEoa(magic: any): Promise<string | null> {
  try {
    const meta = await magic.user.getInfo();
    const fromMeta = meta?.publicAddress ?? meta?.wallets?.ethereum?.publicAddress;
    if (fromMeta) return fromMeta;
  } catch {
    /* fall through to provider */
  }
  for (const method of ["eth_accounts", "eth_requestAccounts"]) {
    try {
      const accounts = await magic.rpcProvider.request({ method });
      if (accounts?.[0]) return accounts[0];
    } catch {
      /* try next */
    }
  }
  return null;
}

// One-time EIP-7702 delegation of the EOA on a chain (split flow). Sends a real Type-4 tx
// (needs native gas on that chain) and waits until Particle reports the delegation, so the
// next createTransferTransaction build is already-delegated (no inline auth -> avoids AA24).
async function delegateChain7702(
  magic: any,
  ua: any,
  ownerAddress: string,
  chainId: number,
  logFn?: (action: string, result: string, data?: any) => void
): Promise<void> {
  const deployments = await ua.getEIP7702Deployments();
  const dep = (deployments || []).find((d: any) => d.chainId === chainId);
  if (dep?.isDelegated) {
    logFn?.("ensureDelegated", "already delegated", { chainId });
    return;
  }
  logFn?.("ensureDelegated", "delegating", { chainId });
  await magic.evm.switchChain(chainId);
  const [auth] = await ua.getEIP7702Auth([chainId]);
  const authorization = await magic.wallet.sign7702Authorization({
    contractAddress: auth.address,
    chainId,
    nonce: auth.nonce + 1,
  });
  const delegationTx = await magic.wallet.send7702Transaction({
    to: ownerAddress,
    data: "0x",
    authorizationList: [authorization],
  });
  logFn?.("ensureDelegated", "submitted", { chainId, delegationTx });
  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const fresh = await ua.getEIP7702Deployments();
    if ((fresh || []).find((d: any) => d.chainId === chainId)?.isDelegated) {
      logFn?.("ensureDelegated", "confirmed", { chainId });
      return;
    }
  }
  logFn?.("ensureDelegated", "submitted but not confirmed in time", { chainId });
}

const ACTIVE_CHAIN = getActivePaymentChain();
const PAYMENT_MODE = getConfiguredPaymentMode();
const PAYMENT_MODE_LABEL = getPaymentModeLabel(PAYMENT_MODE);
const IS_7702 = PAYMENT_MODE === "universal_7702_transfer";
// One-tap checkout (Spec `one-tap-checkout`): collapse "Build preview" + "Confirm & pay" into a
// single "Pay" after the Trust Preview. Default OFF — the two-step flow stays the shipped default
// until this is live-verified. Flip via the Vercel env var; no logic redeploy needed.
const ONE_TAP_CHECKOUT = process.env.NEXT_PUBLIC_ONE_TAP_CHECKOUT === "true";

interface PaymentLink {
  id: string;
  merchant_address: string;
  amount: string;
  token: string;
  destination_chain_id: number;
  destination_token_address: string | null;
  label: string | null;
  status: "active" | "expired" | "completed" | "failed";
  contract_invoice_id: string | null;
  receipt_emitter_address: string | null;
  registered_tx_hash: string | null;
  paid_tx_hash: string | null;
  paid_at: string | null;
  error_message: string | null;
  latest_payment?: {
    tx_hash: string | null;
    receipt_tx_hash: string | null;
    status: string;
  } | null;
}

// Minimal ERC20 transfer ABI for encoding the merchant payment call.
const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Cross-chain-capable product payment build (EIP-7702 mode), proven live in
// /debug/cross-chain-proof (ledger C21). createUniversalTransaction runs USDC.transfer(merchant,
// amount) on the SETTLEMENT chain, funded from the Universal Account's unified balance — Particle
// sources the shortfall cross-chain when the payer lacks USDC on that chain. usePrimaryTokens:[USDC]
// forces the USDC route (never sells ETH) and forces the cross-chain leg when local USDC is short.
async function build7702Transaction(
  ua: any,
  paymentLink: PaymentLink,
  token: ReturnType<typeof resolvePaymentToken>
): Promise<any> {
  const settlementChain = getPaymentChainById(paymentLink.destination_chain_id);
  const usdcAddress = (paymentLink.destination_token_address as Address | null) ?? token.address;
  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [paymentLink.merchant_address as Address, BigInt(paymentLink.amount)],
  });
  return ua.createUniversalTransaction(
    {
      chainId: settlementChain.chainId,
      expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.USDC, amount: formatAtomicTokenAmount(paymentLink.amount, token) }],
      transactions: [{ to: usdcAddress, data, value: "0x0" }],
    },
    { usePrimaryTokens: [SUPPORTED_TOKEN_TYPE.USDC], slippageBps: 100 }
  );
}

type Step = "loading" | "login" | "balances" | "preview" | "paying" | "success" | "error";

interface DiagnosticLog {
  ts: string;
  action: string;
  result: string;
  data?: any;
}

function summarizeUserOps(transaction: any) {
  const userOps = transaction?.userOps ?? transaction?.data?.userOps ?? [];

  return userOps.map((entry: any) => {
    const userOp = entry.userOp ?? {};
    const eip7702Auth = userOp.eip7702Auth ?? entry.eip7702Auth;

    return {
      chainId: entry.chainId,
      userOpHash: entry.userOpHash,
      userOpKeys: Object.keys(userOp),
      hasEip7702Auth: Boolean(eip7702Auth),
      eip7702Delegated: eip7702Auth?.eip7702Delegated ?? userOp.eip7702Delegated ?? null,
      eip7702Auth,
    };
  });
}

function hasBlockingEip7702Auth(userOps: Array<ReturnType<typeof summarizeUserOps>[number]>) {
  return userOps.some((userOp) => userOp.hasEip7702Auth && userOp.eip7702Delegated === false);
}

function extractEvmTxHash(value: any, keyHint?: string): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const normalizedHint = keyHint?.toLowerCase();
    if (normalizedHint && ["txhash", "transactionhash", "hash"].includes(normalizedHint)) {
      return /^0x[a-fA-F0-9]{64}$/.test(value) ? value : null;
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractEvmTxHash(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    for (const [key, item] of entries) {
      const found = extractEvmTxHash(item, key);
      if (found) return found;
    }
  }
  return null;
}

// A cross-chain UA op produces userOps/tx hashes on multiple chains. mark-paid must verify
// the merchant Transfer on the SETTLEMENT chain, so pick the tx hash tied to that chainId.
function extractSettlementTxHash(value: any, settlementChainId: number): string | null {
  const matches: string[] = [];
  function walk(node: any) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const chainId = (node as any).chainId;
    const txHash = (node as any).txHash ?? (node as any).transactionHash;
    if (
      typeof chainId === "number" &&
      chainId === settlementChainId &&
      typeof txHash === "string" &&
      /^0x[a-fA-F0-9]{64}$/.test(txHash)
    ) {
      matches.push(txHash);
    }
    for (const nested of Object.values(node)) walk(nested);
  }
  walk(value);
  return matches[0] ?? null;
}

// Particle splits a cross-chain transfer into deposit/lending/settlement phases. Only the
// SETTLEMENT phase contains the actual merchant delivery on the settlement chain — deposit
// and lending hashes are internal solver legs and must NOT be used for verification.
function getSettlementOpHash(status: any, settlementChainId: number): string | null {
  const ops = status?.settlementUserOperations ?? [];
  const match = ops.find(
    (op: any) =>
      op?.chainId === settlementChainId &&
      typeof op?.txHash === "string" &&
      /^0x[a-fA-F0-9]{64}$/.test(op.txHash)
  );
  return match?.txHash ?? null;
}

// UA_TRANSACTION_STATUS terminal-failure codes (from the SDK enum). Reaching any of these
// without a settlement hash means the merchant was never paid (and the principal wasn't moved).
const UA_FAILED_STATUS: Record<number, string> = {
  6: "EXECUTION_FAILED",
  8: "REFUND_LOCAL",
  9: "REFUND_PENDING",
  10: "REFUND_FAILED",
  11: "REFUND_FINISHED",
  14: "PENNY_FAILED",
};

function getPaymentAmountLabel(paymentLink: PaymentLink): string {
  try {
    const token = resolvePaymentToken(paymentLink.token, paymentLink.destination_chain_id);
    return `${formatAtomicTokenAmount(paymentLink.amount, token)} ${token.symbol}`;
  } catch {
    return `${paymentLink.amount} ${paymentLink.token}`;
  }
}

function shortAddress(address: string | null | undefined) {
  if (!address) return "Not connected";
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

// The settlement chain (where the merchant actually receives USDC) is per-invoice and may
// differ from the proof chain (always Base). Fall back to the active chain before the link loads.
function getSettlementChainForLink(paymentLink: PaymentLink | null) {
  if (!paymentLink) return ACTIVE_CHAIN;
  try {
    return getPaymentChainById(paymentLink.destination_chain_id);
  } catch {
    return ACTIVE_CHAIN;
  }
}

function getSettlementChainIds(tx: any): number[] {
  const ops = tx?.userOps ?? tx?.data?.userOps ?? [];
  const ids = ops
    .map((op: any) => op?.chainId)
    .filter((id: any) => typeof id === "number");
  return Array.from(new Set(ids));
}

function getModeHelpText() {
  if (PAYMENT_MODE === "universal_invoice") {
    return "Strict invoice mode: Particle builds approve + payInvoice.";
  }
  if (PAYMENT_MODE === "universal_7702_transfer") {
    return "EIP-7702 mode: your Magic EOA is delegated in-place to the Universal Account, then Particle attempts settlement on the invoice's chain. Cross-chain sourcing remains experimental during Particle's V2 migration.";
  }
  return "Fallback mode: Particle sends USDC on Base, then backend verifies the Transfer and records proof.";
}

function getModeProofText() {
  if (PAYMENT_MODE === "universal_invoice") {
    return "Future strict path: ReceiptEmitter receives payInvoice directly in the same universal transaction.";
  }
  if (PAYMENT_MODE === "universal_7702_transfer") {
    return "EIP-7702 path: the EOA acts as the Universal Account; after USDC settles, the backend verifies the Transfer and records an InvoicePaid proof.";
  }
  return "Current working path: the merchant receives USDC first, then the backend writes an InvoicePaid proof after verification.";
}

function getErrorMessage(error: any) {
  return error?.message || error?.response?.data?.message || String(error);
}

function isParticleMaintenanceError(error: any) {
  const message = JSON.stringify({
    message: error?.message,
    response: error?.response?.data,
    code: error?.code,
  }).toLowerCase();
  return message.includes("-32801") || message.includes("maintanence") || message.includes("maintenance");
}

function getCreateTransactionError(error: any) {
  const message = getErrorMessage(error);
  if (PAYMENT_MODE === "universal_invoice" && isParticleMaintenanceError(error)) {
    return [
      "Universal invoice mode is selected, but Particle custom universal transactions are currently blocked for this project.",
      `Exact Particle error: ${message}`,
      "No transfer_fallback was attempted automatically. Switch NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback to use the stable path.",
    ].join(" ");
  }
  if (IS_7702 && isParticleMaintenanceError(error)) {
    return [
      "The network returned a temporary maintenance error while building this transaction (Particle -32801).",
      `Exact Particle error: ${message}`,
      "This is a transient provider issue, not a problem with your payment — please try again in a moment.",
    ].join(" ");
  }
  return `Transaction creation failed: ${message}`;
}

export default function PayPage({ params }: { params: { id: string } }) {
  const [step, setStep] = useState<Step>("loading");
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [magic, setMagic] = useState<any>(null);
  const [ua, setUa] = useState<any>(null);
  const [balances, setBalances] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [txResult, setTxResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTx, setIsCreatingTx] = useState(false);
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [payPhase, setPayPhase] = useState<string | null>(null);

  function log(action: string, result: string, data?: any) {
    setLogs((prev) => [...prev, { ts: new Date().toISOString(), action, result, data }]);
  }

  // 1. Fetch payment link
  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/payment-links/${params.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPaymentLink(data.link);
        log("fetchPaymentLink", "ok", { id: params.id });
        if (data.link.status === "completed" && data.link.paid_tx_hash) {
          const settlementChain = getPaymentChainById(data.link.destination_chain_id);
          const proofChain = getProofChain();
          setTxResult({
            txHash: data.link.paid_tx_hash,
            paymentExplorer: getExplorerTxUrl(settlementChain, data.link.paid_tx_hash),
            proofTxHash: data.link.latest_payment?.receipt_tx_hash ?? null,
            proofExplorer: data.link.latest_payment?.receipt_tx_hash
              ? getExplorerTxUrl(proofChain, data.link.latest_payment.receipt_tx_hash)
              : null,
            verification: { deduped: true, link: data.link },
          });
          setStep("success");
        } else {
          setStep("login");
        }
      } catch (e: any) {
        log("fetchPaymentLink", "error", { message: e.message });
        setError(`Payment link not found: ${e.message}`);
        setStep("error");
      }
    }
    fetchLink();
  }, [params.id]);

  // 2. Init Magic
  useEffect(() => {
    if (typeof window === "undefined") return;
    loadSDKs().then(() => {
      const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!;
      // EIP-7702 needs Magic's EVM extension (sign7702Authorization / send7702Transaction
      // and evm.switchChain). Configure all settlement chains so cross-chain settlement can
      // sign inline 7702 auths on whichever chain the SDK routes through (incl. Optimism,
      // the zero-balance cross-chain target).
      const m = IS_7702
        ? new Magic(key, {
            extensions: [
              new EVMExtension([
                { rpcUrl: getPublicRpcUrl(BASE_CHAIN), chainId: BASE_CHAIN.chainId, default: true },
                { rpcUrl: getPublicRpcUrl(ARBITRUM_CHAIN), chainId: ARBITRUM_CHAIN.chainId },
                { rpcUrl: getPublicRpcUrl(OPTIMISM_CHAIN), chainId: OPTIMISM_CHAIN.chainId },
              ]),
              new OAuthExtension(),
            ],
          })
        : new Magic(key, { extensions: [new OAuthExtension()] });
      setMagic(m);
      log("initMagic", "ok", { mode: PAYMENT_MODE, eip7702: IS_7702, key: key?.slice(0, 10) + "..." });
    });
  }, []);

  // After Magic loads, surface an existing session (set by an email login or by
  // the OAuth round-trip via /auth/callback) so the page does not show the login
  // form to a user who is already authenticated. Mirrors the same pattern in
  // /firewall/page.tsx.
  const completePostAuth = useCallback(async (magicInstance: any) => {
    await loadSDKs();
    const userAddress = await resolveMagicEoa(magicInstance);
    if (!userAddress) throw new Error("No public address from Magic");

    setAddress(userAddress);
    log("magicLogin", "got address", { address: userAddress });

    // 4. Init Particle UA. In EIP-7702 mode the EOA itself becomes the Universal Account.
    const particleCreds = {
      projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
      projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
      projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
    };
    const universalAccount = IS_7702
      ? new UniversalAccount({
          ...particleCreds,
          smartAccountOptions: {
            useEIP7702: true,
            name: "UNIVERSAL",
            version: UNIVERSAL_ACCOUNT_VERSION,
            ownerAddress: userAddress,
          },
          // Matches Particle's official Magic 7702 demo. universalGas:true was tested for
          // cross-chain settlement gas but it stripped the inline 7702 auth and failed
          // simulation (-32613), so we keep the proven false path.
          tradeConfig: { slippageBps: 100, universalGas: false },
        })
      : new UniversalAccount({ ...particleCreds, ownerAddress: userAddress });
    setUa(universalAccount);
    log("initParticleUA", "ok", { mode: PAYMENT_MODE, eip7702: IS_7702, ownerAddress: userAddress });

    // 5. Fetch balances
    setStep("balances");
    try {
      const assets = await universalAccount.getPrimaryAssets();
      setBalances(assets);
      log("getPrimaryAssets", "ok", { assets });
      setStep("preview");
    } catch (e: any) {
      log("getPrimaryAssets", "error", { message: e.message, stack: e.stack });
      setBalances({ error: e.message });
      setStep("preview"); // proceed anyway to show preview
    }
  }, []);

  // Auto-restore an existing Magic session (from email login persisted across reload,
  // or from the Google OAuth round-trip on /auth/callback). Without this, a logged-in
  // user lands on the email form again because nothing else triggers post-auth init.
  useEffect(() => {
    if (!magic) return;
    let cancelled = false;
    (async () => {
      try {
        const isLoggedIn = await magic.user.isLoggedIn();
        if (cancelled || !isLoggedIn) return;
        log("autoLogin", "restoring Magic session", {});
        await completePostAuth(magic);
      } catch (e: any) {
        // No active session — render the login UI normally.
        log("autoLogin", "no active session", { message: e?.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [magic, completePostAuth]);

  // 3. Login with Magic
  const handleLogin = useCallback(async (email: string) => {
    if (!magic) return;
    await loadSDKs();
    try {
      log("magicLogin", "starting", { email });
      const didToken = await magic.auth.loginWithMagicLink({ email });
      log("magicLogin", "authenticated", { didToken: didToken?.slice(0, 20) + "..." });
      await completePostAuth(magic);
    } catch (e: any) {
      log("magicLogin", "error", { message: e.message });
      setError(e.message);
      setStep("error");
    }
  }, [magic, completePostAuth]);

  // 6. Create transaction preview
  const handleCreateTransaction = useCallback(async () => {
    if (!ua || !paymentLink || !address || isCreatingTx) return;
    setIsCreatingTx(true);
    setError(null);
    try {
      const settlementChain = getPaymentChainById(paymentLink.destination_chain_id);
      const token = resolvePaymentToken(paymentLink.token, paymentLink.destination_chain_id);
      if (token.symbol !== "USDC") {
        throw new Error("Active prototype supports USDC invoices only");
      }
      if (!paymentLink.contract_invoice_id || !paymentLink.registered_tx_hash) {
        throw new Error("Invoice is not registered on-chain yet. Missing contract_invoice_id or registered_tx_hash.");
      }
      const receiptEmitterAddress = paymentLink.receipt_emitter_address ?? ACTIVE_CHAIN.receiptEmitterAddress;
      if (!receiptEmitterAddress) throw new Error(`${ACTIVE_CHAIN.name} ReceiptEmitter address is not configured`);
      const particleAmount = formatAtomicTokenAmount(paymentLink.amount, token);

      log("createTransaction", "starting", {
        mode: PAYMENT_MODE,
        settlementChainId: settlementChain.chainId,
        merchant: paymentLink.merchant_address,
        contractInvoiceId: paymentLink.contract_invoice_id,
        receiptEmitter: receiptEmitterAddress,
        amountAtomic: paymentLink.amount,
        amountForParticle: particleAmount,
        token: token.address,
      });

      let tx: any;
      if (PAYMENT_MODE === "universal_invoice") {
        const rawAmount = BigInt(paymentLink.amount);
        const approveCall = {
          to: token.address,
          data: encodeFunctionData({
            abi: ERC20_APPROVE_ABI,
            functionName: "approve",
            args: [receiptEmitterAddress as Address, rawAmount],
          }),
          value: "0",
        };
        const payInvoiceCall = {
          to: receiptEmitterAddress,
          data: encodeFunctionData({
            abi: RECEIPT_EMITTER_ABI,
            functionName: "payInvoice",
            args: [paymentLink.contract_invoice_id as `0x${string}`],
          }),
          value: "0",
        };
        const txPayload = {
          chainId: ACTIVE_CHAIN.chainId,
          expectTokens: [
            {
              type: SUPPORTED_TOKEN_TYPE.USDC,
              amount: particleAmount,
            },
          ],
          transactions: [approveCall, payInvoiceCall],
        };
        log("createUniversalTransaction", "attempting", txPayload);
        tx = await ua.createUniversalTransaction(txPayload);
        log("createUniversalTransaction", "ok", tx);
      } else if (IS_7702) {
        // Cross-chain-capable product path (ledger C21 recipe). Builds the merchant USDC.transfer
        // via createUniversalTransaction so Particle sources the shortfall cross-chain when the
        // payer lacks USDC on the settlement chain; usePrimaryTokens:[USDC] forces the USDC route.
        // Then pre-delegate EVERY chain the routed userOps touch (source + settlement) to the V2
        // delegate — the stale V1 delegate triggers AA24 otherwise — and rebuild fresh so the
        // userOps come back already-delegated (no inline auth, no AA24).
        log("createUniversalTransaction(7702)", "attempting", {
          settlementChainId: settlementChain.chainId,
          merchant: paymentLink.merchant_address,
          amount: particleAmount,
        });
        tx = await build7702Transaction(ua, paymentLink, token);
        const touchedChains = Array.from(
          new Set((tx.userOps ?? []).map((op: any) => op.chainId).filter((c: any) => typeof c === "number"))
        ) as number[];
        log("createUniversalTransaction(7702)", "routed", { transactionId: tx.transactionId, touchedChains });
        for (const chainId of touchedChains) {
          await delegateChain7702(magic, ua, address, chainId, log);
        }
        tx = await build7702Transaction(ua, paymentLink, token);
        log("createUniversalTransaction(7702)", "ok", { transactionId: tx.transactionId });
      } else {
        const txPayload = {
          token: {
            chainId: settlementChain.chainId,
            address: (paymentLink.destination_token_address as Address | null) ?? token.address,
          },
          amount: particleAmount,
          receiver: paymentLink.merchant_address,
        };
        log("createTransferTransaction", "attempting", txPayload);
        tx = await ua.createTransferTransaction(txPayload);
        log("createTransferTransaction", "ok", tx);
      }

      const userOps = summarizeUserOps(tx);
      log("inspectUserOps", "ok", {
        transactionId: tx.transactionId,
        rootHash: tx.rootHash,
        userOps,
      });
      if (!IS_7702 && hasBlockingEip7702Auth(userOps)) {
        throw new Error(
          "EIP-7702 authorization is required. Set NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer to delegate the EOA in-place and sign the authorization, instead of this non-7702 path."
        );
      }
      setTransaction(tx);
      setError(null);

      try {
        const attemptRes = await fetch(`/api/payments/${paymentLink.id}/attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payerAddress: address,
            previewJson: tx,
          }),
        });
        const attemptData = await attemptRes.json();
        if (!attemptRes.ok) throw new Error(attemptData.error || "Payment attempt record failed");
        log("recordPaymentAttempt", "ok", { id: attemptData.paymentAttempt?.id });
      } catch (attemptErr: any) {
        log("recordPaymentAttempt", "error", { message: attemptErr.message });
      }
      return tx;
    } catch (e: any) {
      log("createTransaction", "error", {
        message: e.message,
        response: e.response?.data,
        code: e.code,
        mode: PAYMENT_MODE,
        stage: PAYMENT_MODE === "universal_invoice" ? "createUniversalTransaction" : "createTransferTransaction",
        particleMaintenance: isParticleMaintenanceError(e),
      });
      setError(getCreateTransactionError(e));
    } finally {
      setIsCreatingTx(false);
    }
  }, [ua, paymentLink, address, isCreatingTx, magic]);

  // EIP-7702: pre-delegate the EOA on the active chain (split from the payment tx to
  // avoid the AA24 error seen when delegation + transaction are combined in one step).
  const ensureDelegated7702 = useCallback(async () => {
    if (!ua || !magic || !address) throw new Error("Universal Account or wallet not ready");
    await delegateChain7702(magic, ua, address, ACTIVE_CHAIN.chainId, log);
  }, [ua, magic, address]);

  // EIP-7702: pre-delegate, sign any inline authorizations the SDK still needs, sign the
  // rootHash, then broadcast through the Universal Account SDK with the authorizations.
  const sendVia7702 = useCallback(async (tx: any) => {
    if (!ua || !magic || !address) throw new Error("Universal Account or wallet not ready");
    const { BrowserProvider, getBytes, Signature } = await loadEthers();

    await ensureDelegated7702();
    setPayPhase("Step 2/2: signing and settling the payment...");

    const authorizations: Array<{ userOpHash: string; signature: string }> = [];
    const nonceMap = new Map<string, string>();
    for (const op of tx.userOps ?? []) {
      if (op.eip7702Auth && !op.eip7702Delegated) {
        // Particle issues cross-chain legs with a chain-agnostic authorization (chainId 0)
        // and bundles the authorization tuple using THAT chainId. We must sign over the same
        // chainId, otherwise the recovered authority won't match and the bundler rejects the
        // op with AA24 (signature error) — which is exactly what substituting op.chainId did.
        const authChainId = op.eip7702Auth.chainId ?? op.chainId;
        const cacheKey = `${authChainId}:${op.eip7702Auth.nonce}`;
        let serialized = nonceMap.get(cacheKey);
        if (!serialized) {
          let a: any;
          try {
            a = await magic.wallet.sign7702Authorization({
              contractAddress: op.eip7702Auth.address,
              chainId: authChainId,
              nonce: op.eip7702Auth.nonce,
            });
            log("sign7702Auth", "signed", { authChainId, leg: op.chainId, nonce: op.eip7702Auth.nonce });
          } catch (signErr: any) {
            // Some Magic builds reject the chain-agnostic chainId 0. Fall back to the leg's
            // concrete chainId so we at least produce a chain-specific authorization.
            log("sign7702Auth", "chainId0 rejected; retrying with leg chainId", {
              authChainId,
              leg: op.chainId,
              error: signErr?.message,
            });
            a = await magic.wallet.sign7702Authorization({
              contractAddress: op.eip7702Auth.address,
              chainId: op.chainId,
              nonce: op.eip7702Auth.nonce,
            });
          }
          serialized = Signature.from({ r: a.r, s: a.s, v: a.v }).serialized;
          nonceMap.set(cacheKey, serialized);
        }
        authorizations.push({ userOpHash: op.userOpHash, signature: serialized });
      }
    }
    log("sign7702Authorizations", "ok", { count: authorizations.length });

    // Particle expects an EIP-191 signature of transaction.rootHash.
    const provider = new BrowserProvider(magic.rpcProvider);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(getBytes(tx.rootHash));
    log("signRootHash", "ok", { rootHash: tx.rootHash, signature: signature.slice(0, 20) + "..." });

    return ua.sendTransaction(tx, signature, authorizations.length ? authorizations : undefined);
  }, [ua, magic, address, ensureDelegated7702]);

  // 7. Send transaction
  const handlePay = useCallback(async (txArg?: any) => {
    const tx = txArg ?? transaction;
    if (!ua || !tx || !magic) return;
    if (!tx.rootHash) {
      setError("Payment failed: transaction preview is missing rootHash. Please recreate the preview.");
      setStep("error");
      return;
    }

    setStep("paying");
    setPayPhase(IS_7702 ? "Preparing EIP-7702 payment..." : null);
    try {
      log("sendTransaction", "starting", {
        transactionId: tx.transactionId,
        rootHash: tx.rootHash,
      });

      let result: any;
      if (IS_7702) {
        result = await sendVia7702(tx);
      } else {
        // Sign with Magic provider (cast to any for protected method access)
        const provider = magic.rpcProvider as any;
        const from = address!;

        // Particle expects an EIP-191 signature of transaction.rootHash.
        const signature = await provider.request({
          method: "personal_sign",
          params: [tx.rootHash, from],
        }) as string;

        log("signRootHash", "ok", {
          rootHash: tx.rootHash,
          signature: signature.slice(0, 20) + "...",
        });

        result = await ua.sendTransaction(tx, signature);
      }
      log("sendTransaction", "ok", result);

      if (paymentLink && address) {
        const settlementChain = getPaymentChainById(paymentLink.destination_chain_id);
        const proofChain = getProofChain();

        const isCrossChainSettlement = settlementChain.chainId !== proofChain.chainId;

        // Resolve the merchant-delivery tx hash. Prefer the settlement phase (true cross-chain
        // delivery lives there). Otherwise trust the settlement-chain hash only once the UA tx
        // is FINISHED — same-chain transfers (Arbitrum/Base) put the transfer in a non-
        // "settlement" userOp, and gating on FINISHED avoids grabbing an intermediate
        // deposit/lending leg of an in-flight cross-chain op.
        const UA_FINISHED = 7;
        let txHash: string | null = getSettlementOpHash(result, settlementChain.chainId);

        // Particle settles asynchronously, so the settlement hash is usually absent from the
        // immediate result. Poll getTransaction, and fail fast (clear message) if the
        // transaction reaches a terminal failure/refund state without settling.
        if (!txHash && tx.transactionId) {
          setPayPhase(
            isCrossChainSettlement
              ? "Waiting for cross-chain settlement on " + settlementChain.name + "..."
              : "Waiting for on-chain settlement..."
          );
          for (let attempt = 0; attempt < 20 && !txHash; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const status = await ua.getTransaction(tx.transactionId);
            const statusCode = Number(status?.status);
            txHash =
              getSettlementOpHash(status, settlementChain.chainId) ??
              (statusCode === UA_FINISHED
                ? extractSettlementTxHash(status, settlementChain.chainId) ?? extractEvmTxHash(status)
                : null);
            log(
              "getParticleTransaction",
              txHash ? `settled (attempt ${attempt})` : `status ${statusCode} (attempt ${attempt})`,
              { status: statusCode, settlementOps: (status?.settlementUserOperations ?? []).length }
            );
            if (!txHash && statusCode in UA_FAILED_STATUS) {
              throw new Error(
                `Particle did not complete the ${settlementChain.name} settlement (status ${statusCode} = ${UA_FAILED_STATUS[statusCode]}). No USDC reached the merchant and your principal was not moved — only the small routing fee was taken. This is a Particle Universal Accounts V2 migration limitation, not a OneLink Pay error.`
              );
            }
          }
        }
        if (!txHash) {
          throw new Error(
            `Particle has not surfaced a ${settlementChain.name} settlement tx hash yet. The transfer may still be processing. If USDC already left your wallet, do NOT retry — verify with the Particle transactionId instead.`
          );
        }

        const uaTransactionId = tx.transactionId ?? result?.transactionId ?? null;
        const markPaidRes = await fetch(`/api/payments/${paymentLink.id}/mark-paid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payerAddress: address,
            txHash,
            uaTransactionId,
            sourceChainIds: Array.isArray(result?.tokenChanges?.fromChains)
              ? result.tokenChanges.fromChains
              : [],
          }),
        });
        const markPaidData = await markPaidRes.json();
        if (!markPaidRes.ok) throw new Error(markPaidData.error || "InvoicePaid verification failed");
        log("markPaid", "ok", markPaidData);
        setTxResult({
          particle: result,
          txHash,
          paymentExplorer: getExplorerTxUrl(settlementChain, txHash),
          proofTxHash: markPaidData.proofTxHash ?? markPaidData.payment?.receipt_tx_hash ?? null,
          proofExplorer: markPaidData.proofTxHash
            ? getExplorerTxUrl(proofChain, markPaidData.proofTxHash)
            : null,
          uaTransactionId,
          uaActivityUrl: getUniversalXActivityUrl(uaTransactionId),
          verification: markPaidData,
        });
      }

      setPayPhase(null);
      setStep("success");
    } catch (e: any) {
      log("sendTransaction", "error", {
        message: e.message,
        response: e.response?.data,
        code: e.code,
        stack: e.stack,
      });
      const retryHint = e.message?.includes("No records found")
        ? " The transaction preview may have expired. Retry and create a fresh preview."
        : "";
      setError(`Payment failed: ${e.message}${retryHint}`);
      setPayPhase(null);
      setStep("error");
    }
  }, [ua, transaction, magic, address, paymentLink, sendVia7702]);

  // One-tap orchestrator (Spec one-tap-checkout): from a single "Pay" tap after the Trust Preview,
  // build + pre-delegate (blind plumbing) then sign + send + mark-paid. Reuses the proven handlers;
  // the Trust Preview stays the single explicit consent. Flag-gated by ONE_TAP_CHECKOUT.
  const handlePayOneTap = useCallback(async () => {
    if (!ua || !paymentLink || !address) return;
    setError(null);
    setStep("paying");
    setPayPhase("Preparing your payment…");
    const built = await handleCreateTransaction();
    if (!built) {
      // build / pre-delegation failed — error already surfaced by handleCreateTransaction; no funds moved.
      setStep("error");
      return;
    }
    await handlePay(built);
  }, [ua, paymentLink, address, handleCreateTransaction, handlePay]);

  return (
    <main className="op-shell px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-5 flex items-center justify-between">
          <Wordmark href="/" />
          <div className="flex items-center gap-2">
            <span className="op-chip">
              <IconLock className="h-3.5 w-3.5" /> Secure checkout
            </span>
            {address ? <SignOutButton magic={magic} /> : null}
          </div>
        </header>

        <div className="op-card op-animate-rise p-6 sm:p-7">
          <CheckoutBadges paymentLink={paymentLink} />

          {/* STEP: Loading */}
          {step === "loading" && <LoadingState title="Loading invoice" detail="Fetching payment link details." />}

          {/* STEP: Login */}
          {step === "login" && paymentLink && (
            <LoginForm paymentLink={paymentLink} onLogin={handleLogin} magic={magic} returnTo={`/pay/${params.id}`} />
          )}

          {/* STEP: Balances loading */}
          {step === "balances" && (
            <LoadingState title="Checking balance" detail="Reading Particle Universal Account assets." />
          )}

          {/* STEP: Preview */}
          {step === "preview" && paymentLink && (
            <PreviewStep
              paymentLink={paymentLink}
              address={address}
              balances={balances}
              transaction={transaction}
              error={error}
              isCreatingTx={isCreatingTx}
              onCreateTx={handleCreateTransaction}
              onPay={handlePay}
              oneTap={ONE_TAP_CHECKOUT}
              onPayOneTap={handlePayOneTap}
            />
          )}

          {/* STEP: Paying */}
          {step === "paying" && (
            IS_7702 && paymentLink ? (
              <div className="space-y-4">
                <CrossChainRoute
                  status="routing"
                  toName={getSettlementChainForLink(paymentLink).name}
                  amountLabel={getPaymentAmountLabel(paymentLink)}
                  phaseLabel={payPhase}
                />
                <LoadingState
                  title="Processing payment"
                  detail={payPhase ?? "Signing and settling through your Universal Account."}
                />
              </div>
            ) : (
              <LoadingState title="Processing payment" detail={payPhase ?? "Waiting for Particle transaction and server-side proof verification."} />
            )
          )}

          {/* STEP: Success */}
          {step === "success" && (
            <SuccessState paymentLink={paymentLink} txResult={txResult} />
          )}

          {/* STEP: Error */}
          {step === "error" && (
            <ErrorState message={error} onRetry={() => { setError(null); setStep(paymentLink ? "login" : "loading"); }} />
          )}
        </div>

        {/* Developer logs */}
        <div className="mt-4">
          <Disclosure summary={`Developer logs (${logs.length})`}>
            <div className="max-h-96 space-y-2 overflow-auto">
              {logs.length === 0 ? (
                <p className="text-xs text-faint">No events yet.</p>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="border-b border-line pb-1 font-mono text-xs">
                    <span className="text-faint">{l.ts.split("T")[1]?.slice(0, 8)}</span>{" "}
                    <span className="font-bold text-ink2">{l.action}</span>{" "}
                    <span className={l.result === "error" ? "text-danger" : "text-verify"}>
                      [{l.result}]
                    </span>
                    {l.data && (
                      <pre className="mt-0.5 whitespace-pre-wrap break-all text-muted">
                        {JSON.stringify(l.data, null, 2).slice(0, 500)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </Disclosure>
        </div>
      </div>
    </main>
  );
}

// --- Sub-components ---

function CheckoutBadges({ paymentLink }: { paymentLink: PaymentLink | null }) {
  const settlementChain = getSettlementChainForLink(paymentLink);
  return (
    <div className="mb-5 flex flex-wrap gap-2" title={getModeHelpText()}>
      <span className="op-chip-iris">
        <IconShield className="h-3.5 w-3.5" /> {PAYMENT_MODE_LABEL}
      </span>
      <Chip>{settlementChain.name}</Chip>
    </div>
  );
}

function LoadingState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="op-card-quiet flex items-start gap-3 p-4">
      <span className="relative mt-1 flex h-3 w-3" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/50" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{detail}</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4">
      <p className="font-semibold text-danger">Checkout error</p>
      <p className="mt-1 text-sm text-danger/90">{message || "Something went wrong."}</p>
      <button onClick={onRetry} className="op-btn-secondary mt-4">
        Try again
      </button>
    </div>
  );
}

function PaymentSummary({
  paymentLink,
  address,
}: {
  paymentLink: PaymentLink;
  address?: string | null;
}) {
  const settlementChain = getSettlementChainForLink(paymentLink);
  const proofChain = getProofChain();
  const isCrossChain = settlementChain.chainId !== proofChain.chainId;
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-paper">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="op-eyebrow">Trust Preview</span>
        <span className="op-chip-gold">
          <IconShield className="h-3.5 w-3.5" /> Consent
        </span>
      </div>

      <div className="px-5 pt-4">
        <div className="rounded-2xl bg-paper2 p-5 text-center">
          <p className="text-xs text-muted">You pay</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink tnum">
            {getPaymentAmountLabel(paymentLink)}
          </p>
        </div>
      </div>

      <dl className="divide-y divide-line px-5">
        <Field
          label="Merchant receives"
          value={`${getPaymentAmountLabel(paymentLink)} on ${settlementChain.name}`}
        />
        <Field label="Active chain" value={settlementChain.name} />
        {isCrossChain ? (
          <Field label="Proof anchored on" value={proofChain.name} />
        ) : null}
        <Field label="Payment mode" value={PAYMENT_MODE_LABEL} />
        <Field label="Merchant" value={shortAddress(paymentLink.merchant_address)} mono />
        {address ? <Field label="Your wallet" value={shortAddress(address)} mono /> : null}
      </dl>

      <div className="m-5 mt-3 rounded-2xl border border-line bg-paper2 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Dot tone="gold" /> Proof behavior
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{getModeProofText()}</p>
        {isCrossChain ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Cross-chain candidate: you hold no USDC on {settlementChain.name}. Particle&apos;s
            Universal Liquidity attempts to source from your balances on other chains and settle
            on {settlementChain.name}. If settlement completes, the InvoicePaid proof is anchored
            on {proofChain.name}.
          </p>
        ) : null}
        <p className="mt-2 text-xs font-medium">
          <span className={paymentLink.registered_tx_hash ? "text-verify" : "text-muted"}>
            {paymentLink.registered_tx_hash
              ? "Invoice registered on-chain"
              : "Invoice not yet registered on-chain"}
          </span>
        </p>
      </div>
    </section>
  );
}

function SuccessState({
  paymentLink,
  txResult,
}: {
  paymentLink: PaymentLink | null;
  txResult: any;
}) {
  if (!paymentLink || !txResult?.txHash) {
    return (
      <div className="py-2 text-center">
        <VerifiedSeal animate />
        <p className="mt-4 font-display text-2xl font-semibold text-ink">Payment verified</p>
        <p className="mt-1 text-sm text-muted">
          USDC transfer verified and an InvoicePaid proof was recorded on-chain.
        </p>
      </div>
    );
  }

  const settlementChain = getSettlementChainForLink(paymentLink);
  const proofChain = getProofChain();
  const isCrossChain = settlementChain.chainId !== proofChain.chainId;

  // Cross-chain funding story: the chains the UA SOURCED USDC from (tokenChanges.fromChains),
  // minus the settlement chain itself. If any remain, the payment was funded cross-chain.
  const fundingFromIds: number[] = Array.isArray(txResult.particle?.tokenChanges?.fromChains)
    ? txResult.particle.tokenChanges.fromChains
    : [];
  const crossFromIds = fundingFromIds.filter((c: number) => c !== settlementChain.chainId);
  const crossChain = crossFromIds.length
    ? {
        fromNames: crossFromIds.map((id: number) => {
          try {
            return getPaymentChainById(id).name;
          } catch {
            return `Chain ${id}`;
          }
        }),
        toName: settlementChain.name,
      }
    : null;

  return (
    <div className="py-1">
      <ProofReceiptCard
        amountLabel={getPaymentAmountLabel(paymentLink)}
        merchant={paymentLink.merchant_address}
        invoiceId={paymentLink.contract_invoice_id}
        mode={PAYMENT_MODE_LABEL}
        settlementChainName={settlementChain.name}
        proofChainName={proofChain.name}
        isCrossChain={isCrossChain}
        payment={{ hash: txResult.txHash, href: txResult.paymentExplorer }}
        proof={{ hash: txResult.proofTxHash ?? null, href: txResult.proofExplorer ?? null }}
        universalActivity={{
          id: txResult.uaTransactionId ?? null,
          href: txResult.uaActivityUrl ?? null,
        }}
        crossChain={crossChain}
      />
      <div className="mt-4 flex justify-center">
        <a
          href={`/receipt/${paymentLink.id}`}
          target="_blank"
          rel="noreferrer"
          className="op-btn-ghost"
        >
          View shareable receipt
          <IconArrowUpRight className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-4">
        <Disclosure summary="Raw payment result">
          <pre className="max-h-72 overflow-auto text-left text-xs text-muted">
            {JSON.stringify(txResult, null, 2)}
          </pre>
        </Disclosure>
      </div>
    </div>
  );
}

function LoginForm({ paymentLink, onLogin, magic, returnTo }: { paymentLink: PaymentLink; onLogin: (email: string) => void; magic: any | null; returnTo: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      <PaymentSummary paymentLink={paymentLink} />
      {paymentLink.label ? <p className="px-1 text-sm text-muted">{paymentLink.label}</p> : null}

      <div className="space-y-4 rounded-2xl border border-line bg-paper2 p-4">
        <LoginWithGoogleButton magic={magic} returnTo={returnTo} variant="primary" />
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
          <span className="h-px flex-1 bg-line" />
          <span>or with email</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div>
          <label htmlFor="op-email" className="mb-1 block text-sm font-medium text-ink">
            Email to sign in
          </label>
          <input
            id="op-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="op-input"
            placeholder="you@example.com"
          />
        </div>
        <button
          onClick={() => { setLoading(true); onLogin(email); }}
          disabled={!email || loading}
          className="op-btn-secondary w-full"
        >
          {loading ? "Signing in…" : "Sign in with Magic"}
        </button>
        <MagicLoginReassurance />
        <p className="text-xs leading-relaxed text-muted">
          You&rsquo;ll see the exact payment to approve before anything is sent.
        </p>
      </div>
    </div>
  );
}

// Map a chain id to a display name, with a safe fallback for unknown chains.
function chainNameForId(chainId: number): string {
  try {
    return getPaymentChainById(chainId).name;
  } catch {
    return `Chain ${chainId}`;
  }
}

// Derive the planned cross-chain route from a built Particle transaction (pre-signature) using the
// real tokenChanges.fromChains -> toChains. Returns null for same-chain payments (no leg to show).
function getPreviewRoute(
  transaction: any,
  settlementChainId: number
): { fromNames: string[]; toName: string } | null {
  const fromChains = transaction?.tokenChanges?.fromChains;
  const toChains = transaction?.tokenChanges?.toChains;
  const fromIds: number[] = Array.isArray(fromChains) ? fromChains : [];
  const settleId: number = (Array.isArray(toChains) && typeof toChains[0] === "number" ? toChains[0] : settlementChainId);
  const sources = Array.from(new Set(fromIds)).filter((c) => typeof c === "number" && c !== settleId);
  if (sources.length === 0) return null;
  return { fromNames: sources.map(chainNameForId), toName: chainNameForId(settleId) };
}

// Particle deducts the routing/gas fee in USDC (its primary token). Surface it honestly for the
// preview; returns null if the quote is missing/unparseable. amountInUSD is scaled to 18 decimals.
function getUsdcFeeLabel(transaction: any): string | null {
  try {
    const fees = transaction?.feeQuotes?.[0]?.fees;
    const totalHex = fees?.totals?.feeTokenAmountInUSD;
    const symbol = fees?.feeTokens?.[0]?.token?.symbol;
    if (typeof totalHex !== "string" || !totalHex.startsWith("0x")) return null;
    const usd = Number(BigInt(totalHex) / 10n ** 12n) / 1e6;
    if (!Number.isFinite(usd) || usd <= 0) return null;
    const sym = typeof symbol === "string" ? symbol : "USDC";
    return `~$${usd < 0.01 ? usd.toFixed(4) : usd.toFixed(2)} ${sym}`;
  } catch {
    return null;
  }
}

function PreviewStep({
  paymentLink,
  address,
  balances,
  transaction,
  error,
  isCreatingTx,
  onCreateTx,
  onPay,
  oneTap,
  onPayOneTap,
}: {
  paymentLink: PaymentLink;
  address: string | null;
  balances: any;
  transaction: any;
  error: string | null;
  isCreatingTx: boolean;
  onCreateTx: () => void;
  onPay: () => void;
  oneTap: boolean;
  onPayOneTap: () => void;
}) {
  const settlementChainIds = transaction ? getSettlementChainIds(transaction) : [];
  const settlementChain = getSettlementChainForLink(paymentLink);
  const previewToken = resolvePaymentToken(paymentLink.token, paymentLink.destination_chain_id);
  const previewTokenAddress =
    (paymentLink.destination_token_address as Address | null) ?? previewToken.address;
  const previewRoute = transaction ? getPreviewRoute(transaction, settlementChain.chainId) : null;
  const feeLabel = transaction ? getUsdcFeeLabel(transaction) : null;
  return (
    <div className="space-y-4">
      <PaymentSummary paymentLink={paymentLink} address={address} />

      <PermissionFirewall
        merchantAddress={paymentLink.merchant_address}
        tokenAddress={previewTokenAddress}
        chainId={paymentLink.destination_chain_id}
        amountAtomic={paymentLink.amount}
        symbol={previewToken.symbol}
        decimals={previewToken.decimals}
        payerAddress={address}
        conceptMode
      />

      {/* Balances */}
      <div className="rounded-2xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Your balance</p>
          {balances?.error ? (
            <span className="text-xs font-medium text-danger">Unavailable</span>
          ) : balances ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-verify">
              <IconCheck className="h-3.5 w-3.5" /> Loaded
            </span>
          ) : (
            <span className="text-xs text-faint">No data</span>
          )}
        </div>
        {balances?.error ? (
          <p className="mt-1 text-xs text-danger">{balances.error}</p>
        ) : balances ? (
          <div className="mt-3">
            <Disclosure summary="Show balance details">
              <pre className="max-h-40 overflow-auto text-xs text-muted">
                {JSON.stringify(balances, null, 2)}
              </pre>
            </Disclosure>
          </div>
        ) : null}
      </div>

      {/* Transaction preview */}
      {transaction ? (
        <div className="rounded-2xl border border-gold/30 bg-gold-soft/40 p-4">
          <p className="op-eyebrow text-gold">Settlement preview</p>
          {previewRoute ? (
            <div className="mt-3">
              <CrossChainRoute
                status="preview"
                fromNames={previewRoute.fromNames}
                toName={previewRoute.toName}
                amountLabel={getPaymentAmountLabel(paymentLink)}
                feeLabel={feeLabel}
              />
            </div>
          ) : null}
          <ul className="mt-2 space-y-1.5 text-sm text-ink2">
            <li className="flex gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              You pay {getPaymentAmountLabel(paymentLink)} from your Particle Universal Account.
            </li>
            <li className="flex gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {PAYMENT_MODE === "universal_invoice"
                ? "Particle builds approve + payInvoice as a universal transaction."
                : `Merchant receives USDC on ${settlementChain.name} through your Universal Account.`}
            </li>
            <li className="flex gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {PAYMENT_MODE === "universal_invoice"
                ? "ReceiptEmitter handles the invoice payment directly."
                : "Backend verifies the USDC Transfer and records an InvoicePaid proof."}
            </li>
            {IS_7702 ? (
              <li className="flex gap-2">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                Your first payment includes a one-time EIP-7702 delegation of this wallet (same
                address, reversible).
              </li>
            ) : null}
          </ul>
          <div className="mt-3">
            <Disclosure summary="Raw Particle transaction">
              <p className="mb-2 text-xs text-muted">
                Settlement chain IDs: {settlementChainIds.join(", ") || ACTIVE_CHAIN.chainId}
              </p>
              <pre className="max-h-40 overflow-auto text-xs text-muted">
                {JSON.stringify(transaction, null, 2)}
              </pre>
            </Disclosure>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4">
          <p className="text-sm font-semibold text-danger">Transaction preview failed</p>
          <p className="mt-1 text-xs text-danger/90">{error}</p>
        </div>
      ) : null}

      {/* Actions */}
      {oneTap ? (
        <button onClick={onPayOneTap} disabled={isCreatingTx} className="op-btn-primary w-full">
          {isCreatingTx ? "Processing…" : `Pay ${getPaymentAmountLabel(paymentLink)}`}
        </button>
      ) : !transaction ? (
        <button onClick={onCreateTx} disabled={isCreatingTx} className="op-btn-primary w-full">
          {isCreatingTx ? "Building preview…" : "Build payment preview"}
        </button>
      ) : (
        <button onClick={onPay} className="op-btn-primary w-full">
          Confirm &amp; pay
        </button>
      )}
    </div>
  );
}
