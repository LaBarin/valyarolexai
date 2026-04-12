type SceneWithOverlay = {
  text_overlay?: string | null;
};

const MAX_OVERLAY_WORDS = 8;
const MAX_OVERLAY_CHARS = 56;

const collapseRepeatedWords = (value: string) => {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((acc, word) => {
      const previous = acc[acc.length - 1];
      if (previous?.toLowerCase() === word.toLowerCase()) return acc;
      acc.push(word);
      return acc;
    }, [])
    .join(" ");
};

const trimOverlay = (value: string) => {
  const limitedWords = value.split(/\s+/).slice(0, MAX_OVERLAY_WORDS).join(" ");
  if (limitedWords.length <= MAX_OVERLAY_CHARS) return limitedWords;
  return `${limitedWords.slice(0, MAX_OVERLAY_CHARS - 1).trimEnd()}…`;
};

export const normalizeVideoOverlayText = (
  value?: string | null,
  usedOverlays?: Set<string>,
) => {
  if (!value) return undefined;

  const cleaned = value
    .replace(/[\n|•]+/g, ". ")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .trim();

  if (!cleaned) return undefined;

  const fragments = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((fragment) => fragment.replace(/^[\s\-–—,:;]+|[\s\-–—,:;]+$/g, "").trim())
    .filter(Boolean);

  const candidate = trimOverlay(collapseRepeatedWords(fragments[0] ?? cleaned))
    .replace(/[.!?]+$/g, "")
    .trim();

  if (!candidate) return undefined;

  const overlayKey = candidate.toLowerCase();
  if (usedOverlays?.has(overlayKey)) return undefined;

  usedOverlays?.add(overlayKey);
  return candidate;
};

export const normalizeVideoScenes = <T extends SceneWithOverlay>(scenes?: T[] | null): T[] => {
  const usedOverlays = new Set<string>();

  return (scenes ?? []).map((scene) => {
    const nextOverlay = normalizeVideoOverlayText(scene.text_overlay, usedOverlays);

    if (!nextOverlay) {
      return {
        ...scene,
        text_overlay: undefined,
      };
    }

    return {
      ...scene,
      text_overlay: nextOverlay,
    };
  });
};

export const createShareToken = (byteLength = 16) => {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
};