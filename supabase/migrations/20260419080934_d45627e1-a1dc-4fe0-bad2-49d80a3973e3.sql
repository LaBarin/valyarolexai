-- Replace the broad public SELECT on storage.objects with a stricter policy:
-- Only allow reading curated/* (public library) or files inside the user's own folder.
DROP POLICY IF EXISTS "Public read audio" ON storage.objects;

CREATE POLICY "Read curated or own audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-assets'
    AND (
      (storage.foldername(name))[1] = 'curated'
      OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    )
  );

-- Keep the bucket private at the listing level
UPDATE storage.buckets SET public = false WHERE id = 'audio-assets';