ALTER TABLE public.marketing_campaigns
  ADD COLUMN share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Allow public (unauthenticated) read access via share_token
CREATE POLICY "Anyone can view shared campaigns"
  ON public.marketing_campaigns
  FOR SELECT
  TO anon, authenticated
  USING (share_token IS NOT NULL);
