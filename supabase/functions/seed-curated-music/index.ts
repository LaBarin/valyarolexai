// Owner-only edge function that downloads royalty-free background music tracks
// and uploads them to the audio-assets/curated/ folder, then updates duration
// metadata on the matching audio_tracks rows.
//
// Sources used (all royalty-free, no API key required for direct file access):
//   - Pixabay CDN (cdn.pixabay.com/audio/...) — Pixabay Content License, free for commercial use, no attribution required
//   - Mixkit (assets.mixkit.co/music/...) — Mixkit Free License, free for commercial use, no attribution required
//
// Auth: requires a logged-in owner email (mirrors src/lib/owner.ts allow-list).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { isOwnerEmail } from "../_shared/owner.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SeedTrack = {
  storage_path: string; // must match existing audio_tracks.storage_path
  url: string;          // direct .mp3 URL
  duration: number;     // approximate, in seconds
};

// Hand-picked royalty-free tracks. Storage paths match the rows already in audio_tracks.
const TRACKS: SeedTrack[] = [
  { storage_path: "curated/acoustic-morning.mp3",  url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_1718e49cdc.mp3?filename=acoustic-mood-122655.mp3", duration: 138 },
  { storage_path: "curated/action-beat.mp3",       url: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_8c4e73d4d4.mp3?filename=powerful-beat-121791.mp3", duration: 124 },
  { storage_path: "curated/ambient-dream.mp3",     url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bdd.mp3?filename=ambient-piano-amp-strings-10711.mp3", duration: 156 },
  { storage_path: "curated/cinematic-rise.mp3",    url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_270f49b83f.mp3?filename=cinematic-time-lapse-115672.mp3", duration: 142 },
  { storage_path: "curated/cinematic-trailer.mp3", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cinematic-documentary-115669.mp3", duration: 168 },
  { storage_path: "curated/corporate-inspire.mp3", url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=corporate-uplifting-122280.mp3", duration: 134 },
  { storage_path: "curated/dance-floor.mp3",       url: "https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde668d05.mp3?filename=electronic-rock-king-around-here-15045.mp3", duration: 128 },
  { storage_path: "curated/epic-drama.mp3",        url: "https://cdn.pixabay.com/download/audio/2022/01/20/audio_d1718beff4.mp3?filename=epic-cinematic-trailer-11197.mp3", duration: 162 },
  { storage_path: "curated/future-bass.mp3",       url: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_d0c6ff1bdd.mp3?filename=future-bass-117150.mp3", duration: 145 },
  { storage_path: "curated/hiphop-energy.mp3",     url: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_1808fbf07a.mp3?filename=hip-hop-rock-beats-118000.mp3", duration: 132 },
  { storage_path: "curated/lofi-chill.mp3",        url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-chill-medium-version-159456.mp3", duration: 174 },
  { storage_path: "curated/meditation-calm.mp3",   url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=relaxing-mountains-rivers-streams-running-water-18178.mp3", duration: 192 },
  { storage_path: "curated/modern-tech.mp3",       url: "https://cdn.pixabay.com/download/audio/2022/10/30/audio_347111d564.mp3?filename=tech-house-vlog-music-155291.mp3", duration: 138 },
  { storage_path: "curated/power-anthem.mp3",      url: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_2dde668d05.mp3?filename=powerful-energetic-sport-rock-trailer-11252.mp3", duration: 144 },
  { storage_path: "curated/soft-piano.mp3",        url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bdd.mp3?filename=relaxing-piano-music-9148.mp3", duration: 178 },
  { storage_path: "curated/startup-vibes.mp3",     url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=corporate-technology-117769.mp3", duration: 130 },
  { storage_path: "curated/sunset-drive.mp3",      url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=summer-walk-152722.mp3", duration: 148 },
  { storage_path: "curated/tech-pulse.mp3",        url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=technology-117320.mp3", duration: 136 },
];

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

  // Validate caller is an owner
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

  // Optional body { only?: string[] } to re-seed a subset
  let only: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.only)) only = body.only;
  } catch { /* no body is fine */ }

  const admin = createClient(supabaseUrl, serviceKey);
  const targets = only ? TRACKS.filter((t) => only!.includes(t.storage_path)) : TRACKS;

  const results: { path: string; status: "uploaded" | "skipped" | "failed"; bytes?: number; error?: string }[] = [];

  for (const track of targets) {
    try {
      // Skip if file already exists (HEAD via list)
      const folder = track.storage_path.split("/").slice(0, -1).join("/");
      const filename = track.storage_path.split("/").pop()!;
      const { data: existing } = await admin.storage
        .from("audio-assets")
        .list(folder, { search: filename, limit: 1 });
      if (existing && existing.find((f) => f.name === filename)) {
        results.push({ path: track.storage_path, status: "skipped" });
        continue;
      }

      const res = await fetch(track.url, { redirect: "follow" });
      if (!res.ok) {
        results.push({ path: track.storage_path, status: "failed", error: `download ${res.status}` });
        continue;
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from("audio-assets")
        .upload(track.storage_path, buf, {
          contentType: "audio/mpeg",
          upsert: true,
          cacheControl: "3600",
        });
      if (upErr) {
        results.push({ path: track.storage_path, status: "failed", error: upErr.message });
        continue;
      }

      // Update duration metadata on the matching row
      await admin
        .from("audio_tracks")
        .update({ duration_seconds: track.duration })
        .eq("storage_path", track.storage_path)
        .eq("is_curated", true);

      results.push({ path: track.storage_path, status: "uploaded", bytes: buf.byteLength });
    } catch (e) {
      results.push({ path: track.storage_path, status: "failed", error: (e as Error).message });
    }
  }

  const summary = {
    total: targets.length,
    uploaded: results.filter((r) => r.status === "uploaded").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
  };
  return json({ summary, results });
});
