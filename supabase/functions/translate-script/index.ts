// Translate Script — translates an entire video script (title, description,
// hook, CTA, ad_copy and per-scene visual + voiceover + text_overlay) into a
// target language while preserving the JSON structure. Charges 2 credits per
// translation, refunds on failure.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chargeOrSubscribe, envFromRequest, refundCredits } from "../_shared/entitlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 2;

// Allow-list of languages the UI exposes. The model can technically handle more,
// but constraining keeps the dropdown finite and audit-friendly.
const LANGUAGES: Record<string, string> = {
  es: "Spanish (Latin American)",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese (Brazilian)",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  ar: "Arabic",
  hi: "Hindi",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
  ko: "Korean",
  en: "English (US)",
};

type Scene = {
  scene_number?: number;
  duration_seconds?: number;
  visual?: string;
  text_overlay?: string;
  voiceover?: string;
  transition?: string;
  notes?: string;
  image_url?: string;
};

type Script = {
  title?: string;
  description?: string;
  hook?: string;
  cta?: string;
  ad_copy?: { headline?: string; description?: string; hashtags?: string[] };
  scenes?: Scene[];
  // Pass-through unknown fields untouched.
  [k: string]: any;
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
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const script: Script | null = body?.script && typeof body.script === "object" ? body.script : null;
    const target = typeof body?.target === "string" ? body.target : "";
    const targetName = LANGUAGES[target];

    if (!script) {
      return new Response(JSON.stringify({ error: "Missing script payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!targetName) {
      return new Response(JSON.stringify({ error: "Unsupported target language" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hard cap on payload size — refuse anything truly huge to prevent runaway cost.
    const sceneCount = Array.isArray(script.scenes) ? script.scenes.length : 0;
    if (sceneCount > 30) {
      return new Response(JSON.stringify({ error: "Script too long (max 30 scenes)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = envFromRequest(body);
    const charge = await chargeOrSubscribe({
      userId: user.id,
      amount: CREDIT_COST,
      description: `Translate script (${target})`,
      env,
    });
    if (!charge.ok) {
      return new Response(JSON.stringify({ error: "insufficient_credits" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await refundCredits(user.id, CREDIT_COST, "Refund: AI gateway misconfigured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use tool-calling so we get back a strictly-shaped object.
    const systemPrompt = [
      `You are a senior advertising copy translator. Translate every text field from the input video script into ${targetName}.`,
      "Rules:",
      "- Keep brand names, URLs, phone numbers, hashtags and proper nouns unchanged.",
      "- Match the original length within ±20% so on-screen captions still fit.",
      "- Preserve marketing punch — do not soften CTAs.",
      "- Do NOT translate image_url or transition values.",
      "- Return ONLY the translated payload via the provided tool.",
    ].join("\n");

    const toolSchema = {
      type: "function" as const,
      function: {
        name: "return_translation",
        description: `Return the script with text fields translated into ${targetName}.`,
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            hook: { type: "string" },
            cta: { type: "string" },
            ad_copy: {
              type: "object",
              properties: {
                headline: { type: "string" },
                description: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
              },
              additionalProperties: false,
            },
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scene_number: { type: "number" },
                  visual: { type: "string" },
                  text_overlay: { type: "string" },
                  voiceover: { type: "string" },
                  notes: { type: "string" },
                },
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
      },
    };

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
          { role: "user", content: JSON.stringify(script) },
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "return_translation" } },
      }),
    });

    if (!aiResp.ok) {
      await refundCredits(user.id, CREDIT_COST, `Refund: translate failed (${aiResp.status})`);
      const status = aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500;
      const msg = aiResp.status === 429
        ? "Rate limited, please try again in a moment."
        : aiResp.status === 402
        ? "AI credits exhausted on platform."
        : "AI gateway error";
      console.error("translate-script gateway error:", aiResp.status, await aiResp.text());
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    let translated: any = null;
    if (typeof argsStr === "string") {
      try { translated = JSON.parse(argsStr); } catch { /* fallthrough */ }
    }
    if (!translated || typeof translated !== "object") {
      await refundCredits(user.id, CREDIT_COST, "Refund: empty translation");
      return new Response(JSON.stringify({ error: "Empty response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Merge translated fields back over the original script — preserves
    // image_url, transitions, durations, last_render_meta, etc.
    const merged: Script = { ...script };
    if (translated.title) merged.title = translated.title;
    if (translated.description) merged.description = translated.description;
    if (translated.hook) merged.hook = translated.hook;
    if (translated.cta) merged.cta = translated.cta;
    if (translated.ad_copy) merged.ad_copy = { ...(script.ad_copy ?? {}), ...translated.ad_copy };

    if (Array.isArray(script.scenes) && Array.isArray(translated.scenes)) {
      merged.scenes = script.scenes.map((orig, i) => {
        const tr = translated.scenes.find((s: Scene) =>
          s?.scene_number === orig?.scene_number,
        ) ?? translated.scenes[i] ?? {};
        return {
          ...orig,
          ...(tr.visual ? { visual: tr.visual } : {}),
          ...(tr.text_overlay !== undefined ? { text_overlay: tr.text_overlay } : {}),
          ...(tr.voiceover ? { voiceover: tr.voiceover } : {}),
          ...(tr.notes ? { notes: tr.notes } : {}),
        };
      });
    }

    return new Response(JSON.stringify({ script: merged, target, targetName }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
