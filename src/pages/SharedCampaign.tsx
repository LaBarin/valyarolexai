import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Megaphone, Target, Calendar, Share2, Mail, FileText, BarChart3,
  Loader2, ArrowLeft, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/valyarolex-logo.png";

type Goal = { goal: string; metric: string; target: string };
type Channel = { channel: string; strategy: string; budget_pct: number };
type ContentItem = { title: string; type: string; channel: string; description: string; week: number };
type Phase = { name: string; weeks: string; focus: string };

const CHANNEL_ICONS: Record<string, any> = {
  social: Share2, email: Mail, content: FileText, paid_ads: Target,
  pr: Megaphone, events: Calendar, facebook: Share2, instagram: Share2,
  tiktok: Share2, youtube: Share2, linkedin: Share2, twitter: Share2,
  google_ads: Target, snapchat: Share2, pinterest: Share2, reddit: Share2,
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
  pr: "bg-accent/20 text-accent",
  events: "bg-primary/20 text-primary",
};

const SharedCampaign = () => {
  const { token } = useParams<{ token: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .rpc("get_shared_campaign", { p_share_token: token })
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setCampaign({
          ...data,
          goals: (data.goals as any) || [],
          channels: (data.channels as any) || [],
          content_plan: (data.content_plan as any) || [],
          schedule: (data.schedule as any) || {},
        });
      }
      setLoading(false);
    };
    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Megaphone className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Campaign Not Found</h1>
        <p className="text-muted-foreground">This campaign link may have expired or been removed.</p>
        <Link to="/">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Go Home</Button>
        </Link>
      </div>
    );
  }

  const goals = campaign.goals as Goal[];
  const channels = campaign.channels as Channel[];
  const contentPlan = campaign.content_plan as ContentItem[];
  const schedule = campaign.schedule as { duration_weeks?: number; phases?: Phase[] };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Valyarolex.AI" className="h-8" />
            <span className="text-sm text-muted-foreground">Campaign Plan</span>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Try Valyarolex.AI
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
              <p className="text-muted-foreground">{campaign.description}</p>
            </div>
          </div>
          {campaign.target_audience && (
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Target Audience:</span> {campaign.target_audience}</p>
          )}
        </motion.div>

        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="ads">Ad Creatives</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Ad Creatives Tab */}
          <TabsContent value="ads" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {contentPlan.map((item, i) => {
                const colorClass = PLATFORM_COLORS[item.channel] || PLATFORM_COLORS.social;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className={colorClass}>{item.channel}</Badge>
                      <Badge variant="outline" className="text-[10px]">Week {item.week}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{item.type.replace(/_/g, " ")}</Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-6">
            {/* Goals */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Campaign Goals</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {goals.map((g, i) => (
                  <div key={i} className="bg-background/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium">{g.goal}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{g.metric}</span>
                      <span className="text-primary font-semibold">{g.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Share2 className="w-4 h-4 text-primary" /> Channels & Budget</h3>
              <div className="space-y-3">
                {channels.map((ch, i) => {
                  const Icon = CHANNEL_ICONS[ch.channel] || Megaphone;
                  const colorClass = PLATFORM_COLORS[ch.channel] || PLATFORM_COLORS.social;
                  return (
                    <div key={i} className="bg-background/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium capitalize">{ch.channel.replace(/_/g, " ")}</span>
                        </div>
                        <Badge className={colorClass}>{ch.budget_pct}% budget</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ch.strategy}</p>
                      <Progress value={ch.budget_pct} className="h-1.5 mt-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Campaign Timeline</h3>
              {schedule.duration_weeks && (
                <p className="text-sm text-muted-foreground mb-4">Duration: {schedule.duration_weeks} weeks</p>
              )}
              <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {(schedule.phases || []).map((phase, i) => (
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

        {/* Footer */}
        <div className="text-center py-8 text-xs text-muted-foreground">
          Generated by <span className="text-primary font-semibold">Valyarolex.AI</span> — One Workspace. Infinite Intelligence.
        </div>
      </main>
    </div>
  );
};

export default SharedCampaign;
