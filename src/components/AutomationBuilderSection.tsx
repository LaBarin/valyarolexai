import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  Zap, Mail, Brain, ListTodo, Calendar, BarChart3, Check, ArrowDown,
  Bell, Users, Sparkles, FormInput, MessageSquare, Database, Activity,
  Bot, Shield, Eye
} from "lucide-react";
import WorkflowBuilder from "@/components/WorkflowBuilder";

type AgentCapability = {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
};

type AgentDemo = {
  name: string;
  role: string;
  status: "active" | "monitoring";
  trigger: { label: string; sublabel: string; icon: React.ElementType };
  capabilities: AgentCapability[];
  stats: { handled: number; avgTime: string };
};

const agents: AgentDemo[] = [
  {
    name: "Sales Agent",
    role: "Responds to leads, books meetings, updates pipeline",
    status: "active",
    trigger: { label: "New Lead Detected", sublabel: "Continuous: monitors forms, emails, chat", icon: FormInput },
    capabilities: [
      { label: "Analyze & Score Lead", sublabel: "Intent, budget, timeline assessed", icon: Brain, color: "hsl(190 100% 50%)" },
      { label: "Schedule Meeting", sublabel: "Optimal slot found, invite sent", icon: Calendar, color: "hsl(150 70% 50%)" },
      { label: "Send Slack Alert", sublabel: "#sales-leads → qualified prospect", icon: MessageSquare, color: "hsl(35 95% 55%)" },
      { label: "Create CRM Record", sublabel: "Salesforce contact + opportunity", icon: Database, color: "hsl(280 70% 60%)" },
    ],
    stats: { handled: 847, avgTime: "1.4s" },
  },
  {
    name: "Operations Agent",
    role: "Monitors deadlines, assigns tasks, keeps dashboards current",
    status: "monitoring",
    trigger: { label: "Continuous Monitoring", sublabel: "Always-on: scans tasks, deadlines, blockers", icon: Eye },
    capabilities: [
      { label: "Detect At-Risk Deadline", sublabel: "3 tasks flagged behind schedule", icon: Shield, color: "hsl(190 100% 50%)" },
      { label: "Reassign Tasks", sublabel: "Load-balanced across team", icon: Users, color: "hsl(150 70% 50%)" },
      { label: "Update Dashboards", sublabel: "KPIs, burndown, status synced", icon: BarChart3, color: "hsl(35 95% 55%)" },
      { label: "Notify Stakeholders", sublabel: "Slack + email status digest", icon: Bell, color: "hsl(280 70% 60%)" },
    ],
    stats: { handled: 2340, avgTime: "0.8s" },
  },
  {
    name: "Meeting Agent",
    role: "Captures notes, extracts tasks, follows up automatically",
    status: "active",
    trigger: { label: "Meeting Ended", sublabel: "Trigger: calendar event complete", icon: Calendar },
    capabilities: [
      { label: "Generate Summary", sublabel: "Key decisions & action items", icon: Brain, color: "hsl(190 100% 50%)" },
      { label: "Extract & Assign Tasks", sublabel: "3 tasks auto-assigned by role", icon: ListTodo, color: "hsl(150 70% 50%)" },
      { label: "Send Follow-up Email", sublabel: "Attendees receive recap in 30s", icon: Mail, color: "hsl(35 95% 55%)" },
    ],
    stats: { handled: 512, avgTime: "1.8s" },
  },
];

