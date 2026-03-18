import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Send, Loader2, TrendingDown, TrendingUp, Sparkles, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid } from "recharts";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type InsightMessage = {
  role: "user" | "assistant";
  content: string;
};

const presetQuestions = [
  "Why are sales down this week?",
  "What's slowing our team's productivity?",
  "Which tasks are most overdue?",
  "How can we improve lead response time?",
];

// Simulated insight cards shown before first question
const defaultInsights = [
  {
    title: "Lead Response Time ↑ 43%",
    description: "Average response to new leads increased from 2.1hrs to 3.0hrs this week.",
    recommendation: "Automate initial follow-ups with a Sales Agent.",
    severity: "warning" as const,
    icon: AlertTriangle,
  },
  {
    title: "Deep Work Blocks: +2.5hrs",
    description: "AI scheduled 5 focus blocks this week, saving 2.5hrs from meeting conflicts.",
    severity: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Task Completion: 73%",
    description: "12 of 16 tasks completed. 3 overdue tasks need attention.",
    recommendation: "Reassign overdue tasks to available team members.",
    severity: "neutral" as const,
    icon: BarChart3,
  },
];

const severityStyles = {
  warning: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
  positive: { bg: "bg-accent/10", border: "border-accent/20", text: "text-accent" },
  neutral: { bg: "bg-primary/10", border: "border-primary/20", text: "text-primary" },
};

const AIInsights = ({ compact = false }: { compact?: boolean }) => {
  const [messages, setMessages] = useState<InsightMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const askQuestion = async (question?: string) => {
    const q = question || input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: InsightMessage = { role: "user", content: q };
    const updated = [...messages, userMsg];
    setMessages(updated);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not signed in");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `You are an analytics AI for a productivity platform. Analyze this business question and give specific, data-driven insights with metrics and actionable recommendations. Be concise. Question: ${q}` },
          ],
          mode: "chat",
        }),
      });

      if (!resp.ok) throw new Error("AI request failed");

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                }
                return [...prev, { role: "assistant", content: assistantText }];
              });
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Compact mode for dashboard embed
  if (compact) {
    return (
      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" /> AI Insights
        </h3>
        <div className="space-y-2">
          {defaultInsights.slice(0, 2).map((insight, i) => {
            const styles = severityStyles[insight.severity];
            return (
              <div key={i} className={`rounded-lg p-3 ${styles.bg} border ${styles.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <insight.icon className={`w-3.5 h-3.5 ${styles.text}`} />
                  <span className={`text-xs font-semibold ${styles.text}`}>{insight.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{insight.description}</p>
                {insight.recommendation && (
                  <p className="text-[10px] text-muted-foreground mt-1">💡 {insight.recommendation}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askQuestion()}
            placeholder="Ask about your data..."
            className="text-xs h-8 bg-background/50 border-border/50"
          />
          <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => askQuestion()} disabled={!input.trim() || loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    );
  }

  // Full analytics view
  return (
    <div className="space-y-6">
      {/* Insight Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {defaultInsights.map((insight, i) => {
          const styles = severityStyles[insight.severity];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-xl p-5 border ${styles.border}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <insight.icon className={`w-4 h-4 ${styles.text}`} />
                <span className={`text-sm font-semibold ${styles.text}`}>{insight.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
              {insight.recommendation && (
                <div className="rounded-lg bg-background/50 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">💡 <span className="font-medium text-foreground/80">{insight.recommendation}</span></p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* AI Q&A */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Ask your data anything</span>
        </div>

        <ScrollArea className="max-h-[400px]" ref={scrollRef}>
          <div className="p-5 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {presetQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => askQuestion(q)}
                      className="text-xs px-3 py-1.5 rounded-full glass border border-border/50 hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`${msg.role === "user" ? "flex justify-end" : ""}`}>
                <div className={`rounded-xl px-4 py-3 max-w-[85%] text-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "glass border border-border/50"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="glass border border-border/50 rounded-xl px-4 py-3 inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askQuestion()}
              placeholder="Why are sales down this week?"
              className="bg-background/50 border-border/50"
            />
            <Button onClick={() => askQuestion()} disabled={!input.trim() || loading} size="icon">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
