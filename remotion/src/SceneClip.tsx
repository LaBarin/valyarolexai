import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "./schema";

type AnimParams = { startScale: number; endScale: number; startX: number; startY: number; endX: number; endY: number };

const ANIM: Record<Scene["animation"], AnimParams> = {
  "none":       { startScale: 1, endScale: 1, startX: 0, startY: 0, endX: 0, endY: 0 },
  "zoom-in":    { startScale: 1, endScale: 1.14, startX: 0, startY: 0, endX: 0, endY: 0 },
  "zoom-out":   { startScale: 1.14, endScale: 1, startX: 0, startY: 0, endX: 0, endY: 0 },
  "pan-left":   { startScale: 1.05, endScale: 1.05, startX: 0.04, startY: 0, endX: -0.04, endY: 0 },
  "pan-right":  { startScale: 1.05, endScale: 1.05, startX: -0.04, startY: 0, endX: 0.04, endY: 0 },
  "pan-up":     { startScale: 1.05, endScale: 1.05, startX: 0, startY: 0.03, endX: 0, endY: -0.03 },
  "ken-burns":  { startScale: 1, endScale: 1.12, startX: 0, startY: 0, endX: -0.04, endY: -0.03 },
  "fade-pulse": { startScale: 1, endScale: 1, startX: 0, startY: 0, endX: 0, endY: 0 },
};

const FADE_FRAMES = 12; // ~0.4s @ 30fps cross-fade between scenes

export const SceneClip: React.FC<{ scene: Scene; index: number; isLast: boolean }> = ({ scene, index, isLast }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const totalFrames = durationInFrames;

  const params = ANIM[scene.animation];
  const t = totalFrames > 1 ? frame / (totalFrames - 1) : 0;

  let scale = params.startScale + (params.endScale - params.startScale) * t;
  if (scene.animation === "fade-pulse") scale = 1 + 0.04 * Math.sin(t * Math.PI);

  const panX = (params.startX + (params.endX - params.startX) * t) * width;
  const panY = (params.startY + (params.endY - params.startY) * t) * height;

  // Cross-fade in for non-first scenes
  const fadeIn = index === 0 ? 1 : interpolate(frame, [0, FADE_FRAMES], [0, 1], { extrapolateRight: "clamp" });
  // Cross-fade out for non-last scenes
  const fadeOut = isLast ? 1 : interpolate(frame, [totalFrames - FADE_FRAMES, totalFrames - 1], [1, 0], { extrapolateLeft: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  // Text overlay entrance: slide-up + fade-in over first 25% of scene
  const overlayProgress = Math.min(1, t / 0.25);
  const overlayEase = 1 - Math.pow(1 - overlayProgress, 3);

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={scene.imageUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </AbsoluteFill>

      {/* Text overlay card pinned to bottom */}
      {scene.textOverlay && (
        <AbsoluteFill
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: Math.round(height * 0.06),
            pointerEvents: "none",
          }}
        >
          {/* Bottom scrim for legibility */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: Math.round(height * 0.22),
              background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.72))",
            }}
          />
          <div
            style={{
              position: "relative",
              opacity: overlayEase,
              transform: `translateY(${(1 - overlayEase) * 30}px)`,
              maxWidth: "78%",
              padding: `${Math.round(width * 0.02)}px ${Math.round(width * 0.028)}px`,
              background: "rgba(8, 12, 18, 0.58)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: Math.max(28, Math.min(70, Math.round(width * 0.04))),
              lineHeight: 1.12,
              textAlign: "center",
              textShadow: "0 2px 14px rgba(0,0,0,0.45)",
              borderRadius: 4,
            }}
          >
            {scene.textOverlay}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
