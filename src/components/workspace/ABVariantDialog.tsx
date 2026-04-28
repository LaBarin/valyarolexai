import { useState } from "react";
import { Loader2, Sparkles, Check, FlaskConical, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBrandKit } from "@/hooks/useBrandKit";
import { brandContextBlock } from "@/lib/brand-context";
import { cn } from "@/lib/utils";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export type AdVariant = {
  id: string;
  hook: string;
  prompt: string;
  cta: string;
  angle: string;
};

type Divergence = "slight" | "medium" | "extreme";

const DIVERGENCE_OPTIONS: { id: Divergence; label: string; help: string }[] = [
  { id: "slight",  label: "Slight",  help: "Same angle, fresh wording" },
  { id: "medium",  label: "Medium",  help: "Three different angles" },
  { id: "extreme", label: "Extreme", help: "Wildly different — risky bets" },
];

const DIVERGENCE_BRIEF: Record<Divergence, string> = {
  slight: `All 3 variants must keep the SAME core angle and tone as the base prompt.
Vary only the hook wording, sentence structure, and CTA phrasing.
Label angles like: "Tighter Hook", "Reworded", "Sharper CTA".`,
  medium: `Each variant must take a DIFFERENT angle:
- Variant 1: Emotional / story-driven
- Variant 2: Direct / benefit-focused
- Variant 3: Curiosity / pattern-interrupt
Stay on-brand and on-product.`,
  extreme: `Each variant must be a BOLD departure that takes a creative risk.
Pick three from: shock-open, controversial framing, comedic absurdity,
unexpected protagonist, anti-ad, mockumentary, satire, role-reversal.
You may break category conventions, but the product must remain clearly the hero.`,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basePrompt: string;
  platform: string;
  duration: string;
  onSelect: (variant: AdVariant) => void;
}

const ABVariantDialog = ({ open, onOpenChange, basePrompt, platform, duration, onSelect }: Props) => {
  const [editablePrompt, setEditablePrompt] = useState(basePrompt);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<AdVariant[]>([]);
  const [divergence, setDivergence] = useState<Divergence>("medium");
  const [runCount, setRunCount] = useState(0);
  const { kit: brand } = useBrandKit();

  const generateVariants = async () => {
    if (!editablePrompt.trim()) {
      toast.error("Enter a base prompt first");
      return;
    }
    setLoading(true);
    setVariants([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sys = `You are an expert ad copywriter generating A/B test variants. Return ONLY JSON.

${brandContextBlock(brand)}

Generate exactly 3 distinct creative variants for the same product/idea.

DIVERGENCE LEVEL: ${divergence.toUpperCase()}
${DIVERGENCE_BRIEF[divergence]}

For each variant return:
{
  "hook": "first 2-second hook (max 12 words)",
  "prompt": "complete refined prompt for video generation (1-2 sentences)",
  "cta": "call-to-action button text (max 4 words)",
  "angle": "short label of the angle"
}

Return: { "variants": [v1, v2, v3] }`;

      // Nudge the model to produce different output on regenerate.
      const seed = runCount > 0
        ? `\n\nThis is regeneration attempt #${runCount + 1} — produce DIFFERENT variants than you would normally default to. Avoid repeating common opening lines.`
        : "";

      const userMsg = `Base idea: ${editablePrompt}
Platform: ${platform}
Duration: ${duration}${seed}

Generate 3 A/B variants now.`;

      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: sys },
            { role: "user", content: userMsg },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Generation failed");
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.content || "";
      const parsed = typeof text === "string" ? JSON.parse(text) : text;
      const list = Array.isArray(parsed?.variants) ? parsed.variants : [];
      if (list.length === 0) throw new Error("No variants returned");

      setVariants(
        list.slice(0, 3).map((v: any, i: number) => ({
          id: `v${i + 1}-${Date.now()}`,
          hook: String(v.hook || ""),
          prompt: String(v.prompt || ""),
          cta: String(v.cta || "Learn More"),
          angle: String(v.angle || `Variant ${i + 1}`),
        }))
      );
      setRunCount((c) => c + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate variants");
    } finally {
      setLoading(false);
    }
  };

  const hasVariants = variants.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/40 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" /> A/B Variant Generator
          </DialogTitle>
          <DialogDescription>
            Generate 3 distinct creative angles from one prompt — pick the winner to render.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={editablePrompt}
            onChange={(e) => setEditablePrompt(e.target.value)}
            placeholder="Describe your product or campaign…"
            className="min-h-20 text-sm"
          />

          {/* Divergence selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">How different should they be?</label>
            <div className="grid grid-cols-3 gap-2">
              {DIVERGENCE_OPTIONS.map((opt) => {
                const active = divergence === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDivergence(opt.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-all",
                      active
                        ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                        : "border-border/40 hover:border-border bg-muted/10"
                    )}
                  >
                    <p className={cn("text-xs font-semibold", active ? "text-primary" : "text-foreground")}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{opt.help}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={generateVariants} disabled={loading || !editablePrompt.trim()} className="w-full">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating 3 variants…</>
            ) : hasVariants ? (
              <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate Variants</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate Variants</>
            )}
          </Button>
        </div>

        {hasVariants && (
          <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
            {variants.map((v, i) => (
              <div key={v.id} className="rounded-lg border border-border/40 p-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                    {String.fromCharCode(65 + i)} · {v.angle}
                  </span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { onSelect(v); onOpenChange(false); }}>
                    <Check className="w-3 h-3" /> Use this
                  </Button>
                </div>
                <p className="text-xs font-semibold mb-1">"{v.hook}"</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{v.prompt}</p>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  CTA: {v.cta}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ABVariantDialog;
