import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import AIChatWidget from "@/components/AIChatWidget";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { 
  MessageSquare, Workflow, ListTodo, Calendar, BarChart3, Plug
} from "lucide-react";
import TaskManager from "@/components/workspace/TaskManager";
import ScheduleView from "@/components/workspace/ScheduleView";
import TeamDashboard from "@/components/workspace/TeamDashboard";
import IntegrationHub from "@/components/workspace/IntegrationHub";
import SavedWorkflows from "@/components/workspace/SavedWorkflows";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "chat", label: "AI Assistant", icon: MessageSquare },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "integrations", label: "Integrations", icon: Plug },
] as const;

type TabId = typeof tabs[number]["id"];

const Workspace = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16 px-4 sm:px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Your <span className="text-gradient">Workspace</span>
            </h1>
            <p className="text-muted-foreground">
              AI assistant, tasks, scheduling, automations, and integrations — all in one place.
            </p>
          </motion.div>

          {/* Tab navigation */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "dashboard" && <TeamDashboard />}
            {activeTab === "chat" && (
              <div className="max-w-3xl">
                <AIChatWidget className="h-[calc(100vh-320px)] min-h-[400px]" />
              </div>
            )}
            {activeTab === "tasks" && (
              <div className="max-w-3xl">
                <TaskManager />
              </div>
            )}
            {activeTab === "schedule" && (
              <div className="max-w-3xl">
                <ScheduleView />
              </div>
            )}
            {activeTab === "workflows" && (
              <div className="max-w-3xl">
                <SavedWorkflows />
              </div>
            )}
            {activeTab === "integrations" && (
              <div className="max-w-4xl">
                <IntegrationHub />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
