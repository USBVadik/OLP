"use client";

import { useCallback, useMemo, useState } from "react";
import { BASE_CHAIN, getExplorerTxUrl, getPublicRpcUrl } from "@/lib/config/payment";

const OWNER_EMAIL = "usbvadik@gmail.com";
const EXPECTED_OWNER = "0x53Bd615635Af778e5E460d5EEC2d6b234693206a";
const LEGACY_UA = "0xeE1FB8b1d24d658F39D1AFEc50a82D0c306c0246";
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const SEND_CONFIRMATION = "SWEEP LEGACY UA";

let MagicCtor: any = null;
let EVMExtensionCtor: any = null;
let UniversalAccountCtor: any = null;

interface LogEntry {
  at: string;
  stage: string;
  status: string;
  data?: unknown;
}

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
  }
}

async function resolveMagicEoa(magic: any): Promise<string | null> {
  try {
    const meta = await magic.user.getInfo();
    const fromMeta = meta?.publicAddress ?? meta?.wallets?.ethereum?.publicAddress;
    if (fromMeta) return fromMeta;
  } catch {
    /* fall through */
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

function shortAddress(address: string | null | undefined) {
  if (!address) return "not connected";
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
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
    for (const [key, item] of Object.entries(value)) {
      const found = extractEvmTxHash(item, key);
      if (found) return found;
    }
  }
  return null;
}

function getBaseUsdcBalance(assets: any) {
  const usdc = assets?.assets?.find((asset: any) => asset.tokenType === "usdc");
  const base = usdc?.chainAggregation?.find((entry: any) => entry.token?.chainId === BASE_CHAIN.chainId);
  return base?.amount ?? "unknown";
}

export default function SweepLegacyUaPage() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG_PROBES === "true";
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [amount, setAmount] = useState("1.45");
  const [magic, setMagic] = useState<any>(null);
  const [ua, setUa] = useState<any>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [assets, setAssets] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [sendConfirmation, setSendConfirmation] = useState("");
  const [sendResult, setSendResult] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((stage: string, status: string, data?: unknown) => {
    setLogs((entries) => [{ at: new Date().toLocaleTimeString(), stage, status, data }, ...entries]);
  }, []);

  const baseUsdcBalance = useMemo(() => getBaseUsdcBalance(assets), [assets]);
  const canSend = Boolean(preview?.rootHash) && sendConfirmation === SEND_CONFIRMATION && !busy;

  const handleConnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    addLog("connect", "starting", { email });
    try {
      await loadSDKs();
      addLog("connect", "sdk loaded");
      const instance = new MagicCtor(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!, {
        extensions: [
          new EVMExtensionCtor([
            {
              rpcUrl: getPublicRpcUrl(BASE_CHAIN),
              chainId: BASE_CHAIN.chainId,
              default: true,
            },
          ]),
        ],
      });

      // Use the same login method as the (proven) checkout page. loginWithEmailOTP was
      // failing silently here; loginWithMagicLink is the path known to work with this key.
      await instance.auth.loginWithMagicLink({ email });
      const resolved = await resolveMagicEoa(instance);
      if (!resolved) throw new Error("Magic did not return an EVM address");
      if (resolved.toLowerCase() !== EXPECTED_OWNER.toLowerCase()) {
        throw new Error(`Wrong Magic owner: expected ${EXPECTED_OWNER}, got ${resolved}`);
      }

      const universalAccount = new UniversalAccountCtor({
        projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
        projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
        projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
        ownerAddress: resolved,
      });
      const primaryAssets = await universalAccount.getPrimaryAssets();

      setMagic(instance);
      setUa(universalAccount);
      setOwnerAddress(resolved);
      setAssets(primaryAssets);
      setPreview(null);
      setSendResult(null);
      setTxHash(null);
      addLog("connect", "ok", {
        ownerAddress: resolved,
        legacyUa: LEGACY_UA,
        baseUsdcBalance: getBaseUsdcBalance(primaryAssets),
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
      addLog("connect", "error", err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }, [addLog, email]);

  const handleBuildPreview = useCallback(async () => {
    if (!ua) return;
    setBusy(true);
    setError(null);
    try {
      const transaction = await ua.createTransferTransaction({
        token: { chainId: BASE_CHAIN.chainId, address: BASE_USDC },
        amount,
        receiver: EXPECTED_OWNER,
      });
      setPreview(transaction);
      setSendResult(null);
      setTxHash(null);
      addLog("buildPreview", "ok", {
        transactionId: transaction.transactionId,
        rootHashPresent: Boolean(transaction.rootHash),
        sender: transaction.sender,
        receiver: transaction.receiver,
        tokenChanges: transaction.tokenChanges,
        userOps: (transaction.userOps ?? []).map((op: any) => ({
          chainId: op.chainId,
          userOpHash: op.userOpHash,
          hasEip7702Auth: Boolean(op.eip7702Auth),
          eip7702Delegated: op.eip7702Delegated ?? null,
        })),
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
      addLog("buildPreview", "error", {
        message: err?.message,
        code: err?.code,
        response: err?.response?.data,
      });
    } finally {
      setBusy(false);
    }
  }, [addLog, amount, ua]);

  const handleSend = useCallback(async () => {
    if (!magic || !ua || !preview?.rootHash || !ownerAddress) return;
    setBusy(true);
    setError(null);
    try {
      const signature = await magic.rpcProvider.request({
        method: "personal_sign",
        params: [preview.rootHash, ownerAddress],
      });
      addLog("signRootHash", "ok", { rootHash: preview.rootHash, signature: `${signature.slice(0, 20)}...` });
      const result = await ua.sendTransaction(preview, signature);
      setSendResult(result);
      addLog("sendTransaction", "ok", result);

      let foundTxHash = extractEvmTxHash(result);
      if (!foundTxHash && preview.transactionId) {
        for (let attempt = 0; attempt < 15 && !foundTxHash; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const status = await ua.getTransaction(preview.transactionId);
          foundTxHash = extractEvmTxHash(status);
          addLog("pollTransaction", foundTxHash ? "tx found" : "pending", status);
        }
      }
      setTxHash(foundTxHash);

      const freshAssets = await ua.getPrimaryAssets();
      setAssets(freshAssets);
      addLog("refreshAssets", "ok", { baseUsdcBalance: getBaseUsdcBalance(freshAssets) });
    } catch (err: any) {
      setError(err?.message ?? String(err));
      addLog("sendTransaction", "error", {
        message: err?.message,
        code: err?.code,
        response: err?.response?.data,
      });
    } finally {
      setBusy(false);
    }
  }, [addLog, magic, ownerAddress, preview, ua]);

  if (!enabled) {
    return (
      <main style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
        <h1>Legacy UA sweep disabled</h1>
        <p>Set NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true to enable this local-only page.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 32, fontFamily: "system-ui, sans-serif", color: "#201C1A" }}>
      <p style={{ color: "#746D64", marginBottom: 8 }}>Local debug only</p>
      <h1 style={{ fontSize: 40, margin: "0 0 12px" }}>Sweep legacy Particle UA</h1>
      <p style={{ maxWidth: 760, lineHeight: 1.5 }}>
        Moves Base USDC from the old separate Particle UA into the active Magic EOA.
        This page only exists to consolidate dust/funds for testing.
      </p>

      <section style={{ border: "1px solid #E4D8C7", background: "#FFFDF7", borderRadius: 18, padding: 24, marginTop: 24 }}>
        <h2>Route</h2>
        <dl style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10 }}>
          <dt>From legacy UA</dt><dd style={{ fontFamily: "monospace" }}>{LEGACY_UA}</dd>
          <dt>To active EOA</dt><dd style={{ fontFamily: "monospace" }}>{EXPECTED_OWNER}</dd>
          <dt>Token</dt><dd>Base USDC</dd>
          <dt>Connected owner</dt><dd style={{ fontFamily: "monospace" }}>{shortAddress(ownerAddress)}</dd>
          <dt>Legacy UA balance</dt><dd>{baseUsdcBalance} USDC</dd>
        </dl>
      </section>

      <section style={{ border: "1px solid #E4D8C7", background: "#FFFDF7", borderRadius: 18, padding: 24, marginTop: 16 }}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Magic email
          <input value={email} onChange={(event) => setEmail(event.target.value)} style={{ display: "block", marginTop: 6, width: "100%", padding: 12, borderRadius: 10, border: "1px solid #E4D8C7" }} />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          Amount to sweep
          <input value={amount} onChange={(event) => setAmount(event.target.value)} style={{ display: "block", marginTop: 6, width: "100%", padding: 12, borderRadius: 10, border: "1px solid #E4D8C7" }} />
        </label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={handleConnect} disabled={busy} style={{ padding: "12px 18px", borderRadius: 999, border: "0", background: "#7A3E73", color: "white", fontWeight: 700 }}>
            Connect Magic + legacy UA
          </button>
          <button onClick={handleBuildPreview} disabled={busy || !ua} style={{ padding: "12px 18px", borderRadius: 999, border: "1px solid #E4D8C7", background: "#FFFDF7", fontWeight: 700 }}>
            Build preview
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #E4D8C7", background: "#FFFDF7", borderRadius: 18, padding: 24, marginTop: 16 }}>
        <h2>Send confirmation</h2>
        <p>Type <strong>{SEND_CONFIRMATION}</strong> to enable sending. This will call Particle <code>sendTransaction</code>.</p>
        <input value={sendConfirmation} onChange={(event) => setSendConfirmation(event.target.value)} placeholder={SEND_CONFIRMATION} style={{ display: "block", width: "100%", padding: 12, borderRadius: 10, border: "1px solid #E4D8C7", marginBottom: 12 }} />
        <button onClick={handleSend} disabled={!canSend} style={{ padding: "14px 22px", borderRadius: 999, border: "0", background: canSend ? "#201C1A" : "#D8D0C4", color: "white", fontWeight: 800 }}>
          Send legacy UA sweep
        </button>
      </section>

      {error ? (
        <section style={{ border: "1px solid #F1B3A8", background: "#FFF2EF", borderRadius: 18, padding: 20, marginTop: 16, color: "#A5321F" }}>
          <strong>Error</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {txHash ? (
        <section style={{ border: "1px solid #B6D8CB", background: "#E6F3ED", borderRadius: 18, padding: 20, marginTop: 16 }}>
          <strong>Sweep sent</strong>
          <p><a href={getExplorerTxUrl(BASE_CHAIN, txHash)} target="_blank" rel="noreferrer">{txHash}</a></p>
        </section>
      ) : null}

      <details style={{ marginTop: 18 }}>
        <summary>Raw preview / result / logs</summary>
        <pre style={{ overflow: "auto", background: "#1f1b18", color: "#fff", padding: 16, borderRadius: 12 }}>
{JSON.stringify({ preview, sendResult, logs }, null, 2)}
        </pre>
      </details>
    </main>
  );
}
