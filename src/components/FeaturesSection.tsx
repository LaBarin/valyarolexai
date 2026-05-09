import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Calendar, Zap, Brain, MessageSquare, BarChart3,
  Bot, FolderKanban, TrendingUp, Workflow, Compass,
  ChevronDown,
} from "lucide-react";

type Feature = {
  icon: typeof Mail;
  title: string;
  description: string;
  section: "Intelligence" | "Productivity" | "Workspace" | "Communication";
};

const features: Feature[] = [
  // --- Top 8 (visible by default) ---
  {
    icon: Bot,
    title: "Agents & Models",
    description: "Spin up specialized AI agents backed by best-in-class models. Pick the right brain for each job — research, writing, analysis, or creative.",
    section: "Intelligence",
  },
  {
    icon: Brain,
    title: "Adaptive Intelligence",
    description: "Learns your energy cycles, work patterns, and preferences. Schedules adapt to how you actually work.",
    section: "Intelligence",
  },
  {
    icon: TrendingUp,
    title: "Trends",
    description: "Real-time intelligence on what's breaking, trending, and converting in your industry — surfaced before the curve.",
    section: "Intelligence",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI scans all calendars, proposes optimal times, protects focus blocks, and dynamically reorganizes your day.",
    section: "Productivity",
  },
  {
    icon: Workflow,
    title: "Workflows",
    description: "Chain agents, tools, and approvals into repeatable, no-code automations triggered by events or natural language.",
    section: "Productivity",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    description: "Group work into living projects with assets, agents, timelines, and progress tracking baked in.",
    section: "Workspace",
  },
  {
    icon: Compass,
    title: "Explore",
    description: "Discover templates, prompts, agents, and community workflows curated for your industry — one click to remix.",
    section: "Workspace",
  },
  {
    icon: Mail,
    title: "Unified Inbox",
    description: "Email, Slack, and Teams messages in one intelligent stream. AI auto-drafts responses and highlights what matters.",
    section: "Communication",
  },

  // --- Remainder (in dropdown) ---
  {
    icon: Zap,
    title: "Workflow Automation",
    description: "Natural language triggers create cross-platform workflows. No code, no complexity—just results.",
    section: "Productivity",
  },
  {
    icon: MessageSquare,
    title: "Natural Language Control",
    description: 'Type or speak commands like "Move non-urgent meetings to next week" and watch it happen instantly.',
    section: "Communication",
  },
  {
    icon: BarChart3,
    title: "Team Workspaces",
    description: "Shared calendars, project dashboards, goal tracking, and AI-powered workload balancing for teams.",
    section: "Workspace",
  },
];

const TOP_COUNT = 8;
const SECTION_ORDER: Feature["section"][] = [
  "Intelligence",
  "Productivity",
  "Workspace",
  "Communication",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const FeatureCard = ({ feature }: { feature: Feature }) => (
  <motion.div
    variants={item}
    className="group glass rounded-xl p-8 hover:border-primary/30 transition-all duration-300"
  >
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:shadow-glow transition-shadow duration-300">
      <feature.icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">
      {feature.description}
    </p>
  </motion.div>
);

const SectionGroup = ({
  section,
  items,
}: {
  section: Feature["section"];
  items: Feature[];
}) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary/80">
          {section}
        </span>
        <span className="h-px flex-1 bg-border/40" />
        <span className="text-[10px] text-muted-foreground/60">
          {items.length} {items.length === 1 ? "feature" : "features"}
        </span>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {items.map((f) => (
          <FeatureCard key={f.title} feature={f} />
        ))}
      </motion.div>
    </div>
  );
};

const FeaturesSection = () => {
  const [expanded, setExpanded] = useState(false);
  const top = features.slice(0, TOP_COUNT);
  const rest = features.slice(TOP_COUNT);

  const groupBySection = (list: Feature[]) =>
    SECTION_ORDER.map((s) => ({ section: s, items: list.filter((f) => f.section === s) }));

  const topGroups = groupBySection(top);
  const restGroups = groupBySection(rest);

  return (
    <section id="features" className="relative py-32 px-6">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            Capabilities
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            One workspace.<br />
            <span className="text-gradient">Every workflow.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stop switching between apps. Valyarolex.AI connects your email, calendar, tasks, and team tools into a single AI-powered command center.
          </p>
        </motion.div>

        <div className="space-y-14">
          {topGroups.map((g) => (
            <SectionGroup key={g.section} section={g.section} items={g.items} />
          ))}
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="more-features"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-14 mt-14">
                {restGroups.map((g) => (
                  <SectionGroup key={g.section} section={g.section} items={g.items} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {rest.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-border/40 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
            >
              <span>
                {expanded ? "Show fewer features" : `Show all ${features.length} features`}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturesSection;
