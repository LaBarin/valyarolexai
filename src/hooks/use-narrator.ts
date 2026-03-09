import { useState, useCallback, useRef, useEffect } from "react";

interface NarratorOptions {
  onStepChange: (step: number) => void;
  totalSteps: number;
}

export function useNarrator({ onStepChange, totalSteps }: NarratorOptions) {
  const [isNarrating, setIsNarrating] = useState(false);
  const [currentNarrationStep, setCurrentNarrationStep] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isNarratingRef = useRef(false);

  const stopNarration = useCallback(() => {
    isNarratingRef.current = false;
    setIsNarrating(false);
    window.speechSynthesis.cancel();
  }, []);

  const narrateStep = useCallback(
    (stepIndex: number, text: string, onDone: () => void) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Pick a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel"))
      );
      if (preferred) utterance.voice = preferred;

      utterance.onend = () => {
        if (isNarratingRef.current) {
          setTimeout(onDone, 600);
        }
      };
      utterance.onerror = () => {
        if (isNarratingRef.current) onDone();
      };

      utteranceRef.current = utterance;
      onStepChange(stepIndex);
      setCurrentNarrationStep(stepIndex);
      window.speechSynthesis.speak(utterance);
    },
    [onStepChange]
  );

  const startNarration = useCallback(
    (steps: { title: string; subtitle: string; description: string; highlights?: string[] }[], fromStep = 0) => {
      if (!window.speechSynthesis) return;

      isNarratingRef.current = true;
      setIsNarrating(true);

      const narrateSequence = (index: number) => {
        if (index >= steps.length || !isNarratingRef.current) {
          stopNarration();
          return;
        }

        const s = steps[index];
        let text = `${s.title}. ${s.subtitle}. ${s.description}`;
        if (s.highlights?.length) {
          text += " Key highlights: " + s.highlights.join(". ") + ".";
        }

        narrateStep(index, text, () => narrateSequence(index + 1));
      };

      narrateSequence(fromStep);
    },
    [narrateStep, stopNarration]
  );

  useEffect(() => {
    // Preload voices
    window.speechSynthesis?.getVoices();
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    isNarrating,
    currentNarrationStep,
    startNarration,
    stopNarration,
  };
}
