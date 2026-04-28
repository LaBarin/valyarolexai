// Translate dropdown — calls the translate-script edge function and returns
// a fully-translated VideoData blob via onTranslated. The parent persists.
import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷" },
  { code: "nl", label: "Dutch", flag: "🇳🇱" },
  { code: "pl", label: "Polish", flag: "🇵🇱" },
  { code: "tr", label: "Turkish", flag: "🇹🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

interface Props {
  script: any | null | undefined;
  onTranslated: (next: any, language: { code: string; name: string }) => void;
  disabled?: boolean;
}

export const TranslateMenu = ({ script, onTranslated, disabled }: Props) => {
  const { toast } = useToast();
  const [pending, setPending] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const isDisabled = disabled || !script;

  const run = async (code: string, label: string) => {
    if (isDisabled || pending) return;
    setPending(code);
    try {
      const { data, error } = await supabase.functions.invoke("translate-script", {
        body: { script, target: code },
      });
      if (error) {
        const ctx: any = (error as any)?.context;
        let detailMsg: string | null = null;
        if (ctx && typeof ctx.json === "function") {
          try { const p = await ctx.json(); detailMsg = p?.error ?? null; } catch { /* ignore */ }
        }
        if (detailMsg === "insufficient_credits") {
          toast({ title: "Out of credits", description: "Top up to keep translating.", variant: "destructive" });
        } else {
          toast({ title: "Translation failed", description: detailMsg || error.message, variant: "destructive" });
        }
        return;
      }
      const translated = (data as any)?.script;
      if (!translated) {
        toast({ title: "Translation failed", description: "No translated script returned.", variant: "destructive" });
        return;
      }
      onTranslated(translated, { code, name: label });
      setOpen(false);
      toast({ title: `Translated to ${label}`, description: "Script and scene captions updated." });
    } catch (e: any) {
      toast({ title: "Translation failed", description: e?.message || "Unexpected error", variant: "destructive" });
    } finally {
      setPending(null);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={(v) => !pending && setOpen(v)}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={isDisabled}>
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Languages className="w-3.5 h-3.5 mr-1.5" />
          )}
          Translate
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[60vh] overflow-y-auto">
        <DropdownMenuLabel className="text-xs">Translate full script • 2 credits</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            disabled={!!pending}
            onSelect={(e) => { e.preventDefault(); void run(l.code, l.label); }}
            className="cursor-pointer flex items-center justify-between"
          >
            <span className="flex items-center gap-2 text-sm">
              <span>{l.flag}</span>
              {l.label}
            </span>
            {pending === l.code && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
