import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ArrowRight, ListTodo, Calendar, Zap, Plug, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { label: "AI Assistant", icon: MessageSquare, tab: "chat", color: "hsl(190 100% 50%)" },
  { label: "Tasks", icon: ListTodo, tab: "tasks", color: "hsl(150 70% 50%)" },
  { label: "Schedule", icon: Calendar, tab: "schedule", color: "hsl(35 95% 55%)" },
  { label: "Workflows", icon: Zap, tab: "workflows", color: "hsl(280 70% 60%)" },
  { label: "Integrations", icon: Plug, tab: "integrations", color: "hsl(190 100% 50%)" },
  { label: "Dashboard", icon: BarChart3, tab: "dashboard", color: "hsl(150 70% 50%)" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container max-w-4xl mx-auto"
        >
          {/* Welcome */}
          <div className="glass rounded-2xl p-8 md:p-10 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Welcome back,</p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {displayName} <span className="text-gradient">👋</span>
                </h1>
              </div>
              <Link to="/workspace">
                <Button className="gap-2">
                  Open Workspace <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick access grid */}
          <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickLinks.map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Link to={`/workspace?tab=${link.tab}`}>
                  <div className="glass rounded-xl p-5 hover:border-primary/30 hover:shadow-glow transition-all duration-300 cursor-pointer group">
                    <link.icon className="w-6 h-6 mb-3 transition-colors" style={{ color: link.color }} />
                    <p className="text-sm font-semibold group-hover:text-foreground transition-colors">{link.label}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
