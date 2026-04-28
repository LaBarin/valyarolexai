// Generate voice-over audio from script via ElevenLabs TTS, store in audio-assets bucket.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ELEVEN_KEY = Deno.env.get("ELEVENLABS_API_KEY")!;
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPA_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate user via anon client (JWT verify)
    const userClient = createClient(SUPA_URL, SUPA_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const script: string = (body.script ?? "").toString().trim();
    const voiceId: string = body.voiceId || "JBFqnCBsd6RMkjVDRZzb"; // George
    const videoId: string | null = body.videoId ?? null;

    // Validate voiceId format - ElevenLabs voice IDs are alphanumeric (prevents URL path injection)
    const VOICE_ID_RE = /^[A-Za-z0-9]{1,64}$/;
    if (!VOICE_ID_RE.test(voiceId)) {
      return new Response(JSON.stringify({ error: "Invalid voiceId format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!script || script.length < 3) {
      return new Response(JSON.stringify({ error: "Script too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (script.length > 5000) {
      return new Response(JSON.stringify({ error: "Script too long (max 5000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role admin client for credit spend + storage upload + DB insert
    const admin = createClient(SUPA_URL, SUPA_SERVICE);

    // Charge 2 credits
    const { data: spent, error: spendErr } = await admin.rpc("spend_credits", {
      p_user_id: userId,
      p_amount: 2,
      p_description: "Voice-over generation",
    });
    if (spendErr || spent !== true) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call ElevenLabs
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      // Refund credits
      await admin.rpc("grant_credits", {
        p_user_id: userId,
        p_amount: 2,
        p_type: "refund",
        p_description: "Voice-over failed - refund",
      });
      return new Response(
        JSON.stringify({ error: "TTS failed", detail: errText.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuf = new Uint8Array(await elevenRes.arrayBuffer());
    const filename = `${userId}/voiceovers/${crypto.randomUUID()}.mp3`;

    const { error: upErr } = await admin.storage
      .from("audio-assets")
      .upload(filename, audioBuf, {
        contentType: "audio/mpeg",
        upsert: false,
      });
    if (upErr) {
      return new Response(
        JSON.stringify({ error: "Storage upload failed", detail: upErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Estimate duration (rough: 150 words/min, ~5 chars/word)
    const estimatedSeconds = Math.max(1, Math.round((script.length / 5 / 150) * 60));

    const { data: vo, error: insErr } = await admin
      .from("voiceovers")
      .insert({
        user_id: userId,
        video_id: videoId,
        source: "tts",
        voice_id: voiceId,
        script,
        storage_path: filename,
        duration_seconds: estimatedSeconds,
      })
      .select()
      .single();

    if (insErr) {
      return new Response(
        JSON.stringify({ error: "DB insert failed", detail: insErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URL valid for 1 year for playback
    const { data: signed } = await admin.storage
      .from("audio-assets")
      .createSignedUrl(filename, 60 * 60 * 24 * 365);

    return new Response(
      JSON.stringify({ voiceover: vo, url: signed?.signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
