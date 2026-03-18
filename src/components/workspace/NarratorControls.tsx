import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback } from "react";

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;

interface NarratorControlsProps {
  slides: { title: string; body: string }[];
  currentSlide: number;
  compact?: boolean;
  isNarrating: boolean;
  rate: number;
  onStart: (slides: { title: string; subtitle: string; description: string }[], fromStep: number) => void;
  onStop: () => void;
  onRateChange: (rate: number) => void;
}

export function NarratorControls({ slides, currentSlide, compact, isNarrating, rate, onStart, onStop, onRateChange }: NarratorControlsProps) {
  const handleToggle = useCallback(() => {
    if (isNarrating) {
      onStop();
    } else {
      const narratorSlides = slides.map((s) => ({
        title: s.title,
        subtitle: "",
        description: s.body,
      }));
      onStart(narratorSlides, currentSlide);
    }
  }, [isNarrating, onStop, onStart, slides, currentSlide]);

  return (
    <div className="flex items-center gap-1">
      <Button
        size={compact ? "icon" : "sm"}
        variant={isNarrating ? "default" : "outline"}
        onClick={handleToggle}
        title={isNarrating ? "Stop narrator" : "Start narrator"}
        className={isNarrating ? "animate-pulse" : ""}
      >
        {isNarrating ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        {!compact && <span className="ml-1.5">{isNarrating ? "Stop" : "Narrate"}</span>}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline" className="h-8 w-8" title="Playback speed">
            <span className="text-[10px] font-bold">{rate}x</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-[80px]">
          {SPEED_OPTIONS.map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => onRateChange(s)}
              className={rate === s ? "bg-accent font-semibold" : ""}
            >
              {s}x
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
