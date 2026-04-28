import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  last_verified_at: string | null;
  is_active: boolean;
};

const RECHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

const formatRelative = (iso: string | null) => {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
};

export const ConnectionHealthPanel = () => {
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoCheck, setAutoCheck] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [lastSweep, setLastSweep] = useState<Date | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("publishing_connections")
      .select("*")
      .order("created_at", { ascending: false });
    setConnections((data as any) || []);
    setLoading(false);
  };

  const verifyOne = async (id: string) => {
    setCheckingId(id);
    await supabase.functions.invoke("verify-publishing-connection", { body: { connection_id: id } });
    setCheckingId(null);
    await load();
  };

  const sweepAll = async (silent = false) => {
    const active = connections.filter((c) => c.is_active);
    for (const c of active) {
      await supabase.functions.invoke("verify-publishing-connection", { body: { connection_id: c.id } });
    }
    setLastSweep(new Date());
    await load();
    if (!silent) toast({ title: "Health sweep complete", description: `Re-verified ${active.length} connection(s).` });
  };

  useEffect(() => { load(); }, []);

  // Periodic re-check
  useEffect(() => {
    if (!autoCheck || connections.length === 0) return;
    const interval = setInterval(() => { sweepAll(true); }, RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheck, connections.length]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (connections.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center text-muted-foreground text-sm">
        Add a publishing connection to monitor its health.
      </div>
    );
  }

  const verified = connections.filter((c) => c.verification_status === "verified").length;
  const failed = connections.filter((c) => c.verification_status === "failed").length;
  const stale = connections.filter(
    (c) => c.last_verified_at && Date.now() - new Date(c.last_verified_at).getTime() > STALE_THRESHOLD_MS,
  ).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="glass rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Connection Health</p>
            <p className="text-[11px] text-muted-foreground">
              Auto-checks every 5 minutes • {verified} healthy • {failed} failed • {stale} stale
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAutoCheck((v) => !v)} className="h-7 text-xs">
            {autoCheck ? <><Pause className="w-3 h-3 mr-1" /> Pause</> : <><Play className="w-3 h-3 mr-1" /> Resume</>}
          </Button>
          <Button size="sm" variant="outline" onClick={() => sweepAll(false)} className="h-7 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" /> Re-check All
          </Button>
        </div>
      </div>

      {lastSweep && (
        <p className="text-[10px] text-muted-foreground text-right">Last sweep: {lastSweep.toLocaleTimeString()}</p>
      )}

      {/* Per-connection rows */}
      <div className="space-y-2">
        {connections.map((c) => {
          const isStale = c.last_verified_at && Date.now() - new Date(c.last_verified_at).getTime() > STALE_THRESHOLD_MS;
          const missingScopes = (c.required_scopes || []).filter((s) => !(c.granted_scopes || []).includes(s));
          const verified = c.verification_status === "verified" && missingScopes.length === 0;
          const failed = c.verification_status === "failed";

          return (
            <motion.div
              key={c.id}
              layout
              className={`glass rounded-xl p-3 border ${
                failed ? "border-destructive/30" :
                !verified ? "border-yellow-500/30" :
                isStale ? "border-yellow-500/20" :
                "border-border/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0">
                    {failed ? <XCircle className="w-5 h-5 text-destructive" /> :
                      !verified ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> :
                      <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{c.display_name}</p>
                      <Badge variant="outline" className="text-[9px]">{c.platform}</Badge>
                      {!c.is_active && <Badge variant="secondary" className="text-[9px]">disabled</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />
                      Checked {formatRelative(c.last_verified_at)}
                      {isStale && <span className="text-yellow-400 ml-1">• stale</span>}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => verifyOne(c.id)}
                  disabled={checkingId === c.id}
                >
                  {checkingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                </Button>
              </div>

              {(failed || missingScopes.length > 0) && (
                <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                  {c.verification_error && (
                    <p className="text-[11px] text-destructive">{c.verification_error}</p>
                  )}
                  {missingScopes.length > 0 && (
                    <p className="text-[11px] text-yellow-400">
                      Missing: {missingScopes.map((s) => s.split("/").pop()).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionHealthPanel;
