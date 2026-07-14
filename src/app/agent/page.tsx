"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, formatUnits, http, type Address, type Hex } from "viem";
import {
  ARBITRUM_CHAIN,
  BASE_CHAIN,
  getExplorerTxUrl,
  getPaymentChainById,
  getPublicRpcUrl,
  getUniversalXActivityUrl,
} from "@/lib/config/payment";
import { ERC20_APPROVE_ABI } from "@/lib/contracts/receipt-emitter";
import { SPEND_POLICY_ABI, toContractMandate } from "@/lib/contracts/spend-policy";
import {
  buildMandateTypedData,
  deriveMandate,
  getSpendPolicyAddress,
  toRawMandate,
} from "@/lib/mandates/mandate";
import { type PaymentMandate } from "@/lib/mandates/types";
import { listResources, type X402Resource } from "@/lib/x402/catalog";
import { LoginWithGoogleButton, SignOutButton } from "@/components/login-with-google";
import { AgentTerminal } from "@/components/agent-terminal";
import { BudgetHud } from "@/components/budget-hud";
import { AccountSpine } from "@/components/account-spine";
import {
  compactAccountFacts,
  shouldShowCompactAccountFacts,
} from "@/lib/firewall/account-spine";
import {
  postRevokeCheckUnavailableLine,
  postRevokeProofLine,
  revokedStatusCopy,
  revertErrorName,
  type PostRevokeProof,
} from "@/lib/firewall/post-revoke-proof";
import { MandateCard } from "@/components/mandate-card";
import { PermissionReceipt } from "@/components/permission-receipt";
import {
  firewallResultLine,
  type LogEntry,
  type LogSource,
  type LogTone,
} from "@/lib/agent/log-formatter";
import {
  Wordmark,
  Chip,
  Disclosure,
  IconBolt,
  IconCheck,
  IconBan,
  IconLock,
  AppNav,
} from "@/components/ui";
import { UniversalBalanceCard } from "@/components/universal-balance-card";
import { FundUsdcNotice } from "@/components/fund-usdc-notice";
import { summarizeUniversalBalance, type UniversalBalanceSummary } from "@/lib/particle/assets";
import { chainLabel } from "@/lib/particle/assets";
import { buildExpenseCardArmIntent } from "@/lib/particle/expense-card-arm";
import {
  assertExpenseCardReadiness,
  findRecoverableExpenseCardFundingTransaction,
  getExpenseCardFundingAmount,
  hasMaterialExpenseCardPreviewChange,
  prepareExpenseCardFundingTransaction,
  sendExpenseCardFundingTransaction,
  summarizeExpenseCardFundingPreview,
  waitForExpenseCardFunding,
  type ExpenseCardFundingPreview,
} from "@/lib/particle/expense-card-funding";
import { sponsoredDelegateChain } from "@/lib/particle/delegation";
import { ExpenseCardFundingConsent } from "@/components/expense-card-funding-consent";
import { AgentMissionCard } from "@/components/agent-mission-card";
import { AgentTaskResult } from "@/components/agent-task-result";
import {
  RESEARCH_MISSION,
  orderResearchResources,
  summarizeResearchTask,
  type ResearchResourceOutcome,
  type ResearchResourceStatus,
} from "@/lib/agent/research-task";
import { agentControls } from "@/lib/agent/agent-controls";
import {
  RESEARCH_AGENT_BASIS_ATOMIC,
  RESEARCH_AGENT_MERCHANT,
} from "@/lib/agent/expense-card-config";
import type { StoredFundingEvidence } from "@/lib/agent/funding-evidence-store";
import { ExpenseCardFundingProof } from "@/components/expense-card-funding-proof";

// Demo on Arbitrum (where SpendPolicy + USDC + relayer gas live).
const CHAIN = ARBITRUM_CHAIN;
const USDC = CHAIN.usdcAddress;
const DEMO_MERCHANT = RESEARCH_AGENT_MERCHANT;
const AGENT_BASIS = RESEARCH_AGENT_BASIS_ATOMIC; // 0.10 USDC per-charge basis -> agent_budget caps
const ERC20_READ_ABI = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
// Experimental product integration of the successful build-only probe. Literal access is required
// for Next to inline this value in the client bundle. Default OFF preserves the proven direct
// Arbitrum approval path until one explicitly approved live verification succeeds.
const UA_FUNDED_AGENT = process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT === "true";
const SPONSORED_DELEGATION = process.env.NEXT_PUBLIC_SPONSORED_DELEGATION === "true";
const CANONICAL_CROSS_CHAIN_RECEIPT =
  "/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5";

let Magic: any = null;
let OAuthExtension: any = null;
let EVMExtension: any = null;
async function loadMagic() {
  if (!Magic) {
    const m = await import("magic-sdk");
    Magic = m.Magic;
  }
  if (!OAuthExtension) {
    const o = await import("@magic-ext/oauth2");
    OAuthExtension = o.OAuthExtension;
  }
  if (UA_FUNDED_AGENT && !EVMExtension) {
    const e = await import("@magic-ext/evm");
    EVMExtension = e.EVMExtension;
  }
}
let UniversalAccount: any = null;
let UNIVERSAL_ACCOUNT_VERSION: any = null;
async function loadParticle() {
  if (!UniversalAccount) {
    const p = await import("@particle-network/universal-account-sdk");
    UniversalAccount = p.UniversalAccount;
    UNIVERSAL_ACCOUNT_VERSION = p.UNIVERSAL_ACCOUNT_VERSION;
  }
}
async function loadEthers() {
  const e = await import("ethers");
  return {
    BrowserProvider: e.BrowserProvider,
    Contract: e.Contract,
    Signature: e.Signature,
    getBytes: e.getBytes,
  };
}

