// Verifies a publishing connection by hitting each platform's "me" / introspection endpoint.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type VerifyResult = {
  ok: boolean;
  account_id?: string;
  display_name?: string;
  granted_scopes: string[];
  error?: string;
};

async function verifyMeta(token: string, pageId?: string): Promise<VerifyResult> {
  // Validate token + introspect scopes
  const r = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${encodeURIComponent(token)}&fields=id,name`);
  const data = await r.json();
  if (!r.ok) return { ok: false, granted_scopes: [], error: data?.error?.message || "Invalid Meta token" };

  // Get permissions
  const p = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${encodeURIComponent(token)}`);
  const perms = await p.json();
  const granted = (perms?.data || []).filter((x: any) => x.status === "granted").map((x: any) => x.permission);

  // Optionally validate page access
  if (pageId) {
    const pg = await fetch(`https://graph.facebook.com/v19.0/${pageId}?access_token=${encodeURIComponent(token)}&fields=id,name`);
    const pgd = await pg.json();
    if (!pg.ok) return { ok: false, granted_scopes: granted, error: pgd?.error?.message || "Page not accessible" };
    return { ok: true, account_id: pageId, display_name: `${data.name} → ${pgd.name}`, granted_scopes: granted };
  }
  return { ok: true, account_id: data.id, display_name: data.name, granted_scopes: granted };
}

async function verifyTikTok(token: string): Promise<VerifyResult> {
  const r = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await r.json();
  if (!r.ok || data?.error?.code) {
    return { ok: false, granted_scopes: [], error: data?.error?.message || "Invalid TikTok token" };
  }
  const u = data?.data?.user || {};
  return { ok: true, account_id: u.open_id, display_name: u.display_name, granted_scopes: [] };
}

async function verifyYouTube(token: string): Promise<VerifyResult> {
  const r = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await r.json();
  if (!r.ok) return { ok: false, granted_scopes: [], error: data?.error?.message || "Invalid YouTube token" };
  const ch = data?.items?.[0];
  if (!ch) return { ok: false, granted_scopes: [], error: "No YouTube channel found for this token" };

  // Check token scopes via tokeninfo
  const ti = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);
  const tid = await ti.json();
  const scopes: string[] = (tid?.scope || "").split(" ").filter(Boolean);
  return { ok: true, account_id: ch.id, display_name: ch.snippet?.title, granted_scopes: scopes };
}

async function verifyBuffer(token: string): Promise<VerifyResult> {
  const r = await fetch(`https://api.bufferapp.com/1/user.json?access_token=${encodeURIComponent(token)}`);
  const data = await r.json();
  if (!r.ok || data?.error) return { ok: false, granted_scopes: [], error: data?.error || "Invalid Buffer token" };
  return { ok: true, account_id: data.id, display_name: data.name || data.email || "Buffer User", granted_scopes: ["publish"] };
}

async function verifyWebhook(url: string): Promise<VerifyResult> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true, source: "valyarolex.ai", message: "Connection verification ping" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return { ok: false, granted_scopes: [], error: `Webhook returned ${r.status}` };
    return { ok: true, display_name: new URL(url).hostname, granted_scopes: ["webhook"] };
  } catch (e: any) {
    return { ok: false, granted_scopes: [], error: e.message || "Webhook unreachable" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: cErr } = await supabase.auth.getUser(token);
  if (cErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userId = userData.user.id;

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const { connection_id } = body;
  if (!connection_id) {
    return new Response(JSON.stringify({ error: "connection_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: conn, error: fErr } = await supabase
    .from("publishing_connections")
    .select("*")
    .eq("id", connection_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fErr || !conn) {
    return new Response(JSON.stringify({ error: "Connection not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const creds = conn.credentials || {};
  let result: VerifyResult;

  try {
    switch (conn.platform) {
      case "meta":
        result = await verifyMeta(creds.access_token, creds.page_id);
        break;
      case "tiktok":
        result = await verifyTikTok(creds.access_token);
        break;
      case "youtube":
        result = await verifyYouTube(creds.access_token);
        break;
      case "buffer":
        result = await verifyBuffer(creds.access_token);
        break;
      case "webhook":
        result = await verifyWebhook(creds.webhook_url);
        break;
      default:
        result = { ok: false, granted_scopes: [], error: `Unsupported platform: ${conn.platform}` };
    }
  } catch (e: any) {
    result = { ok: false, granted_scopes: [], error: e.message || "Verification failed" };
  }

  await supabase.from("publishing_connections").update({
    verification_status: result.ok ? "verified" : "failed",
    verification_error: result.error || null,
    last_verified_at: new Date().toISOString(),
    granted_scopes: result.granted_scopes,
    account_id: result.account_id || conn.account_id,
    display_name: result.display_name || conn.display_name,
  }).eq("id", connection_id);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
