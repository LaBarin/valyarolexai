import { normalizeVideoOverlayText } from "@/lib/video-script";

/**
 * Client-side video renderer: stitches scene images into a .webm video
 * using Canvas API + MediaRecorder.
 */

type SceneInput = {
  imageUrl: string;
  durationSeconds: number;
  textOverlay?: string;
};

type RenderOptions = {
  format: string; // "9:16" | "1:1" | "16:9"
  scenes: SceneInput[];
  onProgress?: (percent: number) => void;
};

const FORMAT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
  "4:3": { width: 1440, height: 1080 },
};

const FPS = 30;
const FADE_DURATION_SECONDS = 0.4;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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
) {
  const overlayText = normalizeVideoOverlayText(text);
  if (!overlayText) return;

  const fontSize = clamp(Math.round(canvasW * 0.04), 28, 70);
  const lineHeight = Math.round(fontSize * 1.12);
  const maxWidth = canvasW * 0.74;
  const bottomPadding = Math.round(canvasH * 0.06);

  ctx.save();

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

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 14;
  const startY = cardY + cardPaddingY + lineHeight - Math.round(fontSize * 0.12);
  lines.forEach((l, i) => {
    ctx.fillText(l, x, startY + i * lineHeight);
  });
  ctx.restore();
}

/**
 * Renders scene images into a WebM video blob.
 */
export async function renderVideo(options: RenderOptions): Promise<Blob> {
  const { format, scenes, onProgress } = options;
  const dims = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS["16:9"];
  const { width, height } = dims;

  // Pre-load all images
  const images: HTMLImageElement[] = [];
  for (let i = 0; i < scenes.length; i++) {
    onProgress?.(Math.round((i / (scenes.length * 2)) * 100));
    images.push(await loadImageAsBlob(scenes[i].imageUrl));
  }

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Determine codec
  const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
    ? "video/webm; codecs=vp9"
    : "video/webm";

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
    recorder.onerror = (e) => reject(e);
    recorder.start();

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
          // Draw current image
          ctx.globalAlpha = 1 - fadeProgress;
          drawImageCover(ctx, img, width, height);
          // Draw next image
          ctx.globalAlpha = fadeProgress;
          drawImageCover(ctx, nextImg, width, height);
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = 1;
          drawImageCover(ctx, img, width, height);
        }

        // Text overlay (fade in during first second)
        if (scene.textOverlay) {
          const textFadeIn = Math.min(1, frameIdx / (FPS * 0.5));
          ctx.globalAlpha = textFadeIn;
          drawTextOverlay(ctx, scene.textOverlay, width, height);
          ctx.globalAlpha = 1;
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
