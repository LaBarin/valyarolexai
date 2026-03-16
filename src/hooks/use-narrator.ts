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

  const voiceReadyRef = useRef(false);

  // Preload and cache a good voice
  const loadVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel"))
    );
    voiceRef.current = preferred || voices.find((v) => v.lang.startsWith("en")) || null;
    voiceReadyRef.current = true;
  }, []);

  const stopNarration = useCallback(() => {
    isNarratingRef.current = false;
    setIsNarrating(false);
    window.speechSynthesis.cancel();
  }, []);

  const narrateStep = useCallback(
    (stepIndex: number, text: string, onDone: () => void) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      if (!voiceRef.current) loadVoice();
      if (voiceRef.current) utterance.voice = voiceRef.current;

      utterance.onend = () => {
        if (isNarratingRef.current) {
          setTimeout(onDone, 800);
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
    [onStepChange, loadVoice]
  );

  const startNarration = useCallback(
    (steps: { title: string; subtitle: string; description: string; highlights?: string[] }[], fromStep = 0) => {
      if (!window.speechSynthesis) return;

      isNarratingRef.current = true;
      setIsNarrating(true);
      loadVoice();

      const narrateSequence = (index: number) => {
        if (index >= steps.length || !isNarratingRef.current) {
          stopNarration();
          return;
        }

        const s = steps[index];
        let text = `${s.title}. ${s.subtitle}. ${s.description}`;
        if (s.highlights?.length) {
          text += " Key highlights include: " + s.highlights.join(". ") + ".";
        }

        narrateStep(index, text, () => narrateSequence(index + 1));
      };

      narrateSequence(fromStep);
    },
    [narrateStep, stopNarration, loadVoice]
  );

  useEffect(() => {
    // Eagerly trigger voice loading
    loadVoice();
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoice);
    return () => {
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoice);
    };
  }, [loadVoice]);

  return {
    isNarrating,
    currentNarrationStep,
    startNarration,
    stopNarration,
  };
}
