import { motion } from "framer-motion";
import { Briefcase, Sparkles } from "lucide-react";
import { VERTICAL_TEMPLATES, type VerticalTemplate } from "./verticalTemplates";

interface Props {
  onPick: (t: VerticalTemplate) => void;
  selectedId?: string | null;
}

/**
 * One-click industry starters. Picking one prefills the prompt, CTA, ad style,
 * format/duration preset, and music mood — so users don't have to assemble the
 * brief from scratch.
 */
export function VerticalTemplatePicker({ onPick, selectedId }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Briefcase className="w-3.5 h-3.5 text-primary" />
        <h4 className="text-xs font-semibold">Industry Starters</h4>
        <span className="text-[10px] text-muted-foreground">
          One click pre-fills prompt, CTA, style & format
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {VERTICAL_TEMPLATES.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedId === t.id;
          return (
            <motion.button
              key={t.id}
              type="button"
              whileHover={{ y: -1 }}
              onClick={() => onPick(t)}
              className={`text-left rounded-lg border p-2.5 transition-all bg-gradient-to-br ${t.accent} ${
                isSelected
                  ? "border-primary ring-1 ring-primary/40"
                  : "border-border/40 hover:border-border/70"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {t.industry}
                </span>
                {isSelected && <Sparkles className="w-3 h-3 text-primary ml-auto" />}
              </div>
              <h5 className="text-xs font-semibold leading-tight">{t.name}</h5>
              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{t.cta}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