async function delegateAgentChain7702(
  magic: any,
  ua: any,
  ownerAddress: string,
  chainId: number,
): Promise<void> {
  const deployments = await ua.getEIP7702Deployments();
  if ((deployments ?? []).find((deployment: any) => deployment?.chainId === chainId)?.isDelegated) {
    return;
  }

  await magic.evm.switchChain(chainId);
  const [auth] = await ua.getEIP7702Auth([chainId]);
  if (!auth?.address || !Number.isInteger(Number(auth?.nonce))) {
    throw new Error(`Particle did not return a valid EIP-7702 authorization for chain ${chainId}`);
  }
  const authorization = await magic.wallet.sign7702Authorization({
    contractAddress: auth.address,
    chainId,
    nonce: Number(auth.nonce) + 1,
  });
  await magic.wallet.send7702Transaction({
    to: ownerAddress,
    data: "0x",
    authorizationList: [authorization],
  });

  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    const fresh = await ua.getEIP7702Deployments();
    if ((fresh ?? []).find((deployment: any) => deployment?.chainId === chainId)?.isDelegated) {
      return;
    }
  }
  throw new Error(`EIP-7702 delegation was not confirmed on chain ${chainId}`);
}

async function resolveEoa(magic: any): Promise<string | null> {
  for (const method of ["eth_accounts", "eth_requestAccounts"]) {
    try {
      const accounts = await magic.rpcProvider.request({ method });
      if (accounts?.[0]) return accounts[0];
    } catch {
      /* next */
    }
  }
  return null;
}

function fmt(atomic: bigint) {
  const n = Number(formatUnits(atomic, 6));
  return `${n % 1 === 0 ? n : n.toFixed(2)} USDC`;
}

function buildOutcomeEvidenceLink(chainId: number, txHash: string, label: string) {
  try {
    return { label, href: getExplorerTxUrl(getPaymentChainById(chainId), txHash) };
  } catch {
    // Particle's UniversalX activity remains the canonical proof when a routed chain is not part
    // of this app's small explorer allowlist. A new source chain must never crash the judge view.
    return null;
  }
}

type AgentChargeResult = {
  status: ResearchResourceStatus;
  settled?: boolean;
  data?: unknown;
  txUrl?: string;
  reason?: string;
};

