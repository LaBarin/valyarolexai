
-- Pitch decks table
CREATE TABLE public.pitch_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Deck',
  description text,
  theme jsonb DEFAULT '{"primaryColor":"#00d4ff","fontFamily":"Space Grotesk","bgStyle":"dark"}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own decks" ON public.pitch_decks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own decks" ON public.pitch_decks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decks" ON public.pitch_decks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own decks" ON public.pitch_decks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_pitch_decks_updated_at BEFORE UPDATE ON public.pitch_decks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pitch deck slides table
CREATE TABLE public.pitch_deck_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.pitch_decks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  slide_order integer NOT NULL DEFAULT 0,
  slide_type text NOT NULL DEFAULT 'content',
  title text,
  content jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_deck_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own slides" ON public.pitch_deck_slides FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own slides" ON public.pitch_deck_slides FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slides" ON public.pitch_deck_slides FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own slides" ON public.pitch_deck_slides FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_pitch_deck_slides_updated_at BEFORE UPDATE ON public.pitch_deck_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Marketing campaigns table
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  campaign_type text NOT NULL DEFAULT 'general',
  target_audience text,
  goals jsonb DEFAULT '[]'::jsonb,
  channels jsonb DEFAULT '[]'::jsonb,
  content_plan jsonb DEFAULT '[]'::jsonb,
  assets jsonb DEFAULT '[]'::jsonb,
  schedule jsonb DEFAULT '{}'::jsonb,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns" ON public.marketing_campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own campaigns" ON public.marketing_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.marketing_campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.marketing_campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
