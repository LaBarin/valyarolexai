import React from "react";
import { AbsoluteFill, Audio, Series, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { AdVideoProps, FPS } from "./schema";
import { SceneClip } from "./SceneClip";
import { ClosingCard } from "./ClosingCard";
import { BrandFooter } from "./BrandFooter";

// Load Space Grotesk to match the in-app design system.
const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });

export const AdVideo: React.FC<AdVideoProps> = ({
  scenes,
  voiceoverUrl,
  musicUrl,
  voiceoverVolume,
  musicVolume,
  brandFooter,
  closingCard,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Music gain ramps to silence in the final 0.6s so the ad doesn't cut off mid-loop.
  const musicFadeOutFrames = Math.min(durationInFrames, Math.round(0.6 * FPS));
  const musicFadeStart = durationInFrames - musicFadeOutFrames;

  const lastIdx = scenes.length - 1;
  const hasClosing =
    !!closingCard &&
    !!(
      closingCard.clientLogoUrl ||
      closingCard.referenceLogoUrl ||
      closingCard.companyName ||
      closingCard.website ||
      closingCard.phone ||
      closingCard.address
    );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily }}>
      {/* Scenes */}
      <Series>
        {scenes.map((scene, i) => (
          <Series.Sequence
            key={i}
            durationInFrames={Math.max(1, Math.round(scene.durationSeconds * FPS))}
          >
            <SceneClip scene={scene} index={i} isLast={i === lastIdx} />
          </Series.Sequence>
        ))}
      </Series>

      {/* Persistent brand footer on every scene (skipped on last scene if closing card is shown) */}
      {brandFooter && (brandFooter.website || brandFooter.phone) && !hasClosing && (
        <BrandFooter website={brandFooter.website} phone={brandFooter.phone} />
      )}

      {/* Branded closing card overlaid on the last scene */}
      {hasClosing && closingCard && (
        <ClosingCard
          startFrame={scenes.slice(0, lastIdx).reduce((s, sc) => s + Math.round(sc.durationSeconds * FPS), 0)}
          card={closingCard}
        />
      )}

      {/* Voiceover (single track, plays from frame 0) */}
      {voiceoverUrl && (
        <Audio src={voiceoverUrl} volume={voiceoverVolume} />
      )}

      {/* Background music with end-of-video fade-out */}
      {musicUrl && (
        <Audio
          src={musicUrl}
          volume={(frame) => {
            if (frame < musicFadeStart) return musicVolume;
            const t = (frame - musicFadeStart) / Math.max(1, musicFadeOutFrames);
            return Math.max(0, musicVolume * (1 - t));
          }}
          // Loop the bed in case it's shorter than the video.
          loop
        />
      )}
    </AbsoluteFill>
  );
};
