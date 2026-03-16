import { useState, useMemo, useEffect } from "react";
import { useNarrator } from "@/hooks/use-narrator";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, ChevronLeft, ChevronRight, Megaphone, Target,
  Share2, Mail, FileText, Calendar, BarChart3, Eye
} from "lucide-react";
import { NarratorControls } from "./NarratorControls";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import logoImg from "@/assets/valyarolex-logo.png";

const logoUrl = logoImg;
/* ── Campaign Preview ── */

type Goal = { goal: string; metric: string; target: string };
type Channel = { channel: string; strategy: string; budget_pct: number };
type ContentItem = { title: string; type: string; channel: string; description: string; week: number };
type Phase = { name: string; weeks: string; focus: string };

type CampaignPreviewData = {
  name: string;
  description?: string;
  campaign_type?: string;
  target_audience?: string;
  goals: Goal[];
  channels: Channel[];
  content_plan: ContentItem[];
  schedule: { duration_weeks?: number; phases?: Phase[] };
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

export const CampaignPreviewDialog = ({
  open,
  data,
  onApprove,
  onReject,
  loading,
}: {
  open: boolean;
  data: CampaignPreviewData | null;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}) => {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onReject(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={logoUrl} alt="Valyarolex.AI" className="h-5 w-auto" />
            <Eye className="w-5 h-5 text-primary" />
            Review Campaign — {data.name}
          </DialogTitle>
          <DialogDescription>Preview your AI-generated campaign before saving. Approve to save or reject to discard.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 pb-4">
            {/* Overview */}
            <div className="glass rounded-xl p-4 space-y-2">
              <p className="text-sm">{data.description}</p>
              {data.target_audience && (
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Audience:</span> {data.target_audience}</p>
              )}
            </div>

            <Tabs defaultValue="ads" className="space-y-3">
              <TabsList className="glass">
                <TabsTrigger value="ads">Ad Creatives ({data.content_plan.length})</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="ads">
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.content_plan.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass rounded-xl p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className={PLATFORM_COLORS[item.channel] || PLATFORM_COLORS.social}>{item.channel}</Badge>
                        <Badge variant="outline" className="text-[10px]">Week {item.week}</Badge>
                      </div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                      <Badge variant="outline" className="text-[10px]">{item.type.replace(/_/g, " ")}</Badge>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="strategy" className="space-y-3">
                {data.goals.length > 0 && (
                  <div className="glass rounded-xl p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-primary" /> Goals</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {data.goals.map((g, i) => (
                        <div key={i} className="bg-background/50 rounded-lg p-3">
                          <p className="text-xs font-medium">{g.goal}</p>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>{g.metric}</span>
                            <span className="text-primary font-semibold">{g.target}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.channels.length > 0 && (
                  <div className="glass rounded-xl p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5 text-primary" /> Channels</h4>
                    <div className="space-y-2">
                      {data.channels.map((ch, i) => (
                        <div key={i} className="bg-background/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium capitalize">{ch.channel.replace(/_/g, " ")}</span>
                            <Badge className={PLATFORM_COLORS[ch.channel] || PLATFORM_COLORS.social} variant="secondary">{ch.budget_pct}%</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{ch.strategy}</p>
                          <Progress value={ch.budget_pct} className="h-1 mt-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline">
                <div className="glass rounded-xl p-4">
                  {data.schedule.duration_weeks && (
                    <p className="text-xs text-muted-foreground mb-3">Duration: {data.schedule.duration_weeks} weeks</p>
                  )}
                  <div className="relative space-y-3 pl-5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-border">
                    {(data.schedule.phases || []).map((phase, i) => (
                      <div key={i} className="relative">
                        <div className="absolute left-[-16px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                        <div className="bg-background/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-0.5">
                            <h5 className="text-xs font-semibold">{phase.name}</h5>
                            <Badge variant="outline" className="text-[10px]">Weeks {phase.weeks}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{phase.focus}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
          <CampaignNarrator data={data} />
          <div className="flex-1" />
          <Button variant="outline" onClick={onReject} disabled={loading}>
            <X className="w-4 h-4 mr-1.5" /> Reject
          </Button>
          <Button onClick={onApprove} disabled={loading}>
            <Check className="w-4 h-4 mr-1.5" /> {loading ? "Saving…" : "Approve & Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Campaign Narrator Helper ── */

function CampaignNarrator({ data }: { data: CampaignPreviewData }) {
  const slides = useMemo(() => {
    const items: { title: string; body: string }[] = [];
    items.push({
      title: data.name,
      body: `${data.description || ""}. Campaign type: ${data.campaign_type || "general"}. Target audience: ${data.target_audience || "broad audience"}.`,
    });
    if (data.goals.length > 0) {
      items.push({
        title: "Campaign Goals",
        body: data.goals.map((g) => `${g.goal}: target ${g.target} measured by ${g.metric}`).join(". "),
      });
    }
    if (data.channels.length > 0) {
      items.push({
        title: "Channel Strategy",
        body: data.channels.map((ch) => `${ch.channel} at ${ch.budget_pct}% budget: ${ch.strategy}`).join(". "),
      });
    }
    data.content_plan.forEach((item) => {
      items.push({ title: item.title, body: `${item.type} on ${item.channel}. ${item.description}` });
    });
    if (data.schedule.phases && data.schedule.phases.length > 0) {
      items.push({
        title: "Timeline",
        body: data.schedule.phases.map((p) => `${p.name}, weeks ${p.weeks}: ${p.focus}`).join(". "),
      });
    }
    return items;
  }, [data]);

  const { isNarrating, rate, setRate, startNarration, stopNarration } = useNarrator({
    onStepChange: () => {},
    totalSteps: slides.length,
  });

  useEffect(() => () => { stopNarration(); }, [stopNarration]);

  return (
    <NarratorControls
      slides={slides}
      currentSlide={0}
      isNarrating={isNarrating}
      onStart={startNarration}
      onStop={stopNarration}
    />
  );
}

/* ── Pitch Deck Preview ── */

type SlideContent = {
  headline?: string;
  body?: string;
  bullets?: string[];
  metric?: string;
  metric_label?: string;
};

type PreviewSlide = {
  slide_type: string;
  title: string;
  content: SlideContent;
  notes?: string;
};

export type PitchDeckPreviewData = {
  deck_title: string;
  deck_description?: string;
  slides: PreviewSlide[];
};

const SLIDE_TYPE_COLORS: Record<string, string> = {
  title: "from-primary to-accent",
  problem: "from-destructive/60 to-destructive/30",
  solution: "from-accent/60 to-primary/30",
  market: "from-primary/50 to-blue-500/30",
  product: "from-accent to-primary/40",
  traction: "from-green-500/50 to-accent/30",
  business_model: "from-primary/60 to-accent/40",
  team: "from-accent/40 to-primary/30",
  financials: "from-primary/40 to-green-500/30",
  ask: "from-primary to-accent",
  closing: "from-accent to-primary",
  content: "from-primary/40 to-muted/20",
  ad_strategy: "from-blue-500/50 to-primary/30",
  platform_breakdown: "from-accent/50 to-blue-500/30",
  creative_brief: "from-primary/60 to-accent/30",
  targeting: "from-green-500/40 to-primary/30",
  budget: "from-primary/50 to-green-500/30",
};

const renderPreviewSlide = (slide: PreviewSlide, index: number) => {
  const gradientClass = SLIDE_TYPE_COLORS[slide.slide_type] || SLIDE_TYPE_COLORS.content;
  const c = slide.content;
  return (
    <div className={`relative w-full aspect-video rounded-2xl bg-gradient-to-br ${gradientClass} flex flex-col justify-center p-8 overflow-hidden`}>
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
      {/* Company logo */}
      <img src={logoUrl} alt="Valyarolex.AI" className="absolute top-4 left-4 h-6 w-auto opacity-80 z-20" />
      <div className="relative z-10 space-y-3">
        {slide.slide_type === "title" ? (
          <div className="text-center space-y-4">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{c.headline || slide.title}</h2>
            {c.body && <p className="text-sm text-muted-foreground max-w-lg mx-auto">{c.body}</p>}
          </div>
        ) : (
          <>
            <p className="text-[10px] text-primary/80 font-semibold uppercase tracking-widest">{slide.slide_type.replace(/_/g, " ")}</p>
            <h2 className="text-lg md:text-xl font-bold text-foreground">{c.headline || slide.title}</h2>
            {c.body && <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>}
            {c.bullets && c.bullets.length > 0 && (
              <ul className="space-y-1 text-xs">
                {c.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-foreground/90">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {c.metric && (
              <div className="mt-2 glass rounded-lg p-3 inline-block">
                <span className="text-xl font-bold text-primary">{c.metric}</span>
                {c.metric_label && <span className="text-[10px] text-muted-foreground ml-1.5">{c.metric_label}</span>}
              </div>
            )}
          </>
        )}
      </div>
      <div className="absolute bottom-3 right-4 text-[10px] text-muted-foreground/50">{index + 1}</div>
    </div>
  );
};

export const PitchDeckPreviewDialog = ({
  open,
  data,
  onApprove,
  onReject,
  loading,
}: {
  open: boolean;
  data: PitchDeckPreviewData | null;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const narratorSlides = useMemo(() => {
    if (!data) return [];
    return data.slides.map((s) => {
      const c = s.content;
      let body = c.body || "";
      if (c.bullets?.length) body += ". " + c.bullets.join(". ");
      if (c.metric) body += `. Key metric: ${c.metric} ${c.metric_label || ""}`;
      return { title: c.headline || s.title, body };
    });
  }, [data]);

  const { isNarrating, startNarration, stopNarration } = useNarrator({
    onStepChange: setCurrentSlide,
    totalSteps: narratorSlides.length,
  });

  useEffect(() => () => { stopNarration(); }, [stopNarration]);

  if (!data || data.slides.length === 0) return null;
  const slide = data.slides[currentSlide];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onReject(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Review Deck — {data.deck_title}
          </DialogTitle>
          <DialogDescription>Preview your AI-generated pitch deck. Approve to save or reject to discard.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {renderPreviewSlide(slide, currentSlide)}
            </motion.div>
          </AnimatePresence>

          {/* Slide navigation */}
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" disabled={currentSlide === 0} onClick={() => setCurrentSlide(currentSlide - 1)}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <div className="flex items-center gap-1">
              {data.slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "bg-primary w-4" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                />
              ))}
            </div>
            <Button size="sm" variant="outline" disabled={currentSlide === data.slides.length - 1} onClick={() => setCurrentSlide(currentSlide + 1)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Speaker notes */}
          {slide.notes && (
            <div className="glass rounded-lg p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Speaker Notes</p>
              <p className="text-xs text-foreground/80">{slide.notes}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
          <NarratorControls
            slides={narratorSlides}
            currentSlide={currentSlide}
            isNarrating={isNarrating}
            onStart={startNarration}
            onStop={stopNarration}
          />
          <div className="flex-1" />
          <Button variant="outline" onClick={onReject} disabled={loading}>
            <X className="w-4 h-4 mr-1.5" /> Reject
          </Button>
          <Button onClick={onApprove} disabled={loading}>
            <Check className="w-4 h-4 mr-1.5" /> {loading ? "Saving…" : "Approve & Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
