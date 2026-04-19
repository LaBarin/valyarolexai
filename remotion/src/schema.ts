import { z } from "zod";

/** A single storyboard scene rendered as one segment of the video. */
export const SceneSchema = z.object({
  imageUrl: z.string().url(),
  durationSeconds: z.number().min(0.5).max(60),
  textOverlay: z.string().optional().default(""),
  /** Per-scene Ken-Burns style animation. */
  animation: z
    .enum(["none", "zoom-in", "zoom-out", "pan-left", "pan-right", "pan-up", "ken-burns", "fade-pulse"])
    .optional()
    .default("none"),
});

export const ClosingCardSchema = z
  .object({
    clientLogoUrl: z.string().url().optional().nullable(),
    referenceLogoUrl: z.string().url().optional().nullable(),
    companyName: z.string().optional().default(""),
    website: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    address: z.string().optional().default(""),
    poweredByLabel: z.string().optional().default("Powered by"),
  })
  .optional()
  .nullable();

export const BrandFooterSchema = z
  .object({
    website: z.string().optional().default(""),
    phone: z.string().optional().default(""),
  })
  .optional()
  .nullable();

export const AdVideoSchema = z.object({
  format: z.enum(["9:16", "1:1", "16:9", "4:3"]).default("9:16"),
  scenes: z.array(SceneSchema).min(1).max(40),
  voiceoverUrl: z.string().url().optional().nullable(),
  musicUrl: z.string().url().optional().nullable(),
  voiceoverVolume: z.number().min(0).max(1).default(1),
  musicVolume: z.number().min(0).max(1).default(0.25),
  brandFooter: BrandFooterSchema,
  closingCard: ClosingCardSchema,
});

export type AdVideoProps = z.infer<typeof AdVideoSchema>;
export type Scene = z.infer<typeof SceneSchema>;

export const FORMAT_DIMENSIONS: Record<AdVideoProps["format"], { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
  "4:3": { width: 1440, height: 1080 },
};

export const FPS = 30;
