import {
  Wrench,
  Home,
  Car,
  UtensilsCrossed,
  Building2,
  Dumbbell,
  Scissors,
  Smile,
  Scale,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type VerticalTemplate = {
  id: string;
  name: string;
  industry: string;
  icon: LucideIcon;
  /** Color tint for the card. */
  accent: string;
  /** Pre-filled AI prompt (the user can still edit). */
  prompt: string;
  /** Suggested CTA. */
  cta: string;
  /** Suggested ad style (id matching AD_TEMPLATES). */
  styleId: string;
  /** Suggested preset (id matching AD_PRESETS). */
  presetId: string;
  /** Suggested music mood. */
  mood: string;
};

/**
 * 10 industry-specific starter templates. One click pre-fills a complete
 * brief — prompt, CTA, ad style, format/duration, and music mood — so
 * non-creative users can ship a relevant ad without thinking about format.
 */
export const VERTICAL_TEMPLATES: VerticalTemplate[] = [
  {
    id: "vert-plumbing",
    name: "Emergency Plumber",
    industry: "Plumbing",
    icon: Wrench,
    accent: "from-blue-500/20 to-cyan-500/10",
    prompt:
      "Create a 30-second local ad for a 24/7 emergency plumber. Open with a burst pipe disaster, cut to a fast response van arriving, show a friendly licensed plumber fixing it, end with phone number, service area, and 'No overtime fees' badge.",
    cta: "Call Now — 24/7 Service",
    styleId: "live-broadcast",
    presetId: "tv-spot-30",
    mood: "energetic",
  },
  {
    id: "vert-roofing",
    name: "Roofing Contractor",
    industry: "Roofing",
    icon: Home,
    accent: "from-orange-500/20 to-amber-500/10",
    prompt:
      "Create a 30-second roofing ad. Show storm damage drone shots, then a professional crew completing a clean re-roof, finish with 'Free inspection + insurance claim help' and a strong local CTA.",
    cta: "Book Free Inspection",
    styleId: "live-lifestyle",
    presetId: "youtube-30",
    mood: "cinematic",
  },
  {
    id: "vert-dealership",
    name: "Auto Dealership",
    industry: "Automotive",
    icon: Car,
    accent: "from-red-500/20 to-rose-500/10",
    prompt:
      "Create a high-energy 15-second car dealership ad highlighting a monthly sales event. Show 3 vehicles with on-screen pricing badges, financing offer, and end-of-month urgency.",
    cta: "Shop the Sale",
    styleId: "kinetic-rhythm",
    presetId: "youtube-pre-15",
    mood: "energetic",
  },
  {
    id: "vert-restaurant",
    name: "Restaurant / Cafe",
    industry: "Food & Beverage",
    icon: UtensilsCrossed,
    accent: "from-yellow-500/20 to-orange-500/10",
    prompt:
      "Create a 15-second mouth-watering restaurant ad. Slow-motion food shots, happy diners, kitchen action, end with location and 'Order online or walk in' CTA.",
    cta: "Order Now",
    styleId: "ugc-tutorial",
    presetId: "tiktok-15",
    mood: "uplifting",
  },
  {
    id: "vert-realestate",
    name: "Real Estate Listing",
    industry: "Real Estate",
    icon: Building2,
    accent: "from-emerald-500/20 to-teal-500/10",
    prompt:
      "Create a 30-second luxury home listing ad. Smooth drone exterior, walk-through key rooms with on-screen specs (beds/baths/sqft), neighborhood highlights, agent contact, and 'Schedule a showing' CTA.",
    cta: "Schedule a Showing",
    styleId: "minimal-luxe",
    presetId: "ig-square-30",
    mood: "cinematic",
  },
  {
    id: "vert-fitness",
    name: "Gym / Fitness Studio",
    industry: "Fitness",
    icon: Dumbbell,
    accent: "from-violet-500/20 to-fuchsia-500/10",
    prompt:
      "Create a 15-second high-energy gym promo. Quick cuts of members training, transformations, group classes, end with new-member offer and limited-time CTA.",
    cta: "Claim 7-Day Free Pass",
    styleId: "split-cut",
    presetId: "tiktok-15",
    mood: "energetic",
  },
  {
    id: "vert-salon",
    name: "Hair / Beauty Salon",
    industry: "Beauty",
    icon: Scissors,
    accent: "from-pink-500/20 to-rose-500/10",
    prompt:
      "Create a 15-second salon ad. Before/after transformations, satisfied clients, ambient salon shots, end with booking link and seasonal offer.",
    cta: "Book Your Appointment",
    styleId: "luxury-fashion",
    presetId: "ig-square-15",
    mood: "uplifting",
  },
  {
    id: "vert-dentist",
    name: "Dental Practice",
    industry: "Healthcare",
    icon: Smile,
    accent: "from-sky-500/20 to-blue-500/10",
    prompt:
      "Create a 30-second friendly dental practice ad. Clean modern office, smiling patients, gentle dentist intro, mention insurance accepted and new patient special, end with clear contact info.",
    cta: "Book a Cleaning",
    styleId: "live-testimonial",
    presetId: "youtube-30",
    mood: "calm",
  },
  {
    id: "vert-lawyer",
    name: "Law Firm",
    industry: "Legal Services",
    icon: Scale,
    accent: "from-slate-500/20 to-zinc-500/10",
    prompt:
      "Create a 30-second authoritative law firm ad targeting injury / accident clients. Confident attorney intro, courthouse exterior, key wins/results stats, free consultation offer, and a clear phone CTA.",
    cta: "Free Case Evaluation",
    styleId: "live-broadcast",
    presetId: "tv-spot-30",
    mood: "cinematic",
  },
  {
    id: "vert-ecom",
    name: "E-commerce Product",
    industry: "Retail / DTC",
    icon: ShoppingBag,
    accent: "from-indigo-500/20 to-purple-500/10",
    prompt:
      "Create a 15-second product ad for an online store. Product hero shot, 3 key benefits with kinetic text, social proof, end with discount code and 'Shop now' CTA.",
    cta: "Shop Now — 20% Off",
    styleId: "product-spin",
    presetId: "tiktok-15",
    mood: "energetic",
  },
];
