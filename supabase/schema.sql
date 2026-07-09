-- Supabase SQL schema for OneLink Pay
-- Run this in Supabase SQL Editor

-- Merchants
create table if not exists merchants (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  name text,
  created_at timestamptz default now()
);

-- Payment Links
create table if not exists payment_links (
  id uuid primary key default gen_random_uuid(),
  merchant_id text not null,
  merchant_address text not null,
  amount text not null,
  token text not null,
  destination_token_address text,
  destination_chain_id integer not null default 8453,
  label text,
  status text not null default 'active' check (status in ('active', 'expired', 'completed', 'failed')),
  contract_invoice_id text,
  receipt_emitter_address text,
  registered_tx_hash text,
  paid_tx_hash text,
  paid_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- Payments
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  payment_link_id uuid references payment_links(id),
  payer_address text not null,
  source_chain_id integer not null,
  destination_chain_id integer not null,
  token text not null,
  amount text not null,
  tx_hash text,
  receipt_tx_hash text,
  ua_transaction_id text,
  preview_json jsonb,
  error_message text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Indexes
create index if not exists idx_payment_links_merchant on payment_links(merchant_id);
create index if not exists idx_payments_link on payments(payment_link_id);
create index if not exists idx_payments_status on payments(status);

-- Milestone B migration helpers for existing Supabase projects
alter table if exists payment_links add column if not exists destination_token_address text;
alter table if exists payment_links add column if not exists contract_invoice_id text;
alter table if exists payment_links add column if not exists receipt_emitter_address text;
alter table if exists payment_links add column if not exists registered_tx_hash text;
alter table if exists payment_links add column if not exists paid_tx_hash text;
alter table if exists payment_links add column if not exists paid_at timestamptz;
alter table if exists payment_links add column if not exists error_message text;
alter table if exists payment_links drop constraint if exists payment_links_status_check;
alter table if exists payment_links
  add constraint payment_links_status_check
  check (status in ('active', 'expired', 'completed', 'failed'));

alter table if exists payments add column if not exists preview_json jsonb;
alter table if exists payments add column if not exists error_message text;
alter table if exists payments add column if not exists ua_transaction_id text;
alter table if exists payments drop constraint if exists payments_status_check;
alter table if exists payments
  add constraint payments_status_check
  check (status in ('pending', 'processing', 'completed', 'failed'));

-- Explicit Data API grants for Supabase PostgREST / supabase-js compatibility.
-- Required for new Supabase projects after 2026-05-30 and existing projects after 2026-10-30.
--
-- Least-privilege (audit-remediation-pass2): the app reads payment_links/payments ONLY via the
-- server-side service_role client (`supabaseAdmin`) — the public anon client (`supabase`) is unused
-- (no importer, no `.from`/`.rpc`/`.auth` call). So anon gets NO table access and RLS is enabled
-- deny-by-default on all three tables. service_role bypasses RLS, so the server-rendered
-- /receipt/[id] and every /api route keep working unchanged. This closes the prior exposure where
-- a public anon key could read all payer addresses, tx hashes, preview JSON, and error messages.

grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant usage on schema public to service_role;

-- anon: schema usage only. Intentionally NO table SELECT (a public anon key must not read the
-- payments / payment_links tables). On an existing project that previously granted it, revoke:
--   revoke select on public.payment_links, public.payments from anon;

grant select
  on public.merchants,
     public.payment_links,
     public.payments
  to authenticated;

grant select, insert, update, delete
  on public.merchants,
     public.payment_links,
     public.payments
  to service_role;

grant usage, select
  on all sequences in schema public
  to authenticated;

grant usage, select
  on all sequences in schema public
  to service_role;

-- Row Level Security: deny-by-default. No anon/authenticated row policy is defined, so PostgREST
-- callers (anon/authenticated keys) see ZERO rows; service_role bypasses RLS and serves the app.
alter table public.merchants      enable row level security;
alter table public.payment_links  enable row level security;
alter table public.payments       enable row level security;

-- ── Apply on an EXISTING Supabase project (run once in the SQL editor) ───────────────────────────
--   revoke select on public.payment_links, public.payments from anon;
--   alter table public.merchants      enable row level security;
--   alter table public.payment_links  enable row level security;
--   alter table public.payments       enable row level security;
-- Post-apply check:
--   1. With the ANON key, `select * from payments limit 1` must return 0 rows (RLS denies).
--   2. The public /receipt/[id] page (server-rendered via service_role) must still render a
--      completed payment.

-- ── x402 replay protection (audit: x402 consume-store) ───────────────────────────────────────────
-- A verified proof (settlement tx_hash) unlocks ONE x402 resource exactly once. The route inserts
-- the tx_hash here BEFORE delivering; UNIQUE(tx_hash) makes a replayed OR cross-resource reuse of
-- the same proof collide and get rejected (on-chain MandateCharged does not bind to a resource id,
-- so uniqueness is on tx_hash alone). Written only by the server-side service_role client.
create table if not exists x402_consumed (
  id uuid primary key default gen_random_uuid(),
  tx_hash text not null,
  resource text not null,
  consumed_at timestamptz default now(),
  unique (tx_hash)
);

grant select, insert on public.x402_consumed to service_role;
alter table public.x402_consumed enable row level security;

-- ── Apply on an EXISTING Supabase project (run once in the SQL editor) ────────────────────────────
--   create table if not exists x402_consumed (
--     id uuid primary key default gen_random_uuid(),
--     tx_hash text not null,
--     resource text not null,
--     consumed_at timestamptz default now(),
--     unique (tx_hash)
--   );
--   grant select, insert on public.x402_consumed to service_role;
--   alter table public.x402_consumed enable row level security;
