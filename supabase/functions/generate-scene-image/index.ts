import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chargeOrSubscribe, envFromRequest, refundCredits } from "../_shared/entitlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
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

    const token = authHeader.replace("Bearer ", "");
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAX_VISUAL_LEN = 2000;
    const MAX_OVERLAY_LEN = 200;
    const MAX_DATA_URI_LEN = 10 * 1024 * 1024; // 10MB
    const ALLOWED_FORMATS = ["9:16", "1:1", "16:9"];
    const ALLOWED_PLATFORMS = ["tiktok", "instagram", "youtube", "facebook", "linkedin", "twitter", "snapchat", "pinterest", "general"];

    const body = await req.json();
    const { visual, text_overlay, format, platform, brand_logo_url, reference_image_url, scene_role } = body;
    const sceneRole: "main" | "closing" = scene_role === "closing" ? "closing" : "main";
    if (!visual || typeof visual !== "string" || visual.length > MAX_VISUAL_LEN) {
      return new Response(JSON.stringify({ error: "Invalid or too-long visual description" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text_overlay && String(text_overlay).length > MAX_OVERLAY_LEN) {
      return new Response(JSON.stringify({ error: "text_overlay too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (format && !ALLOWED_FORMATS.includes(format)) {
      return new Response(JSON.stringify({ error: "Invalid format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (platform && !ALLOWED_PLATFORMS.includes(platform)) {
      return new Response(JSON.stringify({ error: "Invalid platform" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validate image URLs: only allow data URIs to prevent SSRF
    if (reference_image_url) {
      if (typeof reference_image_url !== "string" || !reference_image_url.startsWith("data:image/") || reference_image_url.length > MAX_DATA_URI_LEN) {
        return new Response(JSON.stringify({ error: "Invalid reference_image_url: only data:image/ URIs are accepted" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (brand_logo_url) {
      if (typeof brand_logo_url !== "string" || !brand_logo_url.startsWith("data:image/") || brand_logo_url.length > MAX_DATA_URI_LEN) {
        return new Response(JSON.stringify({ error: "Invalid brand_logo_url: only data:image/ URIs are accepted" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const userId = (data.claims as any).sub as string;

    // Entitlement: 5 credits per image unless subscribed
    const SCENE_IMAGE_COST = 5;
    const env = envFromRequest(body);
    const charge = await chargeOrSubscribe({
      userId,
      amount: SCENE_IMAGE_COST,
      description: "ai:scene-image",
      env,
    });
    if (!charge.ok) {
      return new Response(JSON.stringify({
        error: "Insufficient credits. Upgrade to a paid plan or buy a credit pack.",
        code: "insufficient_credits",
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build image prompt from scene data
    const aspectDesc = format === "9:16" ? "vertical mobile portrait" : format === "1:1" ? "square" : "widescreen landscape 16:9";
    const brandingNote = brand_logo_url && sceneRole !== "closing" ? " Include subtle brand logo watermark in corner." : "";

    let prompt: string;
    if (sceneRole === "closing") {
      // Closing/branded card: minimal, premium, leaves room for logos & contact text rendered by app
      prompt = `Create a clean, premium ${aspectDesc} closing card background for a video ad. Scene: ${visual}. Style: minimal, elegant gradient, subtle texture, professional brand-card aesthetic with large clean negative space in the center and bottom for app-rendered logos and contact text. Do NOT include any text, logos, watermarks, faces, or busy details. Soft focus, sophisticated color palette.`;
    } else if (reference_image_url) {
      // Reference image becomes the MAIN SUBJECT across all scenes
      prompt = `Create a cinematic, professional ${aspectDesc} video ad frame. The provided reference image is the MAIN SUBJECT of this video — preserve its identity, key features, colors, and likeness consistently. Place this same subject into the following scene: ${visual}.${brandingNote} Platform: ${platform || "general"}. Style: high-end commercial photography, dramatic cinematic lighting, sharp focus on the subject, modern and sleek composition. Leave clean negative space for app-rendered captions. Do NOT bake any headline, caption, large text, or watermarks into the image. Keep the subject visually consistent with the reference at all times.`;
    } else {
      prompt = `Create a cinematic, professional video ad frame/still image. ${aspectDesc} aspect ratio. Scene: ${visual}.${brandingNote} Platform: ${platform || "general"}. Style: high-end commercial photography, dramatic lighting, modern and sleek. Leave clean negative space for app-rendered captions and avoid baking any headline, caption, or large text into the image itself. Do NOT include any watermarks.`;
    }

    // Build message content - support reference images
    const messageContent: any[] = [{ type: "text", text: prompt }];
    // Skip reference image on closing scene (we want a clean branded card, not the subject)
    if (reference_image_url && sceneRole !== "closing") {
      messageContent.push({ type: "image_url", image_url: { url: reference_image_url } });
    }
    if (brand_logo_url && sceneRole !== "closing") {
      messageContent.push({ type: "image_url", image_url: { url: brand_logo_url } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: messageContent.length === 1 ? prompt : messageContent }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      // Best-effort refund since the spend already happened
      await refundCredits(userId, SCENE_IMAGE_COST, "refund:scene-image-failed");
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI provider usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI image generation error:", response.status, t);
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const imageUrl = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      await refundCredits(userId, SCENE_IMAGE_COST, "refund:scene-image-empty");
      return new Response(JSON.stringify({ error: "No image was generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image_url: imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-scene-image error:", e);
    return new Response(JSON.stringify({ error: "Image generation failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
