import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const responseHeaders = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Content-Type": "application/json",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, responseHeaders);
  }

  try {
    // Require authenticated caller — prevents anonymous probing of pricing
    // via our server-side Paddle API key.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        ...responseHeaders,
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        ...responseHeaders,
      });
    }

    const { priceId, environment } = await req.json();
    if (!priceId || typeof priceId !== "string") {
      return new Response(JSON.stringify({ error: "priceId required" }), {
        status: 400,
        ...responseHeaders,
      });
    }

    const env = (environment === "live" ? "live" : "sandbox") as PaddleEnv;
    const response = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(priceId)}`);
    const data = await response.json();

    if (!data.data?.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404,
        ...responseHeaders,
      });
    }

    return new Response(JSON.stringify({ paddleId: data.data[0].id }), responseHeaders);
  } catch (e) {
    console.error("get-paddle-price error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, ...responseHeaders },
    );
  }
});
