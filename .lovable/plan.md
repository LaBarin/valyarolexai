# Lengthen the Music Library

## Goal
Expand the curated royalty-free music library from 18 tracks to 40+ tracks across all mood categories.

## Plan

### Step 1 — Expand the seed-curated-music edge function
Replace the existing 18-track `TRACKS` array in `supabase/functions/seed-curated-music/index.ts` with 40+ hand-picked royalty-free tracks from Pixabay and Mixkit, covering all moods: upbeat, cinematic, corporate, chill, dramatic, tech, acoustic.

### Step 2 — Database migration to insert missing tracks
Create a migration that inserts every track from the expanded list into `audio_tracks` as curated rows, skipping any that already exist by `storage_path`. This ensures the UI can display them immediately without waiting for the owner to run the seed function.

### Step 3 — Deploy edge function
Deploy the updated `seed-curated-music` edge function so owner-triggered re-seeds include the new tracks.

## Technical details
- All tracks are royalty-free (Pixabay / Mixkit), free for commercial use, no attribution required.
- The edge function uploads files to `audio-assets/curated/` and updates `duration_seconds` on the matching `audio_tracks` row.
- The migration inserts rows with correct `name`, `artist`, `mood`, `storage_path`, `duration_seconds`, `is_curated = true`, and `license = 'Pixabay'`.
- Mood mapping is explicit per track so the filter tabs in `MusicLibrary` work correctly.
