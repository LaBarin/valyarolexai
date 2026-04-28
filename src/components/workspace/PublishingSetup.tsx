import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, XCircle, Loader2, Trash2, RefreshCw, ShieldCheck, ShieldAlert, ExternalLink, Facebook, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Connection = {
  id: string;
  platform: string;
  display_name: string;
  account_id: string | null;
  required_scopes: string[];
  granted_scopes: string[];
  verification_status: string;
  last_verified_at: string | null;
  verification_error: string | null;
  is_active: boolean;
  credentials: any;
};

const PLATFORM_META: Record<string, {
  name: string;
  icon: any;
  color: string;
  scopes: string[];
  docsUrl: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  helpText: string;
}> = {
  meta: {
    name: "Meta (Facebook & Instagram)",
    icon: Facebook,
    color: "text-blue-400",
    scopes: ["pages_manage_posts", "pages_read_engagement", "instagram_basic", "instagram_content_publish"],
    docsUrl: "https://developers.facebook.com/tools/explorer/",
    fields: [
      { key: "access_token", label: "Page Access Token", placeholder: "EAAG..." },
      { key: "page_id", label: "Page ID", placeholder: "123456789012345" },
    ],
    helpText: "Generate a long-lived Page Access Token in Meta Graph API Explorer. Requires a Meta App with Business Verification.",
  },
  tiktok: {
    name: "TikTok",
    icon: () => <span className="font-bold text-foreground text-lg">♪</span>,
    color: "text-foreground",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
    docsUrl: "https://developers.tiktok.com/doc/login-kit-web",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "act.example..." },
    ],
    helpText: "Create a TikTok app at developers.tiktok.com, complete Content Posting API approval, then generate an access token.",
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    color: "text-red-400",
    scopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
    docsUrl: "https://developers.google.com/youtube/v3/guides/auth/installed-apps",
    fields: [
      { key: "access_token", label: "OAuth Access Token", placeholder: "ya29...." },
    ],
    helpText: "Create a Google Cloud project, enable YouTube Data API v3, and get an OAuth token with upload scope.",
  },
  buffer: {
    name: "Buffer",
    icon: RefreshCw,
    color: "text-primary",
    scopes: ["publish"],
    docsUrl: "https://buffer.com/developers/apps",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "1/abc..." },
      { key: "profile_ids", label: "Profile IDs (comma-sep)", placeholder: "5f1234abcd..." },
    ],
    helpText: "Easiest path. Buffer's app is already approved for Meta, TikTok, YouTube, LinkedIn, and X. Get a token from buffer.com/developers/apps.",
  },
  webhook: {
    name: "Webhook (Zapier / Make / Custom)",
    icon: ExternalLink,
    color: "text-accent",
    scopes: ["webhook"],
    docsUrl: "https://zapier.com/apps/webhook/integrations",
    fields: [
      { key: "webhook_url", label: "Webhook URL", placeholder: "https://hooks.zapier.com/..." },
    ],
    helpText: "We POST JSON with caption + media URL. Wire it to any automation that handles posting for you.",
  },
};