export default function AgentPage() {
  const spendPolicy = getSpendPolicyAddress(CHAIN.chainId);
  const deployed = spendPolicy !== "0x0000000000000000000000000000000000000000";

  const [magic, setMagic] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [armed, setArmed] = useState<{ mandate: PaymentMandate; signature: string } | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [revokeProof, setRevokeProof] = useState<PostRevokeProof | null>(null);
  const [revokeTxUrl, setRevokeTxUrl] = useState<string | null>(null);
  const [agentLog, setAgentLog] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [bought, setBought] = useState<Record<string, unknown>>({});
  const [taskOutcomes, setTaskOutcomes] = useState<ResearchResourceOutcome[]>([]);
  const [blockPulse, setBlockPulse] = useState(0);
  const [settleTick, setSettleTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [balanceSummary, setBalanceSummary] = useState<UniversalBalanceSummary | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceReloadKey, setBalanceReloadKey] = useState(0);
  const [ua, setUa] = useState<any>(null);
  const [fundingPreview, setFundingPreview] = useState<any>(null);
  const [fundingPreviewSummary, setFundingPreviewSummary] = useState<ExpenseCardFundingPreview | null>(null);
  const [fundingPreviewLoading, setFundingPreviewLoading] = useState(false);
  const [fundingPreviewError, setFundingPreviewError] = useState<string | null>(null);
  const [fundingEvidence, setFundingEvidence] = useState<StoredFundingEvidence | null>(null);

  const append = useCallback(
    (source: LogSource, message: string, tone: LogTone, txUrl?: string) => {
      setAgentLog((prev) => [...prev, { ts: Date.now(), source, message, tone, txUrl }]);
    },
    []
  );

  // Manual re-trigger for the read-only balance (Particle reads can flake mid-demo).
  const reloadBalance = useCallback(() => setBalanceReloadKey((k) => k + 1), []);

  const resources = useMemo(() => listResources(), []);

  const taskSummary = useMemo(() => {
    const dailyCap = armed
      ? armed.mandate.maxPerDay > 0n
        ? armed.mandate.maxPerDay
        : armed.mandate.totalCap
      : 0n;
    return summarizeResearchTask(taskOutcomes, dailyCap, armed?.mandate.maxPerCharge ?? null);
  }, [armed, taskOutcomes]);

  const recordOutcome = useCallback(
    (resource: X402Resource, result: AgentChargeResult) => {
      const outcome: ResearchResourceOutcome = {
        resourceId: resource.id,
        title: resource.title,
        priceAtomic: resource.priceAtomic,
        status: result.status,
        ...(result.settled === undefined ? {} : { settled: result.settled }),
        ...(result.data === undefined ? {} : { data: result.data }),
        ...(result.txUrl ? { txUrl: result.txUrl } : {}),
        ...(result.reason ? { reason: result.reason } : {}),
      };
      setTaskOutcomes((previous) => [
        ...previous.filter((item) => item.resourceId !== resource.id),
        outcome,
      ]);
    },
    [],
  );

  // A stable agent_budget mandate preview derived once we know the payer address.
  const chosen = useMemo<PaymentMandate | null>(() => {
    if (!address) return null;
    return deriveMandate({
      payer: address as Address,
      merchant: DEMO_MERCHANT,
      token: USDC,
      chainId: CHAIN.chainId,
      invoiceAmount: AGENT_BASIS,
      preset: "agent_budget",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (typeof window === "undefined" || !deployed) return;
    loadMagic().then(() => {
      const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!;
      const instance = UA_FUNDED_AGENT
        ? new Magic(key, {
            extensions: [
              new EVMExtension([
                { rpcUrl: getPublicRpcUrl(ARBITRUM_CHAIN), chainId: ARBITRUM_CHAIN.chainId, default: true },
                { rpcUrl: getPublicRpcUrl(BASE_CHAIN), chainId: BASE_CHAIN.chainId },
              ]),
              new OAuthExtension(),
            ],
          })
        : new Magic(key, {
            network: { rpcUrl: getPublicRpcUrl(CHAIN), chainId: CHAIN.chainId },
            extensions: [new OAuthExtension()],
          });
      setMagic(instance);
    });
  }, [deployed]);

  // Restore an existing Magic session (email or Google OAuth round-trip).
  useEffect(() => {
    if (!magic) return;
    let cancelled = false;
    (async () => {
      try {
        if (!(await magic.user.isLoggedIn())) return;
        const eoa = await resolveEoa(magic);
        if (cancelled || !eoa) return;
        setAddress(eoa);
      } catch {
        /* no session */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [magic]);

  // Read-only Particle Universal Account balance (the chain-abstraction showcase).
  // getPrimaryAssets aggregates the wallet's balance across chains — no tx, no gas.
  useEffect(() => {
    if (!address) {
      setUa(null);
      setBalanceSummary(null);
      return;
    }
    let cancelled = false;
    setUa(null);
    setBalanceSummary(null);
    setBalanceLoading(true);
    setBalanceError(null);
    (async () => {
      try {
        await loadParticle();
        const ua = new UniversalAccount({
          projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
          projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
          projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
          smartAccountOptions: {
            useEIP7702: true,
            name: "UNIVERSAL",
            version: UNIVERSAL_ACCOUNT_VERSION,
            ownerAddress: address,
          },
          tradeConfig: { slippageBps: 100, universalGas: false },
        });
        if (!cancelled) setUa(ua);
        const raw = await ua.getPrimaryAssets();
        if (cancelled) return;
        setBalanceSummary(summarizeUniversalBalance(raw));
      } catch (e: any) {
        if (!cancelled) {
          setUa(null);
          setBalanceError(e?.message ?? "balance unavailable");
        }
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, balanceReloadKey]);

  // Funding evidence is immutable and safe to restore after a refresh. The current mandate still
  // requires a fresh Magic signature; restoring proof never arms the agent by itself.
  useEffect(() => {
    if (!UA_FUNDED_AGENT || !address) {
      setFundingEvidence(null);
      return;
    }
    let cancelled = false;
    setFundingEvidence(null);
    void fetch(`/api/agent/funding-evidence?payerAddress=${encodeURIComponent(address)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = await response.json();
        return body?.evidence as StoredFundingEvidence | undefined;
      })
      .then((evidence) => {
        if (!cancelled && evidence) setFundingEvidence(evidence);
      })
      .catch(() => {
        // Absence or temporary read failure keeps the UI on the normal explicit funding path.
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const fundingAmount = useMemo(
    () => (chosen ? getExpenseCardFundingAmount(chosen) : 0n),
    [chosen],
  );

  const buildFundingTransaction = useCallback(async () => {
    if (!ua || !chosen) throw new Error("Universal Account or mandate is not ready");
    const intent = buildExpenseCardArmIntent({
      chainId: CHAIN.chainId,
      tokenAddress: USDC,
      spendPolicyAddress: spendPolicy,
      amountAtomic: fundingAmount,
      totalCapAtomic: chosen.totalCap,
    });
    return ua.createUniversalTransaction(intent.request, intent.options);
  }, [ua, chosen, spendPolicy, fundingAmount]);

  const readCardReadiness = useCallback(async () => {
    if (!address) throw new Error("Connected wallet address is unavailable");
    const client = createPublicClient({ transport: http(getPublicRpcUrl(CHAIN)) });
    const [balance, allowance] = await Promise.all([
      client.readContract({
        address: USDC,
        abi: ERC20_READ_ABI,
        functionName: "balanceOf",
        args: [address as Address],
      }),
      client.readContract({
        address: USDC,
        abi: ERC20_READ_ABI,
        functionName: "allowance",
        args: [address as Address, spendPolicy],
      }),
    ]);
    return { balance: BigInt(balance), allowance: BigInt(allowance) };
  }, [address, spendPolicy]);

  const refreshFundingPreview = useCallback(async () => {
    if (!UA_FUNDED_AGENT || !ua || !chosen) return;
    setFundingPreviewLoading(true);
    setFundingPreviewError(null);
    try {
      const transaction = await buildFundingTransaction();
      const summary = summarizeExpenseCardFundingPreview(transaction);
      if (!summary.rootHashPresent) throw new Error("Particle preview is missing rootHash");
      setFundingPreview(transaction);
      setFundingPreviewSummary(summary);
    } catch (cause: any) {
      setFundingPreview(null);
      setFundingPreviewSummary(null);
      setFundingPreviewError(cause?.message ?? "Particle funding preview is unavailable");
    } finally {
      setFundingPreviewLoading(false);
    }
  }, [ua, chosen, buildFundingTransaction]);

  // Preview is read-only: no wallet prompt, delegation, signature, or send. It becomes the consent
  // material shown beside the signed mandate before the user chooses to fund and arm the card.
  useEffect(() => {
    if (!UA_FUNDED_AGENT || !ua || !chosen) return;
    void refreshFundingPreview();
  }, [ua, chosen, refreshFundingPreview]);

  const connect = useCallback(async () => {
    if (!magic || !email) return;
    setBusy("Signing in…");
    setError(null);
    try {
      await magic.auth.loginWithMagicLink({ email });
      const eoa = await resolveEoa(magic);
      if (!eoa) throw new Error("No address from Magic");
      setAddress(eoa);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }, [magic, email]);

  const arm = useCallback(async () => {
    if (!magic || !address || !chosen) return;
    if (UA_FUNDED_AGENT && (!ua || !fundingPreview || !fundingPreviewSummary)) return;
    const reviewedFundingPreview = fundingPreview;
    const reviewedFundingSummary = fundingPreviewSummary;
    setBusy(UA_FUNDED_AGENT ? "Reviewing and signing your limits…" : "Arming: sign mandate + approve SpendPolicy…");
    setError(null);
    if (UA_FUNDED_AGENT) setAgentLog([]);
    try {
      const { BrowserProvider, Contract, Signature, getBytes } = await loadEthers();
      const provider = new BrowserProvider(magic.rpcProvider);
      const signer = await provider.getSigner();

      const typed = buildMandateTypedData(chosen, spendPolicy);
      const signature = await signer.signTypedData(
        typed.domain,
        typed.types as unknown as Record<string, Array<{ name: string; type: string }>>,
        typed.message
      );

      if (UA_FUNDED_AGENT) {
        const existingReadiness = await readCardReadiness();
        let transactionId: string | null = null;
        let recovered = false;
        let verifiedEvidence: StoredFundingEvidence | null = null;

        if (
          existingReadiness.balance >= fundingAmount &&
          existingReadiness.allowance >= fundingAmount
        ) {
          setBusy("Reconciling the completed Particle funding…");
          if (
            fundingEvidence &&
            fundingEvidence.payer_address.toLowerCase() === address.toLowerCase() &&
            BigInt(fundingEvidence.approved_amount) >= fundingAmount
          ) {
            transactionId = fundingEvidence.ua_transaction_id;
            verifiedEvidence = fundingEvidence;
          } else {
            const history = await ua.getTransactions(1, 10);
            const entries = Array.isArray(history) ? history : history?.data;
            transactionId = findRecoverableExpenseCardFundingTransaction({
              entries,
              payerAddress: address,
              targetChainId: CHAIN.chainId,
              targetTokenAddress: USDC,
              amountAtomic: fundingAmount,
            });
            if (!transactionId) {
              throw new Error(
                "The card already has sufficient balance and allowance, but no matching recent Particle funding activity was found. No new transaction was sent.",
              );
            }
          }
          recovered = true;
        } else {
          setBusy("Preparing the Particle funding route…");
          const prepared = await prepareExpenseCardFundingTransaction({
            initialTransaction: reviewedFundingPreview,
            buildTransaction: buildFundingTransaction,
            ensureDelegated: async (chainId) => {
              setBusy(`Preparing your account on ${chainLabel(chainId)}…`);
              if (SPONSORED_DELEGATION) {
                try {
                  await sponsoredDelegateChain(magic, ua, address, chainId);
                  return;
                } catch {
                  // Preserve the proven self-paid delegation fallback. This is still an explicit
                  // wallet action inside the user-triggered Fund & arm flow, never an auto-send.
                }
              }
              await delegateAgentChain7702(magic, ua, address, chainId);
            },
          });

          const freshSummary = summarizeExpenseCardFundingPreview(prepared.transaction);
          if (!reviewedFundingSummary) throw new Error("Reviewed Particle funding preview is missing");
          if (hasMaterialExpenseCardPreviewChange(reviewedFundingSummary, freshSummary)) {
            setFundingPreview(prepared.transaction);
            setFundingPreviewSummary(freshSummary);
            throw new Error(
              "Particle changed the funding route or fee after account preparation. Review the refreshed preview, then confirm again.",
            );
          }

          setBusy("Confirming the Particle funding transaction…");
          const sent = await sendExpenseCardFundingTransaction({
            transaction: prepared.transaction,
            signAuthorization: async ({ contractAddress, chainId, legChainId, nonce }) => {
              await magic.evm.switchChain(legChainId);
              const authorization = await magic.wallet.sign7702Authorization({
                contractAddress,
                chainId,
                nonce,
              });
              const recovery =
                authorization.v !== undefined
                  ? Number(authorization.v)
                  : Number(authorization.yParity) + 27;
              return Signature.from({
                r: authorization.r,
                s: authorization.s,
                v: recovery,
              }).serialized;
            },
            signRootHash: async (rootHash) => signer.signMessage(getBytes(rootHash)),
            sendTransaction: async (transaction, rootSignature, authorizations) =>
              ua.sendTransaction(transaction, rootSignature, authorizations),
          });

          transactionId = prepared.transaction.transactionId ?? sent?.transactionId ?? null;
          if (!transactionId) throw new Error("Particle did not return a funding transactionId");
          setBusy("Waiting for the daily budget to become available…");
          await waitForExpenseCardFunding({
            transactionId,
            getTransaction: (id) => ua.getTransaction(id),
            onStatus: (status) => setBusy(`Funding the card · Particle status ${status}…`),
          });
        }

        if (!verifiedEvidence) {
          setBusy("Verifying the funding source and approval…");
          const verificationResponse = await fetch("/api/agent/funding-evidence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uaTransactionId: transactionId,
              payerAddress: address,
              mandate: toRawMandate(chosen),
              signature,
            }),
          });
          const verificationBody = await verificationResponse.json().catch(() => ({}));
          if (!verificationResponse.ok || !verificationBody?.evidence?.approval_tx_hash) {
            throw new Error(
              verificationBody?.error ??
                "Server could not verify the Particle funding activity and on-chain approval. The agent was not armed.",
            );
          }
          verifiedEvidence = verificationBody.evidence as StoredFundingEvidence;
        }
        setFundingEvidence(verifiedEvidence);
        append(
          "FIREWALL",
          verifiedEvidence.cross_chain
            ? "Cross-chain funding source and SpendPolicy approval verified server-side."
            : "Funding activity and SpendPolicy approval verified server-side.",
          "ok",
          getExplorerTxUrl(CHAIN, verifiedEvidence.approval_tx_hash),
        );

        setBusy("Verifying the card balance and allowance on Arbitrum…");
        const { balance, allowance } = await readCardReadiness();
        assertExpenseCardReadiness({
          balance,
          allowance,
          required: fundingAmount,
        });
        append(
          "USER",
          recovered
            ? `${fmt(fundingAmount)} completed Particle funding recovered and verified without a duplicate transaction.`
            : `${fmt(fundingAmount)} daily budget funded through Particle and approved on Arbitrum.`,
          "ok",
        );
        setBalanceReloadKey((key) => key + 1);
      } else {
        // Proven rollback path: direct Arbitrum approval remains unchanged while the UA-funded
        // integration flag is off.
        const usdc = new Contract(USDC, ERC20_APPROVE_ABI as any, signer);
        const tx = await usdc.approve(spendPolicy, chosen.totalCap);
        await tx.wait();
        setAgentLog([]);
      }

      setArmed({ mandate: chosen, signature });
      setRevoked(false);
      setRevokeProof(null);
      setRevokeTxUrl(null);
      setBought({});
      setTaskOutcomes([]);
      append(
        "USER",
        `Agent armed — budget up to ${fmt(chosen.totalCap)}, ${fmt(chosen.maxPerCharge)} per call.`,
        "ok"
      );
    } catch (e: any) {
      setError(e.message ?? "Arming failed");
    } finally {
      setBusy(null);
    }
  }, [
    magic,
    address,
    chosen,
    spendPolicy,
    append,
    ua,
    fundingPreview,
    fundingPreviewSummary,
    buildFundingTransaction,
    fundingAmount,
    fundingEvidence,
    readCardReadiness,
  ]);

  // Revoke the budget on-chain (mirrors the proven /firewall flow). SpendPolicy.revoke marks the
  // mandate revoked; any later charge then reverts with MandateIsRevoked. No new payment logic.
  const revoke = useCallback(async () => {
    if (!magic || !armed || running) return;
    setBusy("Revoking budget…");
    setError(null);
    try {
      const { BrowserProvider, Contract } = await loadEthers();
      const provider = new BrowserProvider(magic.rpcProvider);
      const signer = await provider.getSigner();
      const policy = new Contract(spendPolicy, SPEND_POLICY_ABI as any, signer);
      append("USER", "Revoke signed.", "info");
      const tx = await policy.revoke(toContractMandate(armed.mandate));
      await tx.wait();
      setRevoked(true);
      setRevokeTxUrl(getExplorerTxUrl(CHAIN, tx.hash));
      append(
        "FIREWALL",
        "Budget revoked on-chain. Agent disarmed — further charges will revert.",
        "blocked",
        getExplorerTxUrl(CHAIN, tx.hash)
      );

      // Kill-switch proof: simulate ONE more within-cap charge read-only (eth_call — no
      // signature prompt, no broadcast, no gas) and surface only the exact live revert.
      try {
        const client = createPublicClient({ transport: http(getPublicRpcUrl(CHAIN)) });
        await client.simulateContract({
          address: spendPolicy as Address,
          abi: SPEND_POLICY_ABI,
          functionName: "charge",
          args: [
            toContractMandate(armed.mandate),
            armed.signature as Hex,
            armed.mandate.maxPerCharge,
          ],
          account: armed.mandate.payer,
        });
        const proof = postRevokeProofLine(null);
        setRevokeProof(proof);
        append("FIREWALL", proof.message, "error");
      } catch (simErr) {
        const name = revertErrorName(simErr);
        const proof = name ? postRevokeProofLine(name) : postRevokeCheckUnavailableLine();
        setRevokeProof(proof);
        append("FIREWALL", proof.message, proof.proven ? "blocked" : "error");
      }
    } catch (e: any) {
      setError(e.message ?? "Revoke failed");
    } finally {
      setBusy(null);
    }
  }, [magic, armed, running, spendPolicy, append]);

  const chargeForResource = useCallback(
    async (resource: X402Resource): Promise<AgentChargeResult> => {
      if (!armed) return { status: "error", reason: "No armed permission" };
      const path = `/api/x402/${resource.id}`;
      let settlementTxUrl: string | undefined;
      try {
        // 1) Unpaid request -> expect 402 + payment requirements (the x402 handshake).
        append("AGENT", `GET ${path} — requesting resource…`, "info");
        const unpaid = await fetch(path);
        if (unpaid.status !== 402) {
          append("AGENT", `Unexpected ${unpaid.status} (expected 402 Payment Required).`, "error");
          return { status: "error", reason: `Unexpected HTTP ${unpaid.status}` };
        }
        const body = await unpaid.json();
        const reqs = body?.accepts?.[0];
        if (!reqs) {
          append("FIREWALL", "402 had no payment requirements.", "error");
          return { status: "error", reason: "402 had no payment requirements" };
        }
        append(
          "FIREWALL",
          `402 Payment Required — ${fmt(BigInt(reqs.maxAmountRequired))} to ${reqs.payTo.slice(0, 6)}…${reqs.payTo.slice(-4)}`,
          "info"
        );

        // 2) Pay within the mandate (relayer charges SpendPolicy; over-cap reverts here).
        append("AGENT", `Paying ${fmt(resource.priceAtomic)} within mandate…`, "info");
        const chargeRes = await fetch("/api/mandates/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mandate: toRawMandate(armed.mandate),
            signature: armed.signature,
            amount: resource.priceAtomic.toString(),
          }),
        });
        const charge = await chargeRes.json();
        if (!charge.ok) {
          if (charge.blocked) {
            const perCharge = /per-charge/.test(charge.reason ?? "");
            const line = firewallResultLine({
              kind: "blocked",
              reason: charge.reason,
              ...(perCharge
                ? { attemptedDisplay: fmt(resource.priceAtomic), capDisplay: fmt(armed.mandate.maxPerCharge) }
                : {}),
            });
            append("FIREWALL", line.message, line.tone);
            append("AGENT", `Access denied by the firewall — ${resource.title} not delivered.`, "error");
            setBlockPulse((n) => n + 1);
            return {
              status: "blocked",
              reason: charge.reason ?? "Blocked by the signed spending policy",
            };
          }
          const line = firewallResultLine({ kind: "error", message: charge.error ?? "charge failed" });
          append("FIREWALL", line.message, line.tone);
          return { status: "error", reason: charge.error ?? "Charge failed" };
        }
        const txUrl = getExplorerTxUrl(CHAIN, charge.txHash);
        settlementTxUrl = txUrl;
        append(
          "FIREWALL",
          `Charged ${fmt(resource.priceAtomic)}. Settled to merchant.`,
          "ok",
          txUrl
        );
        setSettleTick((n) => n + 1);

        // 3) Retry with the on-chain proof; poll briefly while the tx mines.
        const proof = {
          scheme: "onelink-mandate",
          txHash: charge.txHash,
          amount: resource.priceAtomic.toString(),
          asset: USDC,
          payTo: reqs.payTo,
          resource: path,
        };
        const xPayment = btoa(JSON.stringify(proof));
        append("AGENT", `GET ${path} (paid) — retrying with proof…`, "info");

        for (let attempt = 0; attempt < 6; attempt++) {
          const paid = await fetch(path, { headers: { "X-PAYMENT": xPayment } });
          if (paid.ok) {
            const data = await paid.json();
            append("AGENT", `200 OK — received ${resource.title}.`, "ok", txUrl);
            setBought((prev) => ({ ...prev, [resource.id]: data.data }));
            return { status: "purchased", settled: true, data: data.data, txUrl };
          }
          const err = await paid.json().catch(() => ({}));
          if (typeof err?.error === "string" && /not found on-chain yet/.test(err.error) && attempt < 5) {
            await new Promise((r) => setTimeout(r, 1500)); // wait for mining
            continue;
          }
          append("FIREWALL", `Resource withheld: ${err?.error ?? paid.status}`, "blocked");
          return {
            status: "withheld",
            settled: true,
            txUrl,
            reason: err?.error ?? `Resource returned HTTP ${paid.status}`,
          };
        }
        return {
          status: "withheld",
          settled: true,
          txUrl,
          reason: "Resource proof was not accepted in time",
        };
      } catch (e: any) {
        append("FIREWALL", `ERROR: ${e?.message ?? "network"}`, "error");
        return {
          status: "error",
          ...(settlementTxUrl ? { settled: true, txUrl: settlementTxUrl } : {}),
          reason: e?.message ?? "Network error",
        };
      }
    },
    [armed, append]
  );

  // Manual single-resource purchase (the per-API buttons).
  const buy = useCallback(
    async (resource: X402Resource) => {
      if (!armed || running) return;
      setRunning(true);
      setError(null);
      try {
        const result = await chargeForResource(resource);
        recordOutcome(resource, result);
      } finally {
        setRunning(false);
      }
    },
    [armed, running, chargeForResource, recordOutcome]
  );

  // The unattended workflow follows one explicit task plan. The final premium request deliberately
  // exercises the same on-chain cap as a buggy or over-eager production workflow would.
  const runAutonomous = useCallback(async () => {
    if (!armed || running) return;
    setRunning(true);
    setError(null);
    try {
      const plan = orderResearchResources(resources);
      append(
        "AGENT",
        `Task started — prepare the ETH market-risk brief with a ${fmt(armed.mandate.maxPerCharge)} per-tool limit.`,
        "info"
      );
      let purchased = 0;
      let halted = false;
      for (const r of plan) {
        if (r.id in bought) continue;
        if (r.id === RESEARCH_MISSION.unexpectedResourceId) {
          append(
            "AGENT",
            `${RESEARCH_MISSION.adversarialFixture.label.toUpperCase()} — ${RESEARCH_MISSION.adversarialFixture.instruction}`,
            "info",
          );
        }
        const outcome = await chargeForResource(r);
        recordOutcome(r, outcome);
        if (outcome.status === "purchased") {
          purchased += 1;
          continue;
        }
        halted = true;
        if (outcome.status === "blocked") {
          append(
            "AGENT",
            `Brief inputs complete after ${purchased} purchase${purchased === 1 ? "" : "s"}. The unexpected premium export was blocked before settlement.`,
            "error"
          );
        } else {
          append("AGENT", `Stopping after ${purchased} purchase${purchased === 1 ? "" : "s"}.`, "info");
        }
        break;
      }
      if (!halted) {
        append(
          "AGENT",
          `Task complete — ${purchased} required input${purchased === 1 ? "" : "s"} purchased within budget.`,
          "ok"
        );
      }
    } finally {
      setRunning(false);
    }
  }, [armed, running, resources, bought, chargeForResource, recordOutcome, append]);

  const controls = agentControls({ running, revoked });
  const showAccountFacts = shouldShowCompactAccountFacts({
    uaReady: Boolean(ua),
    balanceReady: balanceSummary !== null,
    balanceFailed: Boolean(balanceError),
  });
  const revokedCopy = revoked ? revokedStatusCopy(revokeProof) : null;
  const outcomeParticleActivity = fundingEvidence
    ? {
        activityId: fundingEvidence.ua_transaction_id,
        href: getUniversalXActivityUrl(fundingEvidence.ua_transaction_id),
        sourceNames: fundingEvidence.source_chain_ids.map(chainLabel),
        settlementName: chainLabel(fundingEvidence.settlement_chain_id),
        verified: true,
      }
    : null;
  const outcomeFundingLinks = fundingEvidence
    ? [
        ...fundingEvidence.source_legs.flatMap((leg) => {
          const link = buildOutcomeEvidenceLink(
            leg.chainId,
            leg.txHash,
            `${chainLabel(leg.chainId)} source leg`,
          );
          return link ? [link] : [];
        }),
        buildOutcomeEvidenceLink(
          fundingEvidence.settlement_chain_id,
          fundingEvidence.approval_tx_hash,
          `${chainLabel(fundingEvidence.settlement_chain_id)} approval`,
        ),
      ].filter(
        (link): link is { label: string; href: string } => link !== null,
      )
    : [];

  return (
    <main className="op-shell px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 flex items-center justify-between">
          <Wordmark href="/" />
          <div className="flex items-center gap-2">
            <span className="op-chip">
              <IconBolt className="h-3.5 w-3.5" /> x402 gateway
            </span>
            {address ? <SignOutButton magic={magic} /> : null}
          </div>
        </header>

        <AppNav active="/agent" className="mb-5" />

        <div className="op-card op-animate-rise p-6 sm:p-7">
          <div className="mb-5">
            <p className="op-eyebrow">Research agent expense card</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
              Give software a budget, not your wallet
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Set a 2 USDC daily tool budget. The workflow buys two paid data feeds, prepares an ETH
              market-risk brief, then faces a deterministic adversarial request. The signed card
              contains the 0.20 USDC attempt at its 0.10 USDC per-tool limit.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="op-chip-iris" title="Universal Accounts in EIP-7702 mode">
                One supported-chain balance
              </span>
              <span className="op-chip" title="Magic embedded wallet with email or Google login">
                Sign in with email
              </span>
              <span className="op-chip" title="Every charge is checked by SpendPolicy on Arbitrum One">
                On-chain spending limits
              </span>
            </div>
          </div>

          {!deployed ? (
            <div className="rounded-2xl border border-gold/30 bg-gold-soft/40 p-4 text-sm text-ink2">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <IconLock className="h-4 w-4 text-gold" /> SpendPolicy not deployed
              </p>
              <p className="mt-1.5 text-muted">
                Set <span className="font-mono text-xs">NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM</span>{" "}
                to enable the x402 agent demo.
              </p>
            </div>
          ) : !address ? (
            <div className="space-y-4">
              <LoginWithGoogleButton magic={magic} returnTo="/agent" />
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
                <span className="h-px flex-1 bg-line" />
                <span>or with email</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <input
                id="agent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="op-input"
              />
              <button onClick={connect} disabled={!email || !!busy} className="op-btn-primary w-full">
                {busy ?? "Connect with Magic"}
              </button>
            </div>
          ) : !armed ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-paper2 p-4">
                <p className="op-eyebrow">Connected · Magic</p>
                <p className="mt-1 font-mono text-sm text-ink2">
                  {address.slice(0, 10)}…{address.slice(-6)}
                </p>
              </div>
              <UniversalBalanceCard
                summary={balanceSummary}
                loading={balanceLoading}
                error={balanceError}
                onRetry={reloadBalance}
              />
              {showAccountFacts ? (
                <ul
                  aria-label="Account capabilities"
                  className="flex flex-wrap items-center justify-center gap-1.5"
                >
                  {compactAccountFacts().map((fact) => (
                    <li
                      key={fact}
                      className="flex items-center gap-1 rounded-full border border-line2 bg-paper px-2.5 py-1 text-[11px] font-medium text-ink2"
                    >
                      <IconBolt className="h-3 w-3 shrink-0 text-gold" aria-hidden="true" />
                      {fact}
                    </li>
                  ))}
                </ul>
              ) : null}
              <FundUsdcNotice
                summary={balanceSummary}
                ownerAddress={address}
                targetChainId={CHAIN.chainId}
                targetUsdcAddress={USDC}
              />
              {chosen ? <MandateCard mandate={chosen} /> : null}
              {UA_FUNDED_AGENT && chosen ? (
                <ExpenseCardFundingConsent
                  amountAtomic={fundingAmount}
                  totalCapAtomic={chosen.totalCap}
                  summary={fundingPreviewSummary}
                  loading={fundingPreviewLoading}
                  error={fundingPreviewError}
                  onRetry={refreshFundingPreview}
                />
              ) : null}
              {UA_FUNDED_AGENT && fundingEvidence ? (
                <ExpenseCardFundingProof evidence={fundingEvidence} />
              ) : null}
              <button
                onClick={arm}
                disabled={
                  !chosen ||
                  !!busy ||
                  (UA_FUNDED_AGENT && (!fundingPreview || !fundingPreviewSummary || fundingPreviewLoading))
                }
                className="op-btn-primary w-full"
              >
                {busy ??
                  (UA_FUNDED_AGENT
                    ? fundingEvidence
                      ? "Arm agent with verified funding"
                      : `Fund ${fmt(fundingAmount)} & arm agent`
                    : "Arm agent budget")}
              </button>
              {UA_FUNDED_AGENT ? (
                <p className="text-center text-[11px] leading-relaxed text-muted">
                  {fundingEvidence
                    ? "Funding is already verified. Sign the current spending limits; no new funding transaction will be sent."
                    : "One review, explicit wallet approvals: sign the spending limits, then sign the Particle funding transaction. A one-time chain activation may also be requested."}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {UA_FUNDED_AGENT && fundingEvidence && (running || taskSummary.status === "idle") ? (
                <ExpenseCardFundingProof evidence={fundingEvidence} />
              ) : null}
              <AgentMissionCard mandate={armed.mandate} running={running} onRun={runAutonomous} disabled={revoked} />

              {!running && taskSummary.status !== "idle" ? (
                <AgentTaskResult
                  summary={taskSummary}
                  particleActivity={outcomeParticleActivity}
                  fundingLinks={outcomeFundingLinks}
                  revoked={revoked}
                  revokeProof={revokeProof}
                  revokeTxUrl={revokeTxUrl}
                  receiptHref={CANONICAL_CROSS_CHAIN_RECEIPT}
                />
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <BudgetHud
                  chainId={CHAIN.chainId}
                  mandate={armed.mandate}
                  protectedPulse={blockPulse}
                  refreshSignal={settleTick}
                />
                <AccountSpine
                  address={address}
                  protectedPulse={blockPulse}
                  clearSignal={settleTick}
                />
              </div>

              {revoked && taskSummary.status !== "complete" ? (
                <div role="status" className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-danger">
                    <IconBan className="h-4 w-4" /> Budget revoked on-chain
                  </p>
                  {revokedCopy?.proven ? (
                    <p className="animate-seal mt-2 flex items-start gap-1.5 rounded-xl bg-paper px-3 py-2 text-xs font-semibold text-ink">
                      <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-verify" aria-hidden="true" />
                      {revokedCopy.message}
                    </p>
                  ) : (
                    <p className="mt-1 text-danger/90">
                      {revokedCopy?.message}
                      {revokedCopy?.detail ? (
                        <span className="mt-1 block text-xs font-normal text-danger/80">
                          {revokedCopy.detail}
                        </span>
                      ) : null}
                    </p>
                  )}
                </div>
              ) : !revoked ? (
                <button
                  type="button"
                  onClick={revoke}
                  disabled={!controls.canRevoke || !!busy}
                  className="op-btn-secondary w-full justify-center"
                >
                  {busy ?? (
                    <>
                      <IconBan className="h-4 w-4 text-danger" /> Revoke budget
                    </>
                  )}
                </button>
              ) : null}

              <Disclosure
                summary={
                  <span className="flex items-center gap-2">
                    <IconBolt className="h-4 w-4 text-gold" /> Technical activity · x402 and on-chain evidence
                  </span>
                }
              >
                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <PermissionReceipt mandate={armed.mandate} revoked={revoked} />
                    <UniversalBalanceCard
                      summary={balanceSummary}
                      loading={balanceLoading}
                      error={balanceError}
                      onRetry={reloadBalance}
                    />
                  </div>

                  <div>
                    <p className="op-eyebrow">Agent activity</p>
                    <div className="mt-2">
                      <AgentTerminal entries={agentLog} />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      Each purchase runs the real x402-pattern handshake: the API answers{" "}
                      <span className="font-mono">402 Payment Required</span>, the workflow pays through
                      the mandate, then retries with on-chain proof. Over-cap calls are blocked before
                      settlement.
                    </p>
                  </div>

                  <div>
                    <p className="op-eyebrow">Resource controls and raw payloads</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {resources.map((r) => {
                        const owned = r.id in bought;
                        return (
                          <div key={r.id} className="flex min-w-0 flex-col rounded-2xl border border-line bg-paper p-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="min-w-0 text-sm font-semibold text-ink">{r.title}</p>
                              <span className="shrink-0 font-mono text-xs text-ink2">{fmt(r.priceAtomic)}</span>
                            </div>
                            <p className="mb-3 mt-1 text-xs leading-relaxed text-muted">{r.description}</p>
                            {/* mt-auto pins the action row: equal-height cards, buttons on one line. */}
                            <button
                              type="button"
                              onClick={() => buy(r)}
                              disabled={running || owned}
                              className="op-btn-secondary mt-auto w-full justify-center text-xs"
                            >
                              {owned ? (
                                <>
                                  <IconCheck className="h-4 w-4 text-verify" /> Purchased
                                </>
                              ) : r.priceAtomic > armed.mandate.maxPerCharge ? (
                                <>
                                  <IconBan className="h-4 w-4 text-danger" /> Try over cap
                                </>
                              ) : (
                                <>
                                  <IconBolt className="h-4 w-4 text-gold" /> Buy this call
                                </>
                              )}
                            </button>
                            {owned ? (
                              <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-paper2 p-2 text-[11px] leading-relaxed text-ink2">
                                {JSON.stringify(bought[r.id], null, 2)}
                              </pre>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-faint">
                    Particle Universal Accounts provide the supported-chain balance. This deterministic
                    task settles its x402-pattern purchases on Arbitrum; the project&apos;s separate
                    canonical receipt proves the live Particle UA cross-chain operation.
                  </p>
                </div>
              </Disclosure>
            </div>
          )}

          {error ? (
            <div role="alert" className="mt-4 rounded-2xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
          <Chip>{UA_FUNDED_AGENT ? "Particle-funded card" : "x402 pattern"}</Chip>
          <span>
            {UA_FUNDED_AGENT
              ? "experimental path · explicit confirmation required"
              : "deterministic workflow · on-chain enforcement"}
          </span>
        </div>
      </div>
    </main>
  );
}
