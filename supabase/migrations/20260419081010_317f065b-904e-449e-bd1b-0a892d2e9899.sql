CREATE POLICY "Users update own tracks"
  ON public.audio_tracks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_curated = false)
  WITH CHECK (user_id = auth.uid() AND is_curated = false);

CREATE POLICY "Users update own audio files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audio-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'audio-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );