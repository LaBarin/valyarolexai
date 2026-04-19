import { Composition } from "remotion";
import { AdVideo } from "./AdVideo";
import { AdVideoSchema, FORMAT_DIMENSIONS, FPS } from "./schema";

const DEFAULT_PROPS = {
  format: "9:16" as const,
  scenes: [
    {
      imageUrl: "https://placehold.co/1080x1920/0f172a/00d4ff/png?text=Scene+1",
      durationSeconds: 3,
      textOverlay: "Welcome",
      animation: "ken-burns" as const,
    },
    {
      imageUrl: "https://placehold.co/1080x1920/0f172a/00d4ff/png?text=Scene+2",
      durationSeconds: 3,
      textOverlay: "Powered by Valyarolex.AI",
      animation: "zoom-in" as const,
    },
  ],
  voiceoverUrl: null,
  musicUrl: null,
  voiceoverVolume: 1,
  musicVolume: 0.25,
  brandFooter: null,
  closingCard: null,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AdVideo"
      component={AdVideo}
      schema={AdVideoSchema}
      defaultProps={DEFAULT_PROPS}
      fps={FPS}
      // calculateMetadata is the canonical Remotion way to compute dynamic
      // duration + dimensions per render. The Lambda call passes inputProps
      // and we resize the composition to match the chosen format and total
      // scene duration.
      calculateMetadata={({ props }) => {
        const dims = FORMAT_DIMENSIONS[props.format] ?? FORMAT_DIMENSIONS["9:16"];
        const totalSec = props.scenes.reduce((s, sc) => s + sc.durationSeconds, 0);
        return {
          durationInFrames: Math.max(1, Math.round(totalSec * FPS)),
          width: dims.width,
          height: dims.height,
          fps: FPS,
        };
      }}
    />
  );
};
