import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  Zap, Mail, Brain, ListTodo, Calendar, BarChart3, Check, ArrowDown,
  Bell, Users, ChevronRight, Sparkles
} from "lucide-react";
import WorkflowBuilder from "@/components/WorkflowBuilder";

type PipelineStep = {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  colorVar: string; // semantic token name
  color: string; // actual hsl for inline styles
};

type WorkflowDemo = {
  title: string;
  prompt: string;
  trigger: { label: string; sublabel: string; icon: React.ElementType };
  steps: PipelineStep[];
  result: string;
};

const demos: WorkflowDemo[] = [
  {
    title: "Lead → Meeting → CRM",
    prompt: "When a new lead arrives, schedule a meeting and notify sales.",
    trigger: { label: "New Lead Email", sublabel: "Trigger: Inbox receives lead", icon: Mail },
    steps: [
      { label: "AI Reads Email", sublabel: "Extracts name, company, intent", icon: Brain, colorVar: "primary", color: "hsl(190 100% 50%)" },
      { label: "Create Task", sublabel: "High-priority follow-up assigned", icon: ListTodo, colorVar: "accent", color: "hsl(150 70% 50%)" },
      { label: "Schedule Meeting", sublabel: "Optimal slot found in 0.8s", icon: Calendar, colorVar: "primary", color: "hsl(35 95% 55%)" },
      { label: "Update CRM", sublabel: "Salesforce contact enriched", icon: BarChart3, colorVar: "primary", color: "hsl(280 70% 60%)" },
      { label: "Notify Sales Team", sublabel: "Slack #sales-leads channel", icon: Bell, colorVar: "accent", color: "hsl(190 100% 50%)" },
    ],
    result: "5 actions completed in 2.1 seconds",
  },
  {
    title: "Meeting → Notes → Tasks",
    prompt: "After a meeting ends, summarize, extract tasks, and notify attendees.",
    trigger: { label: "Meeting Ended", sublabel: "Trigger: Calendar event complete", icon: Calendar },
    steps: [
      { label: "Generate Summary", sublabel: "Key points extracted by AI", icon: Brain, colorVar: "primary", color: "hsl(190 100% 50%)" },
      { label: "Extract Action Items", sublabel: "3 tasks identified", icon: ListTodo, colorVar: "accent", color: "hsl(150 70% 50%)" },
      { label: "Assign to Team", sublabel: "Auto-assigned by expertise", icon: Users, colorVar: "primary", color: "hsl(35 95% 55%)" },
      { label: "Send Follow-up", sublabel: "Email sent to all attendees", icon: Mail, colorVar: "primary", color: "hsl(280 70% 60%)" },
    ],
    result: "4 actions completed in 1.8 seconds",
  },
  {
    title: "Daily Standup Automation",
    prompt: "Every morning, compile team updates and send a digest.",
    trigger: { label: "9:00 AM Daily", sublabel: "Trigger: Scheduled cron", icon: Zap },
    steps: [
      { label: "Scan Team Tasks", sublabel: "23 tasks across 5 members", icon: ListTodo, colorVar: "primary", color: "hsl(190 100% 50%)" },
      { label: "AI Compiles Digest", sublabel: "Blockers & wins summarized", icon: Brain, colorVar: "accent", color: "hsl(150 70% 50%)" },
      { label: "Post to Slack", sublabel: "#team-standup channel", icon: Bell, colorVar: "primary", color: "hsl(35 95% 55%)" },
    ],
    result: "3 actions completed in 1.2 seconds",
  },
];

