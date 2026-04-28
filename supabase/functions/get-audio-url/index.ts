// Get a signed URL for any audio file the user is allowed to play.
// Used for both curated music and user-owned voiceovers/uploads.
//
// Hardening:
//  - Strict path validation (no traversal, no leading slash, no backslashes, no nulls)
//  - Allow-list audio extensions
//  - Curated paths must correspond to a real audio_tracks row (is_curated=true)
//  - User paths must correspond to a row the user owns (audio_tracks or voiceovers)
//  - JWT validated via Supabase auth.getUser()
//  - Method allow-list, max body length, generic error messages
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPA_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const ALLOWED_PREFIXES = new Set(["curated", "curated-eleven"]);
const ALLOWED_EXTS = new Set(["mp3", "wav", "m4a", "ogg", "mpeg"]);
const MAX_PATH_LEN = 256;
const MAX_BODY_BYTES = 2_048;
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6; // 6h

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isSafePath(path: string): boolean {
  if (!path || path.length === 0 || path.length > MAX_PATH_LEN) return false;
  if (path.startsWith("/") || path.startsWith("./") || path.startsWith("../")) return false;
  if (path.includes("\\")) return false;
  if (path.includes("\0")) return false;
  if (path.includes("//")) return false;
  // Block any path segment equal to ".." or "."
  for (const seg of path.split("/")) {
    if (seg === ".." || seg === ".") return false;
    if (seg.length === 0) return false;
  }
  // Restrict to printable ASCII (storage keys must not include control chars)
  if (!/^[A-Za-z0-9._\-/]+$/.test(path)) return false;
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTS.has(ext)) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Validate JWT via Supabase auth
    const userClient = createClient(SUPA_URL, SUPA_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    // Bound the request body
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return json({ error: "Payload too large" }, 413);
    let body: { path?: unknown };
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const path = typeof body.path === "string" ? body.path : "";
    if (!isSafePath(path)) return json({ error: "Invalid path" }, 400);

    const firstSeg = path.split("/")[0];
    const isCurated = ALLOWED_PREFIXES.has(firstSeg);
    if (!isCurated && firstSeg !== userId) {
      return json({ error: "Forbidden" }, 403);
    }

    const admin = createClient(SUPA_URL, SUPA_SERVICE);

    // Catalog-existence check: path must be referenced by a real DB row.
    // - Curated: must be an is_curated track
    // - User-owned: must be a track owned by this user, or a voiceover the user owns
    if (isCurated) {
      const { data: track, error: trackErr } = await admin
        .from("audio_tracks")
        .select("id")
        .eq("storage_path", path)
        .eq("is_curated", true)
        .maybeSingle();
      if (trackErr || !track) return json({ error: "Not found" }, 404);
    } else {
      const [{ data: ownTrack }, { data: ownVoice }] = await Promise.all([
        admin
          .from("audio_tracks")
          .select("id")
          .eq("storage_path", path)
          .eq("user_id", userId)
          .maybeSingle(),
        admin
          .from("voiceovers")
          .select("id")
          .eq("storage_path", path)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (!ownTrack && !ownVoice) return json({ error: "Not found" }, 404);
    }

    const { data, error } = await admin.storage
      .from("audio-assets")
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      return json({ error: "File missing" }, 404);
    }

    return json({ url: data.signedUrl });
  } catch (_e) {
    // Avoid leaking internals
    return json({ error: "Server error" }, 500);
  }
});
