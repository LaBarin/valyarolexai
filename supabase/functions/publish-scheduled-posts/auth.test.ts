// E2E test for publish-scheduled-posts cron worker.
// This function is invokable but only the service role can mutate posts;
// the function itself uses the service-role key internally.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN = `${SUPABASE_URL}/functions/v1/publish-scheduled-posts`;

Deno.test("OPTIONS preflight ok", async () => {
  const r = await fetch(FN, { method: "OPTIONS" });
  await r.text();
  assertEquals(r.status, 200);
});

Deno.test("invocation returns processed result envelope", async () => {
  // verify_jwt = false for this function (cron). Anyone with anon key can ping it.
  const r = await fetch(FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: "{}",
  });
  const body = await r.json();
  assert(r.ok, `expected ok got ${r.status}: ${JSON.stringify(body)}`);
  assert("processed" in body, "missing processed field");
  assert(Array.isArray(body.results), "results must be array");
});
