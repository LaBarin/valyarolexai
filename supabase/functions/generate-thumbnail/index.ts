// Thumbnail Generator — produces a single AI thumbnail image in a chosen style
// using Gemini Nano Banana, then uploads to the private "thumbnails" bucket
// under {user_id}/{video_id}/{style}-{timestamp}.png and saves the URL on the
// video_projects row. Charges 4 credits per generation, refunds on failure.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chargeOrSubscribe, envFromRequest, refundCredits } from "../_shared/entitlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 4;

const STYLE_PROMPTS: Record<string, { name: string; directive: string }> = {
  bold_cta: {
    name: "Bold CTA",
    directive:
      "High-contrast thumbnail with a single huge punchy CTA word stamped across the image, thick sans-serif type, vivid saturated colors, dramatic lighting, attention-grabbing arrow or burst graphic. Designed to stop the scroll on Facebook, YouTube, and TikTok.",
  },
  premium: {
    name: "Premium",
    directive:
      "Luxury, editorial-grade thumbnail. Soft cinematic lighting, refined typography (light serif accent + clean sans body), generous negative space, muted high-end palette (matte black, ivory, gold or deep navy). Looks like a print magazine cover.",
  },
  bright_social: {
    name: "Bright Social",
    directive:
      "Energetic Instagram/TikTok-ready thumbnail. Bright pastel-meets-neon palette, playful sticker-style shapes, soft drop shadows, friendly rounded type. Feels modern, joyful, mobile-first.",
  },
  viral: {
    name: "Viral",
    directive:
      "MrBeast-style viral YouTube thumbnail. Surprised facial expression vibe, oversized arrow or circle highlight, exaggerated colors, big bold outlined caption text, heavy contrast and depth. Maximum click temptation.",
  },
  product_focus: {
    name: "Product Focus",
    directive:
      "Clean studio product shot thumbnail. Subject hero-centered with soft gradient backdrop, subtle shadow, restrained label text in one corner, brand-safe palette. Feels like a premium ecommerce hero image.",
  },
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
    const videoId = typeof body?.videoId === "string" ? body.videoId : "";
    const style = typeof body?.style === "string" ? body.style : "";
    const title = typeof body?.title === "string" ? body.title.slice(0, 200) : "";
    const description = typeof body?.description === "string" ? body.description.slice(0, 600) : "";
    const brand = typeof body?.brand === "string" ? body.brand.slice(0, 80) : "";
    const ctaText = typeof body?.cta === "string" ? body.cta.slice(0, 60) : "";
    const format = typeof body?.format === "string" ? body.format : "16:9";
    const persist = body?.persist !== false; // default true — save to bucket + project row

    if (!videoId || !STYLE_PROMPTS[style]) {
      return new Response(JSON.stringify({ error: "videoId and valid style required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership of the video before charging.
    const { data: project, error: projectErr } = await supabase
      .from("video_projects")
      .select("id, user_id")
      .eq("id", videoId)
      .maybeSingle();
    if (projectErr || !project || project.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = envFromRequest(body);
    const charge = await chargeOrSubscribe({
      userId: user.id,
      amount: CREDIT_COST,
      description: `Thumbnail (${style})`,
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

    const stylePreset = STYLE_PROMPTS[style];
    const aspectHint = format === "9:16"
      ? "Vertical 9:16 mobile thumbnail."
      : format === "1:1"
      ? "Square 1:1 thumbnail."
      : "Horizontal 16:9 thumbnail.";

    const imagePrompt = [
      `${stylePreset.name} thumbnail style. ${stylePreset.directive}`,
      aspectHint,
      title ? `Subject of the ad: "${title}".` : "",
      description ? `Context: ${description}.` : "",
      brand ? `Brand: ${brand} (small, tasteful logo placement only — do not invent a logo).` : "",
      ctaText ? `Optional CTA word to feature: "${ctaText}".` : "",
      "Output a single photographic / poster-grade still image. No watermarks. No frames. No mockup screen overlays.",
    ].filter(Boolean).join(" ");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResp.ok) {
      await refundCredits(user.id, CREDIT_COST, `Refund: thumbnail failed (${aiResp.status})`);
      const errTxt = await aiResp.text();
      console.error("generate-thumbnail gateway error:", aiResp.status, errTxt);
      const status = aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500;
      const msg = aiResp.status === 429
        ? "Rate limited, please try again in a moment."
        : aiResp.status === 402
        ? "AI image credits exhausted on platform."
        : "AI gateway error";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const dataUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      await refundCredits(user.id, CREDIT_COST, "Refund: empty thumbnail response");
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!persist) {
      // Preview mode — return the data URL without saving.
      return new Response(JSON.stringify({ image: dataUrl, style }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 → bytes and upload to the private bucket.
    const commaIdx = dataUrl.indexOf(",");
    const meta = dataUrl.slice(5, commaIdx); // e.g. "image/png;base64"
    const mime = meta.split(";")[0] || "image/png";
    const ext = mime.split("/")[1] || "png";
    const base64 = dataUrl.slice(commaIdx + 1);
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const path = `${user.id}/${videoId}/${style}-${Date.now()}.${ext}`;

    // Use service role for storage upload so we don't depend on per-user mime restrictions.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const upload = await admin.storage.from("thumbnails").upload(path, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (upload.error) {
      await refundCredits(user.id, CREDIT_COST, "Refund: thumbnail upload failed");
      console.error("thumbnail upload error:", upload.error);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sign for ~7 days so the studio UI can show it without re-signing each render.
    const signed = await admin.storage.from("thumbnails").createSignedUrl(path, 60 * 60 * 24 * 7);
    const signedUrl = signed.data?.signedUrl ?? null;

    // Save the storage path on the project so future reloads can re-sign it.
    await supabase.from("video_projects").update({ thumbnail_url: path } as any).eq("id", videoId);

    return new Response(JSON.stringify({ path, signedUrl, style }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-thumbnail error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