export const PublishingSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState<keyof typeof PLATFORM_META>("buffer");
  const [newName, setNewName] = useState("");
  const [newCreds, setNewCreds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("publishing_connections").select("*").order("created_at", { ascending: false });
    setConnections(data || []);
    setLoading(false);
  };

  const verify = async (id: string) => {
    setVerifyingId(id);
    const { data, error } = await supabase.functions.invoke("verify-publishing-connection", { body: { connection_id: id } });
    setVerifyingId(null);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.ok) toast({ title: "✓ Verified", description: data.display_name || "Connection is valid." });
    else toast({ title: "Verification failed", description: data?.error || "Token rejected", variant: "destructive" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("publishing_connections").delete().eq("id", id);
    setConnections((c) => c.filter((x) => x.id !== id));
  };

  const toggleActive = async (c: Connection) => {
    await supabase.from("publishing_connections").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  };

  const create = async () => {
    if (!user) return;
    const meta = PLATFORM_META[newPlatform];
    const missingField = meta.fields.find((f) => !newCreds[f.key]);
    if (missingField) {
      toast({ title: "Missing field", description: missingField.label, variant: "destructive" });
      return;
    }
    setSaving(true);
    const credentials: any = { ...newCreds };
    if (credentials.profile_ids) credentials.profile_ids = credentials.profile_ids.split(",").map((s: string) => s.trim()).filter(Boolean);

    const { data, error } = await supabase.from("publishing_connections").insert({
      user_id: user.id,
      platform: newPlatform,
      display_name: newName || meta.name,
      credentials,
      required_scopes: meta.scopes,
    }).select().single();

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setAddOpen(false);
    setNewName("");
    setNewCreds({});
    await load();
    if (data) verify(data.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Publishing Connections</h2>
          <p className="text-xs text-muted-foreground mt-1">Connect Meta, TikTok, YouTube, Buffer, and webhooks. Each connection is verified against the platform's API before scheduling.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Connection</Button>
      </div>

      {/* Recommended path callout */}
      <div className="glass rounded-xl p-4 border border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-1">Recommended: connect via Buffer</p>
            <p className="text-xs text-muted-foreground">
              Buffer's app is already approved by Meta, TikTok, YouTube, LinkedIn, and X — one OAuth login covers everything. Building our own OAuth would require separate App Review approvals (weeks-to-months per platform) and Business Verification with Meta. Direct tokens still work below for advanced users with approved apps.
            </p>
            <a href="https://buffer.com/developers/apps" target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-2">
              Get a Buffer access token <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : connections.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No publishing connections yet.</p>
          <p className="text-xs mt-1">Add Buffer for the fastest path to real auto-posting.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {connections.map((c) => {
            const meta = PLATFORM_META[c.platform];
            const Icon = meta?.icon || ShieldCheck;
            const missing = (c.required_scopes || []).filter((s) => !(c.granted_scopes || []).includes(s));
            const verified = c.verification_status === "verified";
            return (
              <motion.div key={c.id} layout className="glass rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center ${meta?.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.display_name}</p>
                      <p className="text-[10px] text-muted-foreground">{meta?.name || c.platform}</p>
                    </div>
                  </div>
                  <Badge className={verified ? "bg-green-500/20 text-green-400" : c.verification_status === "failed" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}>
                    {verified ? <><CheckCircle2 className="w-3 h-3 mr-1" /> verified</> : c.verification_status === "failed" ? <><XCircle className="w-3 h-3 mr-1" /> failed</> : "unverified"}
                  </Badge>
                </div>

                {c.account_id && <p className="text-[10px] text-muted-foreground">Account: <span className="text-foreground">{c.account_id}</span></p>}
                {c.verification_error && <p className="text-[10px] text-destructive">{c.verification_error}</p>}

                {(c.required_scopes || []).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Required permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {c.required_scopes.map((s) => {
                        const ok = c.granted_scopes?.includes(s);
                        return (
                          <Badge key={s} variant="outline" className={`text-[9px] ${ok ? "border-green-500/40 text-green-400" : verified ? "border-yellow-500/40 text-yellow-400" : "border-border text-muted-foreground"}`}>
                            {ok ? "✓" : "•"} {s.split("/").pop()}
                          </Badge>
                        );
                      })}
                    </div>
                    {verified && missing.length > 0 && (
                      <p className="text-[10px] text-yellow-400">Missing {missing.length} scope(s) — re-issue token with full permissions.</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => verify(c.id)} disabled={verifyingId === c.id}>
                    {verifyingId === c.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Verify
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleActive(c)}>
                    {c.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(c.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Publishing Connection</DialogTitle>
            <DialogDescription>Connect a destination and verify required permissions before scheduling.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform</Label>
              <Select value={newPlatform} onValueChange={(v: any) => { setNewPlatform(v); setNewCreds({}); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-2">
              <p className="text-xs text-muted-foreground">{PLATFORM_META[newPlatform].helpText}</p>
              <a href={PLATFORM_META[newPlatform].docsUrl} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                Get credentials <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex flex-wrap gap-1 pt-1">
                {PLATFORM_META[newPlatform].scopes.map((s) => (
                  <Badge key={s} variant="outline" className="text-[9px]">{s.split("/").pop()}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Display name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={PLATFORM_META[newPlatform].name} />
            </div>

            {PLATFORM_META[newPlatform].fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type={f.type || "text"}
                  value={newCreds[f.key] || ""}
                  onChange={(e) => setNewCreds({ ...newCreds, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            <Button className="w-full" onClick={create} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Save & Verify
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublishingSetup;
