import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Calendar, Flag, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  tags: string[];
  created_at: string;
};

const priorityColors: Record<string, string> = {
  low: "hsl(150 70% 50%)",
  medium: "hsl(35 95% 55%)",
  high: "hsl(0 84% 60%)",
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const TaskManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "in_progress" | "done">("all");

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading tasks", description: error.message, variant: "destructive" });
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const addTask = async () => {
    if (!newTitle.trim() || !user) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: newTitle.trim(), user_id: user.id })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setTasks((prev) => [data, ...prev]);
      setNewTitle("");
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;

    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    }
  };

  const updateTaskPriority = async (id: string, priority: string) => {
    const { error } = await supabase.from("tasks").update({ priority }).eq("id", id);
    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const aiSuggestTasks = async () => {
    if (!user || aiSuggesting) return;
    setAiSuggesting(true);
    try {
      const session = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Based on a typical productivity workflow, suggest 3 actionable tasks. Return ONLY a JSON array of objects with "title" and "priority" (low/medium/high) fields. No markdown, no explanation.`,
          }],
          mode: "chat",
        }),
      });

      if (!resp.ok) throw new Error("Failed to get suggestions");

      // Read the SSE stream to get the full response
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch {}
          }
        }
      }

      const jsonStr = fullText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const suggestions = JSON.parse(jsonStr);

      for (const s of suggestions) {
        const { data } = await supabase
          .from("tasks")
          .insert({ title: s.title, priority: s.priority || "medium", user_id: user.id, tags: ["ai-suggested"] })
          .select()
          .single();
        if (data) setTasks((prev) => [data, ...prev]);
      }

      toast({ title: "AI Suggestions Added", description: `${suggestions.length} tasks created` });
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    } finally {
      setAiSuggesting(false);
    }
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "In Progress", value: stats.inProgress, color: "text-primary" },
          { label: "Completed", value: stats.done, color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add task */}
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a new task..."
          className="bg-background/50"
        />
        <Button onClick={addTask} size="icon" disabled={!newTitle.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
        <Button onClick={aiSuggestTasks} variant="outline" size="icon" disabled={aiSuggesting} title="AI suggest tasks">
          {aiSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "todo", "in_progress", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "todo" ? "To Do" : f === "in_progress" ? "In Progress" : "Done"}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No tasks yet. Add one above or let AI suggest some.</p>
        ) : (
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`glass rounded-lg p-3 flex items-center gap-3 group ${task.status === "done" ? "opacity-60" : ""}`}
              >
                <button
                  onClick={() => updateTaskStatus(task.id, task.status === "done" ? "todo" : "done")}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    task.status === "done" ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary"
                  }`}
                >
                  {task.status === "done" && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through" : ""}`}>
                    {task.title}
                  </p>
                  {task.tags?.includes("ai-suggested") && (
                    <span className="text-[10px] text-primary">✨ AI suggested</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    const next = task.priority === "low" ? "medium" : task.priority === "medium" ? "high" : "low";
                    updateTaskPriority(task.id, next);
                  }}
                  title={`Priority: ${task.priority}`}
                >
                  <Flag className="w-3.5 h-3.5" style={{ color: priorityColors[task.priority] }} />
                </button>

                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className="text-[10px] bg-muted/50 rounded px-1.5 py-0.5 border-none text-muted-foreground"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
