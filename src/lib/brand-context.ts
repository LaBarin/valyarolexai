// Shared helper: turns a saved BrandKit into a short instruction block to
// prepend to AI prompts, so generated ads/decks/campaigns automatically
// reflect the user's saved brand identity.
import type { BrandKit } from "@/hooks/useBrandKit";

export function brandContextBlock(kit: BrandKit | null | undefined): string {
  if (!kit) return "";
  const lines: string[] = [];
  if (kit.business_name) lines.push(`Business name: ${kit.business_name}`);
  if (kit.slogan) lines.push(`Tagline: ${kit.slogan}`);
  if (kit.website) lines.push(`Website: ${kit.website}`);
  if (kit.phone) lines.push(`Phone: ${kit.phone}`);
  if (kit.email) lines.push(`Email: ${kit.email}`);
  if (kit.address) lines.push(`Address: ${kit.address}`);
  if (kit.default_cta) lines.push(`Preferred CTA text: "${kit.default_cta}"`);
  const colors = [kit.primary_color, kit.secondary_color, kit.accent_color]
    .filter(Boolean) as string[];
  if (colors.length) lines.push(`Brand colors: ${colors.join(", ")}`);
  if (kit.heading_font || kit.body_font) {
    lines.push(`Brand fonts: heading=${kit.heading_font || "default"}, body=${kit.body_font || "default"}`);
  }
  if (kit.default_music_mood) lines.push(`Preferred music mood: ${kit.default_music_mood}`);
  if (!lines.length) return "";
  return `\n\n[BRAND CONTEXT — apply consistently across all output]\n${lines.join("\n")}\n[/BRAND CONTEXT]\n`;
}

/** Pick the first non-empty value, useful for defaulting to brand kit values. */
export function pickFirst<T>(...vals: (T | null | undefined | "")[]): T | undefined {
  for (const v of vals) if (v !== null && v !== undefined && v !== "") return v as T;
  return undefined;
}
