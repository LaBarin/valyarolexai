import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Clock, Zap, TrendingUp, Users, Calendar, ListTodo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TeamDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeWorkflows: 0,
    todayEvents: 0,
    integrations: 0,
  });

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const [tasksRes, workflowsRes, eventsRes, integrationsRes] = await Promise.all([
      supabase.from("tasks").select("status"),
      supabase.from("saved_workflows").select("is_active"),
      supabase.from("schedule_events").select("id").gte("start_time", new Date().toISOString().split("T")[0] + "T00:00:00Z").lte("start_time", new Date().toISOString().split("T")[0] + "T23:59:59Z"),
      supabase.from("connected_integrations").select("id"),
    ]);

    setStats({
      totalTasks: tasksRes.data?.length || 0,
      completedTasks: tasksRes.data?.filter((t) => t.status === "done").length || 0,
      activeWorkflows: workflowsRes.data?.filter((w) => w.is_active).length || 0,
      todayEvents: eventsRes.data?.length || 0,
      integrations: integrationsRes.data?.length || 0,
    });
  };

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  const cards = [
    { label: "Tasks", value: stats.totalTasks, icon: ListTodo, color: "hsl(190 100% 50%)", sub: `${stats.completedTasks} completed` },
    { label: "Completion", value: `${completionRate}%`, icon: CheckCircle2, color: "hsl(150 70% 50%)", sub: "Task completion rate" },
    { label: "Workflows", value: stats.activeWorkflows, icon: Zap, color: "hsl(35 95% 55%)", sub: "Active automations" },
    { label: "Today", value: stats.todayEvents, icon: Calendar, color: "hsl(280 70% 60%)", sub: "Scheduled events" },
    { label: "Integrations", value: stats.integrations, icon: TrendingUp, color: "hsl(190 100% 50%)", sub: "Connected tools" },
    { label: "AI Actions", value: "∞", icon: Zap, color: "hsl(150 70% 50%)", sub: "Available anytime" },
  ];

  const activityFeed = [
    { action: "Task completed", detail: "Review sprint backlog", time: "2 min ago", icon: CheckCircle2 },
    { action: "Workflow triggered", detail: "Auto-reply to client emails", time: "15 min ago", icon: Zap },
    { action: "Schedule optimized", detail: "AI added focus block 2-4 PM", time: "1 hr ago", icon: Clock },
    { action: "Integration synced", detail: "Gmail inbox updated", time: "2 hrs ago", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4"
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

      {/* Productivity Score */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Productivity Score
          </h3>
          <span className="text-2xl font-bold text-primary">{completionRate}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-primary rounded-full"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {completionRate >= 80 ? "🔥 Crushing it!" : completionRate >= 50 ? "💪 Good progress" : "🚀 Let's get started"}
        </p>
      </div>

      {/* Activity Feed */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Recent Activity
        </h3>
        <div className="space-y-3">
          {activityFeed.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-primary" />
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
  );
};

export default TeamDashboard;
