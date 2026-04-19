import { normalizeVideoOverlayText } from "@/lib/video-script";

// ─── Public types ───────────────────────────────────────────────

/** Per-scene animation effect */
export type SceneAnimation =
  | "none"
  | "zoom-in"
  | "zoom-out"
  | "pan-left"
  | "pan-right"
  | "pan-up"
  | "ken-burns"    // alternating zoom+pan
  | "fade-pulse";  // gentle scale pulse

/** Global animation style preset */
export type AnimationPreset = "none" | "cinematic" | "energetic" | "minimal";

export const SCENE_ANIMATION_OPTIONS: { value: SceneAnimation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "zoom-in", label: "Zoom In" },
  { value: "zoom-out", label: "Zoom Out" },
  { value: "pan-left", label: "Pan Left" },
  { value: "pan-right", label: "Pan Right" },
  { value: "pan-up", label: "Pan Up" },
  { value: "ken-burns", label: "Ken Burns" },
  { value: "fade-pulse", label: "Fade Pulse" },
];

export const ANIMATION_PRESETS: { value: AnimationPreset; label: string; description: string }[] = [
  { value: "none", label: "None", description: "Static scenes, no motion" },
  { value: "cinematic", label: "Cinematic", description: "Slow zooms & drifts, dramatic pacing" },
  { value: "energetic", label: "Energetic", description: "Fast pans & bold zooms, high-energy feel" },
  { value: "minimal", label: "Minimal", description: "Subtle zooms, refined motion" },
];

/** Resolve the animation for a scene — explicit per-scene overrides the preset */
export function resolveSceneAnimation(
  preset: AnimationPreset,
  sceneIndex: number,
  perScene?: SceneAnimation,
): SceneAnimation {
  if (perScene && perScene !== "none") return perScene;
  if (preset === "none") return "none";

  const CINEMATIC: SceneAnimation[] = ["zoom-in", "ken-burns", "zoom-out", "pan-left"];
  const ENERGETIC: SceneAnimation[] = ["pan-right", "zoom-in", "pan-left", "zoom-out", "pan-up"];
  const MINIMAL: SceneAnimation[] = ["zoom-in", "zoom-out"];

  const pool =
    preset === "cinematic" ? CINEMATIC :
    preset === "energetic" ? ENERGETIC :
    MINIMAL;

  return pool[sceneIndex % pool.length];
}

// ─── Scene input ────────────────────────────────────────────────

export type SceneInput = {
  imageUrl: string;
  durationSeconds: number;
  textOverlay?: string;
  animation?: SceneAnimation;
};

type RenderOptions = {
  format: string;
  scenes: SceneInput[];
  onProgress?: (percent: number) => void;
  preset?: AnimationPreset;
  /** Optional voiceover audio URL to mix into the exported video */
  voiceoverUrl?: string | null;
  /** Optional background music audio URL to mix into the exported video */
  musicUrl?: string | null;
  /** Background music volume 0-1 (default 0.25) */
  musicVolume?: number;
  /** Voiceover volume 0-1 (default 1.0) */
  voiceoverVolume?: number;
  /** Optional persistent brand info shown as a small footer on every frame */
  brandFooter?: { website?: string; phone?: string } | null;
};

// ─── Constants ──────────────────────────────────────────────────

const FORMAT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
  "4:3": { width: 1440, height: 1080 },
};

const FPS = 30;
const FADE_DURATION_SECONDS = 0.4;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// ─── Animation drawing helpers ──────────────────────────────────

type KBParams = { startScale: number; endScale: number; startX: number; startY: number; endX: number; endY: number };

