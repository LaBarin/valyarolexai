import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation, Plus, Sparkles, ChevronLeft, ChevronRight, Maximize2,
  Minimize2, Download, Trash2, GripVertical, Edit3, Loader2, FileText
} from "lucide-react";
import { NarratorControls } from "./NarratorControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNarrator } from "@/hooks/use-narrator";
import { PitchDeckPreviewDialog, type PitchDeckPreviewData } from "./AdPreviewDialog";
import logoImg from "@/assets/valyarolex-logo.png";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type SlideContent = {
  headline?: string;
  body?: string;
  bullets?: string[];
  metric?: string;
  metric_label?: string;
};

type Slide = {
  id?: string;
  slide_type: string;
  title: string;
  content: SlideContent;
  notes?: string;
  slide_order: number;
};

type Deck = {
  id: string;
  title: string;
  description?: string;
  slides: Slide[];
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

const PitchDeckBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PitchDeckPreviewData | null>(null);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const presentRef = useRef<HTMLDivElement>(null);

  const narratorSlides = useMemo(() => {
    if (!activeDeck) return [];
    return activeDeck.slides.map((s) => {
      const c = s.content;
      let body = c.body || "";
      if (c.bullets?.length) body += ". " + c.bullets.join(". ");
      if (c.metric) body += `. Key metric: ${c.metric} ${c.metric_label || ""}`;
      return { title: c.headline || s.title, body };
    });
  }, [activeDeck]);

  const { isNarrating, rate, setRate, startNarration, stopNarration } = useNarrator({
    onStepChange: setCurrentSlide,
    totalSteps: narratorSlides.length,
  });

  // Stop narration when leaving deck
  useEffect(() => () => { stopNarration(); }, [stopNarration]);

  useEffect(() => {
    if (user) loadDecks();
  }, [user]);

  const loadDecks = async () => {
    setLoading(true);
    const { data: deckRows } = await supabase
      .from("pitch_decks")
      .select("*")
      .order("updated_at", { ascending: false });

    if (deckRows) {
      const fullDecks: Deck[] = [];
      for (const d of deckRows) {
        const { data: slides } = await supabase
          .from("pitch_deck_slides")
          .select("*")
          .eq("deck_id", d.id)
          .order("slide_order", { ascending: true });
        fullDecks.push({
          id: d.id,
          title: d.title,
          description: d.description ?? undefined,
          slides: (slides ?? []).map((s) => ({
            id: s.id,
            slide_type: (s.content as any)?.slide_type || s.slide_type,
            title: s.title || "",
            content: (s.content as any) || {},
            notes: s.notes ?? undefined,
            slide_order: s.slide_order,
          })),
        });
      }
      setDecks(fullDecks);
    }
    setLoading(false);
  };

  const generateDeck = async () => {
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
          mode: "pitch_deck",
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
      setPreviewData({
        deck_title: parsed.deck_title || "AI Pitch Deck",
        deck_description: parsed.deck_description,
        slides: (parsed.slides || []).map((s: any) => ({
          slide_type: s.slide_type || "content",
          title: s.title || "",
          content: s.content || {},
          notes: s.notes || undefined,
        })),
      });
    } catch (e: any) {
      toast({ title: "Generation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const approveDeckPreview = async () => {
    if (!previewData || !user) return;
    setIsSavingPreview(true);
    try {
      const { data: newDeck, error: deckErr } = await supabase
        .from("pitch_decks")
        .insert({ user_id: user.id, title: previewData.deck_title, description: previewData.deck_description })
        .select()
        .single();
      if (deckErr) throw deckErr;

      const slidesData = previewData.slides.map((s, i) => ({
        deck_id: newDeck.id,
        user_id: user.id,
        slide_order: i,
        slide_type: s.slide_type,
        title: s.title,
        content: s.content || {},
        notes: s.notes || null,
      }));
      await supabase.from("pitch_deck_slides").insert(slidesData);

      setPreviewData(null);
      setPrompt("");
      await loadDecks();
      const { data: slides } = await supabase
        .from("pitch_deck_slides")
        .select("*")
        .eq("deck_id", newDeck.id)
        .order("slide_order", { ascending: true });
      setActiveDeck({
        id: newDeck.id,
        title: newDeck.title,
        description: newDeck.description ?? undefined,
        slides: (slides ?? []).map((s) => ({
          id: s.id,
          slide_type: s.slide_type,
          title: s.title || "",
          content: (s.content as any) || {},
          notes: s.notes ?? undefined,
          slide_order: s.slide_order,
        })),
      });
      setCurrentSlide(0);
      toast({ title: "Deck Approved", description: `Created ${slidesData.length} slides` });
    } catch (e: any) {
      toast({ title: "Save Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingPreview(false);
    }
  };

  const rejectDeckPreview = () => {
    setPreviewData(null);
    toast({ title: "Deck Rejected", description: "The draft was discarded." });
  };

  const deleteDeck = async (deckId: string) => {
    await supabase.from("pitch_decks").delete().eq("id", deckId);
    if (activeDeck?.id === deckId) setActiveDeck(null);
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
  };

  const enterPresentation = () => {
    setIsPresenting(true);
    presentRef.current?.requestFullscreen?.();
  };

  const exitPresentation = () => {
    setIsPresenting(false);
    if (document.fullscreenElement) document.exitFullscreen();
  };

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setIsPresenting(false); };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (!isPresenting) return;
    const handler = (e: KeyboardEvent) => {
      const total = activeDeck?.slides.length || 0;
      if (e.key === "ArrowRight" || e.key === " ") setCurrentSlide((c) => Math.min(c + 1, total - 1));
      if (e.key === "ArrowLeft") setCurrentSlide((c) => Math.max(c - 1, 0));
      if (e.key === "Escape") exitPresentation();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPresenting, activeDeck]);

  const renderSlide = (slide: Slide, index: number, isFullscreen = false) => {
    const gradientClass = SLIDE_TYPE_COLORS[slide.slide_type] || SLIDE_TYPE_COLORS.content;
    const c = slide.content;
    return (
      <div
        className={`relative w-full aspect-video rounded-2xl bg-gradient-to-br ${gradientClass} flex flex-col justify-center p-4 md:p-8 overflow-hidden ${isFullscreen ? "rounded-none h-screen p-16" : ""}`}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        {/* Company logo */}
        <img src={logoImg} alt="Valyarolex.AI" className={`absolute top-3 left-4 w-auto opacity-80 z-20 ${isFullscreen ? "h-10" : "h-5"}`} />

        <div className="relative z-10 space-y-2 md:space-y-3">
          {slide.slide_type === "title" ? (
            <div className="text-center space-y-3 md:space-y-4">
              <h1 className={`font-bold tracking-tight text-foreground ${isFullscreen ? "text-6xl" : "text-lg md:text-3xl"}`}>
                {c.headline || slide.title}
              </h1>
              {c.body && <p className={`text-muted-foreground max-w-2xl mx-auto ${isFullscreen ? "text-2xl" : "text-[11px] md:text-base"}`}>{c.body}</p>}
            </div>
          ) : (
            <>
              <p className={`text-primary/80 font-semibold uppercase tracking-widest ${isFullscreen ? "text-lg" : "text-[10px]"}`}>
                {slide.slide_type.replace(/_/g, " ")}
              </p>
              <h2 className={`font-bold text-foreground ${isFullscreen ? "text-5xl" : "text-base md:text-2xl"}`}>
                {c.headline || slide.title}
              </h2>
              {c.body && <p className={`text-muted-foreground leading-relaxed ${isFullscreen ? "text-xl" : "text-[11px] md:text-sm"}`}>{c.body}</p>}
              {c.bullets && c.bullets.length > 0 && (
                <ul className={`space-y-1.5 ${isFullscreen ? "text-xl" : "text-[11px] md:text-sm"}`}>
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
                  <span className={`font-bold text-primary ${isFullscreen ? "text-5xl" : "text-xl"}`}>{c.metric}</span>
                  {c.metric_label && <span className={`text-muted-foreground ml-2 ${isFullscreen ? "text-lg" : "text-[10px]"}`}>{c.metric_label}</span>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Slide number */}
        <div className={`absolute bottom-4 right-6 text-muted-foreground/50 ${isFullscreen ? "text-lg" : "text-xs"}`}>
          {index + 1}
        </div>
      </div>
    );
  };

  // Fullscreen presentation overlay
  if (isPresenting && activeDeck) {
    return (
      <div ref={presentRef} className="fixed inset-0 bg-background z-50 flex items-center justify-center" onClick={() => {
        const total = activeDeck.slides.length;
        setCurrentSlide((c) => (c + 1 >= total ? c : c + 1));
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {renderSlide(activeDeck.slides[currentSlide], currentSlide, true)}
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 glass rounded-full px-6 py-2">
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setCurrentSlide(Math.max(0, currentSlide - 1)); }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">{currentSlide + 1} / {activeDeck.slides.length}</span>
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setCurrentSlide(Math.min(activeDeck.slides.length - 1, currentSlide + 1)); }}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <div onClick={(e) => e.stopPropagation()}>
             <NarratorControls
               slides={narratorSlides}
               currentSlide={currentSlide}
               compact
               isNarrating={isNarrating}
               rate={rate}
               onStart={startNarration}
               onStop={stopNarration}
               onRateChange={setRate}
             />
          </div>
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); exitPresentation(); }}>
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Deck editor
  if (activeDeck) {
    return (
      <>
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI Pitch Deck Generator</h3>
                <p className="text-xs text-muted-foreground">Describe your business and get a professional investor deck</p>
              </div>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. We're building an AI-powered logistics platform that reduces shipping costs by 40% for e-commerce businesses. We have $2M ARR, 150 customers, and are raising a $10M Series A..."
              rows={3}
              className="bg-background/50 border-border/50"
            />
            <Button onClick={generateDeck} disabled={!prompt.trim() || isGenerating} className="w-full">
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Deck...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Pitch Deck</>}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Button size="sm" variant="ghost" onClick={() => { setActiveDeck(null); loadDecks(); }}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <h2 className="text-xl font-bold truncate">{activeDeck.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={enterPresentation}>
                  <Maximize2 className="w-4 h-4 mr-1" /> Present
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast({ title: "Export", description: "PDF export coming soon — use Present mode for now." })}>
                  <Download className="w-4 h-4 mr-1" /> Export PDF
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
              {/* Main slide view */}
              <div className="order-1 flex flex-col gap-3 xl:col-span-9">
                <div className="rounded-2xl border border-border/30 bg-muted/10 p-2 flex-shrink-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex min-h-[116px] items-center justify-center overflow-hidden sm:min-h-[132px]"
                    >
                      <div className="w-full max-w-[260px] sm:max-w-[300px] md:max-w-[340px] xl:max-w-[380px]">
                        {activeDeck.slides[currentSlide] && renderSlide(activeDeck.slides[currentSlide], currentSlide)}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                  <Button size="sm" variant="outline" disabled={currentSlide === 0} onClick={() => setCurrentSlide(currentSlide - 1)}>
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <NarratorControls
                      slides={narratorSlides}
                      currentSlide={currentSlide}
                      isNarrating={isNarrating}
                      rate={rate}
                      onStart={startNarration}
                      onStop={stopNarration}
                      onRateChange={setRate}
                    />
                    <span className="text-sm text-muted-foreground">{currentSlide + 1} / {activeDeck.slides.length}</span>
                  </div>
                  <Button size="sm" variant="outline" disabled={currentSlide === activeDeck.slides.length - 1} onClick={() => setCurrentSlide(currentSlide + 1)}>
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {activeDeck.slides[currentSlide]?.notes && (
                  <div className="glass rounded-xl p-3 flex-shrink-0 max-h-24 overflow-auto">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Speaker Notes</p>
                    <p className="text-sm text-foreground/80">{activeDeck.slides[currentSlide].notes}</p>
                  </div>
                )}
              </div>

              {/* Slide thumbnails */}
              <div className="order-2 xl:col-span-3">
                <ScrollArea className="w-full xl:max-h-[420px]">
                  <div className="flex gap-2 pb-2 xl:block xl:space-y-2 xl:pr-2 xl:pb-0">
                    {activeDeck.slides.map((slide, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-40 shrink-0 text-left rounded-lg overflow-hidden border-2 transition-all xl:w-full ${
                          currentSlide === i ? "border-primary shadow-glow" : "border-border/30 hover:border-border"
                        }`}
                      >
                        <div className="relative w-full aspect-video overflow-hidden">
                          <div className="absolute inset-0 origin-top-left scale-[0.25] w-[400%] h-[400%] pointer-events-none">
                            {renderSlide(slide, i)}
                          </div>
                        </div>
                        <div className="p-2 bg-background/80">
                          <p className="text-xs font-medium truncate">{slide.title || `Slide ${i + 1}`}</p>
                          <p className="text-[10px] text-muted-foreground">{slide.slide_type.replace(/_/g, " ")}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>

        <PitchDeckPreviewDialog
          open={!!previewData}
          data={previewData}
          onApprove={approveDeckPreview}
          onReject={rejectDeckPreview}
          loading={isSavingPreview}
        />
      </>
    );
  }

  // Deck list view
  return (
    <>
    <div className="space-y-6">
      {/* AI Generator */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Pitch Deck Generator</h3>
            <p className="text-xs text-muted-foreground">Describe your business and get a professional investor deck</p>
          </div>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. We're building an AI-powered logistics platform that reduces shipping costs by 40% for e-commerce businesses. We have $2M ARR, 150 customers, and are raising a $10M Series A..."
          rows={3}
          className="bg-background/50 border-border/50"
        />
        <Button onClick={generateDeck} disabled={!prompt.trim() || isGenerating} className="w-full">
          {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Deck...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Pitch Deck</>}
        </Button>
      </div>

      {/* Deck list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Presentation className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No decks yet. Use AI to generate your first pitch deck above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks.map((deck) => (
            <motion.div
              key={deck.id}
              whileHover={{ scale: 1.01 }}
              className="glass rounded-xl p-5 cursor-pointer group"
              onClick={() => { setActiveDeck(deck); setCurrentSlide(0); }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{deck.title}</h3>
                    <p className="text-xs text-muted-foreground">{deck.slides.length} slides</p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              {deck.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{deck.description}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>

    <PitchDeckPreviewDialog
      open={!!previewData}
      data={previewData}
      onApprove={approveDeckPreview}
      onReject={rejectDeckPreview}
      loading={isSavingPreview}
    />
    </>
  );
};

export default PitchDeckBuilder;
