import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

interface NarratorControlsProps {
  slides: { title: string; body: string }[];
  currentSlide: number;
  compact?: boolean;
  // External narrator state (lifted up)
  isNarrating: boolean;
  onStart: (slides: { title: string; subtitle: string; description: string }[], fromStep: number) => void;
  onStop: () => void;
}

export function NarratorControls({ slides, currentSlide, compact, isNarrating, onStart, onStop }: NarratorControlsProps) {
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
  );
}
