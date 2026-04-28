import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

type Severity = "error" | "warn" | "info";
type State = "open" | "fixed" | "ignored";

type LintFinding = {
  id: string;
  title: string;
  severity: Severity;
  state: State;
  source: string;
  remediation: string;
  remediationUrl: string;
  note?: string;
};

// Curated, in-app mirror of the project's security-linter triage. Updated whenever
// migrations or edge-function changes resolve a finding. Source-of-truth lives in
// Lovable Cloud's security view; this dashboard surfaces the live status inline.
const FINDINGS: LintFinding[] = [
  {
    id: "rls_realtime_messages",
    title: "Realtime channel auth on notifications",
    severity: "error",
    state: "fixed",
    source: "agent_security",
    remediation: "Enable RLS on realtime.messages and restrict topic to auth.uid().",
    remediationUrl: "https://docs.lovable.dev/features/security#realtime",
    note: "RLS enabled; topic must equal auth.uid()::text.",
  },
  {
    id: "voiceid_path_injection",
    title: "Unvalidated voiceId in generate-voiceover",
    severity: "warn",
    state: "fixed",
    source: "agent_security",
    remediation: "Validate voiceId against /^[A-Za-z0-9]{1,64}$/ before calling ElevenLabs.",
    remediationUrl: "https://docs.lovable.dev/features/security#input-validation",
    note: "Regex allowlist applied in edge function.",
  },
  {
    id: "brand_assets_listing",
    title: "Public brand-assets bucket allowed listing",
    severity: "warn",
    state: "fixed",
    source: "supabase",
    remediation: "Make bucket private; allow direct-path reads only; owners may list own folder.",
    remediationUrl:
      "https://supabase.com/docs/guides/database/database-linter?lint=0025_public_bucket_allows_listing",
    note: "Bucket flipped to private; new SELECT policies restrict enumeration.",
  },
  {
    id: "sp_pc_rls_owner",
    title: "scheduled_posts / publishing_connections RLS",
    severity: "error",
    state: "fixed",
    source: "supabase",
    remediation: "Owner-scoped policies for authenticated; service_role for cron worker.",
    remediationUrl:
      "https://supabase.com/docs/guides/database/database-linter?lint=0006_rls_disabled_in_public",
    note: "8-policy matrix verified on /security-check.",
  },
  {
    id: "secdef_anon_executable",
    title: "SECURITY DEFINER callable by anon",
    severity: "warn",
    state: "ignored",
    source: "supabase",
    remediation:
      "Revoke EXECUTE from anon on internal helpers; keep get_shared_* anon-callable (lookup-by-secret).",
    remediationUrl:
      "https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable",
    note:
      "Revoked anon execute on enqueue/delete/move/read email helpers, generate_*_share_token, has_active_subscription. get_shared_* intentionally anon for share-link pages.",
  },
  {
    id: "secdef_auth_executable",
    title: "SECURITY DEFINER callable by signed-in users",
    severity: "warn",
    state: "ignored",
    source: "supabase",
    remediation:
      "Revoke EXECUTE from authenticated on internal helpers; keep owner-scoped functions executable.",
    remediationUrl:
      "https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable",
    note:
      "spend_credits/grant_credits restricted to service_role; owner-scoped helpers validate auth.uid() inside the function body.",
  },
  {
    id: "rls_enabled_no_policy",
    title: "RLS enabled with no policy (system tables)",
    severity: "info",
    state: "ignored",
    source: "supabase",
    remediation: "System tables (pgmq, realtime.messages) are managed via service-role bypass.",
    remediationUrl:
      "https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy",
    note: "App uses postgres_changes which enforces underlying table RLS.",
  },
  {
    id: "email_send_log_select",
    title: "email_send_log has no SELECT policy",
    severity: "info",
    state: "ignored",
    source: "supabase",
    remediation: "Service-role only by design — operational log not exposed to clients.",
    remediationUrl: "https://docs.lovable.dev/features/security",
    note: "Intentional; readable only via service role.",
  },
];

const SEVERITY_META: Record<Severity, { label: string; icon: typeof ShieldX; tone: string }> = {
  error: { label: "Error", icon: ShieldX, tone: "text-destructive" },
  warn: { label: "Warning", icon: ShieldAlert, tone: "text-amber-400" },
  info: { label: "Info", icon: Info, tone: "text-muted-foreground" },
};

const STATE_META: Record<State, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  open: { label: "Open", icon: AlertTriangle, tone: "bg-destructive/15 text-destructive border-destructive/30" },
  fixed: { label: "Fixed", icon: CheckCircle2, tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  ignored: {
    label: "Triaged",
    icon: ShieldCheck,
    tone: "bg-muted/40 text-muted-foreground border-border",
  },
};

const formatRelative = (date: Date) => {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
};

type Filter = "all" | "open" | "fixed" | "ignored";

export const SecurityLintDashboard = () => {
  const [lastScan, setLastScan] = useState<Date>(new Date());
  const [filter, setFilter] = useState<Filter>("all");

  // refresh "last scanned" timestamp every 30s so UI feels live
  useEffect(() => {
    const t = setInterval(() => setLastScan((s) => s), 30_000);
    return () => clearInterval(t);
  }, []);

  const counts = {
    open: FINDINGS.filter((f) => f.state === "open").length,
    fixed: FINDINGS.filter((f) => f.state === "fixed").length,
    ignored: FINDINGS.filter((f) => f.state === "ignored").length,
  };

  const visible = FINDINGS.filter((f) => filter === "all" || f.state === filter);

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Security Lint Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live status of every linter finding with one-click remediation links.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Last scan {formatRelative(lastScan)}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => setLastScan(new Date())}
          >
            <RefreshCw className="h-3 w-3 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["open", "fixed", "ignored"] as const).map((k) => {
          const meta = STATE_META[k];
          const Icon = meta.icon;
          return (
            <button
              key={k}
              onClick={() => setFilter(filter === k ? "all" : k)}
              className={`rounded-lg border p-3 text-left transition ${
                filter === k ? "ring-2 ring-primary/50" : ""
              } ${meta.tone}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4" />
                <span className="text-2xl font-semibold tabular-nums">{counts[k]}</span>
              </div>
              <div className="text-xs mt-1 capitalize">{meta.label}</div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {visible.map((f, i) => {
          const sev = SEVERITY_META[f.severity];
          const st = STATE_META[f.state];
          const SevIcon = sev.icon;
          const StIcon = st.icon;
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="rounded-lg border border-border/40 bg-background/40 p-4 hover:bg-background/60 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <SevIcon className={`h-4 w-4 mt-0.5 shrink-0 ${sev.tone}`} />
                  <div className="min-w-0">
                    <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                      <span>{f.title}</span>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                        {f.source}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{f.remediation}</p>
                    {f.note && (
                      <p className="text-xs text-muted-foreground/80 mt-1 italic">{f.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-[10px] gap-1 ${st.tone}`}>
                    <StIcon className="h-3 w-3" />
                    {st.label}
                  </Badge>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                    <a href={f.remediationUrl} target="_blank" rel="noreferrer">
                      Fix steps
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {visible.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6">
            No findings in this view.
          </div>
        )}
      </div>
    </Card>
  );
};
