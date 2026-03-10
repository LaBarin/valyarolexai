import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Zap, Mail, Calendar, FileText, MessageSquare, Check } from "lucide-react";
import WorkflowBuilder from "@/components/WorkflowBuilder";

const workflows = [
  {
    trigger: "Client sends contract request",
    triggerIcon: Mail,
    steps: [
      { label: "Draft reply email", icon: Mail, color: "hsl(190 100% 50%)" },
      { label: "Schedule meeting", icon: Calendar, color: "hsl(150 70% 50%)" },
      { label: "Create proposal doc", icon: FileText, color: "hsl(35 95% 55%)" },
    ],
  },
  {
    trigger: "New lead added to CRM",
    triggerIcon: MessageSquare,
    steps: [
      { label: "Enrich contact data", icon: Zap, color: "hsl(35 95% 55%)" },
      { label: "Send welcome email", icon: Mail, color: "hsl(190 100% 50%)" },
      { label: "Assign to rep", icon: Calendar, color: "hsl(150 70% 50%)" },
    ],
  },
  {
    trigger: "Meeting ends",
    triggerIcon: Calendar,
    steps: [
      { label: "Generate summary", icon: FileText, color: "hsl(150 70% 50%)" },
      { label: "Extract action items", icon: Check, color: "hsl(190 100% 50%)" },
      { label: "Notify team on Slack", icon: MessageSquare, color: "hsl(35 95% 55%)" },
    ],
  },
];

const DemoAnimation = () => {
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= 2) {
          setTimeout(() => {
            setActiveWorkflow((w) => (w + 1) % workflows.length);
            setActiveStep(-1);
          }, 1200);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkflow]);

  const wf = workflows[activeWorkflow];

  return (
    <div className="glass rounded-2xl p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeWorkflow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 glass rounded-xl px-5 py-3 border-primary/30"
          >
            <wf.triggerIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{wf.trigger}</span>
          </motion.div>

          {wf.steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: activeStep >= i ? 32 : 0,
                  opacity: activeStep >= i ? 1 : 0.2,
                }}
                transition={{ duration: 0.3 }}
                className="w-px"
                style={{ backgroundColor: step.color }}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0.3 }}
                animate={{
                  scale: activeStep >= i ? 1 : 0.9,
                  opacity: activeStep >= i ? 1 : 0.3,
                }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center gap-3 glass rounded-xl px-5 py-3 transition-all"
                style={{
                  borderColor: activeStep >= i ? step.color : undefined,
                  borderWidth: activeStep >= i ? 1 : undefined,
                }}
              >
                <step.icon className="w-5 h-5" style={{ color: step.color }} />
                <span className="text-sm font-medium">{step.label}</span>
                {activeStep >= i && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: step.color }}
                  >
                    <Check className="w-3 h-3 text-background" />
                  </motion.div>
                )}
              </motion.div>
            </div>
          ))}

          {activeStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-primary font-medium flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Workflow complete — 3 actions in 2.4 seconds
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
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
            Natural language.<br />
            <span className="text-gradient">Infinite workflows.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Describe what you need in plain English. Valyarolex.AI builds cross-platform automations instantly — no drag-and-drop complexity, no code.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Interactive Workflow Builder */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Try it — type your workflow
            </p>
            <WorkflowBuilder />
          </motion.div>

          {/* Demo Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Example workflows
            </p>
            <DemoAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AutomationBuilderSection;
