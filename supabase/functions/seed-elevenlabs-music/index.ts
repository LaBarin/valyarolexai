// Owner-only edge function. Generates a fresh curated music library using the
// ElevenLabs Music API, uploads each MP3 to audio-assets/curated-eleven/, and
// replaces the curated rows in the audio_tracks table.
//
// Run from the owner account via: supabase.functions.invoke("seed-elevenlabs-music")
// Optional body: { only?: string[] } to re-seed a subset by name.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { isOwnerEmail } from "../_shared/owner.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SeedTrack = {
  name: string;
  mood: string;
  prompt: string;
  duration: number; // seconds
};

const TRACKS: SeedTrack[] = [
  { name: "Acoustic Morning",   mood: "acoustic",  duration: 45, prompt: "Warm acoustic guitar, soft hand percussion, gentle morning vibe, optimistic and intimate, no vocals" },
  { name: "Action Beat",        mood: "dramatic",  duration: 30, prompt: "High-energy cinematic action drums, big toms, driving synth bass, blockbuster trailer feel, no vocals" },
  { name: "Ambient Dream",      mood: "chill",     duration: 60, prompt: "Slow ambient pads, ethereal piano, gentle reverb, dreamy and reflective, instrumental" },
  { name: "Cinematic Rise",     mood: "cinematic", duration: 45, prompt: "Cinematic orchestral build, swelling strings, soft piano, hopeful crescendo, no vocals" },
  { name: "Cinematic Trailer",  mood: "cinematic", duration: 45, prompt: "Epic orchestral trailer, dramatic strings, heroic brass, pulsing percussion, instrumental" },
  { name: "Corporate Inspire",  mood: "corporate", duration: 45, prompt: "Uplifting corporate background, soft piano, warm strings, subtle four-on-the-floor beat, motivational, no vocals" },
  { name: "Dance Floor",        mood: "upbeat",    duration: 30, prompt: "Energetic electronic dance, four-on-the-floor kick, bright synths, festival vibe, instrumental" },
  { name: "Epic Drama",         mood: "dramatic",  duration: 45, prompt: "Powerful cinematic drama, full orchestra, taiko drums, emotional and grand, no vocals" },
  { name: "Future Bass",        mood: "upbeat",    duration: 30, prompt: "Modern future bass, bright supersaw chords, snappy drums, feel-good and uplifting, instrumental" },
  { name: "Lofi Chill",         mood: "chill",     duration: 60, prompt: "Lofi hip-hop beat, mellow electric piano, vinyl crackle, relaxing and warm, instrumental" },
  { name: "Meditation Calm",    mood: "chill",     duration: 60, prompt: "Calm meditation soundscape, soft pads, gentle bells, tranquil and spacious, no vocals" },
  { name: "Modern Tech",        mood: "tech",      duration: 30, prompt: "Modern tech house background, clean synth pluck, smooth bassline, sleek and minimal, instrumental" },
  { name: "Power Anthem",       mood: "dramatic",  duration: 30, prompt: "Powerful sport rock anthem, distorted electric guitars, big drums, energetic and triumphant, no vocals" },
  { name: "Soft Piano",         mood: "cinematic", duration: 60, prompt: "Solo piano, slow and emotive, gentle reverb, intimate and reflective, instrumental" },
  { name: "Startup Vibes",      mood: "corporate", duration: 30, prompt: "Modern startup background music, bright plucks, soft beat, optimistic and clean, instrumental" },
  { name: "Sunset Drive",       mood: "upbeat",    duration: 45, prompt: "Synthwave sunset drive, warm analog synths, steady drum machine, nostalgic and cinematic, instrumental" },
  { name: "Tech Pulse",         mood: "tech",      duration: 30, prompt: "Pulsing electronic tech track, arpeggiated synths, driving beat, futuristic and focused, instrumental" },
];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const elevenKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!elevenKey) return json({ error: "ELEVENLABS_API_KEY not configured" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
  if (!isOwnerEmail(userData.user.email)) {
    return json({ error: "Owner access required" }, 403);
  }

  let only: string[] | null = null;
  let replace = true;
  try {
    const body = await req.json();
    if (Array.isArray(body?.only)) only = body.only;
    if (typeof body?.replace === "boolean") replace = body.replace;
  } catch { /* no body */ }

  const admin = createClient(supabaseUrl, serviceKey);
  const targets = only
    ? TRACKS.filter((t) => only!.includes(t.name))
    : TRACKS;

  // Optionally clear previous curated rows so the library reflects the new set
  if (replace && !only) {
    const { data: oldRows } = await admin
      .from("audio_tracks")
      .select("storage_path")
      .eq("is_curated", true);
    if (oldRows && oldRows.length > 0) {
      const paths = oldRows.map((r) => r.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await admin.storage.from("audio-assets").remove(paths).catch(() => {});
      }
      await admin.from("audio_tracks").delete().eq("is_curated", true);
    }
  }

  const results: { name: string; status: "uploaded" | "failed"; bytes?: number; error?: string }[] = [];

  for (const track of targets) {
    try {
      const elevenRes = await fetch("https://api.elevenlabs.io/v1/music", {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: track.prompt,
          music_length_ms: Math.min(300_000, track.duration * 1000),
        }),
      });
      if (!elevenRes.ok) {
        const errText = await elevenRes.text();
        results.push({ name: track.name, status: "failed", error: `eleven ${elevenRes.status}: ${errText.slice(0, 200)}` });
        continue;
      }
      const buf = new Uint8Array(await elevenRes.arrayBuffer());
      if (buf.byteLength < 1000) {
        results.push({ name: track.name, status: "failed", error: "empty audio" });
        continue;
      }

      const storagePath = `curated-eleven/${slug(track.name)}.mp3`;
      const { error: upErr } = await admin.storage
        .from("audio-assets")
        .upload(storagePath, buf, {
          contentType: "audio/mpeg",
          upsert: true,
          cacheControl: "3600",
        });
      if (upErr) {
        results.push({ name: track.name, status: "failed", error: upErr.message });
        continue;
      }

      // Upsert curated row
      await admin.from("audio_tracks").delete().eq("storage_path", storagePath);
      const { error: insErr } = await admin.from("audio_tracks").insert({
        name: track.name,
        artist: "ElevenLabs Music",
        mood: track.mood,
        storage_path: storagePath,
        duration_seconds: track.duration,
        is_curated: true,
        license: "ElevenLabs Generated",
        user_id: null,
      });
      if (insErr) {
        results.push({ name: track.name, status: "failed", error: insErr.message });
        continue;
      }

      results.push({ name: track.name, status: "uploaded", bytes: buf.byteLength });
    } catch (e) {
      results.push({ name: track.name, status: "failed", error: (e as Error).message });
    }
  }

  return json({
    summary: {
      total: targets.length,
      uploaded: results.filter((r) => r.status === "uploaded").length,
      failed: results.filter((r) => r.status === "failed").length,
    },
    results,
  });
});
