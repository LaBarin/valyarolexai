import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type ClosingCardData = {
  clientLogoUrl?: string | null;
  referenceLogoUrl?: string | null;
  companyName?: string;
  website?: string;
  phone?: string;
  address?: string;
  poweredByLabel?: string;
};

/**
 * Branded closing card — fades in over the last scene starting at startFrame.
 * Renders the client logo big, a small "Powered by" line with the reference logo,
 * and the contact info block underneath.
 */
export const ClosingCard: React.FC<{ startFrame: number; card: ClosingCardData }> = ({ startFrame, card }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // 0.5s fade-in from the start of the last scene
  const fadeIn = interpolate(frame, [startFrame, startFrame + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (fadeIn <= 0) return null;

  const lines = [card.website, card.phone, card.address].filter(Boolean) as string[];
  const refLogoH = card.referenceLogoUrl ? Math.max(36, Math.min(90, Math.round(height * 0.06))) : 0;

  return (
    <AbsoluteFill
      style={{
        opacity: fadeIn,
        background:
          "linear-gradient(to bottom, rgba(8,12,18,0.55) 0%, rgba(8,12,18,0.7) 50%, rgba(8,12,18,0.85) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: Math.round(height * 0.12),
        color: "#fff",
        textAlign: "center",
      }}
    >
      {/* Client logo (hero) */}
      {card.clientLogoUrl ? (
        <Img
          src={card.clientLogoUrl}
          style={{
            maxWidth: width * 0.55,
            maxHeight: height * 0.32,
            objectFit: "contain",
          }}
        />
      ) : card.companyName ? (
        <div
          style={{
            fontSize: Math.max(36, Math.min(110, Math.round(width * 0.06))),
            fontWeight: 700,
            textShadow: "0 0 14px rgba(0,0,0,0.5)",
          }}
        >
          {card.companyName}
        </div>
      ) : null}

      {/* "Powered by" + small reference logo */}
      {(card.referenceLogoUrl || card.poweredByLabel) && (
        <div
          style={{
            marginTop: Math.round(height * 0.05),
            display: "flex",
            alignItems: "center",
            gap: Math.round(width * 0.012),
            fontSize: Math.max(14, Math.min(28, Math.round(width * 0.018))),
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <span>{card.poweredByLabel || "Powered by"}</span>
          {card.referenceLogoUrl && (
            <Img
              src={card.referenceLogoUrl}
              style={{ height: refLogoH, width: "auto", objectFit: "contain" }}
            />
          )}
        </div>
      )}

      {/* Contact info block */}
      {lines.length > 0 && (
        <div
          style={{
            marginTop: Math.round(height * 0.06),
            display: "flex",
            flexDirection: "column",
            gap: Math.round(height * 0.015),
            fontSize: Math.max(18, Math.min(38, Math.round(width * 0.022))),
            fontWeight: 500,
            textShadow: "0 0 10px rgba(0,0,0,0.5)",
          }}
        >
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
