// Edge function that triggers a Remotion Lambda render.
//
// Two modes (selected by `action`):
//   - "start"  : kicks off renderMediaOnLambda, returns { renderId, bucketName }
//   - "status" : polls getRenderProgress; when done, copies the MP4 from the
//                Remotion S3 output bucket into our private `video-exports`
//                bucket and updates `video_projects.exported_video_url`.
//
// Everything is invoked from the browser, so we validate the JWT in code and
// only allow the calling user to render their own project.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  renderMediaOnLambda,
  getRenderProgress,
} from "npm:@remotion/lambda-client@4.0.298";
import { isOwnerUser } from "../_shared/owner.ts";
import { chargeOrSubscribe, refundCredits, envFromRequest } from "../_shared/entitlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- Env ----------
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const AWS_REGION = (Deno.env.get("REMOTION_AWS_REGION") || "us-east-1") as
  | "us-east-1"
  | "us-east-2"
  | "us-west-1"
  | "us-west-2"
  | "eu-west-1"
  | "eu-central-1"
  | "ap-south-1"
  | "ap-southeast-1"
  | "ap-southeast-2"
  | "ap-northeast-1";
const REMOTION_FN = Deno.env.get("REMOTION_LAMBDA_FUNCTION_NAME") || "";
const REMOTION_SERVE_URL = Deno.env.get("REMOTION_SERVE_URL") || "";
const AWS_KEY = Deno.env.get("REMOTION_AWS_ACCESS_KEY_ID") || "";
const AWS_SECRET = Deno.env.get("REMOTION_AWS_SECRET_ACCESS_KEY") || "";

function lambdaConfigured(): string | null {
  if (!REMOTION_FN) return "REMOTION_LAMBDA_FUNCTION_NAME secret is not set";
  if (!REMOTION_SERVE_URL) return "REMOTION_SERVE_URL secret is not set";
  if (!AWS_KEY) return "REMOTION_AWS_ACCESS_KEY_ID secret is not set";
  if (!AWS_SECRET) return "REMOTION_AWS_SECRET_ACCESS_KEY secret is not set";
  return null;
}

// The Remotion Lambda SDK reads AWS creds from process.env, so we mirror them.
Deno.env.set("REMOTION_AWS_ACCESS_KEY_ID", AWS_KEY);
Deno.env.set("REMOTION_AWS_SECRET_ACCESS_KEY", AWS_SECRET);

// ---------- Helpers ----------

/** Validate the caller's JWT and return the user id. */
async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

/** Resolve a private storage path to a temporary signed URL Lambda can fetch. */
async function signedUrl(svc: ReturnType<typeof createClient>, bucket: string, path: string, ttl = 60 * 60): Promise<string | null> {
  const { data, error } = await svc.storage.from(bucket).createSignedUrl(path, ttl);
  if (error || !data) return null;
  return data.signedUrl;
}

type ScenePayload = {
  imageUrl: string;
  durationSeconds: number;
  textOverlay?: string;
  animation?: string;
};

type AdVideoProps = {
  format: string;
  scenes: ScenePayload[];
  voiceoverUrl: string | null;
  musicUrl: string | null;
  voiceoverVolume: number;
  musicVolume: number;
  brandFooter: { website?: string; phone?: string } | null;
  closingCard: {
    clientLogoUrl?: string | null;
    referenceLogoUrl?: string | null;
    companyName?: string;
    website?: string;
    phone?: string;
    address?: string;
    poweredByLabel?: string;
  } | null;
};

