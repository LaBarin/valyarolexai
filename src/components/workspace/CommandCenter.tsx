import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Inbox, Calendar, ListTodo, Bot, BarChart3, Zap, Presentation, Megaphone,
  Plug, MessageSquare, Brain, TrendingUp, ArrowRight, Clock, Sparkles,
  CheckCircle2, AlertTriangle, Sun, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AIInsights from "@/components/workspace/AIInsights";

type Stats = {
  totalTasks: number;
  completedTasks: number;
  activeAgents: number;
  todayEvents: number;
  integrations: number;
  pendingInbox: number;
};

const CommandCenter = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0, completedTasks: 0, activeAgents: 0,
    todayEvents: 0, integrations: 0, pendingInbox: 0,
  });

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const [tasksRes, agentsRes, eventsRes, integrationsRes] = await Promise.all([
      supabase.from("tasks").select("status"),
      supabase.from("saved_workflows").select("is_active"),
      supabase.from("schedule_events").select("id")
        .gte("start_time", today + "T00:00:00Z")
        .lte("start_time", today + "T23:59:59Z"),
      supabase.from("connected_integrations").select("id"),
    ]);
    setStats({
      totalTasks: tasksRes.data?.length || 0,
      completedTasks: tasksRes.data?.filter((t) => t.status === "done").length || 0,
      activeAgents: agentsRes.data?.filter((w) => w.is_active).length || 0,
      todayEvents: eventsRes.data?.length || 0,
      integrations: integrationsRes.data?.length || 0,
      pendingInbox: 3,
    });
  };

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isDeepWorkHours = hour >= 9 && hour <= 11;

  // AI suggestions based on patterns
  const aiSuggestions = [
    {
      type: "energy" as const,
      icon: isDeepWorkHours ? Sun : Moon,
      title: isDeepWorkHours ? "Peak Focus Window Active" : "Focus window: 9–11 AM",
      description: isDeepWorkHours
        ? "You're in your peak performance zone. Deep work blocks are scheduled."
        : "AI detected your best focus hours are 9–11 AM. Meetings auto-moved.",
      action: "View Schedule",
      target: "schedule",
      color: "hsl(150 70% 50%)",
    },
    ...(stats.pendingInbox > 0 ? [{
      type: "action" as const,
      icon: AlertTriangle,
      title: `${stats.pendingInbox} items need attention`,
      description: "3 follow-up emails pending. AI suggests automating repeat follow-ups.",
      action: "Open Inbox",
      target: "inbox",
      color: "hsl(35 95% 55%)",
    }] : []),
    {
      type: "insight" as const,
      icon: Brain,
      title: "Pattern Detected",
      description: "You repeatedly send follow-ups to leads. Create an automated follow-up agent?",
      action: "Create Agent",
      target: "agents",
      color: "hsl(190 100% 50%)",
    },
  ];

  return (
    <ScrollArea className="h-[calc(100vh-140px)]">
      <div className="space-y-6 pr-2">
        {/* Greeting & Status Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{greeting}</h2>
            <p className="text-sm text-muted-foreground">
              {stats.todayEvents} events today · {stats.totalTasks - stats.completedTasks} tasks remaining · {stats.activeAgents} agents active
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDeepWorkHours && (
              <Badge className="bg-accent/15 text-accent border-accent/30 animate-pulse">
                <Sun className="w-3 h-3 mr-1" /> Deep Work Mode
              </Badge>
            )}
          </div>
        </div>

        {/* AI Suggestions Strip */}
        <div className="space-y-2">
          {aiSuggestions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-4 flex items-center gap-4 group cursor-pointer hover:border-primary/20 transition-all"
              onClick={() => onNavigate(s.target)}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
              <Button size="sm" variant="ghost" className="flex-shrink-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {s.action} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Tasks", value: stats.totalTasks, sub: `${stats.completedTasks} done`, icon: ListTodo, color: "hsl(190 100% 50%)", target: "tasks" },
            { label: "Today", value: stats.todayEvents, sub: "events scheduled", icon: Calendar, color: "hsl(150 70% 50%)", target: "schedule" },
            { label: "Agents", value: stats.activeAgents, sub: "running 24/7", icon: Bot, color: "hsl(35 95% 55%)", target: "agents" },
            { label: "Completion", value: `${completionRate}%`, sub: "this week", icon: TrendingUp, color: "hsl(280 70% 60%)", target: "analytics" },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="glass rounded-xl p-4 cursor-pointer hover:border-primary/20 transition-all"
              onClick={() => onNavigate(card.target)}
            >
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-[11px] text-muted-foreground">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Productivity + AI Insights side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Productivity */}
          <div className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Productivity Score
              </h3>
              <span className="text-2xl font-bold text-primary">{completionRate}</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {completionRate >= 80 ? "🔥 Crushing it! AI agents are accelerating your output." :
               completionRate >= 50 ? "💪 Good progress. Consider automating repetitive tasks." :
               "🚀 Getting started — let AI agents handle the routine work."}
            </p>

            {/* Energy cycle indicator */}
            <div className="pt-2 border-t border-border/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Your Energy Cycle Today</p>
              <div className="flex items-center gap-1 h-8">
                {Array.from({ length: 14 }, (_, i) => {
                  const h = i + 7;
                  const energy = h >= 9 && h <= 11 ? 1 : h >= 14 && h <= 16 ? 0.7 : h >= 20 ? 0.3 : 0.5;
                  const isCurrent = h === hour;
                  return (
                    <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className={`w-full rounded-sm transition-all ${isCurrent ? "ring-1 ring-primary" : ""}`}
                        style={{
                          height: `${energy * 100}%`,
                          backgroundColor: energy > 0.7 ? "hsl(150 70% 50%)" : energy > 0.4 ? "hsl(35 95% 55%)" : "hsl(var(--muted))",
                          opacity: isCurrent ? 1 : 0.6,
                        }}
                      />
                      {(h === 9 || h === 14 || h === 20) && (
                        <span className="text-[8px] text-muted-foreground">{h}:00</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">AI detected peak focus: 9–11 AM · Secondary peak: 2–4 PM</p>
            </div>
          </div>

          {/* AI Insights mini */}
          <AIInsights compact />
        </div>

        {/* Activity Feed */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Live Activity
          </h3>
          <div className="space-y-3">
            {[
              { action: "Sales Agent scored lead", detail: "Acme Corp → High intent (92%)", time: "2 min ago", icon: Bot, color: "hsl(150 70% 50%)" },
              { action: "Deep work block started", detail: "AI moved standup to 11:30 AM", time: "15 min ago", icon: Sun, color: "hsl(35 95% 55%)" },
              { action: "Auto follow-up sent", detail: "3 leads received personalized emails", time: "1 hr ago", icon: Zap, color: "hsl(190 100% 50%)" },
              { action: "Task completed", detail: "Review Q1 metrics → marked done", time: "2 hrs ago", icon: CheckCircle2, color: "hsl(150 70% 50%)" },
              { action: "Schedule optimized", detail: "2 meetings consolidated, 45 min saved", time: "3 hrs ago", icon: Sparkles, color: "hsl(280 70% 60%)" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}12` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default CommandCenter;
