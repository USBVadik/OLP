# Deploy checklist — OneLink Pay on Vercel

Last updated: 2026-06-21

This is a living preview deploy: every push to the branch auto-redeploys. It is **not** a
frozen "final" — keep shipping during the workshop and Vercel rebuilds each commit.

Stack facts that make this zero-config:
- Next.js 14 (App Router), standard SSR/serverless — no `output: export`, no `basePath`.
- Vercel auto-detects **pnpm** from `pnpm-lock.yaml` and runs `next build`.
- Secrets are safe for a GitHub-based deploy: only `.env.example` is tracked; `.env.local`
  and `.secrets/` are gitignored. **Never** paste secrets into the repo — use Vercel env vars.

---

## 0. Pre-flight (already green)
- [x] `corepack pnpm typecheck` — 0 errors
- [x] `corepack pnpm lint` — 0 warnings
- [x] `corepack pnpm build` — compiled, 12/12 static, 21 routes
- [x] secrets gitignored (`.env.local`, `.secrets/`)
- [x] debug routes gated on `NEXT_PUBLIC_ENABLE_DEBUG_PROBES`

## 1. Import the project (your Vercel account — same account is fine)
1. Vercel → **Add New… → Project** → import the GitHub repo `USBVadik/OLP`.
2. **Production branch**: set to `feat/eip7702-universal-account-mode` (or merge to `main`
   first and deploy `main` — your call). Framework preset auto-detects **Next.js**.
3. Leave build/install commands as default (Vercel uses pnpm + `next build`). Node 20 default is fine.
4. **Do NOT deploy yet** — add the env vars below first (NEXT_PUBLIC_* are baked at build time).

## 2. Environment variables

