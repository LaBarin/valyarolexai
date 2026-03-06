import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Play, Pause, RotateCcw, Zap, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import demoInbox from "@/assets/demo-inbox.jpg";
import demoCalendar from "@/assets/demo-calendar.jpg";
import demoAutomation from "@/assets/demo-automation.jpg";
import demoCommands from "@/assets/demo-commands.jpg";
import demoTeam from "@/assets/demo-team.jpg";
import demoIntegrations from "@/assets/demo-integrations.jpg";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Elevance",
    subtitle: "Your AI Executive Assistant",
    description:
      "Elevance unifies email, calendar, and team workflows into one intelligent workspace. Let's walk through the key features that will transform how you work.",
    image: null,
    badge: "Getting Started",
  },
  {
    id: "inbox",
    title: "Unified Inbox",
    subtitle: "All messages. One intelligent stream.",
    description:
      "Elevance aggregates emails, Slack messages, and Teams notifications into a single prioritized feed. The AI auto-drafts responses for routine messages, highlights urgent items with smart categorization, and generates thread summaries so you never miss what matters.",
    image: demoInbox,
    badge: "Feature 1 of 6",
    highlights: [
      "AI-drafted replies for routine emails",
      "Smart priority categorization",
      "Thread summaries in one click",
      "Convert emails to actionable tasks",
    ],
  },
  {
    id: "calendar",
    title: "Smart Scheduling",
    subtitle: "AI that understands your rhythm.",
    description:
      "The scheduling engine scans all participants' calendars and proposes optimal meeting times based on availability, time zones, and workload balance. Focus blocks are automatically protected during your peak energy hours, and the AI dynamically reorganizes your day when changes occur.",
    image: demoCalendar,
    badge: "Feature 2 of 6",
    highlights: [
      "Cross-timezone availability scanning",
      "Energy-based focus block protection",
      "Dynamic schedule reorganization",
      "Meeting fatigue prevention",
    ],
  },
  {
    id: "automation",
    title: "Workflow Automation",
    subtitle: "Natural language triggers. Zero code.",
    description:
      'Create powerful cross-platform workflows using simple natural language. For example: "When a client sends a contract request, draft a reply, schedule a meeting, and create a proposal document." The visual automation builder connects your tools without any technical complexity.',
    image: demoAutomation,
    badge: "Feature 3 of 6",
    highlights: [
      "Visual flow builder with drag & drop",
      "Natural language workflow creation",
      "Cross-platform action chains",
      "CRM and document automation",
    ],
  },
  {
    id: "commands",
    title: "Natural Language Control",
    subtitle: "Just tell Elevance what you need.",
    description:
      'Manage your entire workday by typing or speaking natural commands. Say "Move non-urgent meetings to next week" or "Prepare tomorrow\'s schedule with focus blocks" and watch Elevance execute instantly. No menus, no clicks — just results.',
    image: demoCommands,
    badge: "Feature 4 of 6",
    highlights: [
      "Voice and text command support",
      "Instant schedule reorganization",
      "Batch operations with one sentence",
      "Context-aware AI understanding",
    ],
  },
  {
    id: "team",
    title: "Team Workspaces",
    subtitle: "Collaboration without the chaos.",
    description:
      "Shared workspaces let teams coordinate effortlessly with real-time calendars, project dashboards, and AI-powered workload balancing. When a team member becomes overloaded, Elevance recommends task redistribution to maintain productivity across the entire team.",
    image: demoTeam,
    badge: "Feature 5 of 6",
    highlights: [
      "Real-time team calendars",
      "Workload monitoring & balancing",
      "Automated progress tracking",
      "Smart task redistribution",
    ],
  },
  {
    id: "integrations",
    title: "Deep Integrations",
    subtitle: "Connects to everything you use.",
    description:
      "Elevance integrates with Gmail, Outlook, Slack, Teams, Zoom, Salesforce, HubSpot, Notion, Asana, and more. All connections sync in real-time with secure OAuth, ensuring your data flows seamlessly across every tool your team relies on.",
    image: demoIntegrations,
    badge: "Feature 6 of 6",
    highlights: [
      "12+ enterprise tool integrations",
      "Real-time bidirectional sync",
      "Secure OAuth connections",
      "Zero-configuration setup",
    ],
  },
  {
    id: "conclusion",
    title: "Ready to Elevate?",
    subtitle: "Replace busywork with intelligence.",
    description:
      "Elevance replaces six hours of weekly administrative work with one intelligent workspace. Less switching, fewer meetings, smarter scheduling, and improved team alignment — all powered by AI that learns your unique work style.",
    image: null,
    badge: "Get Started",
  },
];

