import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_MESSAGES = 20;
const MAX_MSG_LENGTH = 4000;
const ALLOWED_MODES = ["chat", "workflow", "pitch_deck", "campaign", "video", "schedule"];

serve(async (req) => {
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

    const companyContext = `\n\nIMPORTANT CONTEXT: Valyarolex.AI is headquartered in Houston, Texas. Always use Houston, Texas as the company location — never San Francisco or any other city. The official website is www.valyarolexai.com — always use this URL in closing slides, contact info, and any web references. The contact email is XyzDiverseServices@Gmail.Com. Do NOT include or reference any social media links (LinkedIn, Twitter, etc.) — none exist yet.\n`;

    const systemPrompts: Record<string, string> = {
      chat: `You are Valyarolex.AI, an intelligent productivity assistant. You help users manage their workflows, schedule tasks, draft emails, and automate repetitive work. Be concise, professional, and proactive. Use markdown formatting for clarity.${companyContext}`,
      workflow: `You are Valyarolex.AI's workflow builder assistant. When a user describes a workflow in natural language, respond with a structured workflow in this exact JSON format:
{
  "trigger": "description of the trigger event",
  "steps": [
    { "label": "step description", "type": "email|calendar|document|message|automation" }
  ],
  "summary": "brief one-line summary of the workflow"
}
Always respond with valid JSON only, no other text.${companyContext}`,
      pitch_deck: `You are Valyarolex.AI's pitch deck and ad campaign generator. When a user describes their business, product, idea, or ad campaign, generate a professional presentation as JSON. Support all use cases: investor pitches, product launches, and advertising campaigns for all major platforms (Facebook, Instagram, TikTok, YouTube, LinkedIn, X/Twitter, Google Ads, Snapchat, Pinterest, Reddit).

For ad campaigns, include platform-specific slides with ad copy, targeting suggestions, creative direction, budget allocation, and KPIs per platform.

Each slide should have this format:
{
  "slides": [
    {
      "slide_type": "title|problem|solution|market|product|traction|business_model|team|financials|ask|closing|ad_strategy|platform_breakdown|creative_brief|targeting|budget",
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
Generate 8-15 slides. For ad campaigns, include slides for each requested platform with specific ad copy, targeting, and creative specs. Always respond with valid JSON only.${companyContext}`,
      campaign: `You are Valyarolex.AI's marketing campaign strategist and ad planner. When a user describes their campaign goals, generate a comprehensive multi-platform marketing and advertising campaign plan as JSON.

Support ALL major advertising platforms: Facebook Ads, Instagram Ads, TikTok Ads, YouTube Ads, LinkedIn Ads, X/Twitter Ads, Google Ads (Search + Display), Snapchat Ads, Pinterest Ads, Reddit Ads. Include platform-specific ad copy, creative specs, targeting parameters, and budget recommendations for each requested platform.

{
  "name": "Campaign name",
  "description": "Campaign overview",
  "campaign_type": "product_launch|brand_awareness|lead_gen|event|seasonal|content|ad_campaign",
  "target_audience": "Audience description",
  "goals": [{"goal": "description", "metric": "KPI", "target": "target value"}],
  "channels": [{"channel": "facebook|instagram|tiktok|youtube|linkedin|twitter|google_ads|snapchat|pinterest|reddit|email|content|pr|events", "strategy": "platform-specific strategy with ad format recommendations", "budget_pct": 25}],
  "content_plan": [
    {"title": "Content/Ad piece title", "type": "blog|social_post|email|video|ad|infographic|story_ad|reel|carousel|search_ad|display_ad|sponsored_post", "channel": "platform name", "description": "ad copy or content description with creative direction and specs (dimensions, duration, format)", "week": 1}
  ],
  "schedule": {"duration_weeks": 8, "phases": [{"name": "Phase name", "weeks": "1-2", "focus": "phase focus"}]}
}
For each platform, include specific ad formats (e.g. Facebook: carousel, story, reel; TikTok: in-feed, spark ads; Google: search, display, shopping). Generate a detailed, actionable campaign with real ad copy examples. Always respond with valid JSON only.${companyContext}`,
      video: `You are Valyarolex.AI's video ad creative director. Generate professional video ad scripts and storyboards for any platform. When a user describes their video concept, generate a detailed production plan as JSON.

Support ALL formats: shorts (5-15s for TikTok/Reels/Shorts), square (1:1 for feed ads), landscape (16:9 for YouTube/web), and commercial-length (30-60s for TV/pre-roll).

{
  "title": "Video title",
  "description": "Video concept overview",
  "format": "9:16|1:1|16:9",
  "duration_seconds": 15,
  "duration_type": "short|square|landscape|commercial",
  "platform": "tiktok|instagram|youtube|facebook|linkedin|twitter|snapchat|pinterest|general",
  "target_audience": "audience description",
  "hook": "opening hook text (first 3 seconds)",
  "cta": "call to action text",
  "music_mood": "upbeat|dramatic|calm|energetic|inspiring|corporate",
  "scenes": [
    {
      "scene_number": 1,
      "duration_seconds": 3,
      "visual": "detailed visual description of what's on screen",
      "text_overlay": "any text shown on screen",
      "voiceover": "narration or dialogue",
      "transition": "cut|fade|swipe|zoom|none",
      "notes": "production notes"
    }
  ],
  "ad_copy": {
    "headline": "ad headline",
    "description": "ad description for the platform",
    "hashtags": ["relevant", "hashtags"]
  }
}

Generate 3-8 scenes depending on duration. Include specific visual directions, text overlays, voiceover scripts, and transitions. Make it platform-native (e.g. TikTok = casual/trending, LinkedIn = professional, YouTube = polished).

IMPORTANT: The LAST scene must ALWAYS be a branded closing card. This final scene should have:
- visual: "Clean branded end card with Valyarolex.AI logo centered on a dark gradient background. Below the logo, display the website URL www.valyarolexai.com and email XyzDiverseServices@Gmail.Com in clean white text. No social media icons. Minimal, professional, and elegant."
- text_overlay: "www.valyarolexai.com"
- voiceover: A brief closing line like "Visit valyarolexai.com to get started" or similar
- duration_seconds: 3-5 seconds
- transition: "fade"

Always respond with valid JSON only.${companyContext}`,
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

    if (mode === "workflow" || mode === "pitch_deck" || mode === "campaign" || mode === "video") {
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
