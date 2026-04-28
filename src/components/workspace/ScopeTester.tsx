import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, ChevronRight, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Connection = {
  id: string;
  platform: string;
  display_name: string;
  required_scopes: string[];
  granted_scopes: string[];
  verification_status: string;
  verification_error: string | null;
};

type StepStatus = "idle" | "running" | "pass" | "fail";
type Step = {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  detail?: string;
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  connection: Connection | null;
  onComplete?: () => void;
}

// Per-platform step blueprints. Each is a non-destructive probe.
const STEPS_FOR_PLATFORM: Record<string, Omit<Step, "status">[]> = {
  meta: [
    { id: "reach", label: "API reachability", description: "Hit Graph API /me with the saved token." },
    { id: "scopes", label: "Permission audit", description: "Confirm pages_manage_posts, pages_read_engagement, instagram_content_publish are granted." },
    { id: "page", label: "Page access", description: "Verify the configured Page ID is accessible by this token." },
  ],
  tiktok: [
    { id: "reach", label: "API reachability", description: "Call /v2/user/info/ on TikTok Open API." },
    { id: "scopes", label: "Account info", description: "Confirm open_id and display_name are returned." },
    { id: "publish", label: "Publish capability", description: "TikTok Content Posting API approval is required for video.publish." },
  ],
  youtube: [
    { id: "reach", label: "API reachability", description: "List the authenticated user's channels via YouTube Data API v3." },
    { id: "scopes", label: "Scope audit", description: "Confirm token includes youtube.upload scope." },
    { id: "channel", label: "Channel detected", description: "Verify a YouTube channel is bound to this OAuth token." },
  ],
  buffer: [
    { id: "reach", label: "Buffer reachability", description: "Call /1/user.json with the access token." },
    { id: "scopes", label: "Publish scope", description: "Buffer's app handles publish scope per profile." },
  ],
  webhook: [
    { id: "reach", label: "Webhook ping", description: "POST a test payload and confirm 2xx response." },
  ],
};

export const ScopeTester = ({ open, onOpenChange, connection, onComplete }: Props) => {
  const { toast } = useToast();
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [overall, setOverall] = useState<"idle" | "pass" | "fail">("idle");

  const initSteps = () => {
    if (!connection) return [];
    const blueprint = STEPS_FOR_PLATFORM[connection.platform] || [];
    return blueprint.map((s) => ({ ...s, status: "idle" as StepStatus }));
  };

  // Reset on open
  if (open && steps.length === 0 && connection) {
    setSteps(initSteps());
    setOverall("idle");
  }
  if (!open && steps.length > 0) {
    // gentle reset
    setTimeout(() => { setSteps([]); setOverall("idle"); }, 200);
  }

  const update = (id: string, patch: Partial<Step>) =>
    setSteps((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const runAll = async () => {
    if (!connection) return;
    setRunning(true);
    setOverall("idle");
    setSteps(initSteps());

    // Step 1: reachability — invoke verify-publishing-connection
    update("reach", { status: "running" });
    const { data, error } = await supabase.functions.invoke("verify-publishing-connection", {
      body: { connection_id: connection.id },
    });

    if (error || !data?.ok) {
      update("reach", { status: "fail", detail: data?.error || error?.message || "Verification failed" });
      // Mark remaining steps failed
      setSteps((cs) => cs.map((s) => s.id === "reach" ? s : { ...s, status: "fail", detail: "Skipped — reachability failed" }));
      setOverall("fail");
      setRunning(false);
      return;
    }
    update("reach", { status: "pass", detail: data.display_name || "Reachable" });

    // Step 2: scopes/account — derived from response
    if (steps.find((s) => s.id === "scopes")) {
      update("scopes", { status: "running" });
      const granted: string[] = data.granted_scopes || [];
      const required: string[] = connection.required_scopes || [];
      const missing = required.filter((r) => !granted.includes(r));
      if (connection.platform === "tiktok") {
        update("scopes", {
          status: data.account_id ? "pass" : "fail",
          detail: data.account_id ? `Open ID: ${data.account_id}` : "No account info returned",
        });
      } else if (connection.platform === "buffer") {
        update("scopes", { status: "pass", detail: "Buffer manages per-profile scopes" });
      } else {
        update("scopes", {
          status: missing.length === 0 ? "pass" : "fail",
          detail: missing.length === 0 ? `${granted.length} scope(s) granted` : `Missing: ${missing.map((m) => m.split("/").pop()).join(", ")}`,
        });
      }
    }

    // Step 3: platform-specific
    if (connection.platform === "meta" && steps.find((s) => s.id === "page")) {
      update("page", {
        status: data.account_id ? "pass" : "fail",
        detail: data.account_id ? `Page accessible (${data.account_id})` : "No page bound or page inaccessible",
      });
    }
    if (connection.platform === "youtube" && steps.find((s) => s.id === "channel")) {
      update("channel", {
        status: data.account_id ? "pass" : "fail",
        detail: data.account_id ? `Channel: ${data.display_name}` : "No channel found",
      });
    }
    if (connection.platform === "tiktok" && steps.find((s) => s.id === "publish")) {
      const hasPublish = (data.granted_scopes || []).includes("video.publish");
      update("publish", {
        status: hasPublish ? "pass" : "fail",
        detail: hasPublish ? "video.publish granted" : "Approval required at developers.tiktok.com to enable video.publish",
      });
    }

    // Compute overall
    setSteps((cs) => {
      const final = cs;
      const allPass = final.every((s) => s.status === "pass");
      setOverall(allPass ? "pass" : "fail");
      return final;
    });

    setRunning(false);
    onComplete?.();
    toast({ title: "Scope test complete", description: `${connection.display_name}` });
  };

  const icon = (s: StepStatus) => {
    if (s === "pass") return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    if (s === "fail") return <XCircle className="w-5 h-5 text-destructive" />;
    if (s === "running") return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    return <ChevronRight className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Scope Tester
          </DialogTitle>
          <DialogDescription>
            {connection ? `Guided verification for ${connection.display_name}` : "Select a connection"}
          </DialogDescription>
        </DialogHeader>

        {connection && (
          <div className="space-y-3">
            <div className="space-y-2">
              <AnimatePresence>
                {steps.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      s.status === "pass" ? "border-green-500/30 bg-green-500/5" :
                      s.status === "fail" ? "border-destructive/30 bg-destructive/5" :
                      s.status === "running" ? "border-primary/30 bg-primary/5" :
                      "border-border/40 bg-muted/20"
                    }`}
                  >
                    <div className="mt-0.5">{icon(s.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Step {i + 1} — {s.label}</p>
                        <Badge variant="outline" className="text-[9px] uppercase">{s.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                      {s.detail && (
                        <p className="text-[11px] mt-1 font-mono text-foreground/80 break-all">{s.detail}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {overall === "pass" && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <p className="text-xs text-green-400">All checks passed — this connection is cleared for scheduling.</p>
              </div>
            )}
            {overall === "fail" && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <p className="text-xs text-destructive">One or more checks failed. Re-issue your token with the correct scopes, then re-run.</p>
              </div>
            )}

            <Button onClick={runAll} disabled={running} className="w-full">
              {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running checks…</> : "Run Scope Test"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScopeTester;
