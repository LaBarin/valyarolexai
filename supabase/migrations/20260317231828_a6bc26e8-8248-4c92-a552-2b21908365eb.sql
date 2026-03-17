
-- Make video-exports bucket private
UPDATE storage.buckets SET public = false WHERE id = 'video-exports';

-- Drop existing overly-permissive SELECT policy
DROP POLICY IF EXISTS "Public read access for video exports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload video exports" ON storage.objects;

-- Scoped SELECT: only owners can read their own exports
CREATE POLICY "Owners can read own video exports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'video-exports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Scoped INSERT: only owners can upload to their own folder
CREATE POLICY "Owners can upload own video exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'video-exports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Scoped UPDATE: only owners can update their own exports
CREATE POLICY "Owners can update own video exports"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'video-exports'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'video-exports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: owners can delete their own exports
CREATE POLICY "Owners can delete own video exports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'video-exports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
