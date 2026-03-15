import { motion } from "framer-motion";
import { 
  Mail, Calendar, Zap, Brain, MessageSquare, BarChart3, 
  FileText, Shield, Globe, Workflow, Users, Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tools = [
  {
    icon: Mail,
    title: "Unified Inbox",
    description: "Aggregate Gmail, Outlook, Slack, and Teams into one AI-prioritized feed. Auto-draft replies, smart categorization, one-click summaries.",
    color: "hsl(190 100% 50%)",
    category: "Communication",
    capabilities: ["AI auto-drafts", "Priority scoring", "Thread summaries", "Email → Task conversion"],
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI scans all calendars, proposes optimal times, protects focus blocks, and dynamically reorganizes your day.",
    color: "hsl(150 70% 50%)",
    category: "Scheduling",
    capabilities: ["Cross-timezone scan", "Energy-based blocks", "Auto-reschedule", "Meeting fatigue prevention"],
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description: "Natural language triggers create cross-platform workflows. No code, no drag-and-drop complexity — just results.",
    color: "hsl(35 95% 55%)",
    category: "Automation",
    capabilities: ["Natural language triggers", "50+ integrations", "Multi-step chains", "Conditional logic"],
  },
  {
    icon: Brain,
    title: "Adaptive AI Engine",
    description: "Learns your energy cycles, work patterns, and preferences. Your workspace gets smarter every day.",
    color: "hsl(280 70% 60%)",
    category: "Intelligence",
    capabilities: ["Behavioral learning", "Pattern recognition", "Predictive suggestions", "Continuous optimization"],
  },
  {
    icon: MessageSquare,
    title: "Natural Language Control",
    description: "Type or speak commands. \"Move non-urgent meetings to next week\" — and watch it happen instantly.",
    color: "hsl(350 70% 55%)",
    category: "Control",
    capabilities: ["Voice commands", "Batch operations", "Context-aware", "Cross-tool execution"],
  },
  {
    icon: BarChart3,
    title: "Team Workspaces",
    description: "Shared calendars, project dashboards, goal tracking, and AI-powered workload balancing for entire teams.",
    color: "hsl(210 70% 60%)",
    category: "Collaboration",
    capabilities: ["Shared dashboards", "Goal tracking", "Workload balancing", "Team analytics"],
  },
  {
    icon: FileText,
    title: "Document Intelligence",
    description: "AI generates meeting notes, proposals, and reports. Extracts action items automatically from any conversation.",
    color: "hsl(150 70% 50%)",
    category: "Documents",
    capabilities: ["Meeting summaries", "Action extraction", "Auto-reports", "Template generation"],
  },
  {
    icon: Globe,
    title: "Integration Hub",
    description: "Deep, bidirectional integrations with 50+ tools. Real-time sync, zero configuration, secure OAuth.",
    color: "hsl(190 100% 50%)",
    category: "Connectivity",
    capabilities: ["50+ native integrations", "Bidirectional sync", "Zero-config setup", "Webhook support"],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const ToolBreakdown = () => {
  return (
    <section id="tools" className="relative py-32 px-6">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            Complete Toolkit
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            8 tools. <span className="text-gradient">One platform.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every tool you need to eliminate workflow fragmentation — each powered by AI, all working together seamlessly.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-4"
        >
          {tools.map((tool) => (
            <motion.div
              key={tool.title}
              variants={item}
              className="group glass rounded-xl p-6 hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-shadow duration-300 group-hover:shadow-glow"
                  style={{ backgroundColor: `${tool.color}12` }}
                >
                  <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold">{tool.title}</h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Replaces {tool.replaces}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-muted/50 text-secondary-foreground"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/demo">
            <Button variant="hero-outline" className="gap-2">
              See all features in action <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ToolBreakdown;
