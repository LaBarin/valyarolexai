import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import AIChatWidget from "@/components/AIChatWidget";
import WorkflowBuilder from "@/components/WorkflowBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Workspace = () => {
  const { user, loading } = useAuth();

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
      <div className="pt-28 pb-16 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Your <span className="text-gradient">Workspace</span>
            </h1>
            <p className="text-muted-foreground">
              Chat with your AI assistant or build automated workflows.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                AI Assistant
              </h2>
              <AIChatWidget className="h-[600px]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Workflow Builder
              </h2>
              <WorkflowBuilder className="min-h-[600px]" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
