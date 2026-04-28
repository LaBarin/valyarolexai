import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Order matches the spec from the original product brief.
const TONES: { id: string; label: string; hint: string }[] = [
  { id: "persuasive", label: "More persuasive", hint: "Sharper benefits, active voice" },
  { id: "urgent", label: "More urgent", hint: "Time-sensitive, action-driving" },
  { id: "luxury", label: "More luxury", hint: "Refined, premium, exclusive" },
  { id: "funny", label: "More funny", hint: "Light, witty, tasteful" },
  { id: "emotional", label: "More emotional", hint: "Sensory, feeling-driven" },
  { id: "tiktok", label: "For TikTok", hint: "Punchy, casual, hook-first" },
  { id: "linkedin", label: "For LinkedIn", hint: "Professional, insight-led" },
  { id: "facebook", label: "For Facebook leads", hint: "Friendly, benefit-led" },
];

interface RewriteMenuProps {
  /** The current text to rewrite. If empty, the menu is disabled. */
  text: string | null | undefined;
  /** Called with the new text once the rewrite returns. Caller persists it. */
  onRewritten: (next: string) => void;
  /** Optional hint passed to the model so it can match the field shape (e.g. "headline", "CTA button"). */
  fieldHint?: string;
  /** Visual variant — small icon button for inline use, or labelled button. */
  variant?: "icon" | "button";
  /** Optional class name passthrough. */
  className?: string;
}

/**
 * Smart Rewrite dropdown — calls the rewrite-content edge function with one of
 * the 8 tone presets. Charges 1 credit per call (handled server-side).
 */
export const RewriteMenu = ({
  text,
  onRewritten,
  fieldHint,
  variant = "icon",
  className,
}: RewriteMenuProps) => {
  const [pending, setPending] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const disabled = !text || text.trim().length === 0;

  const runRewrite = async (tone: string) => {
    if (disabled || pending) return;
    setPending(tone);
    try {
      const { data, error } = await supabase.functions.invoke("rewrite-content", {
        body: { text, tone, fieldHint },
      });
      if (error) {
        // Functions invoke surfaces non-2xx as error; try to read the JSON body.
        const detail = (error as any)?.context?.body
          ? await (error as any).context.json().catch(() => null)
          : null;
        const msg =
          detail?.error ||
          (error.message?.includes("non-2xx") ? "Rewrite failed" : error.message) ||
          "Rewrite failed";
        if (msg === "insufficient_credits") {
          toast({
            title: "Out of credits",
            description: "Subscribe or top up to keep rewriting.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Rewrite failed", description: msg, variant: "destructive" });
        }
        return;
      }
      const rewritten = (data as any)?.rewritten?.trim();
      if (!rewritten) {
        toast({ title: "Empty rewrite", description: "Try a different tone.", variant: "destructive" });
        return;
      }
      onRewritten(rewritten);
      setOpen(false);
      toast({
        title: "Rewritten",
        description: `Applied "${TONES.find((t) => t.id === tone)?.label.toLowerCase()}".`,
      });
    } catch (e: any) {
      toast({ title: "Rewrite failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setPending(null);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={(v) => !pending && setOpen(v)}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title={disabled ? "Nothing to rewrite" : "Smart Rewrite"}
          className={cn(
            "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:hover:text-muted-foreground",
            variant === "button" &&
              "rounded-md border border-border/50 px-2 py-1 hover:bg-primary/5",
            className,
          )}
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {variant === "button" && <span>Rewrite</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs">Smart Rewrite • 1 credit</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TONES.map((tone) => (
          <DropdownMenuItem
            key={tone.id}
            disabled={!!pending}
            onSelect={(e) => {
              e.preventDefault();
              void runRewrite(tone.id);
            }}
            className="flex flex-col items-start gap-0.5 cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium">{tone.label}</span>
              {pending === tone.id ? (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              ) : pending ? null : (
                <Check className="w-3 h-3 opacity-0" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{tone.hint}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