/** Build the Remotion props from a video project row. */
async function buildInputProps(
  svc: ReturnType<typeof createClient>,
  projectId: string,
  userId: string,
  body: any,
): Promise<{ props: AdVideoProps; durationSec: number; project: any } | { error: string }> {
  const { data: project, error } = await svc
    .from("video_projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !project) return { error: "Project not found" };

  const storyboard: any[] = Array.isArray(project.storyboard) ? project.storyboard : [];
  if (storyboard.length === 0) return { error: "Project has no storyboard" };

  // Each scene must have an image_url. The client passes optional per-scene
  // animations + the closingCard payload that already factors in branding.
  const scenes: ScenePayload[] = storyboard.map((s, i) => ({
    imageUrl: s.image_url,
    durationSeconds: Number(s.duration_seconds) || 3,
    textOverlay: s.text_overlay || "",
    animation: body?.scene_animations?.[i] || body?.scene_animations?.[String(i)] || "none",
  }));

  if (scenes.some((s) => !s.imageUrl)) {
    return { error: "Every scene must have a generated image_url before rendering" };
  }

  // Resolve voiceover + music storage paths -> signed URLs Lambda can pull.
  let voiceoverUrl: string | null = null;
  if (project.voiceover_id) {
    const { data: vo } = await svc
      .from("voiceovers")
      .select("storage_path")
      .eq("id", project.voiceover_id)
      .maybeSingle();
    if (vo?.storage_path) voiceoverUrl = await signedUrl(svc, "audio-assets", vo.storage_path);
  }
  let musicUrl: string | null = null;
  if (project.music_track_id) {
    const { data: tr } = await svc
      .from("audio_tracks")
      .select("storage_path")
      .eq("id", project.music_track_id)
      .maybeSingle();
    if (tr?.storage_path) musicUrl = await signedUrl(svc, "audio-assets", tr.storage_path);
  }

  const props: AdVideoProps = {
    format: project.format || "9:16",
    scenes,
    voiceoverUrl,
    musicUrl,
    voiceoverVolume: 1,
    musicVolume: typeof project.music_volume === "number" ? project.music_volume : 0.25,
    brandFooter: body?.brand_footer ?? null,
    closingCard: body?.closing_card ?? null,
  };

  const durationSec = scenes.reduce((s, sc) => s + sc.durationSeconds, 0);
  return { props, durationSec, project };
}

// ---------- Handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const cfgError = lambdaConfigured();
    if (cfgError) {
      return new Response(JSON.stringify({ error: `Remotion Lambda not configured: ${cfgError}` }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = await getUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "start");
    const env = envFromRequest(body);
    const svc = createClient(SUPABASE_URL, SERVICE_ROLE);

    // ---- START ----
    if (action === "start") {
      const projectId = String(body?.video_project_id || "");
      if (!projectId) {
        return new Response(JSON.stringify({ error: "video_project_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const built = await buildInputProps(svc, projectId, userId, body);
      if ("error" in built) {
        return new Response(JSON.stringify({ error: built.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Charge: 5 credits per 10s of output, min 5, max 60. Skipped for active subscribers + owners.
      const credits = Math.min(60, Math.max(5, Math.ceil(built.durationSec / 10) * 5));
      const isOwner = await isOwnerUser(svc, userId);
      if (!isOwner) {
        const charge = await chargeOrSubscribe({
          userId,
          amount: credits,
          description: `MP4 render (${Math.round(built.durationSec)}s) — Remotion Lambda`,
          env,
        });
        if (!charge.ok) {
          return new Response(JSON.stringify({ error: "insufficient_credits", required: credits }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      try {
        const { renderId, bucketName } = await renderMediaOnLambda({
          region: AWS_REGION,
          functionName: REMOTION_FN,
          serveUrl: REMOTION_SERVE_URL,
          composition: "AdVideo",
          inputProps: built.props as unknown as Record<string, unknown>,
          codec: "h264",
          imageFormat: "jpeg",
          jpegQuality: 88,
          maxRetries: 1,
          privacy: "private",
          downloadBehavior: { type: "play-in-browser" },
        });

        return new Response(
          JSON.stringify({
            ok: true,
            renderId,
            bucketName,
            credits_charged: isOwner ? 0 : credits,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (e) {
        // Refund credits if Lambda submission fails.
        if (!isOwner) await refundCredits(userId, credits, "Refund: Remotion Lambda submit failed").catch(() => {});
        console.error("renderMediaOnLambda failed:", e);
        return new Response(
          JSON.stringify({ error: "Remotion Lambda submission failed", detail: String((e as Error)?.message || e) }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // ---- STATUS / FINALIZE ----
    if (action === "status") {
      const renderId = String(body?.renderId || "");
      const bucketName = String(body?.bucketName || "");
      const projectId = String(body?.video_project_id || "");
      if (!renderId || !bucketName || !projectId) {
        return new Response(JSON.stringify({ error: "renderId, bucketName, video_project_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Re-check ownership before doing anything privileged with the project row.
      const { data: project } = await svc
        .from("video_projects")
        .select("id, user_id")
        .eq("id", projectId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!project) {
        return new Response(JSON.stringify({ error: "Project not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName: REMOTION_FN,
        region: AWS_REGION,
      });

      if (progress.fatalErrorEncountered) {
        return new Response(
          JSON.stringify({
            ok: false,
            done: true,
            failed: true,
            error: progress.errors?.[0]?.message || "Render failed",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (!progress.done) {
        return new Response(
          JSON.stringify({
            ok: true,
            done: false,
            progress: Math.round((progress.overallProgress || 0) * 100),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Done — pull the MP4 from S3 and copy it into our private bucket.
      const outputUrl = progress.outputFile;
      if (!outputUrl) {
        return new Response(
          JSON.stringify({ ok: false, done: true, failed: true, error: "Render finished without an output file" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const mp4Resp = await fetch(outputUrl);
      if (!mp4Resp.ok) {
        return new Response(
          JSON.stringify({ ok: false, done: true, failed: true, error: `Failed to fetch rendered MP4 (${mp4Resp.status})` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const mp4Bytes = new Uint8Array(await mp4Resp.arrayBuffer());

      const filePath = `${userId}/${projectId}.mp4`;
      const { error: upErr } = await svc.storage
        .from("video-exports")
        .upload(filePath, mp4Bytes, { upsert: true, contentType: "video/mp4" });
      if (upErr) {
        return new Response(
          JSON.stringify({ ok: false, done: true, failed: true, error: `Upload failed: ${upErr.message}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      await svc
        .from("video_projects")
        .update({ exported_video_url: filePath, status: "completed" })
        .eq("id", projectId);

      // Issue a short-lived signed URL the browser can stream/download directly.
      const { data: signed } = await svc.storage.from("video-exports").createSignedUrl(filePath, 60 * 60);

      return new Response(
        JSON.stringify({
          ok: true,
          done: true,
          failed: false,
          progress: 100,
          file_path: filePath,
          signed_url: signed?.signedUrl ?? null,
          size_bytes: mp4Bytes.byteLength,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("render-video-lambda error:", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
