import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Sparkles, Check, Smartphone, Square, Monitor, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export type AdTemplate = {
  id: string;
  name: string;
  description: string;
  vibe: string;
  category: "3d" | "kinetic" | "product" | "story";
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

export const AD_TEMPLATES: AdTemplate[] = [
  { id: "kinetic-bold", name: "Kinetic Bold", description: "Massive type, snap cuts, single accent color. Editorial energy.", vibe: "Editorial / High contrast", category: "kinetic", bestFor: ["Brand anthem", "Launch teaser"] },
  { id: "depth-parallax", name: "Depth Parallax", description: "Pseudo-3D layered planes drift past the camera. Dimensional feel without WebGL.", vibe: "Cinematic / Atmospheric", category: "3d", bestFor: ["Product hero", "Tech demo"] },
  { id: "stack-3d", name: "Floating Stack", description: "Cards tilt and stack in 3D space, then resolve into a single hero shot.", vibe: "Premium / SaaS", category: "3d", bestFor: ["Feature reveal", "App promo"] },
  { id: "product-spin", name: "Product Spin", description: "Object rotates in pseudo-3D with light sweeps. Product photography meets motion.", vibe: "Luxury / Retail", category: "product", bestFor: ["E-commerce", "Product launch"] },
  { id: "split-cut", name: "Split Cut", description: "Diagonal wipes between scenes. Fast, modern, energetic.", vibe: "Sport / Lifestyle", category: "kinetic", bestFor: ["Promo", "Event teaser"] },
  { id: "story-arc", name: "Story Arc", description: "Hook → tension → reveal → CTA. Narrative pacing for emotional ads.", vibe: "Brand storytelling", category: "story", bestFor: ["Founder story", "Mission piece"] },
  { id: "neon-grid", name: "Neon Grid", description: "Cyber/retro grid background with type that 'breaks' through. Tech aesthetic.", vibe: "Cyberpunk / Tech", category: "3d", bestFor: ["Crypto", "Gaming", "AI products"] },
  { id: "minimal-luxe", name: "Minimal Luxe", description: "Slow zooms, serif typography, muted palette. Refined and quiet.", vibe: "Editorial / Luxury", category: "story", bestFor: ["Premium brand", "Service biz"] },
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
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Ad Style Templates</h3>
            <p className="text-xs text-muted-foreground">Cinematic motion direction for your ad</p>
          </div>
        </div>
        <Tabs defaultValue="all">
          <TabsList className="h-8 mb-3">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="3d" className="text-xs">3D / Depth</TabsTrigger>
            <TabsTrigger value="kinetic" className="text-xs">Kinetic</TabsTrigger>
            <TabsTrigger value="product" className="text-xs">Product</TabsTrigger>
            <TabsTrigger value="story" className="text-xs">Story</TabsTrigger>
          </TabsList>
          {(["all", "3d", "kinetic", "product", "story"] as const).map((cat) => (
            <TabsContent key={cat} value={cat}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AD_TEMPLATES.filter((t) => cat === "all" || t.category === cat).map((tmpl) => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <motion.button
                      key={tmpl.id}
                      onMouseEnter={() => setHovered(tmpl.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => onTemplateSelect?.(tmpl)}
                      whileHover={{ y: -2 }}
                      className={`text-left rounded-xl border p-3 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/40 bg-muted/20 hover:border-border/70"
                      }`}
                    >
                      <TemplatePreview templateId={tmpl.id} hovered={hovered === tmpl.id} />
                      <div className="flex items-center gap-2 mt-2.5 mb-1">
                        <h4 className="text-xs font-semibold truncate">{tmpl.name}</h4>
                        {isSelected && <Check className="w-3 h-3 text-primary ml-auto flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{tmpl.description}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[9px]">{tmpl.vibe}</Badge>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
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

// Animated mini-previews for each template — pure CSS/framer, no external assets
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
            backgroundImage: "linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
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

  // minimal-luxe
  return (
    <div className={`${base} bg-gradient-to-br from-stone-100 to-stone-300 dark:from-stone-200 dark:to-stone-400`}>
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
