// Generate background music via ElevenLabs Music API, store in audio-assets bucket,
// register the result as a user-owned audio_tracks row.
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

const MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes safety cap

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

    const body = await req.json().catch(() => ({}));
    const prompt: string = (body.prompt ?? "").toString().trim();
    const requestedSeconds: number = Math.max(
      10,
      Math.min(300, Number(body.duration_seconds) || 30),
    );
    const mood: string = (body.mood ?? "custom").toString().slice(0, 32);
    const name: string =
      (body.name ?? `AI Music · ${new Date().toLocaleString()}`).toString().slice(0, 120);

    if (!prompt || prompt.length < 4) {
      return new Response(JSON.stringify({ error: "Prompt too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (prompt.length > 500) {
      return new Response(JSON.stringify({ error: "Prompt too long (max 500 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPA_URL, SUPA_SERVICE);

    // Charge 4 credits for music generation
    const { data: spent, error: spendErr } = await admin.rpc("spend_credits", {
      p_user_id: userId,
      p_amount: 4,
      p_description: "AI music generation",
    });
    if (spendErr || spent !== true) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Call ElevenLabs Music API
    const elevenRes = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: Math.min(MAX_DURATION_MS, requestedSeconds * 1000),
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      await admin.rpc("grant_credits", {
        p_user_id: userId,
        p_amount: 4,
        p_type: "refund",
        p_description: "Music generation failed - refund",
      });
      return new Response(
        JSON.stringify({ error: "Music generation failed", detail: errText.slice(0, 300) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audioBuf = new Uint8Array(await elevenRes.arrayBuffer());
    if (audioBuf.byteLength < 1000) {
      await admin.rpc("grant_credits", {
        p_user_id: userId,
        p_amount: 4,
        p_type: "refund",
        p_description: "Music generation returned empty - refund",
      });
      return new Response(
        JSON.stringify({ error: "Empty audio returned" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const filename = `${userId}/music/${crypto.randomUUID()}.mp3`;
    const { error: upErr } = await admin.storage
      .from("audio-assets")
      .upload(filename, audioBuf, { contentType: "audio/mpeg", upsert: false });
    if (upErr) {
      return new Response(
        JSON.stringify({ error: "Storage upload failed", detail: upErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: track, error: insErr } = await admin
      .from("audio_tracks")
      .insert({
        user_id: userId,
        name,
        artist: "AI · ElevenLabs",
        mood,
        storage_path: filename,
        is_curated: false,
        duration_seconds: requestedSeconds,
        license: "ElevenLabs Generated",
      })
      .select()
      .single();

    if (insErr) {
      return new Response(
        JSON.stringify({ error: "DB insert failed", detail: insErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: signed } = await admin.storage
      .from("audio-assets")
      .createSignedUrl(filename, 60 * 60 * 24 * 365);

    return new Response(
      JSON.stringify({ track, url: signed?.signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
