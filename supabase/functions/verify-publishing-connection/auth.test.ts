// E2E auth test harness for verify-publishing-connection.
// Validates JWT enforcement and user-scoped access.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN = `${SUPABASE_URL}/functions/v1/verify-publishing-connection`;

Deno.test("rejects requests with no Authorization header", async () => {
  const r = await fetch(FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ connection_id: "00000000-0000-0000-0000-000000000000" }),
  });
  await r.text();
  assertEquals(r.status, 401);
});

Deno.test("rejects malformed bearer token", async () => {
  const r = await fetch(FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      Authorization: "Bearer not-a-real-jwt",
    },
    body: JSON.stringify({ connection_id: "00000000-0000-0000-0000-000000000000" }),
  });
  await r.text();
  assert(r.status === 401, `expected 401 got ${r.status}`);
});

Deno.test("OPTIONS preflight returns CORS headers", async () => {
  const r = await fetch(FN, { method: "OPTIONS" });
  await r.text();
  assertEquals(r.status, 200);
  assert(r.headers.get("access-control-allow-origin"));
});
