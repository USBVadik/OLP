"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { encodeFunctionData, type Address } from "viem";
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_USDC,
  BASE_MAINNET_CHAIN_ID,
  BASE_MAINNET_USDC,
  ERC20_APPROVE_ABI,
  RECEIPT_EMITTER_ABI,
  getArbitrumReceiptEmitterAddress,
  getReceiptEmitterAddress,
} from "@/lib/contracts/receipt-emitter";

const MERCHANT: Address = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
const PROBE_AMOUNT_ATOMIC = "10000"; // 0.01 USDC
const FULL_INVOICE_AMOUNT_ATOMIC = "100000"; // 0.10 USDC registered invoice
const DEFAULT_INVOICE_ID =
  "0x860e092e17e1a54c054e411f48781dcca1a474c878f7f35d754f1c587a2e08bd";

const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

type ProbeName =
  | "Probe A createTransferTransaction"
  | "Probe B createUniversalTransaction USDC.transfer"
  | "Probe C createUniversalTransaction USDC.approve"
  | "Probe D createUniversalTransaction approve + payInvoice"
  | "Probe A Arbitrum createTransferTransaction"
  | "Probe B Arbitrum createUniversalTransaction USDC.transfer"
  | "Probe C Arbitrum createUniversalTransaction USDC.approve"
  | "Probe D Arbitrum createUniversalTransaction approve + payInvoice"
  | "Probe E 7702 createTransferTransaction (Base)";

interface ProbeResult {
  probeName: ProbeName;
  network: "Base" | "Arbitrum";
  method: string;
  chainId: number;
  token: string;
  amountAtomic: string;
  recipientOrContract: string;
  createdTransaction: boolean;
  rootHashPresent: boolean;
  userOpsLength: number;
  userOpKeys: string[];
  hasEip7702Auth: boolean;
  eip7702Delegated: boolean | null;
  feeQuotesPresent: boolean;
  tokenChangesPresent: boolean;
  exactErrorMessage: string | null;
  exactErrorCode: string | number | null;
  stage: "build" | "preview" | "auth" | "sign" | "send";
  isParticleMaintenanceError: boolean;
  raw?: unknown;
}

interface ProbeTarget {
  network: "Base" | "Arbitrum";
  chainId: number;
  usdc: Address;
  receiptEmitter: Address | null;
  invoiceId: string;
}

let MagicCtor: any = null;
let EVMExtensionCtor: any = null;
let UniversalAccountCtor: any = null;
let SUPPORTED_TOKEN_TYPE: any = null;
let UNIVERSAL_ACCOUNT_VERSION: any = null;

async function loadSDKs() {
  if (!MagicCtor || !EVMExtensionCtor) {
    const magicMod = await import("magic-sdk");
    MagicCtor = magicMod.Magic;
    const evmMod = await import("@magic-ext/evm");
    EVMExtensionCtor = evmMod.EVMExtension;
  }
  if (!UniversalAccountCtor) {
    const particleMod = await import("@particle-network/universal-account-sdk");
    UniversalAccountCtor = particleMod.UniversalAccount;
    SUPPORTED_TOKEN_TYPE = particleMod.SUPPORTED_TOKEN_TYPE;
    UNIVERSAL_ACCOUNT_VERSION = particleMod.UNIVERSAL_ACCOUNT_VERSION;
  }
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

function findDeepKey(value: unknown, targetKeys: string[], depth = 0): boolean {
  if (!value || depth > 8) return false;
  if (Array.isArray(value)) return value.some((item) => findDeepKey(item, targetKeys, depth + 1));
  if (typeof value !== "object") return false;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (targetKeys.includes(key)) return true;
    if (findDeepKey(nested, targetKeys, depth + 1)) return true;
  }
  return false;
}

function getUserOps(transaction: any): any[] {
  return transaction?.userOps ?? transaction?.data?.userOps ?? [];
}

