import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Sparkles, ChevronDown } from "lucide-react";
import { VERTICAL_TEMPLATES, type VerticalTemplate } from "./verticalTemplates";

interface Props {
  onPick: (t: VerticalTemplate) => void;
  selectedId?: string | null;
}

const TOP_COUNT = 10;

/**
 * One-click industry starters. Picking one prefills the prompt, CTA, ad style,
 * format/duration preset, and music mood — so users don't have to assemble the
 * brief from scratch.
 */
export function VerticalTemplatePicker({ onPick, selectedId }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);

  const topTemplates = VERTICAL_TEMPLATES.slice(0, TOP_COUNT);
  const moreTemplates = VERTICAL_TEMPLATES.slice(TOP_COUNT);
  const selectedInMore = selectedId ? moreTemplates.some((t) => t.id === selectedId) : false;

  function renderCard(t: VerticalTemplate) {
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
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Briefcase className="w-3.5 h-3.5 text-primary" />
        <h4 className="text-xs font-semibold">Industry Starters</h4>
        <span className="text-[10px] text-muted-foreground">
          One click pre-fills prompt, CTA, style & format
        </span>
      </div>

      {/* Top 10 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {topTemplates.map(renderCard)}
      </div>

      {/* More dropdown */}
      {moreTemplates.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              moreOpen || selectedInMore
                ? "bg-primary/10 text-primary"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            }`}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
            />
            More templates
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-[9px] text-muted-foreground">
              {moreTemplates.length}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {(moreOpen || selectedInMore) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
                  {moreTemplates.map(renderCard)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

