import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation, ChevronLeft, ChevronRight, Loader2, ExternalLink, Play, Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NarratorControls } from "@/components/workspace/NarratorControls";
import { useNarrator } from "@/hooks/use-narrator";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/valyarolex-logo.png";

type SlideContent = {
  headline?: string;
  body?: string;
  bullets?: string[];
  metric?: string;
  metric_label?: string;
};

type Slide = {
  slide_type: string;
  title: string;
  content: SlideContent;
  notes?: string;
  slide_order: number;
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

const SharedPitchDeck = () => {
  const { token } = useParams<{ token: string }>();
  const [deck, setDeck] = useState<any>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const narratorSlides = useMemo(() => {
    return slides.map((s) => {
      const c = s.content;
      const parts: string[] = [];
      if (c.headline) parts.push(c.headline);
      else if (s.title) parts.push(s.title);
      if (c.body) parts.push(c.body);
      if (c.bullets?.length) parts.push(c.bullets.join(". "));
      if (c.metric) parts.push(`Key metric: ${c.metric} ${c.metric_label || ""}`);
      return { title: parts[0] || s.title, body: parts.slice(1).join(". ") };
    });
  }, [slides]);

  const { isNarrating, rate, setRate, startNarration, stopNarration } = useNarrator({
    onStepChange: setCurrentSlide,
    totalSteps: slides.length,
  });

  useEffect(() => () => { stopNarration(); }, [stopNarration]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((c) => {
        if (c >= slides.length - 1) {
          setIsAutoPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, slides.length]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .rpc("get_shared_deck", { p_share_token: token })
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setDeck(data);
        const rawSlides = Array.isArray(data.slides) ? data.slides : [];
        setSlides(rawSlides.map((s: any) => ({
          slide_type: s.slide_type || "content",
          title: s.title || "",
          content: s.content || {},
          notes: s.notes || undefined,
          slide_order: s.slide_order || 0,
        })));
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

  if (notFound || !deck) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Presentation className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Pitch Deck Not Found</h1>
        <p className="text-muted-foreground">This link may have expired or been removed.</p>
        <Link to="/">
          <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" /> Go Home</Button>
        </Link>
      </div>
    );
  }

  const slide = slides[currentSlide];
  const renderSlide = (s: Slide, index: number) => {
    const gradientClass = SLIDE_TYPE_COLORS[s.slide_type] || SLIDE_TYPE_COLORS.content;
    const c = s.content;
    return (
      <div className={`relative w-full aspect-video rounded-2xl bg-gradient-to-br ${gradientClass} flex flex-col justify-center p-6 md:p-10 overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        <img src={logoImg} alt="Valyarolex.AI" className="absolute top-4 left-5 h-6 w-auto opacity-80 z-20" />
        <div className="relative z-10 space-y-3">
          {s.slide_type === "title" ? (
            <div className="text-center space-y-4">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">{c.headline || s.title}</h1>
              {c.body && <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">{c.body}</p>}
            </div>
          ) : (
            <>
              <p className="text-[10px] text-primary/80 font-semibold uppercase tracking-widest">{s.slide_type.replace(/_/g, " ")}</p>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{c.headline || s.title}</h2>
              {c.body && <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>}
              {c.bullets && c.bullets.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {c.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {c.metric && (
                <div className="mt-2 glass rounded-xl p-3 inline-block">
                  <span className="text-2xl font-bold text-primary">{c.metric}</span>
                  {c.metric_label && <span className="text-xs text-muted-foreground ml-2">{c.metric_label}</span>}
                </div>
              )}
            </>
          )}
        </div>
        <div className="absolute bottom-3 right-5 text-xs text-muted-foreground/50">{index + 1}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Valyarolex.AI" className="h-8" />
            <span className="text-sm text-muted-foreground">Pitch Deck</span>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Try Valyarolex.AI
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight">{deck.title}</h1>
          {deck.description && <p className="text-muted-foreground mt-1">{deck.description}</p>}
        </motion.div>

        <div className="rounded-2xl border border-border/30 bg-muted/10 p-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {slide && renderSlide(slide, currentSlide)}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button size="sm" variant="outline" disabled={currentSlide === 0} onClick={() => setCurrentSlide(currentSlide - 1)}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={isAutoPlaying ? "default" : "outline"}
              className="h-9 w-9"
              onClick={() => setIsAutoPlaying((v) => !v)}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <NarratorControls
              slides={narratorSlides}
              currentSlide={currentSlide}
              isNarrating={isNarrating}
              rate={rate}
              onStart={startNarration}
              onStop={stopNarration}
              onRateChange={setRate}
            />
            <div className="flex items-center gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "bg-primary w-5" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{currentSlide + 1} / {slides.length}</span>
          </div>
          <Button size="sm" variant="outline" disabled={currentSlide >= slides.length - 1} onClick={() => setCurrentSlide(currentSlide + 1)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {slide?.notes && (
          <div className="glass rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Speaker Notes</p>
            <p className="text-sm text-foreground/80">{slide.notes}</p>
          </div>
        )}

        <div className="text-center py-8 text-xs text-muted-foreground">
          <img src={logoImg} alt="Valyarolex.AI" className="h-8 mx-auto mb-2 opacity-70" />
          Generated by <span className="text-primary font-semibold">Valyarolex.AI</span> — One Workspace. Infinite Intelligence.
        </div>
      </main>
    </div>
  );
};

export default SharedPitchDeck;
