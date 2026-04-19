import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

export const BrandFooter: React.FC<{ website?: string; phone?: string }> = ({ website, phone }) => {
  const { width, height } = useVideoConfig();
  const parts = [website, phone].filter(Boolean) as string[];
  if (parts.length === 0) return null;
  const text = parts.join("   •   ");
  const fontSize = Math.max(16, Math.min(32, Math.round(width * 0.018)));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: Math.round(height * 0.025),
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "rgba(8, 12, 18, 0.62)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            color: "#ffffff",
            fontWeight: 600,
            fontSize,
            padding: `${Math.round(fontSize * 0.5)}px ${Math.round(fontSize * 0.9)}px`,
            textShadow: "0 0 8px rgba(0,0,0,0.5)",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
