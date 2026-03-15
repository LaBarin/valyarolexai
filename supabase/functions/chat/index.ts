import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://valyarolexai.lovable.app",
  "https://www.valyarolexai.com",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

const MAX_MESSAGES = 20;
const MAX_MSG_LENGTH = 4000;
const ALLOWED_MODES = ["chat", "workflow", "pitch_deck", "campaign"];

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Authentication ---
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

    // --- Input Validation ---
    const { messages, mode } = await req.json();

    if (!ALLOWED_MODES.includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: "Invalid or too many messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize: only allow user/assistant roles, trim content length
    const sanitized = messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, MAX_MSG_LENGTH) }));

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- AI Request ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      chat: `You are Valyarolex.AI, an intelligent productivity assistant. You help users manage their workflows, schedule tasks, draft emails, and automate repetitive work. Be concise, professional, and proactive. Use markdown formatting for clarity.`,
      workflow: `You are Valyarolex.AI's workflow builder assistant. When a user describes a workflow in natural language, respond with a structured workflow in this exact JSON format:
{
  "trigger": "description of the trigger event",
  "steps": [
    { "label": "step description", "type": "email|calendar|document|message|automation" }
  ],
  "summary": "brief one-line summary of the workflow"
}
Always respond with valid JSON only, no other text.`,
      pitch_deck: `You are Valyarolex.AI's pitch deck generator. When a user describes their business, product, or idea, generate a professional pitch deck as a JSON array of slides. Each slide should have this format:
{
  "slides": [
    {
      "slide_type": "title|problem|solution|market|product|traction|business_model|team|financials|ask|closing",
      "title": "Slide Title",
      "content": {
        "headline": "Main headline text",
        "body": "Body text or description",
        "bullets": ["bullet point 1", "bullet point 2"],
        "metric": "key metric if applicable",
        "metric_label": "label for the metric"
      }
    }
  ],
  "deck_title": "Name of the deck",
  "deck_description": "One-line description"
}
Generate 8-12 slides for a compelling investor pitch. Always respond with valid JSON only.`,
      campaign: `You are Valyarolex.AI's marketing campaign strategist. When a user describes their campaign goals, generate a comprehensive marketing campaign plan as JSON:
{
  "name": "Campaign name",
  "description": "Campaign overview",
  "campaign_type": "product_launch|brand_awareness|lead_gen|event|seasonal|content",
  "target_audience": "Audience description",
  "goals": [{"goal": "description", "metric": "KPI", "target": "target value"}],
  "channels": [{"channel": "social|email|content|paid_ads|pr|events", "strategy": "channel strategy", "budget_pct": 25}],
  "content_plan": [
    {"title": "Content piece title", "type": "blog|social_post|email|video|ad|infographic", "channel": "channel name", "description": "what this content covers", "week": 1}
  ],
  "schedule": {"duration_weeks": 8, "phases": [{"name": "Phase name", "weeks": "1-2", "focus": "phase focus"}]}
}
Generate a detailed, actionable campaign. Always respond with valid JSON only.`,
    };

    const systemContent = systemPrompts[mode];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...sanitized,
        ],
        stream: mode === "chat",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "workflow" || mode === "pitch_deck" || mode === "campaign") {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      return new Response(JSON.stringify({ result: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
