import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Play, Pause, Trash2, Clock, Loader2, Activity, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

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

type AgentResult = {
  agentId: string;
  content: string;
  timestamp: string;
  loading: boolean;
};

const AgentManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<SavedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [results, setResults] = useState<Record<string, AgentResult>>({});
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

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
    setResults((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const runAgent = async (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;

    // Set loading state for this agent
    setResults((prev) => ({
      ...prev,
      [id]: { agentId: id, content: "", timestamp: new Date().toISOString(), loading: true },
    }));
    setExpandedResults((prev) => ({ ...prev, [id]: true }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const stepsDesc = Array.isArray(agent.steps)
        ? agent.steps.map((s: any, i: number) => `${i + 1}. [${s.type || "action"}] ${s.label || s.description || ""}`).join("\n")
        : "No steps defined.";

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are an AI agent executing a workflow. Here are the details:\n\n**Agent:** ${agent.name}\n**Trigger:** ${agent.trigger_text}\n**Description:** ${agent.description || "N/A"}\n**Steps:**\n${stepsDesc}\n\nSimulate executing this workflow now. For each step, provide a realistic result as if you performed the action (e.g. drafted an email, found data, scheduled a meeting, sent a notification). Format your response with clear step-by-step results using markdown. Be specific and actionable.`,
          }],
          mode: "chat",
        }),
      });

      if (!resp.ok) throw new Error("Agent execution failed");

      // Stream SSE response
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                accumulated += content;
                setResults((prev) => ({
                  ...prev,
                  [id]: { ...prev[id], content: accumulated, loading: true },
                }));
              }
            } catch { /* partial chunk */ }
          }
        }
      }

      // Update run count
      await supabase.from("saved_workflows").update({
        run_count: agent.run_count + 1,
        last_run_at: new Date().toISOString(),
      }).eq("id", id);

      setAgents((prev) => prev.map((a) => a.id === id ? { ...a, run_count: a.run_count + 1, last_run_at: new Date().toISOString() } : a));
      setResults((prev) => ({
        ...prev,
        [id]: { ...prev[id], content: accumulated || "Agent executed successfully.", loading: false },
      }));
    } catch (e: any) {
      setResults((prev) => ({
        ...prev,
        [id]: { agentId: id, content: `Error: ${e.message}`, timestamp: new Date().toISOString(), loading: false },
      }));
      toast({ title: "Agent Error", description: e.message, variant: "destructive" });
    }
  };

  const clearResult = (id: string) => {
    setResults((prev) => { const n = { ...prev }; delete n[id]; return n; });
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
            {agents.map((agent) => {
              const result = results[agent.id];
              const isExpanded = expandedResults[agent.id];
              return (
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
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => runAgent(agent.id)}
                        disabled={result?.loading}
                        title="Run now"
                      >
                        {result?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(agent.id, agent.is_active)}>
                        {agent.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-accent" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => deleteAgent(agent.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Execution Result */}
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 border-t border-border/30 pt-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                            {result.loading ? "Executing…" : "Result"}
                          </span>
                          {result.loading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                        </div>
                        <div className="flex items-center gap-1">
                          {!result.loading && (
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setExpandedResults((p) => ({ ...p, [agent.id]: !p[agent.id] }))}>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                          )}
                          {!result.loading && (
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => clearResult(agent.id)}>
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className={`text-xs text-foreground/85 leading-relaxed prose prose-invert prose-sm max-w-none ${!isExpanded && !result.loading ? "max-h-24 overflow-hidden relative" : ""}`}>
                        <ReactMarkdown>{result.content || "Processing..."}</ReactMarkdown>
                        {!isExpanded && !result.loading && result.content.length > 200 && (
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent" />
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AgentManager;
