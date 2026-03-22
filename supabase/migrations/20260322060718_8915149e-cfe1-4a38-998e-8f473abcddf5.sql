-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Owners can read own video exports" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload video exports" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete own video exports" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access video exports" ON storage.objects;

-- Re-create owner-scoped policies
CREATE POLICY "Owners can upload video exports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'video-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can read own video exports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'video-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can delete own video exports"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'video-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Service role full access video exports"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'video-exports')
WITH CHECK (bucket_id = 'video-exports');