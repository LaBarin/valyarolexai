// Cron-invoked publisher. Picks up due scheduled_posts and dispatches them
// to Buffer, a user-supplied webhook, or simulates the publish.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { safeFetch } from "../_shared/safe-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Post = {
  id: string;
  user_id: string;
  video_id: string | null;
  campaign_id: string | null;
  channel: string;
  caption: string | null;
  publisher: string;
  publisher_config: Record<string, any>;
  attempts: number;
};

async function publishToBuffer(post: Post, mediaUrl: string | null) {
  const token = post.publisher_config?.buffer_access_token || Deno.env.get("BUFFER_ACCESS_TOKEN");
  const profileIds: string[] = post.publisher_config?.profile_ids || [];
  if (!token) throw new Error("Buffer access token missing");
  if (!profileIds.length) throw new Error("Buffer profile_ids missing");

  const form = new URLSearchParams();
  form.set("text", post.caption || "");
  profileIds.forEach((p) => form.append("profile_ids[]", p));
  if (mediaUrl) {
    form.set("media[link]", mediaUrl);
    form.set("media[photo]", mediaUrl);
  }
  form.set("now", "true");

  const r = await fetch(`https://api.bufferapp.com/1/updates/create.json?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await r.json();
  if (!r.ok || data?.success === false) throw new Error(`Buffer error: ${JSON.stringify(data)}`);
  return data;
}

async function publishToWebhook(post: Post, mediaUrl: string | null) {
  const url = post.publisher_config?.webhook_url;
  if (!url) throw new Error("webhook_url missing");
  const { status, bodyText } = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: post.id,
      channel: post.channel,
      caption: post.caption,
      media_url: mediaUrl,
      campaign_id: post.campaign_id,
      video_id: post.video_id,
      scheduled_for: new Date().toISOString(),
    }),
    timeoutMs: 10000,
    maxBodyBytes: 16 * 1024,
  });
  if (status < 200 || status >= 300) throw new Error(`Webhook ${status}: ${bodyText}`);
  return { status, body: bodyText.slice(0, 500) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: due, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(20);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const results: any[] = [];
  for (const post of (due || []) as Post[]) {
    await supabase.from("scheduled_posts").update({ status: "publishing", attempts: post.attempts + 1 }).eq("id", post.id);

    try {
      let mediaUrl: string | null = null;
      if (post.video_id) {
        const { data: v } = await supabase.from("video_projects").select("exported_video_url, thumbnail_url").eq("id", post.video_id).maybeSingle();
        mediaUrl = v?.exported_video_url || v?.thumbnail_url || null;
      }

      let result: any;
      if (post.publisher === "buffer") result = await publishToBuffer(post, mediaUrl);
      else if (post.publisher === "webhook") result = await publishToWebhook(post, mediaUrl);
      else result = { simulated: true, message: `Would publish to ${post.channel}`, media_url: mediaUrl };

      await supabase.from("scheduled_posts").update({
        status: "published",
        published_at: new Date().toISOString(),
        result,
        error: null,
      }).eq("id", post.id);

      await supabase.from("notifications").insert({
        user_id: post.user_id,
        type: "success",
        title: "Post published",
        message: `Your ${post.channel} post was published via ${post.publisher}.`,
        link: post.campaign_id ? `/workspace?tab=campaigns&id=${post.campaign_id}` : "/workspace?tab=campaigns",
      });

      results.push({ id: post.id, ok: true });
    } catch (e: any) {
      await supabase.from("scheduled_posts").update({
        status: "failed",
        error: e.message?.slice(0, 1000) || "Unknown error",
      }).eq("id", post.id);

      await supabase.from("notifications").insert({
        user_id: post.user_id,
        type: "error",
        title: "Publish failed",
        message: `${post.channel} via ${post.publisher}: ${e.message?.slice(0, 200)}`,
        link: "/workspace?tab=campaigns",
      });

      results.push({ id: post.id, ok: false, error: e.message });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
