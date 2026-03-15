import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Play, Pause, Trash2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import WorkflowBuilder from "@/components/WorkflowBuilder";

type SavedWorkflow = {
  id: string;
  name: string;
  description: string | null;
  trigger_text: string;
  steps: any;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
};

const SavedWorkflows = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWorkflows();
  }, [user]);

  const fetchWorkflows = async () => {
    const { data } = await supabase
      .from("saved_workflows")
      .select("*")
      .order("created_at", { ascending: false });
    setWorkflows(data || []);
    setLoading(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("saved_workflows").update({ is_active: !current }).eq("id", id);
    if (!error) setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, is_active: !current } : w)));
  };

  const deleteWorkflow = async (id: string) => {
    await supabase.from("saved_workflows").delete().eq("id", id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const simulateRun = async (id: string) => {
    const { error } = await supabase.from("saved_workflows").update({
      run_count: (workflows.find((w) => w.id === id)?.run_count || 0) + 1,
      last_run_at: new Date().toISOString(),
    }).eq("id", id);
    if (!error) {
      setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, run_count: w.run_count + 1, last_run_at: new Date().toISOString() } : w));
      toast({ title: "Workflow executed", description: "Automation ran successfully." });
    }
  };

  return (
    <div className="space-y-4">
      {/* Builder */}
      <WorkflowBuilder className="max-h-[350px]" />

      {/* Saved workflows list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Saved Automations ({workflows.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
        ) : workflows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No saved workflows yet. Use the builder above to create one.
          </p>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            <AnimatePresence>
              {workflows.map((wf) => (
                <motion.div
                  key={wf.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`glass rounded-lg p-3 group ${!wf.is_active ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${wf.is_active ? "bg-accent" : "bg-muted-foreground/40"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{wf.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{wf.trigger_text}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {wf.run_count} runs
                      </span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => simulateRun(wf.id)} title="Run now">
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(wf.id, wf.is_active)}>
                        {wf.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-accent" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteWorkflow(wf.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedWorkflows;
