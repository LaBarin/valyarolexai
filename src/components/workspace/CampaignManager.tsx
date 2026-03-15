import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Sparkles, Plus, Loader2, ChevronLeft, Trash2, Target,
  Calendar, BarChart3, Mail, Share2, FileText, Zap, Eye, Link2, Copy, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignPreviewDialog } from "./AdPreviewDialog";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type Goal = { goal: string; metric: string; target: string };
type Channel = { channel: string; strategy: string; budget_pct: number };
type ContentItem = { title: string; type: string; channel: string; description: string; week: number };
type Phase = { name: string; weeks: string; focus: string };
type Campaign = {
  id: string;
  name: string;
  description?: string;
  status: string;
  campaign_type: string;
  target_audience?: string;
  goals: Goal[];
  channels: Channel[];
  content_plan: ContentItem[];
  schedule: { duration_weeks?: number; phases?: Phase[] };
  share_token?: string;
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-600/20 text-blue-400",
  instagram: "bg-pink-500/20 text-pink-400",
  tiktok: "bg-foreground/20 text-foreground",
  youtube: "bg-red-500/20 text-red-400",
  linkedin: "bg-blue-500/20 text-blue-300",
  twitter: "bg-sky-500/20 text-sky-400",
  google_ads: "bg-yellow-500/20 text-yellow-400",
  snapchat: "bg-yellow-400/20 text-yellow-300",
  pinterest: "bg-red-400/20 text-red-300",
  reddit: "bg-orange-500/20 text-orange-400",
  social: "bg-primary/20 text-primary",
  email: "bg-accent/20 text-accent",
  content: "bg-muted text-muted-foreground",
  paid_ads: "bg-primary/20 text-primary",
};

const CHANNEL_ICONS: Record<string, any> = {
  social: Share2,
  email: Mail,
  content: FileText,
  paid_ads: Target,
  pr: Megaphone,
  events: Calendar,
  facebook: Share2,
  instagram: Share2,
  tiktok: Share2,
  youtube: Share2,
  linkedin: Share2,
  twitter: Share2,
  google_ads: Target,
  snapchat: Share2,
  pinterest: Share2,
  reddit: Share2,
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-accent/20 text-accent",
  paused: "bg-orange-500/20 text-orange-400",
  completed: "bg-primary/20 text-primary",
};

const CampaignManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isSavingPreview, setIsSavingPreview] = useState(false);

  useEffect(() => {
    if (user) loadCampaigns();
  }, [user]);

  const loadCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) {
      setCampaigns(data.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description ?? undefined,
        status: c.status,
        campaign_type: c.campaign_type,
        target_audience: c.target_audience ?? undefined,
        goals: (c.goals as any) || [],
        channels: (c.channels as any) || [],
        content_plan: (c.content_plan as any) || [],
        schedule: (c.schedule as any) || {},
        share_token: (c as any).share_token ?? undefined,
      })));
    }
    setLoading(false);
  };

  const getShareUrl = (token: string) => {
    const base = window.location.origin;
    return `${base}/campaign/${token}`;
  };

  const copyShareLink = (token: string) => {
    navigator.clipboard.writeText(getShareUrl(token));
    toast({ title: "Link Copied!", description: "Share this link to let others view the campaign." });
  };

  const generateCampaign = async () => {
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "campaign",
        }),
      });
      if (!resp.ok) throw new Error("AI generation failed");
      const { result } = await resp.json();
      let parsed: any;
      try {
        const cleaned = result.replace(/```json\n?|```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("Failed to parse AI response");
      }
      // Show preview instead of saving directly
      setPreviewData(parsed);
    } catch (e: any) {
      toast({ title: "Generation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const approvePreview = async () => {
    if (!previewData || !user) return;
    setIsSavingPreview(true);
    try {
      const { error } = await supabase.from("marketing_campaigns").insert({
        user_id: user.id,
        name: previewData.name || "AI Campaign",
        description: previewData.description,
        campaign_type: previewData.campaign_type || "general",
        target_audience: previewData.target_audience,
        goals: previewData.goals || [],
        channels: previewData.channels || [],
        content_plan: previewData.content_plan || [],
        schedule: previewData.schedule || {},
        ai_generated: true,
      });
      if (error) throw error;
      setPreviewData(null);
      setPrompt("");
      await loadCampaigns();
      toast({ title: "Campaign Approved", description: `"${previewData.name}" has been saved.` });
    } catch (e: any) {
      toast({ title: "Save Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingPreview(false);
    }
  };

  const rejectPreview = () => {
    setPreviewData(null);
    toast({ title: "Campaign Rejected", description: "The draft was discarded." });
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("marketing_campaigns").update({ status }).eq("id", id);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    if (activeCampaign?.id === id) setActiveCampaign((prev) => prev ? { ...prev, status } : null);
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from("marketing_campaigns").delete().eq("id", id);
    if (activeCampaign?.id === id) setActiveCampaign(null);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  // Campaign detail view
  if (activeCampaign) {
    const c = activeCampaign;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => { setActiveCampaign(null); loadCampaigns(); }}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-bold">{c.name}</h2>
              <p className="text-sm text-muted-foreground">{c.description}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={STATUS_COLORS[c.status] || STATUS_COLORS.draft}>{c.status}</Badge>
            {c.share_token && (
              <>
                <Button size="sm" variant="outline" onClick={() => copyShareLink(c.share_token!)}>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
                </Button>
                <a href={getShareUrl(c.share_token)} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                </a>
              </>
            )}
            {c.status === "draft" && (
              <Button size="sm" onClick={() => updateStatus(c.id, "active")}>
                <Zap className="w-4 h-4 mr-1" /> Launch
              </Button>
            )}
            {c.status === "active" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "paused")}>Pause</Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="ads" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="ads">Ad Creatives</TabsTrigger>
            <TabsTrigger value="overview">Strategy</TabsTrigger>
            <TabsTrigger value="content">Content Plan</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Ad Creatives Tab */}
          <TabsContent value="ads" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {c.content_plan.map((item, i) => {
                const colorClass = PLATFORM_COLORS[item.channel] || PLATFORM_COLORS.social;
                return (
                  <div key={i} className="glass rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <Badge className={colorClass}>{item.channel}</Badge>
                      <Badge variant="outline" className="text-[10px]">Week {item.week}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    <Badge variant="outline" className="text-[10px]">{item.type.replace(/_/g, " ")}</Badge>
                  </div>
                );
              })}
            </div>
            {c.content_plan.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No ad creatives in this campaign.</div>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            {/* Goals */}
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Campaign Goals</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.goals.map((g, i) => (
                  <div key={i} className="bg-background/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium">{g.goal}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{g.metric}</span>
                      <span className="text-primary font-semibold">{g.target}</span>
                    </div>
                    <Progress value={0} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Share2 className="w-4 h-4 text-primary" /> Channels & Budget</h3>
              <div className="space-y-3">
                {c.channels.map((ch, i) => {
                  const Icon = CHANNEL_ICONS[ch.channel] || Megaphone;
                  return (
                    <div key={i} className="bg-background/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium capitalize">{ch.channel.replace(/_/g, " ")}</span>
                        </div>
                        <Badge variant="outline">{ch.budget_pct}% budget</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ch.strategy}</p>
                      <Progress value={ch.budget_pct} className="h-1.5 mt-2" />
                    </div>
                  );
                })}
              </div>
            </div>

            {c.target_audience && (
              <div className="glass rounded-xl p-5">
                <h3 className="font-semibold mb-2">Target Audience</h3>
                <p className="text-sm text-muted-foreground">{c.target_audience}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-3">
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Content Pieces</h3>
              <div className="space-y-2">
                {c.content_plan.map((item, i) => (
                  <div key={i} className="bg-background/50 rounded-lg p-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{item.channel}</Badge>
                        <span className="text-[10px] text-muted-foreground">Week {item.week}</span>
                      </div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3">
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Campaign Timeline</h3>
              {c.schedule.duration_weeks && (
                <p className="text-sm text-muted-foreground mb-4">Duration: {c.schedule.duration_weeks} weeks</p>
              )}
              <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {(c.schedule.phases || []).map((phase, i) => (
                  <div key={i} className="relative">
                    <div className="absolute left-[-20px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold">{phase.name}</h4>
                        <Badge variant="outline" className="text-xs">Weeks {phase.weeks}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{phase.focus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* AI Generator */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Campaign Planner</h3>
            <p className="text-xs text-muted-foreground">Describe your goals and get a full marketing campaign plan</p>
          </div>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Launch a product awareness campaign for our new AI writing tool targeting content creators and small businesses. Budget is $15K over 2 months. Focus on social media and content marketing..."
          rows={3}
          className="bg-background/50 border-border/50"
        />
        <Button onClick={generateCampaign} disabled={!prompt.trim() || isGenerating} className="w-full">
          {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Building Campaign...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Campaign Plan</>}
        </Button>
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No campaigns yet. Describe your marketing goals above to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ scale: 1.01 }}
              className="glass rounded-xl p-5 cursor-pointer group"
              onClick={() => setActiveCampaign(c)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-[10px] ${STATUS_COLORS[c.status]}`}>{c.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{c.content_plan.length} content pieces</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {c.share_token && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); copyShareLink(c.share_token!); }}
                    >
                      <Link2 className="w-4 h-4 text-primary" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); deleteCampaign(c.id); }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {c.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignManager;
