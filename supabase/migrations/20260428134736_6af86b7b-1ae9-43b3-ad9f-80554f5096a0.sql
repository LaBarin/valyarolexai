CREATE TABLE public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text,
  slogan text,
  website text,
  phone text,
  email text,
  address text,
  primary_color text DEFAULT '#00d4ff',
  secondary_color text DEFAULT '#0ea5e9',
  accent_color text DEFAULT '#f59e0b',
  heading_font text DEFAULT 'Space Grotesk',
  body_font text DEFAULT 'Inter',
  default_cta text DEFAULT 'Learn More',
  logo_path text,
  default_voice_id text,
  default_music_mood text DEFAULT 'cinematic',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand kit"
  ON public.brand_kits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand kit"
  ON public.brand_kits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kit"
  ON public.brand_kits FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand kit"
  ON public.brand_kits FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();