const AgentPipeline = () => {
  const [activeAgent, setActiveAgent] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const agent = agents[activeAgent];

  const startAnimation = useCallback(() => {
    setActiveStep(-1);
    setIsComplete(false);
    setIsTransitioning(false);
    let step = 0;
    const interval = setInterval(() => {
      if (step >= agent.capabilities.length) {
        clearInterval(interval);
        setIsComplete(true);
        return;
      }
      setActiveStep(step);
      step++;
    }, 700);
    return () => clearInterval(interval);
  }, [agent.capabilities.length]);

  useEffect(() => {
    const cleanup = startAnimation();
    return cleanup;
  }, [startAnimation, activeAgent]);

  useEffect(() => {
    if (!isComplete) return;
    const timeout = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveAgent((prev) => (prev + 1) % agents.length);
      }, 400);
    }, 3500);
    return () => clearTimeout(timeout);
  }, [isComplete]);

  const selectAgent = (i: number) => {
    if (i === activeAgent) return;
    setIsTransitioning(true);
    setTimeout(() => setActiveAgent(i), 300);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-accent animate-ping opacity-40" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          AI Agents — Always On
        </span>
        <Bot className="w-3.5 h-3.5 text-primary ml-auto" />
      </div>

      {/* Agent selector */}
      <div className="flex gap-1 px-4 pt-4">
        {agents.map((a, i) => (
          <button
            key={a.name}
            onClick={() => selectAgent(i)}
            className={`text-[11px] px-3 py-1.5 rounded-full transition-all duration-300 ${
              i === activeAgent
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Agent identity */}
      <div className="px-5 pt-4 pb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAgent}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="glass rounded-lg px-4 py-3 border border-border/50"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-foreground">{agent.name}</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${agent.status === "active" ? "bg-accent" : "bg-primary"}`} />
                <span className="text-[10px] text-muted-foreground capitalize">{agent.status === "monitoring" ? "Monitoring" : "Active"}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pipeline visualization */}
      <div className="px-5 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAgent}
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-0"
          >
            {/* Trigger */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/30">
                <agent.trigger.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{agent.trigger.label}</p>
                <p className="text-[11px] text-muted-foreground">{agent.trigger.sublabel}</p>
              </div>
              <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                ALWAYS ON
              </div>
            </motion.div>

            {/* Capabilities */}
            {agent.capabilities.map((cap, i) => (
              <div key={`${activeAgent}-${i}`} className="relative">
                <div className="flex items-center pl-5 h-8">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: activeStep >= i ? 1 : 0.3, opacity: activeStep >= i ? 1 : 0.15 }}
                    transition={{ duration: 0.3, delay: activeStep === i ? 0.1 : 0 }}
                    className="w-px h-full origin-top"
                    style={{ backgroundColor: cap.color }}
                  />
                  {activeStep >= i && (
                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                      <ArrowDown className="w-3 h-3 -ml-1.5" style={{ color: cap.color }} />
                    </motion.div>
                  )}
                </div>

                <motion.div
                  initial={{ x: -10, opacity: 0.2 }}
                  animate={{ x: activeStep >= i ? 0 : -5, opacity: activeStep >= i ? 1 : 0.25 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative flex items-center gap-4 rounded-xl px-3 py-3 transition-all duration-300"
                  style={{
                    backgroundColor: activeStep >= i ? `${cap.color}08` : undefined,
                    borderLeft: activeStep >= i ? `2px solid ${cap.color}` : "2px solid transparent",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{ backgroundColor: activeStep >= i ? `${cap.color}18` : "hsl(var(--muted))" }}
                  >
                    {activeStep > i ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="w-4 h-4" style={{ color: cap.color }} />
                      </motion.div>
                    ) : (
                      <cap.icon
                        className="w-4.5 h-4.5 transition-colors duration-300"
                        style={{ color: activeStep >= i ? cap.color : "hsl(var(--muted-foreground))" }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium transition-colors duration-300"
                      style={{ color: activeStep >= i ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                      {cap.label}
                    </p>
                    {activeStep >= i && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-[11px] text-muted-foreground">
                        {cap.sublabel}
                      </motion.p>
                    )}
                  </div>
                  {activeStep >= i && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cap.color }}
                    >
                      <Check className="w-3 h-3 text-background" />
                    </motion.div>
                  )}
                </motion.div>
              </div>
            ))}

            {/* Completion */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex items-center justify-between py-3 px-4 rounded-xl bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{agent.capabilities.length} actions in {agent.stats.avgTime}</span>
                </div>
                <span className="text-xs text-muted-foreground">{agent.stats.handled.toLocaleString()} handled</span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const AutomationBuilderSection = () => {
  return (
    <section id="automation" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            AI Agents
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Agents that work <span className="text-gradient">continuously.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Not just triggered workflows — autonomous AI agents that monitor, decide, and act across all your tools, 24/7.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Agent Pipeline Demo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              See agents in action
            </p>
            <AgentPipeline />
          </motion.div>

          {/* Interactive Agent Builder */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Create your own agent
            </p>
            <WorkflowBuilder />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AutomationBuilderSection;
