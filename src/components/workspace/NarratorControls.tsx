import { Volume2, VolumeX, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrator } from "@/hooks/use-narrator";
import { useCallback, useEffect } from "react";

interface NarratorControlsProps {
  slides: { title: string; body: string }[];
  onSlideChange: (index: number) => void;
  currentSlide: number;
  compact?: boolean;
}

export function NarratorControls({ slides, onSlideChange, currentSlide, compact }: NarratorControlsProps) {
  const { isNarrating, currentNarrationStep, startNarration, stopNarration } = useNarrator({
    onStepChange: onSlideChange,
    totalSteps: slides.length,
  });

  const handleToggle = useCallback(() => {
    if (isNarrating) {
      stopNarration();
    } else {
      const narratorSlides = slides.map((s) => ({
        title: s.title,
        subtitle: "",
        description: s.body,
      }));
      startNarration(narratorSlides, currentSlide);
    }
  }, [isNarrating, stopNarration, startNarration, slides, currentSlide]);

  // Stop narration on unmount
  useEffect(() => () => { stopNarration(); }, [stopNarration]);

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
