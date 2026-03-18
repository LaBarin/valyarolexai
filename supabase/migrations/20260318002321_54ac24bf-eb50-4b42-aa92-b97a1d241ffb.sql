
-- Add share_token to pitch_decks
ALTER TABLE public.pitch_decks ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

-- Create RPC to get shared pitch deck (no auth needed)
CREATE OR REPLACE FUNCTION public.get_shared_deck(p_share_token text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  theme jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  slides jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.title,
    d.description,
    d.theme,
    d.created_at,
    d.updated_at,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'slide_type', s.slide_type,
          'title', s.title,
          'content', s.content,
          'notes', s.notes,
          'slide_order', s.slide_order
        ) ORDER BY s.slide_order
      )
      FROM public.pitch_deck_slides s WHERE s.deck_id = d.id),
      '[]'::jsonb
    ) AS slides
  FROM public.pitch_decks d
  WHERE d.share_token = p_share_token
  LIMIT 1;
$$;
