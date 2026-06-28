import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

// Lazily constructed singletons. Building a Supabase client at *import* time crashes
// `next build` ("collect page data") whenever an env var is absent in that environment —
// e.g. a Vercel preview without prod env, or a fresh clone with no secrets. Deferring the
// `createClient` call to first *use* keeps the build green and only requires env at request
// time. Runtime behavior is identical (same URL/keys, same no-store admin fetch, same RLS).
let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

function getAnonClient(): SupabaseClient {
  return (anonClient ??= createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  ));
}

function getAdminClient(): SupabaseClient {
  return (adminClient ??= createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      global: {
        // Server-only admin client. Force no-store so Next.js never serves cached reads —
        // e.g. the server-rendered /receipt/[id] must reflect a just-completed payment
        // (and its ua_transaction_id) immediately, not a stale "active" snapshot.
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    },
  ));
}

// Preserve the existing import API (`supabaseAdmin.from(...)`) with zero call-site changes:
// a Proxy builds the real client on first property access and binds methods to it, so the
// client is never constructed merely by importing this module.
function lazyClient(get: () => SupabaseClient): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      const client = get();
      const value = (client as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}

export const supabase = lazyClient(getAnonClient);
export const supabaseAdmin = lazyClient(getAdminClient);
