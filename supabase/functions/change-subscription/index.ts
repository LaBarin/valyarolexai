// Swap an existing subscriber to a different plan via Paddle (prorated, immediate).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { gatewayFetch, getPaddleClient, type PaddleEnv } from "../_shared/paddle.ts";

const responseHeaders = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Content-Type": "application/json",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, responseHeaders);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, ...responseHeaders });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, ...responseHeaders });

    const { newPriceId } = await req.json();
    if (!newPriceId || typeof newPriceId !== "string") {
      return new Response(JSON.stringify({ error: "newPriceId required" }), { status: 400, ...responseHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id, environment, price_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({ error: "No active subscription" }), { status: 404, ...responseHeaders });
    }
    if (sub.price_id === newPriceId) {
      return new Response(JSON.stringify({ error: "Already on this plan" }), { status: 400, ...responseHeaders });
    }

    const env = sub.environment as PaddleEnv;

    // Resolve external_id -> Paddle internal price id
    const lookup = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(newPriceId)}`);
    const lookupData = await lookup.json();
    if (!lookupData.data?.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), { status: 404, ...responseHeaders });
    }
    const paddlePriceId = lookupData.data[0].id;

    const paddle = getPaddleClient(env);
    const updated = await paddle.subscriptions.update(sub.paddle_subscription_id, {
      items: [{ priceId: paddlePriceId, quantity: 1 }],
      prorationBillingMode: "prorated_immediately",
    });

    return new Response(JSON.stringify({ ok: true, status: updated.status }), responseHeaders);
  } catch (e) {
    console.error("change-subscription error:", e);
    return new Response(
      JSON.stringify({ error: "Unable to change your subscription. Please try again or contact support." }),
      { status: 500, ...responseHeaders },
    );
  }
});
