"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, formatUnits, http, type Address } from "viem";
import { ARBITRUM_CHAIN, BASE_CHAIN, getExplorerTxUrl, getPublicRpcUrl } from "@/lib/config/payment";
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
  orderResearchResources,
  summarizeResearchTask,
  type ResearchResourceOutcome,
  type ResearchResourceStatus,
} from "@/lib/agent/research-task";
import { agentControls } from "@/lib/agent/agent-controls";

// Demo on Arbitrum (where SpendPolicy + USDC + relayer gas live).
const CHAIN = ARBITRUM_CHAIN;
const USDC = CHAIN.usdcAddress;
const DEMO_MERCHANT: Address = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
const AGENT_BASIS = 100_000n; // 0.10 USDC per-charge basis -> agent_budget caps
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
    return summarizeResearchTask(taskOutcomes, dailyCap);
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
      return;
    }
    let cancelled = false;
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

        const transactionId = prepared.transaction.transactionId ?? sent?.transactionId;
        if (!transactionId) throw new Error("Particle did not return a funding transactionId");
        setBusy("Waiting for the daily budget to become available…");
        await waitForExpenseCardFunding({
          transactionId,
          getTransaction: (id) => ua.getTransaction(id),
          onStatus: (status) => setBusy(`Funding the card · Particle status ${status}…`),
        });

        setBusy("Verifying the card balance and allowance on Arbitrum…");
        const arbitrumClient = createPublicClient({ transport: http(getPublicRpcUrl(CHAIN)) });
        const [balance, allowance] = await Promise.all([
          arbitrumClient.readContract({
            address: USDC,
            abi: ERC20_READ_ABI,
            functionName: "balanceOf",
            args: [address as Address],
          }),
          arbitrumClient.readContract({
            address: USDC,
            abi: ERC20_READ_ABI,
            functionName: "allowance",
            args: [address as Address, spendPolicy],
          }),
        ]);
        assertExpenseCardReadiness({
          balance: BigInt(balance),
          allowance: BigInt(allowance),
          required: fundingAmount,
        });
        append(
          "USER",
          `${fmt(fundingAmount)} daily budget funded through Particle and approved on Arbitrum.`,
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
      append(
        "FIREWALL",
        "Budget revoked on-chain. Agent disarmed — further charges will revert.",
        "blocked",
        getExplorerTxUrl(CHAIN, tx.hash)
      );
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
              market-risk brief, and proves that an unnecessary premium export cannot exceed your
              signed 0.10 USDC per-tool limit.
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
              <button
                onClick={arm}
                disabled={
                  !chosen ||
                  !!busy ||
                  (UA_FUNDED_AGENT && (!fundingPreview || !fundingPreviewSummary || fundingPreviewLoading))
                }
                className="op-btn-primary w-full"
              >
                {busy ?? (UA_FUNDED_AGENT ? `Fund ${fmt(fundingAmount)} & arm agent` : "Arm agent budget")}
              </button>
              {UA_FUNDED_AGENT ? (
                <p className="text-center text-[11px] leading-relaxed text-muted">
                  One review, explicit wallet approvals: sign the spending limits, then sign the
                  Particle funding transaction. A one-time chain activation may also be requested.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <AgentMissionCard mandate={armed.mandate} running={running} onRun={runAutonomous} disabled={revoked} />

              {!running && taskSummary.status !== "idle" ? (
                <AgentTaskResult summary={taskSummary} />
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

              {revoked ? (
                <div role="status" className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-danger">
                    <IconBan className="h-4 w-4" /> Budget revoked on-chain
                  </p>
                  <p className="mt-1 text-danger/90">
                    Any further charge now reverts with{" "}
                    <span className="font-mono text-xs">MandateIsRevoked</span> — the agent can no
                    longer spend.
                  </p>
                </div>
              ) : (
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
              )}

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
                          <div key={r.id} className="min-w-0 rounded-2xl border border-line bg-paper p-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="min-w-0 text-sm font-semibold text-ink">{r.title}</p>
                              <span className="shrink-0 font-mono text-xs text-ink2">{fmt(r.priceAtomic)}</span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted">{r.description}</p>
                            <button
                              type="button"
                              onClick={() => buy(r)}
                              disabled={running || owned}
                              className="op-btn-secondary mt-2 w-full justify-center text-xs"
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
              : "settled by an on-chain spend mandate"}
          </span>
        </div>
      </div>
    </main>
  );
}
