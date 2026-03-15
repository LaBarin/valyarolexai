import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Play, Pause, Trash2, Clock, Loader2, Activity, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type SavedAgent = {
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

const AgentManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<SavedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user) fetchAgents();
  }, [user]);

  const fetchAgents = async () => {
    const { data } = await supabase
      .from("saved_workflows")
      .select("*")
      .order("created_at", { ascending: false });
    setAgents(data || []);
    setLoading(false);
  };

  const createAgent = async () => {
    if (!prompt.trim() || !user) return;
    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "workflow",
        }),
      });
      if (!resp.ok) throw new Error("Failed to generate agent");
      const data = await resp.json();
      const raw = data.result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(raw);

      await supabase.from("saved_workflows").insert({
        user_id: user.id,
        name: parsed.summary || "New Agent",
        description: prompt,
        trigger_text: parsed.trigger || prompt,
        steps: parsed.steps || [],
        is_active: true,
      });

      setPrompt("");
      await fetchAgents();
      toast({ title: "Agent Created", description: "Your AI agent is now active." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("saved_workflows").update({ is_active: !current }).eq("id", id);
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !current } : a)));
    toast({ title: !current ? "Agent Activated" : "Agent Paused" });
  };

  const deleteAgent = async (id: string) => {
    await supabase.from("saved_workflows").delete().eq("id", id);
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const simulateRun = async (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;
    await supabase.from("saved_workflows").update({
      run_count: agent.run_count + 1,
      last_run_at: new Date().toISOString(),
    }).eq("id", id);
    setAgents((prev) => prev.map((a) => a.id === id ? { ...a, run_count: a.run_count + 1, last_run_at: new Date().toISOString() } : a));
    toast({ title: "Agent Executed", description: `${agent.name} ran successfully.` });
  };

  return (
    <div className="space-y-6">
      {/* Agent Creator */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Create AI Agent</h3>
            <p className="text-xs text-muted-foreground">Describe what your agent should continuously do</p>
          </div>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Monitor all incoming leads, score them by intent, schedule demos for qualified ones, and notify the sales team via Slack..."
          rows={3}
          className="bg-background/50 border-border/50"
        />
        <Button onClick={createAgent} disabled={!prompt.trim() || isCreating} className="w-full">
          {isCreating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Agent...</> : <><Bot className="w-4 h-4 mr-2" /> Deploy Agent</>}
        </Button>
      </div>

      {/* Agent List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          Active Agents ({agents.filter(a => a.is_active).length}/{agents.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No agents yet. Describe what you need above to deploy your first agent.</p>
          </div>
        ) : (
          <AnimatePresence>
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className={`glass rounded-xl p-4 group transition-opacity ${!agent.is_active ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${agent.is_active ? "bg-accent/15" : "bg-muted"}`}>
                    <Bot className={`w-5 h-5 ${agent.is_active ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold truncate">{agent.name}</p>
                      <Badge variant="outline" className={`text-[10px] ${agent.is_active ? "border-accent/30 text-accent" : "border-muted-foreground/30 text-muted-foreground"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-1 ${agent.is_active ? "bg-accent" : "bg-muted-foreground/50"}`} />
                        {agent.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{agent.description || agent.trigger_text}</p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {agent.run_count} runs</span>
                      {agent.last_run_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Last: {new Date(agent.last_run_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => simulateRun(agent.id)} title="Run now">
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(agent.id, agent.is_active)}>
                      {agent.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-accent" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => deleteAgent(agent.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AgentManager;