function summarizeTransaction(probe: Omit<ProbeResult, "createdTransaction" | "rootHashPresent" | "userOpsLength" | "userOpKeys" | "hasEip7702Auth" | "eip7702Delegated" | "feeQuotesPresent" | "tokenChangesPresent" | "exactErrorMessage" | "exactErrorCode" | "isParticleMaintenanceError" | "raw">, transaction: any): ProbeResult {
  const userOps = getUserOps(transaction);
  const userOpKeys = Array.from(
    new Set(
      userOps.flatMap((entry: any) => {
        const userOp = entry?.userOp ?? {};
        return Object.keys(userOp);
      })
    )
  );
  const authValues = userOps
    .map((entry: any) => entry?.userOp?.eip7702Auth ?? entry?.eip7702Auth)
    .filter(Boolean);
  const delegatedValue = authValues
    .map((auth: any) => auth?.eip7702Delegated)
    .find((value: unknown) => typeof value === "boolean");

  return {
    ...probe,
    createdTransaction: true,
    rootHashPresent: Boolean(transaction?.rootHash),
    userOpsLength: userOps.length,
    userOpKeys,
    hasEip7702Auth: authValues.length > 0,
    eip7702Delegated: typeof delegatedValue === "boolean" ? delegatedValue : null,
    feeQuotesPresent: findDeepKey(transaction, ["feeQuotes", "feeQuote", "fees", "feeTokens"]),
    tokenChangesPresent: findDeepKey(transaction, ["tokenChanges", "tokenChange", "tokenChangesPreview"]),
    exactErrorMessage: null,
    exactErrorCode: null,
    isParticleMaintenanceError: false,
    raw: transaction,
  };
}

function summarizeError(
  probe: Omit<ProbeResult, "createdTransaction" | "rootHashPresent" | "userOpsLength" | "userOpKeys" | "hasEip7702Auth" | "eip7702Delegated" | "feeQuotesPresent" | "tokenChangesPresent" | "exactErrorMessage" | "exactErrorCode" | "isParticleMaintenanceError" | "raw">,
  error: any
): ProbeResult {
  const message =
    error?.response?.data?.message ??
    error?.data?.message ??
    error?.message ??
    String(error);
  const code = error?.response?.data?.code ?? error?.data?.code ?? error?.code ?? null;

  return {
    ...probe,
    createdTransaction: false,
    rootHashPresent: false,
    userOpsLength: 0,
    userOpKeys: [],
    hasEip7702Auth: false,
    eip7702Delegated: null,
    feeQuotesPresent: false,
    tokenChangesPresent: false,
    exactErrorMessage: message,
    exactErrorCode: code,
    isParticleMaintenanceError: /maint/i.test(message),
    raw: {
      message,
      code,
      response: error?.response?.data,
    },
  };
}

function formatReportLine(value: unknown) {
  if (value === null || value === undefined || value === "") return "none";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "none";
  return String(value);
}

