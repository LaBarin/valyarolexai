import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation, Plus, Sparkles, ChevronLeft, ChevronRight, Maximize2,
  Minimize2, Download, Trash2, GripVertical, Edit3, Loader2, FileText,
  Play, Pause, Link, Copy, ExternalLink
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
import type { PitchDeckPreviewData } from "./AdPreviewDialog";
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
  share_token?: string | null;
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
  const [previewSlide, setPreviewSlide] = useState(0);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presentRef = useRef<HTMLDivElement>(null);

  const narratorSlides = useMemo(() => {
    if (!activeDeck) return [];
    return activeDeck.slides.map((s) => {
      const c = s.content;
      const parts: string[] = [];
      if (c.headline) parts.push(c.headline);
      else if (s.title) parts.push(s.title);
      if (c.body) parts.push(c.body);
      if (c.bullets?.length) parts.push(c.bullets.join(". "));
      if (c.metric) parts.push(`Key metric: ${c.metric} ${c.metric_label || ""}`);
      return { title: parts[0] || s.title, body: parts.slice(1).join(". ") };
    });
  }, [activeDeck]);

  const { isNarrating, rate, setRate, startNarration, stopNarration } = useNarrator({
    onStepChange: setCurrentSlide,
    totalSteps: narratorSlides.length,
  });

  // Stop narration when leaving deck
  useEffect(() => () => { stopNarration(); }, [stopNarration]);

  // Preview narrator slides (for generated deck preview)
  const previewNarratorSlides = useMemo(() => {
    if (!previewData) return [];
    return previewData.slides.map((s) => {
      const c = s.content as SlideContent;
      const parts: string[] = [];
      if (c.headline) parts.push(c.headline);
      else if (s.title) parts.push(s.title);
      if (c.body) parts.push(c.body);
      if (c.bullets?.length) parts.push(c.bullets.join(". "));
      if (c.metric) parts.push(`Key metric: ${c.metric} ${c.metric_label || ""}`);
      return { title: parts[0] || s.title, body: parts.slice(1).join(". ") };
    });
  }, [previewData]);

  // Auto-play timer
  useEffect(() => {
    if (isAutoPlaying && activeDeck) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((c) => {
          if (c >= activeDeck.slides.length - 1) {
            setIsAutoPlaying(false);
            return c;
          }
          return c + 1;
        });
      }, 4000);
    } else if (isAutoPlaying && previewData) {
      autoPlayRef.current = setInterval(() => {
        setPreviewSlide((c) => {
          if (c >= previewData.slides.length - 1) {
            setIsAutoPlaying(false);
            return c;
          }
          return c + 1;
        });
      }, 4000);
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isAutoPlaying, activeDeck, previewData]);

  // Stop auto-play when switching decks
  useEffect(() => { setIsAutoPlaying(false); }, [activeDeck]);

  useEffect(() => {
    if (user) loadDecks();
  }, [user]);

  useEffect(() => {
    if (previewData) { setPreviewSlide(0); setIsAutoPlaying(false); }
  }, [previewData]);

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

  const exportDeckAsPDF = useCallback(() => {
    if (!activeDeck || activeDeck.slides.length === 0) return;

    const slideHTML = activeDeck.slides.map((slide, i) => {
      const gradientMap: Record<string, string> = {
        title: "linear-gradient(135deg, hsl(190,100%,50%), hsl(150,70%,50%))",
        problem: "linear-gradient(135deg, hsl(0,60%,50%), hsl(0,60%,35%))",
        solution: "linear-gradient(135deg, hsl(150,70%,45%), hsl(190,100%,40%))",
        market: "linear-gradient(135deg, hsl(190,80%,45%), hsl(220,70%,50%))",
        product: "linear-gradient(135deg, hsl(150,70%,50%), hsl(190,100%,40%))",
        traction: "linear-gradient(135deg, hsl(140,60%,45%), hsl(150,70%,45%))",
        business_model: "linear-gradient(135deg, hsl(190,100%,45%), hsl(150,70%,45%))",
        financials: "linear-gradient(135deg, hsl(190,80%,40%), hsl(140,60%,45%))",
        ask: "linear-gradient(135deg, hsl(190,100%,50%), hsl(150,70%,50%))",
        closing: "linear-gradient(135deg, hsl(150,70%,50%), hsl(190,100%,50%))",
      };
      const bg = gradientMap[slide.slide_type] || "linear-gradient(135deg, hsl(190,80%,40%), hsl(210,20%,20%))";
      const c = slide.content;
      const bulletsHTML = c.bullets?.length
        ? `<ul style="margin:12px 0;padding-left:24px;list-style:disc">${c.bullets.map(b => `<li style="margin:4px 0;color:#e0e0e0;font-size:14px">${b}</li>`).join("")}</ul>`
        : "";
      const metricHTML = c.metric
        ? `<div style="margin-top:12px;background:rgba(255,255,255,0.1);border-radius:12px;padding:12px 20px;display:inline-block"><span style="font-size:32px;font-weight:700;color:hsl(190,100%,60%)">${c.metric}</span>${c.metric_label ? `<span style="margin-left:8px;color:#aaa;font-size:12px">${c.metric_label}</span>` : ""}</div>`
        : "";

      return `<div style="width:100%;aspect-ratio:16/9;background:${bg};border-radius:16px;display:flex;flex-direction:column;justify-content:center;padding:48px 56px;position:relative;page-break-after:always;page-break-inside:avoid;box-sizing:border-box;overflow:hidden;color:#f0f0f0;font-family:'Space Grotesk',system-ui,sans-serif">
        <div style="position:absolute;top:0;right:0;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.05);transform:translate(30%,-30%)"></div>
        ${slide.slide_type === "title"
          ? `<div style="text-align:center"><h1 style="font-size:36px;font-weight:700;margin:0">${c.headline || slide.title}</h1>${c.body ? `<p style="font-size:16px;color:#bbb;margin-top:16px;max-width:600px;margin-left:auto;margin-right:auto">${c.body}</p>` : ""}${bulletsHTML}</div>`
          : `<p style="font-size:10px;text-transform:uppercase;letter-spacing:3px;color:hsl(190,100%,60%);margin:0 0 8px">${slide.slide_type.replace(/_/g, " ")}</p>
             <h2 style="font-size:28px;font-weight:700;margin:0">${c.headline || slide.title}</h2>
             ${c.body ? `<p style="font-size:14px;color:#ccc;margin-top:8px;line-height:1.6">${c.body}</p>` : ""}
             ${bulletsHTML}${metricHTML}`
        }
        <div style="position:absolute;bottom:16px;right:24px;color:rgba(255,255,255,0.3);font-size:12px">${i + 1}</div>
      </div>`;
    }).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Export Failed", description: "Please allow popups and try again.", variant: "destructive" });
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${activeDeck.title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#000;font-family:'Space Grotesk',system-ui,sans-serif;padding:0}
        .slide-container{max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:24px;padding:24px}
        @media print{
          body{background:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
          .slide-container{gap:0;padding:0;max-width:none}
          .slide-container>div{border-radius:0!important;page-break-after:always;height:100vh;aspect-ratio:auto}
          .no-print{display:none!important}
        }
      </style></head><body>
      <div class="no-print" style="text-align:center;padding:16px;background:#111">
        <button onclick="window.print()" style="background:hsl(190,100%,50%);color:#000;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Save as PDF</button>
        <span style="color:#666;margin-left:12px;font-size:13px">Use "Save as PDF" as the destination in the print dialog</span>
      </div>
      <div class="slide-container">${slideHTML}</div></body></html>`);
    printWindow.document.close();
  }, [activeDeck, toast]);

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
        className={`relative w-full aspect-video rounded-2xl bg-gradient-to-br ${gradientClass} flex flex-col justify-center p-3 sm:p-4 md:p-8 overflow-y-auto overflow-x-hidden ${isFullscreen ? "rounded-none h-screen p-16" : ""}`}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        {/* Company logo */}
        <img src={logoImg} alt="Valyarolex.AI" className={`absolute top-3 left-4 w-auto opacity-80 z-20 ${isFullscreen ? "h-10" : "h-5"}`} />

        <div className="relative z-10 space-y-1 sm:space-y-2 md:space-y-3">
          {slide.slide_type === "title" ? (
            <div className="text-center space-y-1 sm:space-y-3 md:space-y-4">
              <h1 className={`font-bold tracking-tight text-foreground ${isFullscreen ? "text-6xl" : "text-sm sm:text-lg md:text-3xl"}`}>
                {c.headline || slide.title}
              </h1>
              {c.body && <p className={`text-muted-foreground max-w-2xl mx-auto ${isFullscreen ? "text-2xl" : "text-[9px] sm:text-[11px] md:text-base"}`}>{c.body}</p>}
            </div>
          ) : (
            <>
              <p className={`text-primary/80 font-semibold uppercase tracking-widest ${isFullscreen ? "text-lg" : "text-[8px] sm:text-[10px]"}`}>
                {slide.slide_type.replace(/_/g, " ")}
              </p>
              <h2 className={`font-bold text-foreground ${isFullscreen ? "text-5xl" : "text-xs sm:text-base md:text-2xl"}`}>
                {c.headline || slide.title}
              </h2>
              {c.body && <p className={`text-muted-foreground leading-relaxed ${isFullscreen ? "text-xl" : "text-[8px] sm:text-[11px] md:text-sm"}`}>{c.body}</p>}
              {c.bullets && c.bullets.length > 0 && (
                <ul className={`space-y-0.5 sm:space-y-1.5 ${isFullscreen ? "text-xl" : "text-[8px] sm:text-[11px] md:text-sm"}`}>
                  {c.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-1 sm:gap-2 text-foreground/90">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary mt-1 sm:mt-1.5 flex-shrink-0" />
                      <span className="line-clamp-2 sm:line-clamp-none">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {c.metric && (
                <div className="mt-1 sm:mt-2 glass rounded-xl p-1.5 sm:p-3 inline-block">
                  <span className={`font-bold text-primary ${isFullscreen ? "text-5xl" : "text-sm sm:text-xl"}`}>{c.metric}</span>
                  {c.metric_label && <span className={`text-muted-foreground ml-1 sm:ml-2 ${isFullscreen ? "text-lg" : "text-[8px] sm:text-[10px]"}`}>{c.metric_label}</span>}
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

  const renderGeneratedDeckPreview = () => {
    if (!previewData || previewData.slides.length === 0) return null;

    const totalSlides = previewData.slides.length;
    const safePreviewSlide = Math.min(previewSlide, totalSlides - 1);
    const draftSlide = previewData.slides[safePreviewSlide];

    return (
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Generated Deck Preview</h3>
            <p className="text-xs text-muted-foreground">Review the draft below, then save it to your workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border/40 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              {safePreviewSlide + 1} / {totalSlides}
            </span>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setIsPreviewExpanded((v) => !v)} title={isPreviewExpanded ? "Minimize" : "Expand"}>
              {isPreviewExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/30 bg-muted/10 p-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={safePreviewSlide}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center overflow-hidden"
            >
              <div className={`w-full ${isPreviewExpanded ? "max-w-[600px] lg:max-w-[720px]" : "max-w-[400px] sm:max-w-[460px] lg:max-w-[520px]"}`}>
                {renderSlide(
                  {
                    slide_type: draftSlide.slide_type,
                    title: draftSlide.title,
                    content: draftSlide.content,
                    notes: draftSlide.notes,
                    slide_order: safePreviewSlide,
                  },
                  safePreviewSlide,
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {previewData.slides.map((preview, index) => (
            <button
              key={`${preview.title || "slide"}-${index}`}
              type="button"
              onClick={() => setPreviewSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === safePreviewSlide ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to generated slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={safePreviewSlide === 0}
              onClick={() => setPreviewSlide((slideIndex) => Math.max(0, slideIndex - 1))}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button
              size="icon"
              variant={isAutoPlaying ? "default" : "outline"}
              className="h-9 w-9"
              onClick={() => setIsAutoPlaying((v) => !v)}
              title={isAutoPlaying ? "Pause auto-play" : "Auto-play slides"}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={safePreviewSlide === totalSlides - 1}
              onClick={() => setPreviewSlide((slideIndex) => Math.min(totalSlides - 1, slideIndex + 1))}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
            <NarratorControls
              slides={previewNarratorSlides}
              currentSlide={safePreviewSlide}
              compact
              isNarrating={isNarrating}
              rate={rate}
              onStart={startNarration}
              onStop={stopNarration}
              onRateChange={setRate}
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button variant="outline" onClick={rejectDeckPreview} disabled={isSavingPreview}>
              Discard Draft
            </Button>
            <Button onClick={approveDeckPreview} disabled={isSavingPreview}>
              {isSavingPreview ? "Saving…" : "Approve & Save"}
            </Button>
          </div>
        </div>

        {draftSlide.notes && (
          <div className="glass rounded-lg p-3">
            <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Speaker Notes</p>
            <p className="text-xs text-foreground/80">{draftSlide.notes}</p>
          </div>
        )}
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

          {renderGeneratedDeckPreview()}

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Button size="sm" variant="ghost" onClick={() => { setActiveDeck(null); loadDecks(); }}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <h2 className="text-xl font-bold truncate">{activeDeck.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={isEditorExpanded ? "default" : "outline"} onClick={() => setIsEditorExpanded((v) => !v)}>
                  {isEditorExpanded ? <Minimize2 className="w-4 h-4 mr-1" /> : <Maximize2 className="w-4 h-4 mr-1" />}
                  {isEditorExpanded ? "Minimize" : "Expand"}
                </Button>
                <Button size="sm" variant="outline" onClick={enterPresentation}>
                  <Presentation className="w-4 h-4 mr-1" /> Present
                </Button>
                <Button size="sm" variant="outline" onClick={exportDeckAsPDF}>
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
                      <div className={`w-full ${isEditorExpanded ? "max-w-[500px] md:max-w-[600px] xl:max-w-[700px]" : "max-w-[340px] sm:max-w-[400px] md:max-w-[440px] xl:max-w-[480px]"}`}>
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
                    <Button
                      size="icon"
                      variant={isAutoPlaying ? "default" : "outline"}
                      className="h-9 w-9"
                      onClick={() => setIsAutoPlaying((v) => !v)}
                      title={isAutoPlaying ? "Pause auto-play" : "Auto-play slides"}
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

      {renderGeneratedDeckPreview()}

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

    </>
  );
};

export default PitchDeckBuilder;
