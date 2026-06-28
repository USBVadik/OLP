import test from "node:test";
import assert from "node:assert/strict";

// Regression guard for the build failure seen on Vercel ("supabaseUrl is required" during
// `next build` → collect page data). The client module MUST NOT construct a Supabase client
// at import time, or any build/clone without env crashes. These tests remove the env and
// assert the module imports cleanly and only fails — with a clear, named error — on actual use.

test("supabase client module imports without env (build-safe, lazy)", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  const mod = await import("./client");
  assert.ok(mod.supabase, "supabase export exists without constructing a client");
  assert.ok(mod.supabaseAdmin, "supabaseAdmin export exists without constructing a client");
});

test("supabase client surfaces a clear, named error only when used without env", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { supabaseAdmin } = await import("./client");
  // Touching a property triggers lazy construction, which should throw our explicit error —
  // never the cryptic "supabaseUrl is required" that killed the build.
  assert.throws(
    () => supabaseAdmin.from("payments"),
    /Missing required env: NEXT_PUBLIC_SUPABASE_URL/,
  );
});
