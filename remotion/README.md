# Valyarolex.AI Remotion Compositions

This folder is a self-contained Remotion project. It is **not** part of the Vite app build — it lives in the repo so the video composition is version-controlled alongside the rest of the product. The actual rendering happens on **Remotion Lambda** (AWS), which is invoked by the `render-video-lambda` Supabase Edge Function.

## One-time AWS setup

Run these on your local machine (Node 18+ required):

```bash
cd remotion
npm install

# 1. Configure AWS credentials in your shell (Remotion CLI reads them from the env)
export REMOTION_AWS_ACCESS_KEY_ID=AKIA...
export REMOTION_AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1   # or your preferred region

# 2. Deploy the Lambda function (idempotent, ~2 minutes)
npx remotion lambda functions deploy
#   -> prints functionName, e.g. remotion-render-4-0-250-mem2048mb-disk2048mb-120sec

# 3. Bundle this composition and upload it to S3 as a "site"
npx remotion lambda sites create src/index.ts --site-name=valyarolex-ads
#   -> prints serveUrl, e.g. https://remotionlambda-useast1-xxx.s3.us-east-1.amazonaws.com/sites/valyarolex-ads/index.html

# 4. Whenever you change the composition (any file in src/), redeploy the site:
npx remotion lambda sites create src/index.ts --site-name=valyarolex-ads
```

After step 4 the Lovable backend already knows the new code — the Edge Function just calls Lambda with the existing `serveUrl` and Lambda fetches the latest bundle from S3.

## Required Lovable secrets

Add these in **Lovable Cloud → Backend → Secrets**:

| Secret | Value |
|---|---|
| `REMOTION_AWS_ACCESS_KEY_ID` | from step 1 |
| `REMOTION_AWS_SECRET_ACCESS_KEY` | from step 1 |
| `REMOTION_AWS_REGION` | e.g. `us-east-1` |
| `REMOTION_LAMBDA_FUNCTION_NAME` | from step 2 output |
| `REMOTION_SERVE_URL` | from step 3 output |

## Local preview while iterating

```bash
npm run dev         # opens Remotion Studio at http://localhost:3000
npm run render:local # renders a sample MP4 to ./out/test.mp4
```

## Composition contract

The composition `id` is **`AdVideo`** and it accepts the props described in
[`src/schema.ts`](./src/schema.ts) (validated with Zod). The Edge Function builds
this exact shape from the user's `video_projects` row.
