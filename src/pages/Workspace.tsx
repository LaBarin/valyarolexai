import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import AIChatWidget from "@/components/AIChatWidget";
import WorkflowBuilder from "@/components/WorkflowBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Navigate } from "react-router-dom";
import { MessageSquare, Workflow } from "lucide-react";

const Workspace = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"chat" | "workflow">("chat");

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
              Chat with your AI assistant or build automated workflows.
            </p>
          </motion.div>

          {/* Mobile tab switcher */}
          {isMobile && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "chat"
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "glass text-muted-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab("workflow")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "workflow"
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "glass text-muted-foreground"
                }`}
              >
                <Workflow className="w-4 h-4" />
                Workflow Builder
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Assistant - show on desktop always, on mobile only when active */}
            {(!isMobile || activeTab === "chat") && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {!isMobile && (
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    AI Assistant
                  </h2>
                )}
                <AIChatWidget className="h-[calc(100vh-320px)] min-h-[400px]" />
              </motion.div>
            )}

            {/* Workflow Builder - show on desktop always, on mobile only when active */}
            {(!isMobile || activeTab === "workflow") && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {!isMobile && (
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Workflow Builder
                  </h2>
                )}
                <WorkflowBuilder className="min-h-[calc(100vh-320px)]" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