const ANIM_PARAMS: Record<SceneAnimation, (preset: AnimationPreset) => KBParams> = {
  "none":       () => ({ startScale: 1, endScale: 1, startX: 0, startY: 0, endX: 0, endY: 0 }),
  "zoom-in":    (p) => ({ startScale: 1, endScale: p === "energetic" ? 1.22 : p === "minimal" ? 1.06 : 1.14, startX: 0, startY: 0, endX: 0, endY: 0 }),
  "zoom-out":   (p) => ({ startScale: p === "energetic" ? 1.22 : p === "minimal" ? 1.06 : 1.14, endScale: 1, startX: 0, startY: 0, endX: 0, endY: 0 }),
  "pan-left":   (p) => ({ startScale: 1.05, endScale: 1.05, startX: 0.04, startY: 0, endX: p === "energetic" ? -0.06 : -0.04, endY: 0 }),
  "pan-right":  (p) => ({ startScale: 1.05, endScale: 1.05, startX: -0.04, startY: 0, endX: p === "energetic" ? 0.06 : 0.04, endY: 0 }),
  "pan-up":     (p) => ({ startScale: 1.05, endScale: 1.05, startX: 0, startY: 0.03, endX: 0, endY: p === "energetic" ? -0.05 : -0.03 }),
  "ken-burns":  (p) => ({ startScale: 1, endScale: p === "energetic" ? 1.18 : 1.12, startX: 0, startY: 0, endX: -0.04, endY: -0.03 }),
  "fade-pulse": () => ({ startScale: 1, endScale: 1, startX: 0, startY: 0, endX: 0, endY: 0 }),
};

function drawAnimatedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  progress: number,
  anim: SceneAnimation,
  preset: AnimationPreset,
) {
  if (anim === "none") {
    drawImageCover(ctx, img, canvasW, canvasH);
    return;
  }

  if (anim === "fade-pulse") {
    // Gentle sine-based scale pulse
    const s = 1 + 0.04 * Math.sin(progress * Math.PI);
    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.scale(s, s);
    ctx.translate(-canvasW / 2, -canvasH / 2);
    drawImageCover(ctx, img, canvasW, canvasH);
    ctx.restore();
    return;
  }

  const params = ANIM_PARAMS[anim](preset);
  const t = clamp(progress, 0, 1);
  const scale = params.startScale + (params.endScale - params.startScale) * t;
  const panX = (params.startX + (params.endX - params.startX) * t) * canvasW;
  const panY = (params.startY + (params.endY - params.startY) * t) * canvasH;

  ctx.save();
  ctx.translate(canvasW / 2 + panX, canvasH / 2 + panY);
  ctx.scale(scale, scale);
  ctx.translate(-canvasW / 2, -canvasH / 2);
  drawImageCover(ctx, img, canvasW, canvasH);
  ctx.restore();
}

// ─── Text helpers ───────────────────────────────────────────────

function wrapOverlayText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";
  let index = 0;

  while (index < words.length) {
    const candidate = currentLine ? `${currentLine} ${words[index]}` : words[index];
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      index += 1;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    } else {
      lines.push(words[index]);
      index += 1;
    }

    if (lines.length === maxLines - 1) break;
  }

  const remainingWords = words.slice(index);
  const tailBase = currentLine || remainingWords.join(" ");
  if (tailBase) {
    let tail = tailBase;
    const needsEllipsis = remainingWords.length > 0 && currentLine.length > 0;
    if (needsEllipsis) tail = `${tail}…`;
    while (ctx.measureText(tail).width > maxWidth && tail.length > 1) {
      tail = `${tail.slice(0, -2).trimEnd()}…`;
    }
    lines.push(tail);
  }

  return lines.slice(0, maxLines);
}

/**
 * Fetches an image as a blob to avoid canvas tainting from cross-origin URLs.
 */
