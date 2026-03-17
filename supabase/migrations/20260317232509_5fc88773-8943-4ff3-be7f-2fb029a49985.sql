-- Drop stale overly-permissive policies from the initial migration
DROP POLICY IF EXISTS "Public can read video exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own video exports" ON storage.objects;