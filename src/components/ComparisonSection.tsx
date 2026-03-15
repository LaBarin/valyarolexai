import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const capabilities = [
  "Unified inbox (email + chat)",
  "AI-powered scheduling",
  "Natural language commands",
  "Cross-app automation",
  "No-code workflow builder",
  "Team workspaces & dashboards",
  "Behavioral learning / adaptive AI",
  "Meeting summaries & action items",
  "CRM & project tool sync",
  "Zero configuration setup",
];

const ComparisonSection = () => {
  return (
    <section id="comparison" className="relative py-32 px-6">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            Why Valyarolex.AI
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Everything you need, <span className="text-gradient">built in</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AI scheduling, automation, inbox, and team collaboration — all in a single workspace. No stitching tools together.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass rounded-2xl overflow-hidden p-8"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{cap}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>
                <span className="text-primary font-semibold">10 core capabilities</span> — all AI-powered, all working together
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