export default function ParticleProbePage() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG_PROBES === "true";
  const receiptEmitter = useMemo(() => {
    try {
      return getReceiptEmitterAddress();
    } catch {
      return null;
    }
  }, []);
  const arbitrumReceiptEmitter = useMemo(() => getArbitrumReceiptEmitterAddress(), []);
  const [email, setEmail] = useState("usbvadik@gmail.com");
  const [invoiceId, setInvoiceId] = useState(DEFAULT_INVOICE_ID);
  const [arbitrumInvoiceId, setArbitrumInvoiceId] = useState("");
  const [magic, setMagic] = useState<any>(null);
  const [ua, setUa] = useState<any>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [uaAddress, setUaAddress] = useState<string | null>(null);
  const [primaryAssetsStatus, setPrimaryAssetsStatus] = useState("not loaded");
  const [status, setStatus] = useState("Idle");
  const [results, setResults] = useState<ProbeResult[]>([]);
  // EIP-7702 probe state
  const [ua7702, setUa7702] = useState<any>(null);
  const [ua7702Address, setUa7702Address] = useState<string | null>(null);
  const [primaryAssets7702, setPrimaryAssets7702] = useState("not loaded");
  const [delegationStatus, setDelegationStatus] = useState("unknown");
  const [sevenStatus, setSevenStatus] = useState("Idle");

  useEffect(() => {
    if (!enabled) return;
    loadSDKs().then(() => {
      const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!;
      const baseRpc = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";
      // EVMExtension is additive: build-only legacy probes keep working, and it unlocks
      // magic.evm + magic.wallet.* 7702 methods for the EIP-7702 delegation probe below.
      setMagic(
        new MagicCtor(key, {
          extensions: [
            new EVMExtensionCtor([{ rpcUrl: baseRpc, chainId: BASE_MAINNET_CHAIN_ID, default: true }]),
          ],
        })
      );
    });
  }, [enabled]);

  const connect = useCallback(async () => {
    if (!magic) return;
    setStatus("Connecting Magic...");
    await loadSDKs();

    const loggedIn = await magic.user.isLoggedIn();
    if (!loggedIn) {
      await magic.auth.loginWithMagicLink({ email });
    }

    const eoa = await resolveMagicEoa(magic);
    if (!eoa) throw new Error("Magic did not return an address");
    setOwnerAddress(eoa);

    const universalAccount = new UniversalAccountCtor({
      projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
      projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
      projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
      ownerAddress: eoa,
    });
    setUa(universalAccount);

    try {
      const options = await universalAccount.getSmartAccountOptions();
      setUaAddress(options?.smartAccountAddress ?? options?.senderAddress ?? null);
    } catch {
      setUaAddress(null);
    }

    try {
      await universalAccount.getPrimaryAssets();
      setPrimaryAssetsStatus("loaded");
    } catch (error: any) {
      setPrimaryAssetsStatus(`error: ${error?.message ?? String(error)}`);
    }

    setStatus("Connected");
  }, [email, magic]);

  const runProbe = useCallback(
    async (probeName: ProbeName): Promise<ProbeResult> => {
      if (!ua) throw new Error("Connect Magic + Particle UA first");
      await loadSDKs();

      const isArbitrum = probeName.includes("Arbitrum");
      const target: ProbeTarget = isArbitrum
        ? {
            network: "Arbitrum",
            chainId: ARBITRUM_MAINNET_CHAIN_ID,
            usdc: ARBITRUM_MAINNET_USDC,
            receiptEmitter: arbitrumReceiptEmitter,
            invoiceId: arbitrumInvoiceId,
          }
        : {
            network: "Base",
            chainId: BASE_MAINNET_CHAIN_ID,
            usdc: BASE_MAINNET_USDC,
            receiptEmitter,
            invoiceId,
          };
      const isFullInvoiceProbe = probeName.includes("approve + payInvoice");
      const isTransferRailProbe = probeName.includes("createTransferTransaction");
      const isUniversalTransferProbe = probeName.includes("USDC.transfer");
      const isUniversalApproveProbe = probeName.includes("USDC.approve");
      const approveSpender = target.receiptEmitter ?? MERCHANT;
      const particleAmount = isFullInvoiceProbe ? "0.1" : "0.01";
      const amountAtomic = isFullInvoiceProbe
        ? FULL_INVOICE_AMOUNT_ATOMIC
        : PROBE_AMOUNT_ATOMIC;
      const base = {
        probeName,
        network: target.network,
        chainId: target.chainId,
        token: target.usdc,
        amountAtomic,
        stage: "build" as const,
      };

      try {
        if (isTransferRailProbe) {
          const tx = await ua.createTransferTransaction({
            token: {
              chainId: target.chainId,
              address: target.usdc,
            },
            amount: particleAmount,
            receiver: MERCHANT,
          });
          return summarizeTransaction(
            {
              ...base,
              method: "createTransferTransaction",
              recipientOrContract: MERCHANT,
            },
            tx
          );
        }

        if (isFullInvoiceProbe && (!target.receiptEmitter || !target.invoiceId)) {
          throw new Error(`${target.network} ReceiptEmitter/invoiceId is not configured; skipping approve + payInvoice probe.`);
        }

        const transactions =
          isUniversalTransferProbe
            ? [
                {
                  to: target.usdc,
                  data: encodeFunctionData({
                    abi: ERC20_TRANSFER_ABI,
                    functionName: "transfer",
                    args: [MERCHANT, BigInt(amountAtomic)],
                  }),
                  value: "0",
                },
              ]
            : isUniversalApproveProbe
              ? [
                  {
                    to: target.usdc,
                    data: encodeFunctionData({
                      abi: ERC20_APPROVE_ABI,
                      functionName: "approve",
                      args: [approveSpender, BigInt(amountAtomic)],
                    }),
                    value: "0",
                  },
                ]
              : [
                  {
                    to: target.usdc,
                    data: encodeFunctionData({
                      abi: ERC20_APPROVE_ABI,
                      functionName: "approve",
                      args: [target.receiptEmitter!, BigInt(amountAtomic)],
                    }),
                    value: "0",
                  },
                  {
                    to: target.receiptEmitter!,
                    data: encodeFunctionData({
                      abi: RECEIPT_EMITTER_ABI,
                      functionName: "payInvoice",
                      args: [target.invoiceId as `0x${string}`],
                    }),
                    value: "0",
                  },
                ];

        const tx = await ua.createUniversalTransaction({
          chainId: target.chainId,
          expectTokens: [
            {
              type: SUPPORTED_TOKEN_TYPE.USDC,
              amount: particleAmount,
            },
          ],
          transactions,
        });

        return summarizeTransaction(
          {
            ...base,
            method: "createUniversalTransaction",
            recipientOrContract:
              isUniversalTransferProbe
                ? target.usdc
                : approveSpender,
          },
          tx
        );
      } catch (error: any) {
        return summarizeError(
          {
            ...base,
            method:
              isTransferRailProbe
                ? "createTransferTransaction"
                : "createUniversalTransaction",
            recipientOrContract:
              isUniversalTransferProbe
                ? target.usdc
                : isTransferRailProbe
                  ? MERCHANT
                  : approveSpender,
          },
          error
        );
      }
    },
    [arbitrumInvoiceId, arbitrumReceiptEmitter, invoiceId, receiptEmitter, ua]
  );

  const runAll = useCallback(async () => {
    setResults([]);
    const probeNames: ProbeName[] = [
      "Probe A createTransferTransaction",
      "Probe B createUniversalTransaction USDC.transfer",
      "Probe C createUniversalTransaction USDC.approve",
      "Probe D createUniversalTransaction approve + payInvoice",
    ];

    const nextResults: ProbeResult[] = [];
    for (const probeName of probeNames) {
      setStatus(`Running ${probeName}...`);
      const result = await runProbe(probeName);
      nextResults.push(result);
      setResults([...nextResults]);
    }
    setStatus("Probe matrix complete. No transactions were sent.");
  }, [runProbe]);

  const runArbitrumAll = useCallback(async () => {
    setResults([]);
    const probeNames: ProbeName[] = [
      "Probe A Arbitrum createTransferTransaction",
      "Probe B Arbitrum createUniversalTransaction USDC.transfer",
      "Probe C Arbitrum createUniversalTransaction USDC.approve",
    ];
    if (arbitrumReceiptEmitter && arbitrumInvoiceId) {
      probeNames.push("Probe D Arbitrum createUniversalTransaction approve + payInvoice");
    }

    const nextResults: ProbeResult[] = [];
    for (const probeName of probeNames) {
      setStatus(`Running ${probeName}...`);
      const result = await runProbe(probeName);
      nextResults.push(result);
      setResults([...nextResults]);
    }
    setStatus("Arbitrum probe matrix complete. No transactions were sent.");
  }, [arbitrumInvoiceId, arbitrumReceiptEmitter, runProbe]);

  // --- EIP-7702 probe (Section D matrix) ---
  const refreshDelegation = useCallback(
    async (uaInstance?: any) => {
      const target = uaInstance ?? ua7702;
      if (!target) return;
      try {
        const deployments = await target.getEIP7702Deployments();
        const base = (deployments || []).find((d: any) => d.chainId === BASE_MAINNET_CHAIN_ID);
        setDelegationStatus(
          `Base ${BASE_MAINNET_CHAIN_ID} isDelegated=${base?.isDelegated ?? false} | ${JSON.stringify(deployments)}`
        );
      } catch (error: any) {
        setDelegationStatus(`error: ${error?.message ?? String(error)}`);
      }
    },
    [ua7702]
  );

  // Step 1-2: connect in EIP-7702 mode (EOA becomes the UA), read balance + delegation.
  const connect7702 = useCallback(async () => {
    if (!magic) return;
    setSevenStatus("Connecting Magic in 7702 mode...");
    await loadSDKs();

    const loggedIn = await magic.user.isLoggedIn();
    if (!loggedIn) await magic.auth.loginWithMagicLink({ email });

    const eoa = await resolveMagicEoa(magic);
    if (!eoa) throw new Error("Magic did not return an address");
    setOwnerAddress(eoa);

    const ua7 = new UniversalAccountCtor({
      projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
      projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
      projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
      smartAccountOptions: {
        useEIP7702: true,
        name: "UNIVERSAL",
        version: UNIVERSAL_ACCOUNT_VERSION,
        ownerAddress: eoa,
      },
      tradeConfig: { slippageBps: 100, universalGas: false },
    });
    setUa7702(ua7);

    try {
      const options = await ua7.getSmartAccountOptions();
      // In 7702 mode the EVM UA address should equal the owner EOA.
      setUa7702Address(options?.smartAccountAddress ?? null);
    } catch {
      setUa7702Address(null);
    }

    try {
      const assets = await ua7.getPrimaryAssets();
      setPrimaryAssets7702(`loaded (total USD: ${assets?.totalAmountInUSD ?? "n/a"})`);
    } catch (error: any) {
      setPrimaryAssets7702(`error: ${error?.message ?? String(error)}`);
    }

    await refreshDelegation(ua7);
    setSevenStatus("Connected in 7702 mode. Funds + delegation read from the EOA itself.");
  }, [email, magic, refreshDelegation]);

  // Step 3: inspect the chain-specific authorization params without signing.
  const inspectAuth = useCallback(async () => {
    if (!ua7702) {
      setSevenStatus("Connect in 7702 mode first.");
      return;
    }
    try {
      const auth = await ua7702.getEIP7702Auth([BASE_MAINNET_CHAIN_ID]);
      setSevenStatus(`getEIP7702Auth(Base): ${JSON.stringify(auth)}`);
    } catch (error: any) {
      setSevenStatus(`getEIP7702Auth error: ${error?.message ?? String(error)}`);
    }
  }, [ua7702]);

  // Step 5: build (no send) a transfer in 7702 mode. This is the key test for whether
  // the V2 migration still returns -32801 in proper EIP-7702 mode.
  const build7702Transfer = useCallback(async () => {
    if (!ua7702) {
      setSevenStatus("Connect in 7702 mode first.");
      return;
    }
    setSevenStatus("Building 7702 transfer preview (no send)...");
    const base = {
      probeName: "Probe E 7702 createTransferTransaction (Base)" as ProbeName,
      network: "Base" as const,
      method: "createTransferTransaction (7702 mode)",
      chainId: BASE_MAINNET_CHAIN_ID,
      token: BASE_MAINNET_USDC,
      amountAtomic: PROBE_AMOUNT_ATOMIC,
      recipientOrContract: MERCHANT,
      stage: "build" as const,
    };
    try {
      const tx = await ua7702.createTransferTransaction({
        token: { chainId: BASE_MAINNET_CHAIN_ID, address: BASE_MAINNET_USDC },
        amount: "0.01",
        receiver: MERCHANT,
      });
      setResults((prev) => [...prev, summarizeTransaction(base, tx)]);
      setSevenStatus("7702 transfer preview built (no send). See Probe Results.");
    } catch (error: any) {
      setResults((prev) => [...prev, summarizeError(base, error)]);
      setSevenStatus("7702 transfer preview failed. See Probe Results for the exact error.");
    }
  }, [ua7702]);

  // Step 4: real one-time delegation (sends a Type-4 tx, costs gas). Split from the
  // payment to avoid the AA24 error seen when combining delegation + transaction.
  const delegateOnBase = useCallback(async () => {
    if (!ua7702 || !magic || !ownerAddress) {
      setSevenStatus("Connect in 7702 mode first.");
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "This sends a REAL EIP-7702 delegation transaction on Base and costs gas on the EOA. Continue?"
      )
    ) {
      return;
    }
    setSevenStatus("Delegating EOA on Base (sending Type-4 tx)...");
    try {
      await magic.evm.switchChain(BASE_MAINNET_CHAIN_ID);
      const [auth] = await ua7702.getEIP7702Auth([BASE_MAINNET_CHAIN_ID]);
      const authorization = await magic.wallet.sign7702Authorization({
        contractAddress: auth.address,
        chainId: BASE_MAINNET_CHAIN_ID,
        nonce: auth.nonce + 1,
      });
      const delegationTx = await magic.wallet.send7702Transaction({
        to: ownerAddress,
        data: "0x",
        authorizationList: [authorization],
      });
      setSevenStatus(`Delegation tx submitted: ${JSON.stringify(delegationTx)}`);
      await refreshDelegation();
    } catch (error: any) {
      setSevenStatus(`Delegation failed: ${error?.message ?? String(error)}`);
    }
  }, [ua7702, magic, ownerAddress, refreshDelegation]);

  if (!enabled) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-6">
          <h1 className="text-xl font-bold">Particle Probe Disabled</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set <code>NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true</code> locally to enable this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-lg border bg-white p-5">
          <h1 className="text-xl font-bold">Particle UA Probe Matrix</h1>
          <p className="mt-1 text-sm text-gray-600">
            Local debug only. This page builds previews/rootHash only and never sends transactions.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="block text-gray-600">Magic email</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="block text-gray-600">Invoice id for Probe D</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
                value={invoiceId}
                onChange={(event) => setInvoiceId(event.target.value)}
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block text-gray-600">Arbitrum invoice id for optional Probe D</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
                value={arbitrumInvoiceId}
                onChange={(event) => setArbitrumInvoiceId(event.target.value)}
                placeholder="Only needed if ReceiptEmitter is deployed on Arbitrum"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={connect}
              disabled={!magic}
            >
              Connect Magic + UA
            </button>
            <button
              className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={runAll}
              disabled={!ua}
            >
              Run Base Probe Matrix
            </button>
            <button
              className="rounded bg-purple-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={runArbitrumAll}
              disabled={!ua}
            >
              Run Arbitrum Probe Matrix
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-700">{status}</p>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="text-base font-semibold">EIP-7702 Delegation Probe (Section D)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Connects in true EIP-7702 mode (the EOA itself becomes the Universal Account).
            Build/read steps send nothing; only &ldquo;Delegate EOA on Base&rdquo; sends a real
            Type-4 transaction and costs gas.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={connect7702}
              disabled={!magic}
            >
              Connect in 7702 mode
            </button>
            <button
              className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={inspectAuth}
              disabled={!ua7702}
            >
              Inspect getEIP7702Auth (Base)
            </button>
            <button
              className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={build7702Transfer}
              disabled={!ua7702}
            >
              Build transfer in 7702 (no send)
            </button>
            <button
              className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={delegateOnBase}
              disabled={!ua7702}
            >
              Delegate EOA on Base (SENDS tx)
            </button>
          </div>

          <pre className="mt-4 overflow-auto rounded bg-gray-50 p-3 text-xs">
{`7702 UA address (should equal EOA): ${ua7702Address ?? "not connected"}
owner EOA: ${ownerAddress ?? "not connected"}
getPrimaryAssets (7702 / EOA): ${primaryAssets7702}
delegation status: ${delegationStatus}
status: ${sevenStatus}`}
          </pre>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="text-base font-semibold">Environment</h2>
          <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs">
{`Particle UA SDK version: 1.1.1
Magic SDK version: 33.7.1 (@magic-ext/evm 1.5.0)
Next version: 14.2.35
ownerAddress: ${ownerAddress ?? "not connected"}
UA address if available: ${uaAddress ?? "not available"}
getPrimaryAssets: ${primaryAssetsStatus}
Base chain id: ${BASE_MAINNET_CHAIN_ID}
Base USDC: ${BASE_MAINNET_USDC}
Base ReceiptEmitter: ${receiptEmitter ?? "not configured"}
Base invoiceId: ${invoiceId}
Arbitrum chain id: ${ARBITRUM_MAINNET_CHAIN_ID}
Arbitrum USDC: ${ARBITRUM_MAINNET_USDC}
Arbitrum ReceiptEmitter: ${arbitrumReceiptEmitter ?? "not configured"}
Arbitrum invoiceId: ${arbitrumInvoiceId || "not configured"}
Merchant: ${MERCHANT}`}
          </pre>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="text-base font-semibold">Probe Results</h2>
          <div className="mt-3 space-y-3">
            {results.map((result) => (
              <details key={result.probeName} open className="rounded border p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  {result.probeName}: {result.createdTransaction ? "created" : "failed"}
                </summary>
                <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs">
{`${result.probeName}:
- result: ${result.createdTransaction ? "created transaction" : "failed"}
- network: ${result.network}
- method: ${result.method}
- chainId: ${result.chainId}
- token: ${result.token}
- amountAtomic: ${result.amountAtomic}
- recipient/contract: ${result.recipientOrContract}
- rootHash: ${formatReportLine(result.rootHashPresent)}
- userOps length: ${result.userOpsLength}
- userOp keys: ${formatReportLine(result.userOpKeys)}
- hasEip7702Auth: ${formatReportLine(result.hasEip7702Auth)}
- eip7702Delegated: ${formatReportLine(result.eip7702Delegated)}
- feeQuotes present: ${formatReportLine(result.feeQuotesPresent)}
- tokenChanges present: ${formatReportLine(result.tokenChangesPresent)}
- stage: ${result.stage}
- Particle maintenance error: ${formatReportLine(result.isParticleMaintenanceError)}
- error code: ${formatReportLine(result.exactErrorCode)}
- error: ${formatReportLine(result.exactErrorMessage)}`}
                </pre>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-600">Raw result/error</summary>
                  <pre className="mt-2 max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs">
                    {JSON.stringify(result.raw, null, 2)}
                  </pre>
                </details>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