### A) Public — `NEXT_PUBLIC_*` (baked at BUILD time → change requires a redeploy)
| Var | Value / source | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_PARTICLE_PROJECT_ID` | Particle dashboard | |
| `NEXT_PUBLIC_PARTICLE_CLIENT_KEY` | Particle dashboard | |
| `NEXT_PUBLIC_PARTICLE_APP_ID` | Particle dashboard | |
| `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` | Magic dashboard (`pk_live_…`) | |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project (anon) | public by design |
| `NEXT_PUBLIC_APP_URL` | the Vercel URL | **two-phase**, see §3 |
| `NEXT_PUBLIC_DESTINATION_CHAIN_ID` | `8453` (Base) or `42161` | match your demo |
| `NEXT_PUBLIC_PAYMENT_MODE` | `transfer_fallback` \| `universal_invoice` \| `universal_7702_transfer` | the mode you demo |
| `NEXT_PUBLIC_RECEIPT_EMITTER_ADDRESS` | deployed contract | |
| `NEXT_PUBLIC_SPEND_POLICY_ADDRESS` | deployed SpendPolicy (Base) | |
| `NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM` | deployed SpendPolicy (Arbitrum) | |
| `NEXT_PUBLIC_ENABLE_DEBUG_PROBES` | **`false`** (or omit) | 🔒 keeps `/debug/*` inert (R18) |
| `NEXT_PUBLIC_BASE_RPC_URL` | `https://mainnet.base.org` or a keyed RPC | |
| `NEXT_PUBLIC_ARBITRUM_CHAIN_ID` | `42161` | |
| `NEXT_PUBLIC_ARBITRUM_USDC_ADDRESS` | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | |
| `NEXT_PUBLIC_ARBITRUM_RECEIPT_EMITTER_ADDRESS` | deployed contract | |
| `NEXT_PUBLIC_OPTIMISM_*` | optional | experimental zero-balance probe; can omit |
| `NEXT_PUBLIC_ZERODEV_PROJECT_ID` | leave empty | stretch, unused for demo |

### B) Server secrets — server-only (never prefix with `NEXT_PUBLIC_`)
| Var | Value / source | Notes |
| --- | --- | --- |
| `PARTICLE_SERVER_KEY` | Particle dashboard (server) | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (service role) | 🔒 full DB access — server-only |
| `BASE_MAINNET_RPC_URL` | server RPC (keyed provider ideal) | |
| `ARBITRUM_MAINNET_RPC_URL` | server RPC | |
| `OPTIMISM_MAINNET_RPC_URL` | optional | |
| `RECEIPT_EMITTER_OWNER_PRIVATE_KEY` | proof-signer key | 🔒 funded for gas; keep minimal |
| `RELAYER_PRIVATE_KEY` | dedicated relayer key | 🔒 **separate** from above; minimal funds |
| `RELAYER_MAX_CHARGES_PER_WINDOW` | `30` | gas guard (rolling window) |
| `RELAYER_CHARGE_WINDOW_MS` | `600000` | gas guard window |
| `ADMIN_CREATE_TOKEN` | strong random string | guards admin payment-link creation |

> Tip: set each var for the **Production** (and optionally Preview) environment.

## 3. First deploy → set `NEXT_PUBLIC_APP_URL` → redeploy
`NEXT_PUBLIC_APP_URL` powers the OpenGraph/Twitter link preview and absolute URLs, but it's
baked at build time. So it's two-phase:
1. Deploy once. Vercel gives you a URL (e.g. `https://onelink-pay.vercel.app`).
2. Set `NEXT_PUBLIC_APP_URL` to that exact URL (or your custom domain).
3. **Redeploy** so the build picks it up. (Until then, OG falls back to Vercel's auto URL,
   which still works but may differ from your final domain.)

## 4. Prod safety gates (do not skip)
- 🔒 **`NEXT_PUBLIC_ENABLE_DEBUG_PROBES` = false** at build → `/debug/cross-chain-proof`,
  `/debug/particle-probe`, `/debug/sweep-legacy-ua` render their disabled state.
- 🔒 **`/api/mandates/charge` is a PUBLIC, gas-spending endpoint.** On an open URL anyone can
  hit it. Mitigate: use a **dedicated `RELAYER_PRIVATE_KEY`** funded with only a small demo
  amount, keep the gas guard on (`RELAYER_MAX_CHARGES_PER_WINDOW` / `RELAYER_CHARGE_WINDOW_MS`),
  and fund the key with real value **only right before a demo**.
- 🔒 Keep `SUPABASE_SERVICE_ROLE_KEY` and the private keys server-only (never `NEXT_PUBLIC_`).
- 🔒 `ADMIN_CREATE_TOKEN` = a strong random value.

## 5. Post-deploy smoke test
Run the **live dry-run checklist** in `docs/demo-runbook.md` against the deployed URL:
- `/` loads; hero + OG preview (paste the URL into a chat/Discord to confirm the card).
- `/firewall` and `/agent`: Magic/Google login → arm → one charge clears → over-cap blocked
  on-chain → revoke → proof receipt.
- `/dashboard`: explorer links resolve to the correct chain (arbiscan / basescan).
- Confirm `/debug/*` shows the disabled state (gate working).

## 5.1 OAuth allowlists — required for login on a new domain (we hit BOTH)
Magic and Google each keep their own allowlist of the redirect domain, localhost-only by
default. After deploying to a new domain, **email + Google login fail until both are updated**:

1. **Magic** (dashboard.magic.link) → your app → **Settings → Allowed Origins & Redirects** →
   add the production origin `https://<domain>` to the **Domain** allowlist (keep `http://localhost`).
   The **Redirect** toggle can stay OFF — the Domain allowlist already covers the `/auth/callback`
   redirect. Symptom if missing: Magic modal *"OAuth Login Failed — Invalid redirect URL"*.
2. **Google Cloud Console** → APIs & Services → Credentials → your OAuth 2.0 **Web** client →
   **Authorized redirect URIs** → add `https://<domain>/auth/callback` (exact, no trailing slash;
   keep the localhost one). Symptom if missing: Google *"Error 400: redirect_uri_mismatch"*.

Both are dashboard-only (no redeploy needed); Google changes can take 1–2 min to apply. Always
sign in via the clean alias `https://<domain>` so `window.location.origin` matches the allowlist.

## 6. Notes
- Live deployment (this project): https://onelink-pay.vercel.app (Vercel scope `wona-s-projects`).
- Every push to the production branch auto-redeploys.
- Rollback: Vercel → Deployments → promote a previous build (instant).
- Custom domain (optional): add it in Vercel → Domains, then update `NEXT_PUBLIC_APP_URL` + redeploy.