const VisualPipeline = () => {
  const [activeDemo, setActiveDemo] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const demo = demos[activeDemo];

  const startAnimation = useCallback(() => {
    setActiveStep(-1);
    setIsComplete(false);
    setIsTransitioning(false);
    let step = 0;
    const interval = setInterval(() => {
      if (step >= demo.steps.length) {
        clearInterval(interval);
        setIsComplete(true);
        return;
      }
      setActiveStep(step);
      step++;
    }, 700);
    return () => clearInterval(interval);
  }, [demo.steps.length]);

  useEffect(() => {
    const cleanup = startAnimation();
    return cleanup;
  }, [startAnimation, activeDemo]);

  // Auto-cycle demos
  useEffect(() => {
    if (!isComplete) return;
    const timeout = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveDemo((prev) => (prev + 1) % demos.length);
      }, 400);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [isComplete]);

  const selectDemo = (i: number) => {
    if (i === activeDemo) return;
    setIsTransitioning(true);
    setTimeout(() => setActiveDemo(i), 300);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Visual Workflow Engine
        </span>
        <Sparkles className="w-3.5 h-3.5 text-primary ml-auto" />
      </div>

      {/* Demo selector tabs */}
      <div className="flex gap-1 px-4 pt-4">
        {demos.map((d, i) => (
          <button
            key={d.title}
            onClick={() => selectDemo(i)}
            className={`text-[11px] px-3 py-1.5 rounded-full transition-all duration-300 ${
              i === activeDemo
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      {/* Prompt display */}
      <div className="px-5 pt-4 pb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDemo}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="glass rounded-lg px-4 py-3 border border-border/50"
          >
            <p className="text-xs text-muted-foreground mb-1">Natural language input:</p>
            <p className="text-sm font-medium text-foreground">"{demo.prompt}"</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pipeline visualization */}
      <div className="px-5 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDemo}
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-0"
          >
            {/* Trigger node */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative flex items-center gap-4 group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/30">
                <demo.trigger.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{demo.trigger.label}</p>
                <p className="text-[11px] text-muted-foreground">{demo.trigger.sublabel}</p>
              </div>
              <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                TRIGGER
              </div>
            </motion.div>

            {/* Steps */}
            {demo.steps.map((step, i) => (
              <div key={`${activeDemo}-${i}`} className="relative">
                {/* Connector line */}
                <div className="flex items-center pl-5 h-8">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{
                      scaleY: activeStep >= i ? 1 : 0.3,
                      opacity: activeStep >= i ? 1 : 0.15,
                    }}
                    transition={{ duration: 0.3, delay: activeStep === i ? 0.1 : 0 }}
                    className="w-px h-full origin-top"
                    style={{ backgroundColor: step.color }}
                  />
                  {activeStep >= i && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ArrowDown className="w-3 h-3 -ml-1.5" style={{ color: step.color }} />
                    </motion.div>
                  )}
                </div>

                {/* Step node */}
                <motion.div
                  initial={{ x: -10, opacity: 0.2 }}
                  animate={{
                    x: activeStep >= i ? 0 : -5,
                    opacity: activeStep >= i ? 1 : 0.25,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative flex items-center gap-4 rounded-xl px-3 py-3 transition-all duration-300"
                  style={{
                    backgroundColor: activeStep >= i ? `${step.color}08` : undefined,
                    borderLeft: activeStep >= i ? `2px solid ${step.color}` : "2px solid transparent",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: activeStep >= i ? `${step.color}18` : "hsl(var(--muted))",
                    }}
                  >
                    {activeStep > i ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="w-4 h-4" style={{ color: step.color }} />
                      </motion.div>
                    ) : (
                      <step.icon
                        className="w-4.5 h-4.5 transition-colors duration-300"
                        style={{ color: activeStep >= i ? step.color : "hsl(var(--muted-foreground))" }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium transition-colors duration-300"
                      style={{ color: activeStep >= i ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                    >
                      {step.label}
                    </p>
                    {activeStep >= i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-[11px] text-muted-foreground"
                      >
                        {step.sublabel}
                      </motion.p>
                    )}
                  </div>
                  {activeStep >= i && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: step.color }}
                    >
                      <Check className="w-3 h-3 text-background" />
                    </motion.div>
                  )}
                </motion.div>
              </div>
            ))}

            {/* Completion banner */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/20"
              >
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{demo.result}</span>
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
            Automation Engine
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Describe it. <span className="text-gradient">AI builds it.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Type what you need in plain English. Valyarolex.AI orchestrates multi-step workflows across all your tools — instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Visual Pipeline Demo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Watch it work
            </p>
            <VisualPipeline />
          </motion.div>

          {/* Interactive Workflow Builder */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Try it — type your workflow
            </p>
            <WorkflowBuilder />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AutomationBuilderSection;
