

# Plan: Make Video Studio Produce Real Downloadable/Shareable Videos

## Problem
The Video Studio only generates static images per scene. There is no actual video file produced -- nothing to download or share as a real video. The share link shows a slideshow, not a video.

## Solution
Use the browser's **Canvas API + MediaRecorder** to stitch generated scene images into a real `.webm` video file that can be downloaded and shared.

## Changes

### 1. Create a video rendering utility (`src/lib/render-video.ts`)
- Takes an ordered list of scene image URLs and durations
- Draws each image onto a `<canvas>` element at the correct aspect ratio (9:16, 1:1, 16:9)
- Uses `canvas.captureStream()` + `MediaRecorder` to record frames into a WebM video blob
- Applies simple cross-fade transitions between scenes by alpha-blending
- Returns a downloadable `Blob`

### 2. Update `VideoStudio.tsx` -- Add "Export Video" button
- Add an "Export Video" button in the project detail view (next to Share button)
- Only enabled when all scenes have generated images
- Shows progress indicator during rendering
- On completion, triggers browser download of the `.webm` file
- Also add a "Download All Images" button that zips scene images (fallback for users who want stills)

### 3. Update `VideoStudio.tsx` -- Fix Share flow
- When sharing, if a video blob has been rendered, store the video in backend file storage so the share link can serve it
- Create a `video-exports` storage bucket for persisting rendered videos
- Update the share page to play the actual video file via `<video>` tag when available, falling back to the current slideshow

### 4. Update `SharedVideo.tsx` -- Play real video
- Check if a rendered video URL exists on the project data
- If yes, show a `<video>` player with download button
- If no, fall back to current slideshow behavior

### 5. Database migration
- Add `exported_video_url` text column to `video_projects` table (nullable)
- Update `get_shared_video` RPC to include this column

### 6. Storage bucket
- Create `video-exports` bucket via migration
- RLS: authenticated users can upload to their own path; public read for shared videos

## Technical Notes
- `MediaRecorder` with `video/webm; codecs=vp9` is supported in all modern browsers
- Canvas resolution will match the aspect ratio: 1080x1920 (9:16), 1080x1080 (1:1), 1920x1080 (16:9)
- Cross-origin images (from AI generation) need to be fetched as blobs first to avoid canvas tainting
- Rendering happens client-side, no server cost
- Video file sizes will be modest (scenes are static images, ~1-5MB typical)

