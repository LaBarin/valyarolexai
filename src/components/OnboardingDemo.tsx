import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Calendar, Zap, Brain, MessageSquare, BarChart3, 
  Play, ChevronRight, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const demoSteps = [
  {
    id: "inbox",
    icon: Mail,
    label: "Unified Inbox",
    title: "All your messages, one stream",
    description: "Gmail, Slack, Teams — AI-prioritized. Auto-drafted replies for routine messages.",
    color: "hsl(190 100% 50%)",
    demo: (
      <div className="space-y-3">
        {[
          { from: "Sarah Chen", subject: "Q3 Budget Approval", tag: "Urgent", tagColor: "hsl(0 84% 60%)" },
          { from: "Slack #product", subject: "New feature discussion", tag: "Team", tagColor: "hsl(150 70% 50%)" },
          { from: "GitHub", subject: "PR #247 merged", tag: "Dev", tagColor: "hsl(280 70% 60%)" },
        ].map((msg, i) => (
          <motion.div
            key={msg.from}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="glass rounded-lg p-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
              {msg.from[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{msg.from}</p>
              <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
            </div>
            <span 
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${msg.tagColor}20`, color: msg.tagColor }}
            >
              {msg.tag}
            </span>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 text-xs text-primary mt-2"
        >
          <Sparkles className="w-3 h-3" />
          <span>AI drafted 2 replies — review & send</span>
        </motion.div>
      </div>
    ),
  },
  {
    id: "scheduling",
    icon: Calendar,
    label: "Smart Schedule",
    title: "AI that adapts to your rhythm",
    description: "Scans calendars, protects focus time, and reorganizes when plans change.",
    color: "hsl(150 70% 50%)",
    demo: (
      <div className="space-y-2">
        {[
          { time: "9:00 AM", event: "Deep Work Block", type: "focus", width: "100%" },
          { time: "11:30 AM", event: "Team Standup", type: "meeting", width: "40%" },
          { time: "1:00 PM", event: "Client Call — rescheduled by AI", type: "ai", width: "60%" },
          { time: "3:00 PM", event: "Review Sprint Backlog", type: "task", width: "50%" },
        ].map((block, i) => (
          <motion.div
            key={block.time}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: i * 0.12, duration: 0.4 }}
            style={{ transformOrigin: "left" }}
            className="flex items-center gap-3"
          >
            <span className="text-[11px] text-muted-foreground w-16 flex-shrink-0">{block.time}</span>
            <div
              className="rounded-md px-3 py-2 text-xs font-medium flex-1"
              style={{
                maxWidth: block.width,
                backgroundColor: block.type === "focus" 
                  ? "hsl(190 100% 50% / 0.15)" 
                  : block.type === "ai" 
                  ? "hsl(35 95% 55% / 0.15)"
                  : block.type === "meeting"
                  ? "hsl(150 70% 50% / 0.15)"
                  : "hsl(280 70% 60% / 0.15)",
                color: block.type === "focus" 
                  ? "hsl(190 100% 50%)" 
                  : block.type === "ai" 
                  ? "hsl(35 95% 55%)"
                  : block.type === "meeting"
                  ? "hsl(150 70% 50%)"
                  : "hsl(280 70% 60%)",
              }}
            >
              {block.event}
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "automation",
    icon: Zap,
    label: "Automation",
    title: "Plain English → workflows",
    description: "Describe what you need. AI builds cross-platform automations instantly.",
    color: "hsl(35 95% 55%)",
    demo: (
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-lg p-3 text-xs text-muted-foreground italic border-primary/20"
        >
          "When a client sends a contract request, draft a reply, schedule a meeting, and create a proposal doc"
        </motion.div>
        {[
          { label: "Draft reply email", color: "hsl(190 100% 50%)" },
          { label: "Schedule meeting", color: "hsl(150 70% 50%)" },
          { label: "Create proposal doc", color: "hsl(35 95% 55%)" },
        ].map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-px h-4 ml-6" style={{ backgroundColor: step.color }} />
            <div className="glass rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2" style={{ borderColor: `${step.color}40` }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
              {step.label}
            </div>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-primary flex items-center gap-1.5 ml-6"
        >
          <Zap className="w-3 h-3" /> 3 actions in 2.4s
        </motion.div>
      </div>
    ),
  },
  {
    id: "ai",
    icon: Brain,
    label: "AI Commands",
    title: "Just tell it what you need",
    description: "Natural language control for everything — email, calendar, tasks, and more.",
    color: "hsl(280 70% 60%)",
    demo: (
      <div className="space-y-3">
        {[
          { cmd: "Move non-urgent meetings to next week", result: "✓ 3 meetings rescheduled" },
          { cmd: "Summarize unread Slack messages", result: "✓ 12 messages summarized" },
          { cmd: "Block 2 hours for deep work tomorrow", result: "✓ 2pm-4pm blocked" },
        ].map((item, i) => (
          <motion.div
            key={item.cmd}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
          >
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-foreground mb-1">"{item.cmd}"</p>
              <p className="text-[11px] text-primary">{item.result}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "team",
    icon: BarChart3,
    label: "Team Dashboard",
    title: "Collaborate with clarity",
    description: "Shared calendars, project dashboards, goal tracking, and AI workload balancing.",
    color: "hsl(150 70% 50%)",
    demo: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Tasks Done", value: "47", change: "+12%" },
            { label: "Focus Hours", value: "18h", change: "+8%" },
            { label: "Automations", value: "23", change: "+34%" },
            { label: "Team Score", value: "94", change: "+5%" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-lg p-3 text-center"
            >
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="text-[10px] text-primary">{stat.change}</p>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
];

const OnboardingDemo = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(true);

  useEffect(() => {
    if (!isAutoplaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % demoSteps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoplaying]);

  const current = demoSteps[activeStep];

  return (
    <section className="relative py-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            Interactive Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            See it in <span className="text-gradient">action</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Experience every feature before you sign up. No account needed.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 max-w-5xl mx-auto">
          {/* Step tabs */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {demoSteps.map((step, i) => (
              <button
                key={step.id}
                onClick={() => {
                  setActiveStep(i);
                  setIsAutoplaying(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 flex-shrink-0 ${
                  i === activeStep
                    ? "glass border-primary/30 shadow-glow"
                    : "hover:bg-muted/30"
                }`}
              >
                <step.icon
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: i === activeStep ? step.color : undefined }}
                />
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${i === activeStep ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate hidden lg:block">
                    {step.title}
                  </p>
                </div>
                {i === activeStep && (
                  <ChevronRight className="w-4 h-4 text-primary ml-auto hidden lg:block" />
                )}
              </button>
            ))}

            <Link to="/demo" className="mt-2 hidden lg:block">
              <Button variant="hero-outline" size="sm" className="w-full gap-2">
                <Play className="w-3.5 h-3.5" /> Full Guided Tour
              </Button>
            </Link>
          </div>

          {/* Demo panel */}
          <div className="glass rounded-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${current.color}15` }}
                  >
                    <current.icon className="w-5 h-5" style={{ color: current.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{current.title}</h3>
                    <p className="text-sm text-muted-foreground">{current.description}</p>
                  </div>
                </div>

                <div className="mt-6">{current.demo}</div>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex items-center justify-between px-6 pb-4">
              <div className="flex gap-1.5">
                {demoSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === activeStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
              <Link to="/signup">
                <Button variant="hero" size="sm" className="gap-1.5">
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnboardingDemo;
