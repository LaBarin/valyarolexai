// Owner-only edge function. Generates a fresh curated music library using the
// ElevenLabs Music API, uploads each MP3 to audio-assets/curated-eleven/, and
// replaces the curated rows in the audio_tracks table.
//
// Run from the owner account via: supabase.functions.invoke("seed-elevenlabs-music")
// Optional body: { only?: string[] } to re-seed a subset by name.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { isOwnerEmail } from "../_shared/owner.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SeedTrack = {
  name: string;
  mood: string;
  prompt: string;
  duration: number; // seconds
};

const TRACKS: SeedTrack[] = [
  // ── Acoustic (20)
  { name: "Acoustic Morning",        mood: "acoustic",  duration: 45, prompt: "Warm acoustic guitar, soft hand percussion, gentle morning vibe, optimistic and intimate, no vocals" },
  { name: "Acoustic Sunrise",        mood: "acoustic",  duration: 45, prompt: "Fingerpicked acoustic guitar, soft ukulele, light shaker, hopeful sunrise feel, instrumental" },
  { name: "Folk Campfire",           mood: "acoustic",  duration: 45, prompt: "Folk acoustic guitar with banjo and stomps, friendly and rustic, indie folk style, no vocals" },
  { name: "Coffee Shop Strum",       mood: "acoustic",  duration: 45, prompt: "Mellow acoustic guitar strumming, light brushes on snare, warm cafe ambience, instrumental" },
  { name: "Country Road",            mood: "acoustic",  duration: 45, prompt: "Country acoustic with slide guitar, gentle drums, easygoing road-trip feel, instrumental" },
  { name: "Whistle and Strings",     mood: "acoustic",  duration: 30, prompt: "Cheerful whistle melody over acoustic guitar and claps, indie commercial feel, no vocals" },
  { name: "Mountain Breeze",         mood: "acoustic",  duration: 45, prompt: "Acoustic guitar and mandolin, soft strings, fresh outdoor mountain feel, instrumental" },
  { name: "Indie Folk Stomp",        mood: "acoustic",  duration: 30, prompt: "Indie folk with foot stomps, claps, acoustic guitar, anthemic and uplifting, no vocals" },
  { name: "Wooden Porch",            mood: "acoustic",  duration: 45, prompt: "Slow acoustic guitar with harmonica, dusty Americana porch vibe, instrumental" },
  { name: "Ukulele Sunshine",        mood: "acoustic",  duration: 30, prompt: "Bright ukulele, claps, glockenspiel, happy travel commercial feel, instrumental" },
  { name: "Fingerstyle Reflection",  mood: "acoustic",  duration: 60, prompt: "Solo fingerstyle acoustic guitar, contemplative and warm, gentle reverb, instrumental" },
  { name: "Banjo Adventure",         mood: "acoustic",  duration: 30, prompt: "Energetic banjo and acoustic guitar, foot stomps, adventurous bluegrass feel, instrumental" },
  { name: "Soft Hymn",               mood: "acoustic",  duration: 60, prompt: "Gentle acoustic guitar with cello and piano, hymn-like and peaceful, instrumental" },
  { name: "Beach Day Acoustic",      mood: "acoustic",  duration: 45, prompt: "Sunny ukulele, acoustic guitar, light percussion, carefree beach day, instrumental" },
  { name: "Front Porch Folk",        mood: "acoustic",  duration: 45, prompt: "Easygoing folk with acoustic guitar, mandolin, brushed drums, no vocals" },
  { name: "Rainy Window",            mood: "acoustic",  duration: 60, prompt: "Soft fingerpicked guitar with rain ambience and gentle piano, melancholic and warm, instrumental" },
  { name: "Hopeful Strum",           mood: "acoustic",  duration: 30, prompt: "Bright strummed acoustic guitar, claps, hopeful indie commercial feel, no vocals" },
  { name: "Sunlit Mandolin",         mood: "acoustic",  duration: 30, prompt: "Mandolin lead with acoustic guitar, light percussion, joyful and bright, instrumental" },
  { name: "Quiet Cabin",             mood: "acoustic",  duration: 60, prompt: "Quiet acoustic fingerstyle with soft strings, cabin-in-the-woods stillness, instrumental" },
  { name: "Travel Diary",            mood: "acoustic",  duration: 45, prompt: "Acoustic guitar, ukulele, claps and whistles, indie travel vlog feel, instrumental" },

  // ── Cinematic (20)
  { name: "Cinematic Rise",          mood: "cinematic", duration: 45, prompt: "Cinematic orchestral build, swelling strings, soft piano, hopeful crescendo, no vocals" },
  { name: "Cinematic Trailer",       mood: "cinematic", duration: 45, prompt: "Epic orchestral trailer, dramatic strings, heroic brass, pulsing percussion, instrumental" },
  { name: "Soft Piano",              mood: "cinematic", duration: 60, prompt: "Solo piano, slow and emotive, gentle reverb, intimate and reflective, instrumental" },
  { name: "Hybrid Score",            mood: "cinematic", duration: 45, prompt: "Hybrid cinematic score, orchestral strings layered with synth pads, modern blockbuster feel, no vocals" },
  { name: "Heroic Journey",          mood: "cinematic", duration: 45, prompt: "Sweeping orchestral adventure, soaring strings, French horns, triumphant and emotive, instrumental" },
  { name: "Mystery Reveal",          mood: "cinematic", duration: 45, prompt: "Cinematic mystery cue, pizzicato strings, soft piano, suspenseful build, instrumental" },
  { name: "Documentary Open",        mood: "cinematic", duration: 45, prompt: "Reflective cinematic underscore, piano, soft strings, documentary opening feel, instrumental" },
  { name: "Inspiring Strings",       mood: "cinematic", duration: 45, prompt: "Inspiring cinematic strings with piano and gentle percussion, hopeful and grand, instrumental" },
  { name: "Emotional Piano",         mood: "cinematic", duration: 60, prompt: "Emotional piano with cello and soft pads, bittersweet and cinematic, instrumental" },
  { name: "Time Lapse Score",        mood: "cinematic", duration: 30, prompt: "Pulsing cinematic time-lapse, arpeggiated piano, soft strings, modern and elegant, instrumental" },
  { name: "Wonder of Nature",        mood: "cinematic", duration: 45, prompt: "Lush cinematic nature documentary score, strings, harp, woodwinds, awe and wonder, instrumental" },
  { name: "Hero Reveal",             mood: "cinematic", duration: 30, prompt: "Triumphant cinematic reveal, brass swell, big drums, climactic and heroic, instrumental" },
  { name: "Quiet Strength",          mood: "cinematic", duration: 60, prompt: "Slow cinematic build, piano, swelling strings, dignified and emotive, instrumental" },
  { name: "Ethereal Choir",          mood: "cinematic", duration: 45, prompt: "Ethereal cinematic choir with strings and soft percussion, otherworldly, instrumental" },
  { name: "Memory Lane",             mood: "cinematic", duration: 60, prompt: "Nostalgic cinematic piano with strings and music box, tender and reflective, instrumental" },
  { name: "Cosmic Drift",            mood: "cinematic", duration: 60, prompt: "Cinematic space drift, slow synth pads, soft piano, awe-inspiring and dreamy, instrumental" },
  { name: "Hopeful Horizon",         mood: "cinematic", duration: 45, prompt: "Cinematic uplifting score, piano, strings, gentle percussion, hopeful horizon feel, instrumental" },
  { name: "Final Stand",             mood: "cinematic", duration: 45, prompt: "Climactic cinematic score, full orchestra, big percussion, heroic resolution, instrumental" },
  { name: "Tender Goodbye",          mood: "cinematic", duration: 60, prompt: "Slow emotional piano with strings, bittersweet farewell mood, instrumental" },
  { name: "Symphonic Sunrise",       mood: "cinematic", duration: 45, prompt: "Orchestral sunrise, strings, harp, French horn, optimistic cinematic build, instrumental" },

  // ── Corporate (20)
  { name: "Corporate Inspire",       mood: "corporate", duration: 45, prompt: "Uplifting corporate background, soft piano, warm strings, subtle four-on-the-floor beat, motivational, no vocals" },
  { name: "Startup Vibes",           mood: "corporate", duration: 30, prompt: "Modern startup background music, bright plucks, soft beat, optimistic and clean, instrumental" },
  { name: "Boardroom Confidence",    mood: "corporate", duration: 45, prompt: "Confident corporate track, smooth piano chords, light electronic beat, professional and modern, instrumental" },
  { name: "Innovation Day",          mood: "corporate", duration: 30, prompt: "Bright corporate motivational, marimba pluck, claps, uplifting tech-startup feel, no vocals" },
  { name: "Productivity Flow",       mood: "corporate", duration: 45, prompt: "Steady corporate groove, soft synth pads, focused beat, productive office vibe, instrumental" },
  { name: "Clean Pitch",             mood: "corporate", duration: 30, prompt: "Clean modern corporate, plucky synth, light beat, perfect for product pitch video, instrumental" },
  { name: "Business Forward",        mood: "corporate", duration: 45, prompt: "Forward-moving corporate, piano with steady drums and bass, professional and warm, instrumental" },
  { name: "Bright Strategy",         mood: "corporate", duration: 30, prompt: "Bright corporate explainer, marimba and acoustic guitar, optimistic and friendly, instrumental" },
  { name: "Modern Office",           mood: "corporate", duration: 45, prompt: "Modern open-office vibe, soft piano, gentle electronic beat, productive and bright, instrumental" },
  { name: "Quarterly Win",           mood: "corporate", duration: 30, prompt: "Triumphant corporate motivational, piano, claps, big build, success feel, instrumental" },
  { name: "Founder's Note",          mood: "corporate", duration: 45, prompt: "Warm sincere corporate, piano, soft strings, light percussion, founder story tone, instrumental" },
  { name: "Whiteboard Session",      mood: "corporate", duration: 30, prompt: "Light corporate explainer, marimba, ukulele, light percussion, friendly and clear, instrumental" },
  { name: "Roadmap Reveal",          mood: "corporate", duration: 45, prompt: "Building corporate motivational, piano, synth pluck, swelling strings, ambitious roadmap feel, instrumental" },
  { name: "Trusted Partner",         mood: "corporate", duration: 45, prompt: "Reassuring corporate, piano, warm strings, gentle drums, trustworthy and stable, instrumental" },
  { name: "Quarter Review",          mood: "corporate", duration: 30, prompt: "Polished corporate underscore, soft piano with light beat, ideal for slide presentations, instrumental" },
  { name: "Growth Curve",            mood: "corporate", duration: 30, prompt: "Optimistic corporate track, plucks, claps, uplifting growth and success feel, instrumental" },
  { name: "Workshop Mood",           mood: "corporate", duration: 45, prompt: "Easygoing corporate, soft acoustic guitar, light electronic beat, collaborative workshop feel, instrumental" },
  { name: "Pitch Deck",              mood: "corporate", duration: 30, prompt: "Confident corporate pitch underscore, piano, strings, clean beat, polished and modern, instrumental" },
  { name: "Quiet Confidence",        mood: "corporate", duration: 45, prompt: "Reserved corporate, piano with subtle synth pads, calm professional confidence, instrumental" },
  { name: "Brand Story",             mood: "corporate", duration: 60, prompt: "Brand story corporate, piano, acoustic guitar, soft strings, sincere and uplifting, instrumental" },

  // ── Chill (20)
  { name: "Ambient Dream",           mood: "chill",     duration: 60, prompt: "Slow ambient pads, ethereal piano, gentle reverb, dreamy and reflective, instrumental" },
  { name: "Lofi Chill",              mood: "chill",     duration: 60, prompt: "Lofi hip-hop beat, mellow electric piano, vinyl crackle, relaxing and warm, instrumental" },
  { name: "Meditation Calm",         mood: "chill",     duration: 60, prompt: "Calm meditation soundscape, soft pads, gentle bells, tranquil and spacious, no vocals" },
  { name: "Lofi Study",              mood: "chill",     duration: 60, prompt: "Chill lofi study beat, jazzy keys, mellow boom-bap drums, cozy and focused, instrumental" },
  { name: "Sunday Morning",          mood: "chill",     duration: 45, prompt: "Slow chill groove, soft Rhodes, brushed drums, lazy weekend feel, instrumental" },
  { name: "Beach Sunset",            mood: "chill",     duration: 45, prompt: "Tropical chill house, soft marimba, mellow beat, sunset beach vibe, instrumental" },
  { name: "Late Night Drive",        mood: "chill",     duration: 60, prompt: "Chillwave late-night drive, soft synth pads, mellow beat, neon-lit calm, instrumental" },
  { name: "Forest Bath",             mood: "chill",     duration: 60, prompt: "Ambient nature soundscape, soft pads with bird ambience, deeply relaxing, instrumental" },
  { name: "Spa Float",               mood: "chill",     duration: 60, prompt: "Spa relaxation, soft piano, gentle pads, water ambience, peaceful, instrumental" },
  { name: "Sleepy Piano",            mood: "chill",     duration: 60, prompt: "Soft sleepy piano with subtle pads, lullaby-like, calming, instrumental" },
  { name: "Yoga Flow",               mood: "chill",     duration: 60, prompt: "Gentle yoga underscore, soft pads, hang drum, slow and grounding, instrumental" },
  { name: "Rainy Lofi",              mood: "chill",     duration: 60, prompt: "Lofi beat with rain ambience, mellow piano, cozy rainy day vibe, instrumental" },
  { name: "Soft Synthwave",          mood: "chill",     duration: 60, prompt: "Slow synthwave, warm analog pads, gentle beat, dreamy and nostalgic, instrumental" },
  { name: "Reading Nook",            mood: "chill",     duration: 60, prompt: "Soft jazzy lofi, brushed drums, electric piano, perfect reading background, instrumental" },
  { name: "Slow Ocean",              mood: "chill",     duration: 60, prompt: "Ambient ocean waves with soft pads and gentle piano, meditative, instrumental" },
  { name: "Twilight Pads",           mood: "chill",     duration: 60, prompt: "Slow ambient track, lush evolving pads, gentle bells, cinematic chill, instrumental" },
  { name: "Soft Bossa",              mood: "chill",     duration: 45, prompt: "Soft bossa nova, nylon guitar, brushed drums, mellow and breezy, instrumental" },
  { name: "Floating",                mood: "chill",     duration: 60, prompt: "Weightless ambient track, slow pads, soft piano notes, drifting and dreamy, instrumental" },
  { name: "Mellow Jazz",             mood: "chill",     duration: 45, prompt: "Mellow late-night jazz, upright bass, brushed drums, soft piano, instrumental" },
  { name: "Calm Focus",              mood: "chill",     duration: 60, prompt: "Calm focus underscore, slow pads, soft pluck, productive and spacious, instrumental" },

  // ── Upbeat (20)
  { name: "Dance Floor",             mood: "upbeat",    duration: 30, prompt: "Energetic electronic dance, four-on-the-floor kick, bright synths, festival vibe, instrumental" },
  { name: "Future Bass",             mood: "upbeat",    duration: 30, prompt: "Modern future bass, bright supersaw chords, snappy drums, feel-good and uplifting, instrumental" },
  { name: "Sunset Drive",            mood: "upbeat",    duration: 45, prompt: "Synthwave sunset drive, warm analog synths, steady drum machine, nostalgic and cinematic, instrumental" },
  { name: "Pop Anthem",              mood: "upbeat",    duration: 30, prompt: "Catchy pop anthem instrumental, big drums, bright synth lead, stadium energy, no vocals" },
  { name: "Tropical House",          mood: "upbeat",    duration: 45, prompt: "Tropical house, plucky synths, light percussion, summer party vibe, instrumental" },
  { name: "Indie Pop Drive",         mood: "upbeat",    duration: 30, prompt: "Indie pop with claps, bright guitar, driving beat, optimistic and feel-good, instrumental" },
  { name: "Funky Groove",            mood: "upbeat",    duration: 30, prompt: "Funky bassline, tight drums, rhythm guitar stabs, dance-floor ready, instrumental" },
  { name: "Summer Hit",              mood: "upbeat",    duration: 30, prompt: "Bright summer pop instrumental, plucky synth, claps, irresistible hook, no vocals" },
  { name: "Disco Lights",            mood: "upbeat",    duration: 30, prompt: "Modern nu-disco, slap bass, four-on-the-floor, glittery strings, dance-floor energy, instrumental" },
  { name: "Stadium Pop",             mood: "upbeat",    duration: 30, prompt: "Big stadium pop, anthemic synth lead, huge drums, celebratory feel, no vocals" },
  { name: "Latin Heat",              mood: "upbeat",    duration: 30, prompt: "Latin pop instrumental, rhythmic guitars, congas, brass stabs, hot summer party, no vocals" },
  { name: "Festival Drop",           mood: "upbeat",    duration: 30, prompt: "Big-room festival EDM, huge drop, bright synths, energetic crowd vibe, instrumental" },
  { name: "Happy Whistles",          mood: "upbeat",    duration: 30, prompt: "Cheerful upbeat track with whistles, ukulele, claps, advertising-friendly, instrumental" },
  { name: "Neon Pop",                mood: "upbeat",    duration: 30, prompt: "Neon synth-pop with bright chords, snappy drums, energetic and modern, instrumental" },
  { name: "Reggaeton Vibe",          mood: "upbeat",    duration: 30, prompt: "Reggaeton beat with bright synths and percussion, dance-pop energy, instrumental" },
  { name: "House Party",             mood: "upbeat",    duration: 30, prompt: "Energetic house track, four-on-the-floor, vocal chops, big party vibe, instrumental" },
  { name: "Bright Morning Pop",      mood: "upbeat",    duration: 30, prompt: "Bright happy pop, ukulele, plucks, claps, sunny commercial vibe, no vocals" },
  { name: "Workout Energy",          mood: "upbeat",    duration: 30, prompt: "High-energy workout pop, driving beat, big synth lead, motivating, instrumental" },
  { name: "Confetti",                mood: "upbeat",    duration: 30, prompt: "Joyful celebration track, claps, whistles, plucks, big drums, party feel, instrumental" },
  { name: "Afrobeat Sunshine",       mood: "upbeat",    duration: 30, prompt: "Afrobeats-inspired groove, bright percussion, plucky synths, sunny and danceable, instrumental" },

  // ── Dramatic (20)
  { name: "Action Beat",             mood: "dramatic",  duration: 30, prompt: "High-energy cinematic action drums, big toms, driving synth bass, blockbuster trailer feel, no vocals" },
  { name: "Epic Drama",              mood: "dramatic",  duration: 45, prompt: "Powerful cinematic drama, full orchestra, taiko drums, emotional and grand, no vocals" },
  { name: "Power Anthem",            mood: "dramatic",  duration: 30, prompt: "Powerful sport rock anthem, distorted electric guitars, big drums, energetic and triumphant, no vocals" },
  { name: "Battle March",            mood: "dramatic",  duration: 45, prompt: "Heavy cinematic battle march, taiko drums, brass swells, intense and heroic, instrumental" },
  { name: "Dark Tension",            mood: "dramatic",  duration: 45, prompt: "Dark suspense underscore, low pulses, dissonant strings, building tension, instrumental" },
  { name: "Trailer Hit",             mood: "dramatic",  duration: 30, prompt: "Big movie trailer hit, braams, percussion risers, climactic, instrumental" },
  { name: "Dystopian Pulse",         mood: "dramatic",  duration: 45, prompt: "Dark dystopian electronic track, throbbing bass, harsh synths, ominous, instrumental" },
  { name: "Sport Highlight",         mood: "dramatic",  duration: 30, prompt: "Energetic sport highlight rock, distorted guitars, big drums, victorious feel, instrumental" },
  { name: "Ominous Strings",         mood: "dramatic",  duration: 45, prompt: "Slow building dramatic strings, low brass, growing dread, cinematic, instrumental" },
  { name: "Hybrid Trailer",          mood: "dramatic",  duration: 45, prompt: "Hybrid trailer cue, orchestra meets distorted synths and big percussion, blockbuster, instrumental" },
  { name: "Rising Threat",           mood: "dramatic",  duration: 45, prompt: "Rising tension cue, ostinato strings, percussion build, suspense climax, instrumental" },
  { name: "Heavy Riff",              mood: "dramatic",  duration: 30, prompt: "Heavy guitar riff with big drums, aggressive cinematic rock, instrumental" },
  { name: "Cinematic Chase",         mood: "dramatic",  duration: 30, prompt: "Driving chase scene cue, fast strings, percussion, urgent and intense, instrumental" },
  { name: "Final Showdown",          mood: "dramatic",  duration: 45, prompt: "Climactic showdown, full orchestra, taiko, brass, dramatic confrontation, instrumental" },
  { name: "Apex Trailer",            mood: "dramatic",  duration: 45, prompt: "Modern hybrid trailer, hits, risers, deep braams, climactic blockbuster cue, instrumental" },
  { name: "Sinister Mood",           mood: "dramatic",  duration: 45, prompt: "Sinister underscore, low drones, dissonant piano, eerie and tense, instrumental" },
  { name: "War Drums",               mood: "dramatic",  duration: 45, prompt: "Heavy war drums and brass, tribal cinematic energy, instrumental" },
  { name: "Glory Run",               mood: "dramatic",  duration: 30, prompt: "Triumphant cinematic rock, big drums, soaring lead, victorious sport feel, instrumental" },
  { name: "Storm Approach",          mood: "dramatic",  duration: 45, prompt: "Approaching storm cue, low rumble, strings tremolo, building dread, instrumental" },
  { name: "Hero's Resolve",          mood: "dramatic",  duration: 45, prompt: "Heroic dramatic build, strings, brass, big percussion, determined and emotive, instrumental" },

  // ── Tech (20)
  { name: "Modern Tech",             mood: "tech",      duration: 30, prompt: "Modern tech house background, clean synth pluck, smooth bassline, sleek and minimal, instrumental" },
  { name: "Tech Pulse",              mood: "tech",      duration: 30, prompt: "Pulsing electronic tech track, arpeggiated synths, driving beat, futuristic and focused, instrumental" },
  { name: "Cyber Grid",              mood: "tech",      duration: 45, prompt: "Futuristic cyber grid soundtrack, digital arps, clean four-on-the-floor, sci-fi mood, instrumental" },
  { name: "AI Lab",                  mood: "tech",      duration: 45, prompt: "Minimal tech score, glitchy percussion, modular synth bleeps, cerebral and modern, instrumental" },
  { name: "Data Stream",             mood: "tech",      duration: 30, prompt: "Driving electronic tech, pulsing bass, crisp hi-hats, data-center innovation feel, instrumental" },
  { name: "Neon Circuit",            mood: "tech",      duration: 45, prompt: "Synthwave-tinged tech, neon lead synth, electronic drums, sleek modern product feel, instrumental" },
  { name: "Quantum Loop",            mood: "tech",      duration: 30, prompt: "Quantum tech vibe, fast arpeggios, deep bass, futuristic loop, instrumental" },
  { name: "Server Room",             mood: "tech",      duration: 45, prompt: "Mechanical tech track, ticking percussion, low pulse bass, industrial cool, instrumental" },
  { name: "Future Lab",              mood: "tech",      duration: 30, prompt: "Future lab electronic, plucky synths, glitch fx, optimistic innovation feel, instrumental" },
  { name: "Robotics",                mood: "tech",      duration: 30, prompt: "Robotic mechanical groove, metallic percussion, synth bass, precise and modern, instrumental" },
  { name: "Hologram",                mood: "tech",      duration: 45, prompt: "Holographic ambient tech, shimmering synths, soft beat, futuristic and clean, instrumental" },
  { name: "Smart City",              mood: "tech",      duration: 45, prompt: "Sleek tech house, minimal synth pluck, steady kick, modern smart-city vibe, instrumental" },
  { name: "Algorithm",               mood: "tech",      duration: 30, prompt: "Algorithmic tech, evolving arps, pulsing bass, focused and cerebral, instrumental" },
  { name: "Launch Sequence",         mood: "tech",      duration: 30, prompt: "Build-up tech track, rising arp, big kick, product launch energy, instrumental" },
  { name: "Cloud Ops",               mood: "tech",      duration: 45, prompt: "Clean tech background, soft synth pluck, light beat, SaaS explainer feel, instrumental" },
  { name: "Pixel Drift",             mood: "tech",      duration: 45, prompt: "Mellow electronic tech, pixel-style bleeps, smooth bass, modern indie tech feel, instrumental" },
  { name: "Crypto Pulse",            mood: "tech",      duration: 30, prompt: "Energetic tech with pulsing bass, crisp percussion, high-stakes fintech feel, instrumental" },
  { name: "Deep Network",            mood: "tech",      duration: 45, prompt: "Deep tech track, dark synth pads, driving bass, focused late-night coding vibe, instrumental" },
  { name: "Smart Pluck",             mood: "tech",      duration: 30, prompt: "Bright minimal tech, plucky lead, light hat, clean and modern explainer feel, instrumental" },
  { name: "Synthetic Mind",          mood: "tech",      duration: 45, prompt: "Cerebral electronic tech, arpeggiated synths, modular bleeps, AI-lab atmosphere, instrumental" },
];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const elevenKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!elevenKey) return json({ error: "ELEVENLABS_API_KEY not configured" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
  if (!isOwnerEmail(userData.user.email)) {
    return json({ error: "Owner access required" }, 403);
  }

  let only: string[] | null = null;
  let replace = true;
  try {
    const body = await req.json();
    if (Array.isArray(body?.only)) only = body.only;
    if (typeof body?.replace === "boolean") replace = body.replace;
  } catch { /* no body */ }

  const admin = createClient(supabaseUrl, serviceKey);
  const targets = only
    ? TRACKS.filter((t) => only!.includes(t.name))
    : TRACKS;

  // Optionally clear previous curated rows so the library reflects the new set
  if (replace && !only) {
    const { data: oldRows } = await admin
      .from("audio_tracks")
      .select("storage_path")
      .eq("is_curated", true);
    if (oldRows && oldRows.length > 0) {
      const paths = oldRows.map((r) => r.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await admin.storage.from("audio-assets").remove(paths).catch(() => {});
      }
      await admin.from("audio_tracks").delete().eq("is_curated", true);
    }
  }

  const results: { name: string; status: "uploaded" | "failed"; bytes?: number; error?: string }[] = [];

  for (const track of targets) {
    try {
      const elevenRes = await fetch("https://api.elevenlabs.io/v1/music", {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: track.prompt,
          music_length_ms: Math.min(300_000, track.duration * 1000),
        }),
      });
      if (!elevenRes.ok) {
        const errText = await elevenRes.text();
        results.push({ name: track.name, status: "failed", error: `eleven ${elevenRes.status}: ${errText.slice(0, 200)}` });
        continue;
      }
      const buf = new Uint8Array(await elevenRes.arrayBuffer());
      if (buf.byteLength < 1000) {
        results.push({ name: track.name, status: "failed", error: "empty audio" });
        continue;
      }

      const storagePath = `curated-eleven/${slug(track.name)}.mp3`;
      const { error: upErr } = await admin.storage
        .from("audio-assets")
        .upload(storagePath, buf, {
          contentType: "audio/mpeg",
          upsert: true,
          cacheControl: "3600",
        });
      if (upErr) {
        results.push({ name: track.name, status: "failed", error: upErr.message });
        continue;
      }

      // Upsert curated row
      await admin.from("audio_tracks").delete().eq("storage_path", storagePath);
      const { error: insErr } = await admin.from("audio_tracks").insert({
        name: track.name,
        artist: "ElevenLabs Music",
        mood: track.mood,
        storage_path: storagePath,
        duration_seconds: track.duration,
        is_curated: true,
        license: "ElevenLabs Generated",
        user_id: null,
      });
      if (insErr) {
        results.push({ name: track.name, status: "failed", error: insErr.message });
        continue;
      }

      results.push({ name: track.name, status: "uploaded", bytes: buf.byteLength });
    } catch (e) {
      results.push({ name: track.name, status: "failed", error: (e as Error).message });
    }
  }

  return json({
    summary: {
      total: targets.length,
      uploaded: results.filter((r) => r.status === "uploaded").length,
      failed: results.filter((r) => r.status === "failed").length,
    },
    results,
  });
});
