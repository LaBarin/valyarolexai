// Smart Rewrite Tools — rewrites a piece of marketing copy in a chosen tone.
// Charges 1 credit per call (skipped for active subscribers / platform owners).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chargeOrSubscribe, envFromRequest, refundCredits } from "../_shared/entitlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_INPUT = 2000;

// Each preset is a directive appended to a base system prompt. The model is
// instructed to return ONLY the rewritten text — no preamble, no quotes.
const TONE_PRESETS: Record<string, string> = {
  persuasive:
    "Rewrite to be sharper and more persuasive. Lead with a benefit. Use active voice and a clear value proposition.",
  urgent:
    "Rewrite with urgency. Emphasize scarcity or time-sensitivity. Push the reader to act now without sounding desperate.",
  luxury:
    "Rewrite in a refined, premium tone. Prefer elegant, understated language. Suggest exclusivity and craftsmanship.",
  funny:
    "Rewrite with light, witty humor. Stay tasteful — playful rather than goofy. Keep the core message intact.",
  emotional:
    "Rewrite to evoke emotion. Use vivid sensory language and speak to the reader's feelings, hopes, or pain points.",
  tiktok:
    "Rewrite for a TikTok audience: short punchy sentences, casual vocabulary, hook-first, trend-aware.",
  linkedin:
    "Rewrite for a LinkedIn audience: professional, insight-driven, slightly formal, focused on value or thought leadership.",
  facebook:
    "Rewrite for Facebook lead generation: friendly, benefit-led, conversational, with an implicit call to action.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const tone = typeof body?.tone === "string" ? body.tone : "";
    const fieldHint = typeof body?.fieldHint === "string" ? body.fieldHint.slice(0, 80) : "";

    if (!text || text.length > MAX_INPUT) {
      return new Response(JSON.stringify({ error: "Text must be 1–2000 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const directive = TONE_PRESETS[tone];
    if (!directive) {
      return new Response(JSON.stringify({ error: "Unknown tone preset." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1 credit per rewrite. Cheap, but not free.
    const env = envFromRequest(body);
    const charge = await chargeOrSubscribe({
      userId: user.id,
      amount: 1,
      description: `Smart Rewrite (${tone})`,
      env,
    });
    if (!charge.ok) {
      return new Response(JSON.stringify({ error: "insufficient_credits" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = [
      "You are a senior copywriter rewriting marketing copy for an AI-powered ad platform.",
      directive,
      "Match the original length within ±25%. Preserve any brand or product names.",
      fieldHint ? `Field type: ${fieldHint}.` : "",
      "Return ONLY the rewritten text. No quotes, no preamble, no explanation.",
    ].filter(Boolean).join(" ");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!aiResp.ok) {
      // Refund the credit if the gateway failed.
      await refundCredits(user.id, 1, `Refund: rewrite failed (${aiResp.status})`);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted on platform. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errTxt = await aiResp.text();
      console.error("rewrite-content gateway error:", aiResp.status, errTxt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const rewritten = (data?.choices?.[0]?.message?.content ?? "").trim()
      // Strip wrapping quotes if the model added any despite the instruction.
      .replace(/^["“”']+|["“”']+$/g, "")
      .trim();

    if (!rewritten) {
      await refundCredits(user.id, 1, "Refund: empty rewrite");
      return new Response(JSON.stringify({ error: "Empty response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ rewritten, tone }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rewrite-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
