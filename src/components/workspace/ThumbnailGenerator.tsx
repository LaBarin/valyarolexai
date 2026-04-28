// Thumbnail Generator panel — picks an AI-generated cover image in 5 styles.
// Saves the chosen thumbnail back to the video project (via the edge function)
// and tells the parent so the workspace grid can update.
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Check, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type ThumbnailStyle =
  | "bold_cta"
  | "premium"
  | "bright_social"
  | "viral"
  | "product_focus";

const STYLES: { id: ThumbnailStyle; name: string; description: string; gradient: string }[] = [
  { id: "bold_cta", name: "Bold CTA", description: "Massive scroll-stopping caption + arrow.", gradient: "from-red-500/30 to-orange-500/20" },
  { id: "premium", name: "Premium", description: "Editorial luxury feel, refined type.", gradient: "from-amber-500/20 to-stone-500/20" },
  { id: "bright_social", name: "Bright Social", description: "Pastel + neon for IG / TikTok.", gradient: "from-pink-500/30 to-cyan-500/20" },
  { id: "viral", name: "Viral", description: "MrBeast-style YouTube clickbait.", gradient: "from-fuchsia-500/30 to-yellow-500/20" },
  { id: "product_focus", name: "Product Focus", description: "Clean studio product hero.", gradient: "from-slate-500/20 to-primary/20" },
];

interface Props {
  videoId: string;
  title?: string;
  description?: string;
  brand?: string;
  cta?: string;
  format?: string;
  currentThumbnail?: string | null;
  onThumbnailUpdated?: (signedUrl: string) => void;
}

export const ThumbnailGenerator = ({
  videoId, title, description, brand, cta, format, currentThumbnail, onThumbnailUpdated,
}: Props) => {
  const { toast } = useToast();
  const [generatingStyle, setGeneratingStyle] = useState<ThumbnailStyle | null>(null);
  // Locally-cached preview per style so users can compare without re-spending credits.
  const [previews, setPreviews] = useState<Partial<Record<ThumbnailStyle, string>>>({});
  const [activeUrl, setActiveUrl] = useState<string | null>(currentThumbnail ?? null);

  const generate = async (style: ThumbnailStyle) => {
    if (generatingStyle) return;
    setGeneratingStyle(style);
    try {
      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: { videoId, style, title, description, brand, cta, format, persist: true },
      });

      if (error) {
        // supabase-js stuffs HTTP body into error.context.body for non-2xx
        const ctx: any = (error as any).context;
        let parsed: any = null;
        try { parsed = ctx?.body ? JSON.parse(ctx.body) : null; } catch { /* ignore */ }
        const msg = parsed?.error || error.message || "Failed to generate thumbnail";
        if (parsed?.error === "insufficient_credits") {
          toast({ title: "Out of credits", description: "Top up to keep generating thumbnails.", variant: "destructive" });
        } else {
          toast({ title: "Generation failed", description: msg, variant: "destructive" });
        }
        return;
      }

      const signedUrl = (data as any)?.signedUrl as string | undefined;
      if (!signedUrl) {
        toast({ title: "Generation failed", description: "No image returned.", variant: "destructive" });
        return;
      }
      setPreviews((p) => ({ ...p, [style]: signedUrl }));
      setActiveUrl(signedUrl);
      onThumbnailUpdated?.(signedUrl);
      toast({ title: "Thumbnail saved", description: `${STYLES.find((s) => s.id === style)?.name} thumbnail set as cover.` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message || "Unexpected error", variant: "destructive" });
    } finally {
      setGeneratingStyle(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold">AI Thumbnail Generator</h3>
            <Badge variant="outline" className="text-xs">4 credits each</Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-prose">
            Pick a style. The AI will draft a cover image using your video's title, description and brand, then save it as your project thumbnail.
          </p>
        </div>
      </div>

      {/* Current cover */}
      {activeUrl && (
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="w-32 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img src={activeUrl} alt="Current thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 text-foreground font-medium mb-0.5">
              <Check className="w-3.5 h-3.5 text-primary" />
              Current cover
            </div>
            Generate a new one below to replace it.
          </div>
        </div>
      )}

      {/* Style grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STYLES.map((s) => {
          const preview = previews[s.id];
          const isGen = generatingStyle === s.id;
          const isActive = preview && preview === activeUrl;
          return (
            <motion.div
              key={s.id}
              whileHover={{ y: -2 }}
              className={`glass rounded-xl overflow-hidden border ${isActive ? "border-primary/60" : "border-transparent"}`}
            >
              <div className={`relative aspect-video w-full bg-gradient-to-br ${s.gradient} overflow-hidden`}>
                {preview ? (
                  <img src={preview} alt={`${s.name} preview`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-foreground/40" />
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-primary-foreground"><Check className="w-3 h-3 mr-1" />Active</Badge>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div>
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{s.description}</div>
                </div>
                <Button
                  size="sm"
                  variant={preview ? "outline" : "hero"}
                  className="w-full"
                  disabled={!!generatingStyle}
                  onClick={() => generate(s.id)}
                >
                  {isGen ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating…</>
                  ) : preview ? (
                    <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Regenerate</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate</>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground glass rounded-lg p-3">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Thumbnails are stored privately. Signed links last 7 days — re-generate if a link expires.
        </span>
      </div>
    </div>
  );
};