async function loadImageAsBlob(url: string): Promise<HTMLImageElement> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const objectUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = objectUrl;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasW / canvasH;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > canvasRatio) {
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / canvasRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasW: number,
  canvasH: number,
  animProgress?: number, // 0-1 for animated text entrance; undefined = static
) {
  const overlayText = normalizeVideoOverlayText(text);
  if (!overlayText) return;

  const fontSize = clamp(Math.round(canvasW * 0.04), 28, 70);
  const lineHeight = Math.round(fontSize * 1.12);
  const maxWidth = canvasW * 0.74;
  const bottomPadding = Math.round(canvasH * 0.06);

  ctx.save();

  // Animated entrance: slide up + fade in during first 25% of the scene
  let textAlpha = 1;
  let textOffsetY = 0;
  if (animProgress !== undefined) {
    const t = clamp(animProgress / 0.25, 0, 1); // ease in over first 25%
    const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
    textAlpha = ease;
    textOffsetY = (1 - ease) * 30;
  }

  const scrimHeight = Math.round(canvasH * 0.22);
  const scrim = ctx.createLinearGradient(0, canvasH - scrimHeight, 0, canvasH);
  scrim.addColorStop(0, "rgba(0, 0, 0, 0)");
  scrim.addColorStop(1, "rgba(0, 0, 0, 0.72)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, canvasH - scrimHeight, canvasW, scrimHeight);

  ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const x = canvasW / 2;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#ffffff";

  const lines = wrapOverlayText(ctx, overlayText, maxWidth, 2);
  const widestLine = Math.max(...lines.map((line) => ctx.measureText(line).width), 0);
  const textBlockHeight = lines.length * lineHeight;
  const cardPaddingX = Math.round(fontSize * 0.7);
  const cardPaddingY = Math.round(fontSize * 0.5);
  const cardWidth = widestLine + cardPaddingX * 2;
  const cardHeight = textBlockHeight + cardPaddingY * 2;
  const cardX = (canvasW - cardWidth) / 2;
  const cardY = canvasH - bottomPadding - cardHeight;

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(8, 12, 18, 0.58)";
  ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

  ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 14;
  const startY = cardY + cardPaddingY + lineHeight - Math.round(fontSize * 0.12) + textOffsetY;
  lines.forEach((l, i) => {
    ctx.fillText(l, x, startY + i * lineHeight);
  });
  ctx.restore();
}

function drawBrandFooter(
  ctx: CanvasRenderingContext2D,
  brand: { website?: string; phone?: string },
  canvasW: number,
  canvasH: number,
) {
  const parts: string[] = [];
  if (brand.website) parts.push(brand.website);
  if (brand.phone) parts.push(brand.phone);
  if (parts.length === 0) return;
  const text = parts.join("   •   ");

  const fontSize = clamp(Math.round(canvasW * 0.018), 16, 32);
  const padX = Math.round(fontSize * 0.9);
  const padY = Math.round(fontSize * 0.5);

  ctx.save();
  ctx.font = `600 ${fontSize}px "Space Grotesk", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textW = ctx.measureText(text).width;
  const cardW = textW + padX * 2;
  const cardH = fontSize + padY * 2;
  const cardX = (canvasW - cardW) / 2;
  const cardY = Math.round(canvasH * 0.025);

  ctx.fillStyle = "rgba(8, 12, 18, 0.62)";
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, canvasW / 2, cardY + cardH / 2);
  ctx.restore();
}
async function loadAudioBuffer(
  audioCtx: AudioContext,
  url: string,
): Promise<AudioBuffer> {
  const resp = await fetch(url);
  const arrayBuffer = await resp.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Renders scene images into a WebM video blob, optionally mixing voiceover and music.
 */
export async function renderVideo(options: RenderOptions): Promise<Blob> {
  const {
    format, scenes, onProgress, preset = "none",
    voiceoverUrl, musicUrl,
    musicVolume = 0.25, voiceoverVolume = 1.0,
    brandFooter,
  } = options;
  const dims = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS["16:9"];
  const { width, height } = dims;

  // Pre-load all images
  const images: HTMLImageElement[] = [];
  for (let i = 0; i < scenes.length; i++) {
    onProgress?.(Math.round((i / (scenes.length * 2)) * 100));
    images.push(await loadImageAsBlob(scenes[i].imageUrl));
  }

  // Total video duration (seconds)
  const totalDurationSec = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Set up audio mixing if any audio sources provided
  let audioCtx: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  let voiceoverBuffer: AudioBuffer | null = null;
  let musicBuffer: AudioBuffer | null = null;

  if (voiceoverUrl || musicUrl) {
    try {
      audioCtx = new AudioContext();
      audioDestination = audioCtx.createMediaStreamDestination();
      if (voiceoverUrl) {
        try { voiceoverBuffer = await loadAudioBuffer(audioCtx, voiceoverUrl); } catch (e) { console.warn("Voiceover load failed", e); }
      }
      if (musicUrl) {
        try { musicBuffer = await loadAudioBuffer(audioCtx, musicUrl); } catch (e) { console.warn("Music load failed", e); }
      }
    } catch (e) {
      console.warn("AudioContext setup failed; rendering without audio", e);
      audioCtx = null;
      audioDestination = null;
    }
  }

  // Build combined stream: canvas video + (optional) audio
  const videoStream = canvas.captureStream(FPS);
  let combinedStream: MediaStream = videoStream;
  if (audioDestination && (voiceoverBuffer || musicBuffer)) {
    combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ]);
  }

  // Determine codec
  const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9,opus")
    ? "video/webm; codecs=vp9,opus"
    : MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
    ? "video/webm; codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      try { audioCtx?.close(); } catch { /* noop */ }
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
    recorder.onerror = (e) => reject(e);
    recorder.start();

    // Schedule audio playback to start in sync with recording
    if (audioCtx && audioDestination) {
      const startAt = audioCtx.currentTime + 0.05;
      if (voiceoverBuffer) {
        const src = audioCtx.createBufferSource();
        src.buffer = voiceoverBuffer;
        const gain = audioCtx.createGain();
        gain.gain.value = voiceoverVolume;
        src.connect(gain).connect(audioDestination);
        src.start(startAt);
      }
      if (musicBuffer) {
        const src = audioCtx.createBufferSource();
        src.buffer = musicBuffer;
        src.loop = true;
        const gain = audioCtx.createGain();
        gain.gain.value = musicVolume;
        // Fade out music near the end
        const fadeStart = Math.max(0, totalDurationSec - 0.6);
        gain.gain.setValueAtTime(musicVolume, startAt + fadeStart);
        gain.gain.linearRampToValueAtTime(0, startAt + totalDurationSec);
        src.connect(gain).connect(audioDestination);
        src.start(startAt);
        src.stop(startAt + totalDurationSec + 0.1);
      }
    }

    const totalFrames = scenes.reduce(
      (sum, s) => sum + Math.round(s.durationSeconds * FPS),
      0,
    );
    let framesDone = 0;

    const renderScene = (sceneIdx: number) => {
      if (sceneIdx >= scenes.length) {
        recorder.stop();
        return;
      }
      const scene = scenes[sceneIdx];
      const img = images[sceneIdx];
      const nextImg = sceneIdx < scenes.length - 1 ? images[sceneIdx + 1] : null;
      const totalSceneFrames = Math.round(scene.durationSeconds * FPS);
      const fadeFrames = Math.round(FADE_DURATION_SECONDS * FPS);
      let frameIdx = 0;

      const sceneAnim = resolveSceneAnimation(preset, sceneIdx, scene.animation);
      const isAnimated = sceneAnim !== "none";

      const drawFrame = () => {
        if (frameIdx >= totalSceneFrames) {
          renderScene(sceneIdx + 1);
          return;
        }

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Check if we're in fade-out to next scene
        const framesLeft = totalSceneFrames - frameIdx;
        const inFade = nextImg && framesLeft <= fadeFrames;

        if (inFade && nextImg) {
          const fadeProgress = 1 - framesLeft / fadeFrames;
          ctx.globalAlpha = 1 - fadeProgress;
          if (isAnimated) {
            drawAnimatedImage(ctx, img, width, height, 1, sceneAnim, preset);
          } else {
            drawImageCover(ctx, img, width, height);
          }
          ctx.globalAlpha = fadeProgress;
          const nextAnim = resolveSceneAnimation(preset, sceneIdx + 1, scenes[sceneIdx + 1]?.animation);
          if (nextAnim !== "none") {
            drawAnimatedImage(ctx, nextImg, width, height, 0, nextAnim, preset);
          } else {
            drawImageCover(ctx, nextImg, width, height);
          }
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = 1;
          if (isAnimated) {
            const progress = frameIdx / Math.max(totalSceneFrames, 1);
            drawAnimatedImage(ctx, img, width, height, progress, sceneAnim, preset);
          } else {
            drawImageCover(ctx, img, width, height);
          }
        }

        // Text overlay (fade in during first second)
        if (scene.textOverlay) {
          if (isAnimated) {
            const progress = frameIdx / Math.max(totalSceneFrames, 1);
            drawTextOverlay(ctx, scene.textOverlay, width, height, progress);
          } else {
            const textFadeIn = Math.min(1, frameIdx / (FPS * 0.5));
            ctx.globalAlpha = textFadeIn;
            drawTextOverlay(ctx, scene.textOverlay, width, height);
            ctx.globalAlpha = 1;
          }
        }

        // Persistent brand footer overlay (always visible)
        if (brandFooter && (brandFooter.website || brandFooter.phone)) {
          drawBrandFooter(ctx, brandFooter, width, height);
        }

        frameIdx++;
        framesDone++;
        onProgress?.(
          50 + Math.round((framesDone / totalFrames) * 50),
        );

        requestAnimationFrame(drawFrame);
      };

      drawFrame();
    };

    renderScene(0);
  });
}