const AUTOPLAY_INTERVAL = 8000;

const DemoPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const goNext = useCallback(() => {
    setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const restart = useCallback(() => {
    setCurrentStep(0);
    setIsAutoPlaying(false);
  }, []);

  // Autoplay
  useEffect(() => {
    if (!isAutoPlaying) return;
    if (isLast) {
      setIsAutoPlaying(false);
      return;
    }
    const timer = setTimeout(goNext, AUTOPLAY_INTERVAL);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStep, isLast, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "Escape") {
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Elevance</span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="gap-1.5"
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutoPlaying ? "Pause" : "Auto-play"}
          </Button>
          <Button variant="ghost" size="sm" onClick={restart} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </Button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted relative">
        <motion.div
          className="h-full bg-gradient-primary"
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel — info */}
        <div className="lg:w-[440px] xl:w-[500px] flex-shrink-0 flex flex-col justify-center px-8 lg:px-12 py-10 lg:py-0 border-b lg:border-b-0 lg:border-r border-border">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
            >
              <span className="text-xs font-medium tracking-widest uppercase text-primary mb-4 block">
                {step.badge}
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                {step.title}
              </h1>
              <p className="text-lg text-primary/80 font-medium mb-4">{step.subtitle}</p>
              <p className="text-muted-foreground leading-relaxed mb-6">{step.description}</p>

              {step.highlights && (
                <ul className="space-y-2.5 mb-8">
                  {step.highlights.map((h, i) => (
                    <motion.li
                      key={h}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="flex items-center gap-3 text-sm text-secondary-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {h}
                    </motion.li>
                  ))}
                </ul>
              )}

              {isLast && (
                <div className="flex gap-3 mt-4">
                  <Button variant="hero" size="lg" onClick={() => navigate("/")}>
                    Get Early Access
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Step navigation */}
          <div className="flex items-center gap-4 mt-8 lg:mt-12">
            <Button
              variant="hero-outline"
              size="sm"
              onClick={goPrev}
              disabled={isFirst}
              className="gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="hero"
              size="sm"
              onClick={goNext}
              disabled={isLast}
              className="gap-1.5"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Right panel — screen preview */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative w-full max-w-4xl"
            >
              {step.image ? (
                <div className="relative rounded-xl overflow-hidden glow-border shadow-glow">
                  <img
                    src={step.image}
                    alt={`${step.title} - Elevance feature screen`}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-20">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center mb-8 shadow-glow"
                  >
                    <Zap className="w-12 h-12 text-primary-foreground" />
                  </motion.div>
                  <p className="text-muted-foreground text-lg max-w-md">
                    {isFirst
                      ? 'Click "Next" or press the right arrow key to begin the walkthrough.'
                      : "Start your journey with Elevance today."}
                  </p>
                  {isFirst && (
                    <div className="flex gap-3 mt-8">
                      <Button variant="hero" size="lg" onClick={goNext}>
                        Start Tour
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                      <Button
                        variant="hero-outline"
                        size="lg"
                        onClick={() => setIsAutoPlaying(true)}
                      >
                        <Play className="mr-2 w-4 h-4" />
                        Auto-play
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sidebar step list (desktop) */}
      <div className="hidden lg:flex items-center justify-center gap-1 py-3 border-t border-border">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              i === currentStep
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DemoPage;
