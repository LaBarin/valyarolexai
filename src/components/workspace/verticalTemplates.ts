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
  Megaphone,
  Briefcase,
  Camera,
  Tv,
  Pizza,
  Film,
  Package,
  Plane,
  GraduationCap,
  Palette,
  Sparkles,
  Aperture,
  Clapperboard,
  Music2,
  Zap,
  FileText,
  BookOpen,
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
  {
    id: "vert-commercial",
    name: "Commercial Ad",
    industry: "Commercial",
    icon: Megaphone,
    accent: "from-cyan-500/20 to-blue-500/10",
    prompt:
      "Create a polished 30-second TV-style commercial. Open with an attention-grabbing hook, introduce the product/service with cinematic b-roll, highlight 3 key benefits with bold on-screen text, include a brief customer moment, and close with a strong brand logo lockup and clear CTA.",
    cta: "Learn More",
    styleId: "live-broadcast",
    presetId: "tv-spot-30",
    mood: "cinematic",
  },
  {
    id: "vert-professional",
    name: "Professional Services",
    industry: "Professional",
    icon: Briefcase,
    accent: "from-slate-500/20 to-blue-500/10",
    prompt:
      "Create a 30-second professional services ad (consulting, finance, B2B agency). Confident on-camera spokesperson, sleek office b-roll, 3 credibility points with clean kinetic text (clients served, years of experience, results delivered), end with a polished logo lockup and 'Schedule a consultation' CTA.",
    cta: "Schedule a Consultation",
    styleId: "minimal-luxe",
    presetId: "youtube-30",
    mood: "calm",
  },
  {
    id: "vert-ugc",
    name: "UGC Ads",
    industry: "Creator / UGC",
    icon: Camera,
    accent: "from-fuchsia-500/20 to-pink-500/10",
    prompt:
      "Create a 15-second UGC-style ad. Front-camera handheld feel, authentic creator talking to camera, quick cut to product in real use, on-screen captions with key benefit, end with relatable CTA.",
    cta: "Try It Today",
    styleId: "ugc-selfie",
    presetId: "tiktok-15",
    mood: "energetic",
  },
  {
    id: "vert-entertainment",
    name: "Entertainment",
    industry: "Entertainment",
    icon: Tv,
    accent: "from-purple-500/20 to-indigo-500/10",
    prompt:
      "Create a 30-second entertainment promo (show, event, streaming launch). High-energy montage of standout moments, kinetic title cards, hype voice-over beats, end with release date and platform lockup.",
    cta: "Watch Now",
    styleId: "kinetic-rhythm",
    presetId: "youtube-30",
    mood: "energetic",
  },
  {
    id: "vert-food",
    name: "Food",
    industry: "Food",
    icon: Pizza,
    accent: "from-amber-500/20 to-red-500/10",
    prompt:
      "Create a 15-second food ad. Slow-motion close-ups of the dish being prepared and plated, steam and texture details, satisfied first-bite reaction, end with brand logo and 'Order now' CTA.",
    cta: "Order Now",
    styleId: "ugc-tutorial",
    presetId: "ig-square-15",
    mood: "uplifting",
  },
  {
    id: "vert-montage",
    name: "Montage",
    industry: "Montage",
    icon: Film,
    accent: "from-zinc-500/20 to-slate-500/10",
    prompt:
      "Create a 30-second high-impact montage. Rapid-cut sequence of cinematic moments synced to a building music track, dynamic transitions and speed ramps, end on a strong final hero frame and logo.",
    cta: "See More",
    styleId: "split-cut",
    presetId: "youtube-30",
    mood: "cinematic",
  },
  {
    id: "vert-product-ads",
    name: "Product Ads",
    industry: "Product",
    icon: Package,
    accent: "from-teal-500/20 to-cyan-500/10",
    prompt:
      "Create a 15-second product ad. Crisp hero rotation of the product on a clean set, light sweeps highlighting key features with on-screen labels, social proof flash, end with discount badge and 'Shop now' CTA.",
    cta: "Shop Now",
    styleId: "product-spin",
    presetId: "ig-square-15",
    mood: "energetic",
  },
  {
    id: "vert-travel",
    name: "Travel & Landscapes",
    industry: "Travel",
    icon: Plane,
    accent: "from-sky-500/20 to-emerald-500/10",
    prompt:
      "Create a 30-second cinematic travel ad. Sweeping aerial drone shots of landscapes, hero traveler moments, cultural and food details, end with destination wordmark and 'Plan your trip' CTA.",
    cta: "Plan Your Trip",
    styleId: "minimal-luxe",
    presetId: "youtube-30",
    mood: "cinematic",
  },
  {
    id: "vert-explainer",
    name: "Explainer",
    industry: "Explainer",
    icon: GraduationCap,
    accent: "from-blue-500/20 to-indigo-500/10",
    prompt:
      "Create a 30-second explainer video. Clear problem setup, simple step-by-step solution with on-screen captions and UI/diagram visuals, friendly voice-over tone, end with 'Get started' CTA.",
    cta: "Get Started",
    styleId: "explainer-screen",
    presetId: "youtube-30",
    mood: "calm",
  },
  {
    id: "vert-animated",
    name: "Animated",
    industry: "Animation",
    icon: Palette,
    accent: "from-pink-500/20 to-violet-500/10",
    prompt:
      "Create a 30-second animated motion-graphics ad. Bold flat 2D shapes and characters, kinetic typography, vibrant color transitions synced to upbeat music, end with brand logo lockup.",
    cta: "Discover More",
    styleId: "anim-mograph",
    presetId: "youtube-30",
    mood: "uplifting",
  },
  {
    id: "vert-anime",
    name: "Anime",
    industry: "Anime",
    icon: Sparkles,
    accent: "from-rose-500/20 to-purple-500/10",
    prompt:
      "Create a 30-second anime-styled promo. Cel-shaded characters with expressive eyes, dynamic action poses, dramatic speed lines and impact frames, Japanese-style title reveal, end with logo and tagline.",
    cta: "Watch the Story",
    styleId: "anim-cartoon",
    presetId: "tiktok-30",
    mood: "energetic",
  },
  {
    id: "vert-realistic",
    name: "Realistic",
    industry: "Realistic",
    icon: Aperture,
    accent: "from-stone-500/20 to-neutral-500/10",
    prompt:
      "Create a 30-second photorealistic ad. Natural lighting, real-world locations, believable human moments shot documentary-style, subtle camera movement, end with brand wordmark and quiet CTA.",
    cta: "Learn More",
    styleId: "live-lifestyle",
    presetId: "youtube-30",
    mood: "cinematic",
  },
  {
    id: "vert-cinematic",
    name: "Cinematic",
    industry: "Cinematic",
    icon: Clapperboard,
    accent: "from-amber-500/20 to-orange-500/10",
    prompt:
      "Create a 30-second cinematic trailer-style ad. Anamorphic widescreen feel, dramatic lighting, slow push-in hero shots, building orchestral music, title card reveal, end with date or CTA lockup.",
    cta: "Experience It",
    styleId: "3d-cinematic",
    presetId: "tv-spot-30",
    mood: "cinematic",
  },
  {
    id: "vert-music",
    name: "Music",
    industry: "Music",
    icon: Music2,
    accent: "from-violet-500/20 to-fuchsia-500/10",
    prompt:
      "Create a 30-second music-driven promo. Lyric-style kinetic typography synced to the beat, performance and crowd energy clips, color-graded visuals matching the track mood, end with artist/track name lockup.",
    cta: "Listen Now",
    styleId: "kinetic-rhythm",
    presetId: "youtube-30",
    mood: "energetic",
  },
];
