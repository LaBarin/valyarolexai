import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Send, Trash2, Loader2, ExternalLink, Plus, ShieldCheck, Layers } from "lucide-react";
import { PublishingSetup } from "./PublishingSetup";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ScheduledPost = {
  id: string;
  channel: string;
  caption: string | null;
  scheduled_at: string;
  status: string;
  publisher: string;
  error: string | null;
  video_id: string | null;
  campaign_id: string | null;
};

type VideoOption = { id: string; title: string; status: string };

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  publishing: "bg-primary/20 text-primary",
  published: "bg-green-500/20 text-green-400",
  failed: "bg-destructive/20 text-destructive",
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaignId?: string;
}

export const SchedulePublishDialog = ({ open, onOpenChange, campaignId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [verifiedConns, setVerifiedConns] = useState<{ platform: string }[]>([]);

  // form state
  const [videoId, setVideoId] = useState<string>("");
  const [channel, setChannel] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [publisher, setPublisher] = useState<"simulated" | "buffer" | "webhook">("simulated");
  const [bufferToken, setBufferToken] = useState("");
  const [bufferProfileIds, setBufferProfileIds] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (open && user) {
      load();
      loadVideos();
      loadVerifiedConnections();
    }
  }, [open, user, campaignId]);

  const loadVerifiedConnections = async () => {
    const { data } = await supabase
      .from("publishing_connections")
      .select("platform")
      .eq("is_active", true)
      .eq("verification_status", "verified");
    setVerifiedConns((data as any) || []);
  };

  const load = async () => {
    setLoading(true);
    let q = supabase.from("scheduled_posts").select("*").order("scheduled_at", { ascending: true });
    if (campaignId) q = q.eq("campaign_id", campaignId);
    const { data, error } = await q;
    if (!error) setPosts(data || []);
    setLoading(false);
  };

  const loadVideos = async () => {
    const { data } = await supabase.from("video_projects").select("id, title, status").order("created_at", { ascending: false }).limit(50);
    setVideos(data || []);
  };

  const createPost = async () => {
    if (!user) return;
    if (publisher === "buffer" && (!bufferToken || !bufferProfileIds)) {
      toast({ title: "Missing Buffer info", description: "Token and profile IDs required.", variant: "destructive" });
      return;
    }
    if (publisher === "webhook" && !webhookUrl) {
      toast({ title: "Missing webhook URL", variant: "destructive" });
      return;
    }
    setCreating(true);
    const publisher_config: any = {};
    if (publisher === "buffer") {
      publisher_config.buffer_access_token = bufferToken;
      publisher_config.profile_ids = bufferProfileIds.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (publisher === "webhook") publisher_config.webhook_url = webhookUrl;

    const { error } = await supabase.from("scheduled_posts").insert({
      user_id: user.id,
      video_id: videoId || null,
      campaign_id: campaignId || null,
      channel,
      caption: caption || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      publisher,
      publisher_config,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Schedule failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Scheduled", description: `Post will publish at ${new Date(scheduledAt).toLocaleString()}` });
    setCaption("");
    load();
  };

  const deletePost = async (id: string) => {
    await supabase.from("scheduled_posts").delete().eq("id", id);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  const publishNow = async () => {
    const { data, error } = await supabase.functions.invoke("publish-scheduled-posts");
    if (error) {
      toast({ title: "Publish failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Publisher run", description: `Processed ${data?.processed ?? 0} post(s).` });
    load();
  };

  const [bulkLoading, setBulkLoading] = useState(false);
  const bulkScheduleFromCampaign = async () => {
    if (!user || !campaignId) return;
    setBulkLoading(true);
    try {
      const { data: campaign } = await supabase
        .from("marketing_campaigns")
        .select("name, content_plan")
        .eq("id", campaignId)
        .maybeSingle();

      const items: any[] = (campaign?.content_plan as any[]) || [];
      if (!items.length) {
        toast({ title: "No content plan", description: "This campaign has no content items to schedule.", variant: "destructive" });
        setBulkLoading(false);
        return;
      }

      const { data: conns } = await supabase
        .from("publishing_connections")
        .select("platform, credentials, verification_status, is_active")
        .eq("is_active", true)
        .eq("verification_status", "verified");

      const connByPlatform: Record<string, any> = {};
      (conns || []).forEach((c: any) => {
        const norm = c.platform === "meta" ? ["facebook", "instagram"] : [c.platform];
        norm.forEach((n) => { if (!connByPlatform[n]) connByPlatform[n] = c; });
      });

      const base = new Date();
      base.setHours(10, 0, 0, 0);
      const rows = items.map((item, i) => {
        const week = Math.max(1, Number(item.week) || 1);
        const dayOffset = (week - 1) * 7 + (i % 7);
        const when = new Date(base.getTime() + dayOffset * 86400000 + (i * 2 * 3600000));
        const channel = (item.channel || "instagram").toLowerCase();
        const conn = connByPlatform[channel];
        const publisher = conn?.platform === "buffer" ? "buffer" : (conn ? conn.platform : "simulated");
        const publisher_config = conn?.credentials || {};
        return {
          user_id: user.id,
          campaign_id: campaignId,
          channel,
          caption: `${item.title}\n\n${item.description || ""}`.trim(),
          scheduled_at: when.toISOString(),
          publisher,
          publisher_config,
        };
      });

      const { error } = await supabase.from("scheduled_posts").insert(rows);
      if (error) throw error;
      toast({ title: "Bulk scheduled", description: `Queued ${rows.length} post(s) from "${campaign?.name}".` });
      load();
    } catch (e: any) {
      toast({ title: "Bulk schedule failed", description: e.message, variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Schedule & Auto-Post
          </DialogTitle>
          <DialogDescription>
            Queue rendered ads to publish to Meta, TikTok, YouTube and more — via Buffer, your own webhook, or simulated runs.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="new" className="space-y-4">
          <TabsList>
            <TabsTrigger value="new"><Plus className="w-3.5 h-3.5 mr-1" />New</TabsTrigger>
            <TabsTrigger value="queue">Queue ({posts.length})</TabsTrigger>
            <TabsTrigger value="connections"><ShieldCheck className="w-3.5 h-3.5 mr-1" />Connections</TabsTrigger>
          </TabsList>

          <TabsContent value="connections">
            <PublishingSetup />
          </TabsContent>

          <TabsContent value="new" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Video</Label>
                <Select value={videoId} onValueChange={setVideoId}>
                  <SelectTrigger><SelectValue placeholder="Select video (optional)" /></SelectTrigger>
                  <SelectContent>
                    {videos.map((v) => <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Caption</Label>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="Write your post caption..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Publish at</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Publisher</Label>
                <Select value={publisher} onValueChange={(v: any) => setPublisher(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simulated">Simulated (test)</SelectItem>
                    <SelectItem value="buffer">Buffer (real publishing)</SelectItem>
                    <SelectItem value="webhook">Webhook (your automation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {publisher === "buffer" && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-xs text-muted-foreground">Get an access token from <a href="https://buffer.com/developers/apps" target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">Buffer <ExternalLink className="w-3 h-3" /></a></p>
                <Input placeholder="Buffer access token" value={bufferToken} onChange={(e) => setBufferToken(e.target.value)} />
                <Input placeholder="Profile IDs (comma-separated)" value={bufferProfileIds} onChange={(e) => setBufferProfileIds(e.target.value)} />
              </div>
            )}
            {publisher === "webhook" && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-xs text-muted-foreground">We'll POST JSON to this URL. Wire it to Zapier, Make, n8n, or your own service.</p>
                <Input placeholder="https://hooks.zapier.com/..." value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
              </div>
            )}

            {(() => {
              const needsConn = publisher !== "simulated" && publisher !== "webhook";
              const channelKey = channel === "facebook" || channel === "instagram" ? "meta" : channel;
              const hasMatch = verifiedConns.some((c) => c.platform === channelKey || c.platform === publisher);
              const blocked = needsConn && !hasMatch;
              return (
                <>
                  {blocked && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400">
                      No verified <span className="font-mono">{channelKey}</span> connection. Open the Connections tab and run the Scope Tester before scheduling.
                    </div>
                  )}
                  <Button className="w-full" onClick={createPost} disabled={creating || blocked}>
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CalendarClock className="w-4 h-4 mr-2" />}
                    Schedule Post
                  </Button>
                </>
              );
            })()}

            {campaignId && (
              <Button variant="outline" className="w-full" onClick={bulkScheduleFromCampaign} disabled={bulkLoading}>
                {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Layers className="w-4 h-4 mr-2" />}
                Bulk Schedule From Campaign Plan
              </Button>
            )}
          </TabsContent>

          <TabsContent value="queue" className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Scheduler runs every minute. Use "Run Now" to dispatch due posts immediately.</p>
              <Button size="sm" variant="outline" onClick={publishNow}><Send className="w-3.5 h-3.5 mr-1" /> Run Now</Button>
            </div>
            {loading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div> :
              posts.length === 0 ? <p className="text-center text-sm text-muted-foreground py-6">No scheduled posts yet.</p> :
              posts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg glass">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLOR[p.status]}>{p.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{p.channel}</Badge>
                      <Badge variant="outline" className="text-[10px]">{p.publisher}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.caption || "(no caption)"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(p.scheduled_at).toLocaleString()}</p>
                    {p.error && <p className="text-[10px] text-destructive">{p.error}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deletePost(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))
            }
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SchedulePublishDialog;
