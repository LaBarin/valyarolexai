import { useState, useCallback, useRef, useEffect } from "react";

interface NarratorOptions {
  onStepChange: (step: number) => void;
  totalSteps: number;
}

export function useNarrator({ onStepChange, totalSteps }: NarratorOptions) {
  const [isNarrating, setIsNarrating] = useState(false);
  const [currentNarrationStep, setCurrentNarrationStep] = useState(0);
  const [rate, setRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isNarratingRef = useRef(false);
  const rateRef = useRef(1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const stepsRef = useRef<{ title: string; subtitle: string; description: string; highlights?: string[] }[]>([]);
  const currentStepRef = useRef(0);
  // Flag to prevent sync loop when narrator itself advances slides
  const narratorDrivenChangeRef = useRef(false);

  const loadVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Karen") || v.name.includes("Moira"))
    );
    voiceRef.current = preferred || voices.find((v) => v.lang.startsWith("en")) || null;
  }, []);

  const stopNarration = useCallback(() => {
    isNarratingRef.current = false;
    setIsNarrating(false);
    window.speechSynthesis.cancel();
    stepsRef.current = [];
  }, []);

  const narrateSingleSlide = useCallback(
    (stepIndex: number) => {
      if (!isNarratingRef.current || stepIndex >= stepsRef.current.length) {
        stopNarration();
        return;
      }

      window.speechSynthesis.cancel();

      const s = stepsRef.current[stepIndex];
      const textParts: string[] = [];
      if (s.title) textParts.push(s.title);
      if (s.subtitle) textParts.push(s.subtitle);
      if (s.description) textParts.push(s.description);
      if (s.highlights?.length) {
        textParts.push("Key highlights include: " + s.highlights.join(". "));
      }
      const text = textParts.join(". ") + ".";

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rateRef.current;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      if (!voiceRef.current) loadVoice();
      if (voiceRef.current) utterance.voice = voiceRef.current;

      utterance.onend = () => {
        if (!isNarratingRef.current) return;
        const nextStep = currentStepRef.current + 1;
        if (nextStep < stepsRef.current.length) {
          currentStepRef.current = nextStep;
          setCurrentNarrationStep(nextStep);
          // Mark this as narrator-driven so syncToSlide ignores it
          narratorDrivenChangeRef.current = true;
          onStepChange(nextStep);
          setTimeout(() => narrateSingleSlide(nextStep), 1200);
        } else {
          stopNarration();
        }
      };
      utterance.onerror = () => {
        if (isNarratingRef.current) {
          const nextStep = currentStepRef.current + 1;
          if (nextStep < stepsRef.current.length) {
            currentStepRef.current = nextStep;
            narratorDrivenChangeRef.current = true;
            onStepChange(nextStep);
            setTimeout(() => narrateSingleSlide(nextStep), 600);
          } else {
            stopNarration();
          }
        }
      };

      utteranceRef.current = utterance;
      currentStepRef.current = stepIndex;
      setCurrentNarrationStep(stepIndex);
      window.speechSynthesis.speak(utterance);
    },
    [onStepChange, loadVoice, stopNarration]
  );

  const startNarration = useCallback(
    (steps: { title: string; subtitle: string; description: string; highlights?: string[] }[], fromStep = 0) => {
      if (!window.speechSynthesis) return;

      isNarratingRef.current = true;
      setIsNarrating(true);
      stepsRef.current = steps;
      loadVoice();

      narratorDrivenChangeRef.current = true;
      onStepChange(fromStep);
      narrateSingleSlide(fromStep);
    },
    [narrateSingleSlide, loadVoice, onStepChange]
  );

  // Sync narration when user manually changes slide (not narrator-driven)
  const syncToSlide = useCallback(
    (slideIndex: number) => {
      // If this change was triggered by the narrator itself, skip
      if (narratorDrivenChangeRef.current) {
        narratorDrivenChangeRef.current = false;
        return;
      }
      if (!isNarratingRef.current || stepsRef.current.length === 0) return;
      if (slideIndex === currentStepRef.current) return;
      // User manually navigated — cancel and narrate the new slide
      narrateSingleSlide(slideIndex);
    },
    [narrateSingleSlide]
  );

  useEffect(() => {
    loadVoice();
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoice);
    return () => {
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoice);
    };
  }, [loadVoice]);

  const updateRate = useCallback((newRate: number) => {
    rateRef.current = newRate;
    setRate(newRate);
    if (utteranceRef.current && isNarratingRef.current) {
      utteranceRef.current.rate = newRate;
    }
  }, []);

  return {
    isNarrating,
    currentNarrationStep,
    rate,
    setRate: updateRate,
    startNarration,
    stopNarration,
    syncToSlide,
  };
}
