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
  const fontSize = Math.round(canvasW * 0.04);
  ctx.save();
  ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const x = canvasW / 2;
  const y = canvasH - Math.round(canvasH * 0.08);
  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#ffffff";
  // Wrap text
  const maxWidth = canvasW * 0.85;
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const lineHeight = fontSize * 1.3;
  const startY = y - (lines.length - 1) * lineHeight;
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
