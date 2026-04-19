import { motion } from "framer-motion";
import { Layers, Sparkles, Check, Smartphone, Square, Monitor, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AdCategory =
  | "3d"
  | "kinetic"
  | "product"
  | "story"
  | "animated"
  | "live-action"
  | "ugc"
  | "explainer"
  | "luxury"
  | "retro";

export type AdTemplate = {
  id: string;
  name: string;
  description: string;
  vibe: string;
  category: AdCategory;
  bestFor: string[];
};

export type AdPreset = {
  id: string;
  name: string;
  duration: number; // seconds
  format: "9:16" | "1:1" | "16:9";
  icon: typeof Smartphone;
  platforms: string[];
};

const CATEGORY_LABELS: Record<AdCategory, string> = {
  "live-action": "Live-Action / Realistic",
  animated: "2D Animated / Motion Graphics",
  "3d": "3D / Depth & Cinematic",
  kinetic: "Kinetic Typography",
  product: "Product / E-commerce",
  story: "Storytelling / Narrative",
  ugc: "UGC / Social-Native",
  explainer: "Explainer / Educational",
  luxury: "Luxury / Editorial",
  retro: "Retro / Nostalgia",
};

export const AD_TEMPLATES: AdTemplate[] = [
  // Live-Action / Realistic
  { id: "live-testimonial", name: "Testimonial Spot", description: "Talking-head customer story with B-roll cutaways. Trust-building.", vibe: "Authentic / Trust", category: "live-action", bestFor: ["Reviews", "Case study"] },
  { id: "live-lifestyle", name: "Lifestyle Commercial", description: "Aspirational scenes of product in real life. Emotional pull.", vibe: "Aspirational / Warm", category: "live-action", bestFor: ["Lifestyle brands", "DTC"] },
  { id: "live-broadcast", name: "Broadcast TV Spot", description: "Classic 30s structure: hook → product → benefit → CTA.", vibe: "Polished / Mainstream", category: "live-action", bestFor: ["TV", "OTT", "Pre-roll"] },

  // 2D Animated / Motion Graphics
  { id: "anim-flat", name: "Flat 2D Animation", description: "Vector characters and shapes. Friendly, clean, scalable.", vibe: "Friendly / SaaS", category: "animated", bestFor: ["Apps", "Fintech", "B2B"] },
  { id: "anim-whiteboard", name: "Whiteboard Animation", description: "Hand-drawn ideas appear in real time. Educational tone.", vibe: "Educational / Clear", category: "animated", bestFor: ["Explainers", "Onboarding"] },
  { id: "anim-mograph", name: "Motion Graphics", description: "Bold shapes, transitions, infographics — pure motion design.", vibe: "Modern / Tech", category: "animated", bestFor: ["Data stories", "Tech demos"] },
  { id: "anim-cartoon", name: "Cartoon / Mascot", description: "Character-led mascot ads with personality and humor.", vibe: "Playful / Memorable", category: "animated", bestFor: ["FMCG", "Kids", "Apps"] },

  // 3D / Depth & Cinematic
  { id: "depth-parallax", name: "Depth Parallax", description: "Pseudo-3D layered planes drift past camera. Cinematic without WebGL.", vibe: "Cinematic / Atmospheric", category: "3d", bestFor: ["Product hero", "Tech demo"] },
  { id: "stack-3d", name: "Floating Stack", description: "Cards tilt and stack in 3D space, resolve into hero shot.", vibe: "Premium / SaaS", category: "3d", bestFor: ["Feature reveal", "App promo"] },
  { id: "3d-render", name: "3D Product Render", description: "CGI-style product reveal with light sweeps and particle FX.", vibe: "Hyper-real / Tech", category: "3d", bestFor: ["Hardware", "Auto", "Premium tech"] },
  { id: "3d-cinematic", name: "Cinematic 3D Trailer", description: "Movie-trailer pacing with 3D camera moves and dramatic score.", vibe: "Epic / Theatrical", category: "3d", bestFor: ["Game launch", "Big reveal"] },
  { id: "neon-grid", name: "Neon Grid", description: "Cyber/retro grid with type breaking through. Pure tech aesthetic.", vibe: "Cyberpunk / Tech", category: "3d", bestFor: ["Crypto", "Gaming", "AI"] },

  // Kinetic Typography
  { id: "kinetic-bold", name: "Kinetic Bold", description: "Massive type, snap cuts, single accent color. Editorial energy.", vibe: "Editorial / High contrast", category: "kinetic", bestFor: ["Brand anthem", "Launch teaser"] },
  { id: "kinetic-rhythm", name: "Lyric / Rhythm Type", description: "Words sync to beat. Hype-track + word-by-word reveals.", vibe: "Hype / Music-driven", category: "kinetic", bestFor: ["Music", "Streetwear", "Events"] },
  { id: "split-cut", name: "Split Cut", description: "Diagonal wipes between scenes. Fast, modern, energetic.", vibe: "Sport / Lifestyle", category: "kinetic", bestFor: ["Promo", "Event teaser"] },

  // Product / E-commerce
  { id: "product-spin", name: "Product Spin", description: "Object rotates in pseudo-3D with light sweeps.", vibe: "Luxury / Retail", category: "product", bestFor: ["E-commerce", "Product launch"] },
  { id: "product-unbox", name: "Unboxing", description: "Hands-on reveal of packaging and product details.", vibe: "Tactile / ASMR", category: "product", bestFor: ["DTC", "Beauty", "Tech"] },
  { id: "product-feature", name: "Feature Stack", description: "Quick-cut feature highlights with on-screen labels.", vibe: "Clear / Info-dense", category: "product", bestFor: ["Hardware", "Apps"] },
  { id: "product-comparison", name: "Before / After", description: "Side-by-side problem → solution demonstration.", vibe: "Persuasive / Demo", category: "product", bestFor: ["Cleaning", "Beauty", "Tools"] },

  // Storytelling
  { id: "story-arc", name: "Story Arc", description: "Hook → tension → reveal → CTA. Narrative pacing for emotion.", vibe: "Brand storytelling", category: "story", bestFor: ["Founder story", "Mission"] },
  { id: "story-mini-doc", name: "Mini-Documentary", description: "60-90s short doc style. Real people, real moments.", vibe: "Authentic / Cinematic", category: "story", bestFor: ["Brand purpose", "Cause campaigns"] },
  { id: "story-anthem", name: "Brand Anthem", description: "Manifesto voice-over over evocative montage.", vibe: "Inspirational / Bold", category: "story", bestFor: ["Rebrand", "Big moments"] },

  // UGC / Social-Native
  { id: "ugc-selfie", name: "UGC Selfie Style", description: "Front-camera, handheld, talking-to-camera authenticity.", vibe: "Native / Raw", category: "ugc", bestFor: ["TikTok", "Reels", "Shorts"] },
  { id: "ugc-tutorial", name: "GRWM / Tutorial", description: "Get-ready-with-me or how-to format with product woven in.", vibe: "Relatable / Helpful", category: "ugc", bestFor: ["Beauty", "Fashion", "Lifestyle"] },
  { id: "ugc-react", name: "React / Try-On", description: "First reactions or live try-on energy.", vibe: "Spontaneous / Honest", category: "ugc", bestFor: ["DTC", "Food", "Apparel"] },

  // Explainer / Educational
  { id: "explainer-screen", name: "Screen Recording Demo", description: "App or product walkthrough with cursor highlights and captions.", vibe: "Practical / Direct", category: "explainer", bestFor: ["SaaS", "Apps", "Tools"] },
  { id: "explainer-howto", name: "How-To / Step-by-Step", description: "Numbered steps with visual demos. Tutorial pacing.", vibe: "Instructional / Clear", category: "explainer", bestFor: ["Recipes", "DIY", "SaaS"] },

  // Luxury / Editorial
  { id: "minimal-luxe", name: "Minimal Luxe", description: "Slow zooms, serif typography, muted palette. Refined.", vibe: "Editorial / Luxury", category: "luxury", bestFor: ["Premium brand", "Service biz"] },
  { id: "luxury-fashion", name: "Fashion Editorial", description: "Magazine-cover energy. Models, lighting, slow motion.", vibe: "High fashion / Bold", category: "luxury", bestFor: ["Apparel", "Beauty", "Jewelry"] },

  // Retro / Nostalgia
  { id: "retro-vhs", name: "VHS / 80s Retro", description: "Scan lines, chromatic aberration, neon palette.", vibe: "Nostalgic / Synthwave", category: "retro", bestFor: ["Music", "Gaming", "Streetwear"] },
  { id: "retro-vintage", name: "Vintage Film", description: "Grain, light leaks, warm tones. 60s-70s commercial vibe.", vibe: "Nostalgic / Warm", category: "retro", bestFor: ["Coffee", "Whiskey", "Heritage brands"] },
];

export const AD_PRESETS: AdPreset[] = [
  { id: "tiktok-15", name: "TikTok / Reels Hook", duration: 15, format: "9:16", icon: Smartphone, platforms: ["TikTok", "Reels", "Shorts"] },
  { id: "tiktok-30", name: "TikTok / Reels Story", duration: 30, format: "9:16", icon: Smartphone, platforms: ["TikTok", "Reels"] },
  { id: "ig-square-15", name: "Instagram Feed", duration: 15, format: "1:1", icon: Square, platforms: ["Instagram", "Facebook"] },
  { id: "ig-square-30", name: "Instagram Story Ad", duration: 30, format: "1:1", icon: Square, platforms: ["Instagram"] },
  { id: "youtube-pre-15", name: "YouTube Pre-Roll", duration: 15, format: "16:9", icon: Monitor, platforms: ["YouTube"] },
  { id: "youtube-30", name: "YouTube Mid-Roll", duration: 30, format: "16:9", icon: Monitor, platforms: ["YouTube"] },
  { id: "tv-spot-30", name: "TV Spot", duration: 30, format: "16:9", icon: Monitor, platforms: ["Broadcast", "OTT"] },
  { id: "long-form-60", name: "Long-Form Commercial", duration: 60, format: "16:9", icon: Monitor, platforms: ["YouTube", "Web"] },
];

interface AdTemplateGalleryProps {
  selectedTemplate?: string | null;
  selectedPreset?: string | null;
  onTemplateSelect?: (template: AdTemplate) => void;
  onPresetSelect?: (preset: AdPreset) => void;
}

export function AdTemplateGallery({
  selectedTemplate,
  selectedPreset,
  onTemplateSelect,
  onPresetSelect,
}: AdTemplateGalleryProps) {
  const current = AD_TEMPLATES.find((t) => t.id === selectedTemplate) ?? null;

  // Group templates by category for the dropdown
  const grouped = (Object.keys(CATEGORY_LABELS) as AdCategory[]).map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: AD_TEMPLATES.filter((t) => t.category === cat),
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Ad Style</h3>
            <p className="text-xs text-muted-foreground">
              Pick from {AD_TEMPLATES.length} styles across every major ad format
            </p>
          </div>
        </div>

        <Select
          value={current?.id ?? ""}
          onValueChange={(id) => {
            const t = AD_TEMPLATES.find((x) => x.id === id);
            if (t) onTemplateSelect?.(t);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose an ad style…" />
          </SelectTrigger>
          <SelectContent className="max-h-[420px]">
            {grouped.map((g) => (
              <SelectGroup key={g.category}>
                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </SelectLabel>
                {g.items.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{t.name}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{t.vibe}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
              <TemplatePreview templateId={current.id} hovered />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{current.name}</h4>
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{current.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-[9px]">{current.vibe}</Badge>
                  <Badge variant="outline" className="text-[9px]">{CATEGORY_LABELS[current.category]}</Badge>
                  {current.bestFor.map((b) => (
                    <Badge key={b} variant="secondary" className="text-[9px]">{b}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Commercial Ad Presets</h3>
            <p className="text-xs text-muted-foreground">Length + format optimized per platform</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {AD_PRESETS.map((p) => {
            const isSelected = selectedPreset === p.id;
            const Icon = p.icon;
            return (
              <motion.button
                key={p.id}
                onClick={() => onPresetSelect?.(p)}
                whileHover={{ y: -1 }}
                className={`text-left rounded-lg border p-2.5 transition-all ${
                  isSelected ? "border-primary bg-primary/5" : "border-border/40 bg-muted/20 hover:border-border/70"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground">{p.format}</span>
                  <span className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />{p.duration}s
                  </span>
                </div>
                <h4 className="text-xs font-semibold mb-1">{p.name}</h4>
                <p className="text-[9px] text-muted-foreground truncate">{p.platforms.join(" · ")}</p>
                {isSelected && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary">
                    <Check className="w-2.5 h-2.5" />Selected
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Animated mini-previews — pure CSS/framer, no external assets.
// Styles without a custom preview fall back to a tasteful generic gradient.
function TemplatePreview({ templateId, hovered }: { templateId: string; hovered: boolean }) {
  const base = "relative w-full aspect-video rounded-lg overflow-hidden";

  if (templateId === "kinetic-bold") {
    return (
      <div className={`${base} bg-gradient-to-br from-zinc-900 to-zinc-800`}>
        <motion.div
          animate={hovered ? { x: [0, -20, 0], opacity: [1, 1, 1] } : {}}
          transition={{ duration: 1.5, repeat: hovered ? Infinity : 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-2xl font-black tracking-tighter text-primary">BOLD.</div>
        </motion.div>
        <div className="absolute bottom-1 left-1 h-1 w-6 bg-primary rounded-full" />
      </div>
    );
  }

  if (templateId === "depth-parallax") {
    return (
      <div className={`${base} bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={hovered ? { x: [-10 * i, 10 * i, -10 * i] } : {}}
            transition={{ duration: 3 + i, repeat: hovered ? Infinity : 0 }}
            className="absolute rounded-full"
            style={{
              width: `${30 + i * 15}%`,
              height: `${30 + i * 15}%`,
              left: `${20 + i * 10}%`,
              top: `${10 + i * 15}%`,
              background: `hsl(var(--primary) / ${0.15 - i * 0.04})`,
              filter: "blur(8px)",
            }}
          />
        ))}
      </div>
    );
  }

  if (templateId === "stack-3d") {
    return (
      <div className={`${base} bg-gradient-to-br from-indigo-950 to-purple-950`} style={{ perspective: "400px" }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={hovered ? { rotateY: [0, 15, 0], y: [0, -3, 0] } : {}}
            transition={{ duration: 2, repeat: hovered ? Infinity : 0, delay: i * 0.2 }}
            className="absolute rounded bg-white/10 border border-white/20 backdrop-blur-sm"
            style={{
              width: "40%",
              height: "55%",
              left: `${25 + i * 8}%`,
              top: `${15 + i * 5}%`,
              transformStyle: "preserve-3d",
            }}
          />
        ))}
      </div>
    );
  }

  if (templateId === "product-spin") {
    return (
      <div className={`${base} bg-gradient-to-br from-amber-950 to-stone-900`}>
        <motion.div
          animate={hovered ? { rotateY: 360 } : {}}
          transition={{ duration: 4, repeat: hovered ? Infinity : 0, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-12 h-16 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 shadow-2xl" />
        </motion.div>
      </div>
    );
  }

  if (templateId === "split-cut") {
    return (
      <div className={`${base} relative`}>
        <motion.div
          animate={hovered ? { x: ["-100%", "100%"] } : { x: "-100%" }}
          transition={{ duration: 1.5, repeat: hovered ? Infinity : 0, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-rose-600 to-orange-500"
          style={{ clipPath: "polygon(0 0, 60% 0, 40% 100%, 0 100%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800" />
        <motion.div
          animate={hovered ? { x: ["100%", "-100%"] } : { x: "100%" }}
          transition={{ duration: 1.5, repeat: hovered ? Infinity : 0, ease: "easeInOut", delay: 0.3 }}
          className="absolute inset-0 bg-gradient-to-l from-cyan-500 to-blue-600"
          style={{ clipPath: "polygon(60% 0, 100% 0, 100% 100%, 40% 100%)" }}
        />
      </div>
    );
  }

  if (templateId === "story-arc") {
    return (
      <div className={`${base} bg-gradient-to-br from-stone-900 via-orange-950/40 to-stone-900`}>
        <motion.div
          animate={hovered ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 3, repeat: hovered ? Infinity : 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-rose-500 blur-sm" />
        </motion.div>
        <div className="absolute bottom-2 left-2 right-2 h-px bg-white/20" />
      </div>
    );
  }

  if (templateId === "neon-grid") {
    return (
      <div className={`${base} bg-black overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
            transform: "perspective(120px) rotateX(45deg)",
            transformOrigin: "center bottom",
          }}
        />
        <motion.div
          animate={hovered ? { y: ["100%", "-100%"] } : { y: "100%" }}
          transition={{ duration: 2, repeat: hovered ? Infinity : 0, ease: "linear" }}
          className="absolute inset-x-0 h-px bg-primary"
          style={{ boxShadow: "0 0 12px hsl(var(--primary))" }}
        />
      </div>
    );
  }

  if (templateId === "minimal-luxe" || templateId === "luxury-fashion") {
    return (
      <div className={`${base} bg-gradient-to-br from-stone-100 to-stone-300`}>
        <motion.div
          animate={hovered ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 4, repeat: hovered ? Infinity : 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-base font-serif italic text-stone-800">Élégance</div>
        </motion.div>
      </div>
    );
  }

  if (templateId === "retro-vhs") {
    return (
      <div className={`${base} bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-900`}>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0 1px, transparent 1px 3px)",
          }}
        />
        <motion.div
          animate={hovered ? { x: [-2, 2, -2] } : {}}
          transition={{ duration: 0.3, repeat: hovered ? Infinity : 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-lg font-black tracking-widest text-pink-300" style={{ textShadow: "2px 0 cyan, -2px 0 magenta" }}>
            REWIND
          </div>
        </motion.div>
      </div>
    );
  }

  if (templateId === "retro-vintage") {
    return (
      <div className={`${base} bg-gradient-to-br from-amber-200 via-orange-300 to-rose-400`}>
        <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{
          backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), transparent 40%)",
        }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sm font-serif text-stone-800/80">Est. 1972</div>
        </div>
      </div>
    );
  }

  if (templateId === "anim-flat" || templateId === "anim-mograph" || templateId === "anim-cartoon" || templateId === "anim-whiteboard") {
    return (
      <div className={`${base} bg-gradient-to-br from-sky-500 to-indigo-600`}>
        <motion.div
          animate={hovered ? { rotate: [0, 360] } : {}}
          transition={{ duration: 3, repeat: hovered ? Infinity : 0, ease: "linear" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-md bg-yellow-300"
        />
        <motion.div
          animate={hovered ? { y: [0, -6, 0] } : {}}
          transition={{ duration: 1.5, repeat: hovered ? Infinity : 0 }}
          className="absolute right-3 top-3 w-4 h-4 rounded-full bg-pink-400"
        />
      </div>
    );
  }

  if (templateId === "ugc-selfie" || templateId === "ugc-tutorial" || templateId === "ugc-react") {
    return (
      <div className={`${base} bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400`}>
        <div className="absolute inset-2 rounded-md border-2 border-white/40" />
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-bold text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />REC
        </div>
        <motion.div
          animate={hovered ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: hovered ? Infinity : 0 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur"
        />
      </div>
    );
  }

  if (templateId === "explainer-screen" || templateId === "explainer-howto") {
    return (
      <div className={`${base} bg-gradient-to-br from-slate-100 to-slate-300`}>
        <div className="absolute top-1.5 left-1.5 right-1.5 h-3 rounded-sm bg-white shadow flex items-center px-1 gap-0.5">
          <span className="w-1 h-1 rounded-full bg-red-400" />
          <span className="w-1 h-1 rounded-full bg-yellow-400" />
          <span className="w-1 h-1 rounded-full bg-green-400" />
        </div>
        <motion.div
          animate={hovered ? { x: [10, 60, 30], y: [10, 30, 20] } : {}}
          transition={{ duration: 3, repeat: hovered ? Infinity : 0 }}
          className="absolute w-2 h-2 rounded-full bg-primary shadow-md"
        />
      </div>
    );
  }

  if (templateId === "product-unbox" || templateId === "product-feature" || templateId === "product-comparison") {
    return (
      <div className={`${base} bg-gradient-to-br from-zinc-800 to-zinc-950`}>
        <motion.div
          animate={hovered ? { y: [0, -4, 0], rotate: [0, 2, -2, 0] } : {}}
          transition={{ duration: 2.5, repeat: hovered ? Infinity : 0 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-10 rounded-md bg-gradient-to-br from-primary/80 to-primary shadow-2xl"
        />
      </div>
    );
  }

  if (templateId === "3d-render" || templateId === "3d-cinematic") {
    return (
      <div className={`${base} bg-black`}>
        <motion.div
          animate={hovered ? { rotateY: [0, 360] } : {}}
          transition={{ duration: 5, repeat: hovered ? Infinity : 0, ease: "linear" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-lg"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            boxShadow: "0 0 30px hsl(var(--primary) / 0.6)",
            transformStyle: "preserve-3d",
          }}
        />
      </div>
    );
  }

  if (templateId === "kinetic-rhythm") {
    return (
      <div className={`${base} bg-gradient-to-br from-violet-900 to-fuchsia-900`}>
        <motion.div
          animate={hovered ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.6, repeat: hovered ? Infinity : 0 }}
          className="absolute inset-0 flex items-center justify-center text-xl font-black text-white"
        >
          DROP
        </motion.div>
      </div>
    );
  }

  if (templateId === "story-mini-doc" || templateId === "story-anthem") {
    return (
      <div className={`${base} bg-gradient-to-br from-stone-900 to-stone-800`}>
        <div className="absolute inset-x-0 top-0 h-2 bg-black" />
        <div className="absolute inset-x-0 bottom-0 h-2 bg-black" />
        <motion.div
          animate={hovered ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 3, repeat: hovered ? Infinity : 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-[10px] font-serif italic text-stone-200">"a true story"</div>
        </motion.div>
      </div>
    );
  }

  // Live-action / broadcast fallback
  return (
    <div className={`${base} bg-gradient-to-br from-slate-700 to-slate-900`}>
      <motion.div
        animate={hovered ? { opacity: [0.6, 1, 0.6] } : {}}
        transition={{ duration: 2, repeat: hovered ? Infinity : 0 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-10 h-10 rounded-full border-2 border-white/60 flex items-center justify-center">
          <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white/80 ml-1" />
        </div>
      </motion.div>
    </div>
  );
}
