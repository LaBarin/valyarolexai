import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { share_token } = await req.json();
    if (!share_token || typeof share_token !== "string" || share_token.length > 64) {
      return new Response(JSON.stringify({ error: "Invalid share token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS and generate signed URL
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch video project by share token
    const { data, error } = await supabase
      .from("video_projects")
      .select("exported_video_url")
      .eq("share_token", share_token)
      .maybeSingle();

    if (error || !data || !data.exported_video_url) {
      return new Response(JSON.stringify({ error: "Video not found or no export available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filePath = data.exported_video_url;

    // If it's already a full URL (legacy), return as-is
    if (filePath.startsWith("http")) {
      return new Response(JSON.stringify({ signed_url: filePath }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a signed URL valid for 1 hour
    const { data: signedData, error: signError } = await supabase.storage
      .from("video-exports")
      .createSignedUrl(filePath, 3600);

    if (signError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signError);
      return new Response(JSON.stringify({ error: "Could not generate video URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ signed_url: signedData.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-shared-video-url error:", e);
    return new Response(JSON.stringify({ error: "Failed to retrieve video URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
