import { Check, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export type RenderStageKey =
  | "queued"
  | "planning"
  | "scenes"
  | "rendering"
  | "captions"
  | "finalizing"
  | "complete";

const STAGES: { key: RenderStageKey; label: string; hint: string }[] = [
  { key: "queued", label: "Queued", hint: "Submitting render job" },
  { key: "planning", label: "Planning", hint: "Preparing scene plan" },
  { key: "scenes", label: "Scenes", hint: "Generating scene visuals" },
  { key: "rendering", label: "Rendering", hint: "Compositing frames on Lambda" },
  { key: "captions", label: "Captions", hint: "Burning in captions & overlays" },
  { key: "finalizing", label: "Finalizing", hint: "Encoding MP4 & uploading" },
  { key: "complete", label: "Complete", hint: "Ready to download" },
];

interface Props {
  /** Current pipeline stage. */
  stage: RenderStageKey;
  /** 0–100 progress within the current stage (or overall). */
  progress?: number | null;
  /** Optional status message override. */
  message?: string;
  /** True if any failure occurred. */
  failed?: boolean;
}

/**
 * Visualizes the 7-stage render pipeline:
 * Queued → Planning → Scenes → Rendering → Captions → Finalizing → Complete
 */
export function RenderProgressTracker({ stage, progress, message, failed }: Props) {
  const currentIdx = STAGES.findIndex((s) => s.key === stage);
  const current = STAGES[currentIdx] ?? STAGES[0];

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        {failed ? (
          <Circle className="w-5 h-5 text-destructive" />
        ) : stage === "complete" ? (
          <Check className="w-5 h-5 text-green-400" />
        ) : (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">
            {failed ? "Render failed" : message || current.label}
          </h4>
          <p className="text-xs text-muted-foreground truncate">{current.hint}</p>
        </div>
        {typeof progress === "number" && (
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {Math.max(0, Math.min(100, Math.round(progress)))}%
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <Progress value={Math.max(0, Math.min(100, progress))} className="h-1.5" />
      )}

      <ol className="grid grid-cols-7 gap-1">
        {STAGES.map((s, i) => {
          const done = i < currentIdx || stage === "complete";
          const active = i === currentIdx && stage !== "complete";
          return (
            <li key={s.key} className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-semibold transition-colors",
                  done && "bg-primary border-primary text-primary-foreground",
                  active && "border-primary text-primary animate-pulse",
                  !done && !active && "border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[9px] leading-tight",
                  active ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Maps the existing autoRenderStage + MP4 polling state to a 7-stage key.
 * Heuristic — uses the status text from the render-video-lambda poller plus
 * the autoRender stage to pick the most descriptive stage.
 */
export function deriveRenderStage(opts: {
  autoStage?: "idle" | "generating-images" | "rendering-video" | "done";
  isMp4Exporting?: boolean;
  mp4Status?: string;
  mp4Progress?: number | null;
  hasRenderedVideo?: boolean;
}): RenderStageKey {
  const { autoStage, isMp4Exporting, mp4Status, mp4Progress, hasRenderedVideo } = opts;
  const status = (mp4Status || "").toLowerCase();

  if (autoStage === "done" || (hasRenderedVideo && !isMp4Exporting && autoStage !== "rendering-video")) {
    return "complete";
  }
  if (autoStage === "generating-images") return "scenes";

  if (isMp4Exporting) {
    if (status.includes("submitting") || status.includes("queue")) return "queued";
    if (status.includes("plan")) return "planning";
    if (status.includes("caption")) return "captions";
    if (status.includes("done")) return "complete";
    if ((mp4Progress ?? 0) >= 90) return "finalizing";
    if ((mp4Progress ?? 0) >= 10) return "rendering";
    return "queued";
  }

  if (autoStage === "rendering-video") return "rendering";
  return "queued";
}
