import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNarrator } from "@/hooks/use-narrator";
import logo from "@/assets/valyarolex-logo.png";

import demoInbox from "@/assets/demo-inbox.jpg";
import demoCalendar from "@/assets/demo-calendar.jpg";
import demoAutomation from "@/assets/demo-automation.jpg";
import demoCommands from "@/assets/demo-commands.jpg";
import demoTeam from "@/assets/demo-team.jpg";
import demoIntegrations from "@/assets/demo-integrations.jpg";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Valyarolex.AI",
    subtitle: "One Workspace. Infinite Intelligence.",
    description:
      "Welcome to the Valyarolex.AI interactive product tour. Valyarolex.AI is a next-generation AI productivity platform that unifies your email, calendar, task management, team collaboration, and AI-powered automation into one intelligent workspace. Over the next slides, we'll walk you through every major feature — including our live AI Assistant and Workflow Builder — showing you exactly how Valyarolex.AI eliminates workflow fragmentation and saves you hours every week. Let's get started.",
    image: null,
    badge: "Getting Started",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    subtitle: "Your always-on productivity co-pilot.",
    description:
      "The Valyarolex.AI Assistant is a real-time, streaming AI chat interface built directly into your dashboard and workspace. Powered by advanced language models, it can draft emails, summarize meeting notes, create task lists, brainstorm ideas, answer questions about your workflow, and execute commands — all through natural conversation. The assistant renders responses with rich markdown formatting, supports quick-prompt shortcuts for common actions, and streams responses token-by-token for instant feedback. It's available on your dashboard for quick queries and in the full workspace for deep work sessions.",
    image: null,
    badge: "Feature 1 of 8",
    highlights: [
      "Streaming AI responses with real-time token rendering",
      "Rich markdown output with code blocks and formatting",
      "Quick-prompt shortcuts for common productivity tasks",
      "Available on dashboard and dedicated workspace page",
    ],
  },
  {
    id: "workflow-builder",
    title: "AI Workflow Builder",
    subtitle: "Describe it. Build it. Automate it.",
    description:
      "The AI Workflow Builder transforms plain English descriptions into visual, executable automation sequences. Simply type what you want automated — like 'When a client emails, draft a reply, schedule a follow-up, and notify the team' — and the AI generates a structured workflow with a trigger event and sequential steps. Each step is visualized with branded icons and animated execution, showing you exactly how your automation will flow. The builder supports email, calendar, document, messaging, and custom automation step types, all generated from a single natural language prompt.",
    image: null,
    badge: "Feature 2 of 8",
    highlights: [
      "Natural language to structured workflow generation",
      "Visual step-by-step execution animation",
      "Supports email, calendar, document, and messaging steps",
      "Quick suggestion prompts for common automation patterns",
    ],
  },
  {
    id: "workspace",
    title: "Unified Workspace",
    subtitle: "Chat + Build, side by side.",
    description:
      "The Workspace page is your dedicated productivity command center, accessible to authenticated users from the navbar or dashboard. It presents the AI Assistant and Workflow Builder in a side-by-side layout, allowing you to have a conversation with your AI co-pilot while simultaneously building automated workflows. This dual-pane design enables a seamless loop: ask the assistant for advice, then immediately translate that advice into an automated workflow — all without switching pages or losing context.",
    image: null,
    badge: "Feature 3 of 8",
    highlights: [
      "Side-by-side AI chat and workflow builder",
      "Authenticated access with protected routes",
      "Seamless context switching between chat and automation",
      "Accessible from navbar and dashboard CTA",
    ],
  },
  {
    id: "inbox",
    title: "Unified Inbox",
    subtitle: "All messages. One intelligent stream.",
    description:
      "The Unified Inbox is your central communication hub. Valyarolex.AI aggregates emails from Gmail and Outlook, instant messages from Slack and Microsoft Teams, and notifications from project management tools — all into a single, AI-prioritized feed. The AI engine automatically drafts responses for routine messages, highlights urgent items using smart categorization, and generates full thread summaries with a single click. You can convert any email or message into an actionable task instantly.",
    image: demoInbox,
    badge: "Feature 4 of 8",
    highlights: [
      "AI-drafted replies for routine emails",
      "Smart priority categorization with urgency scoring",
      "One-click thread summaries for long conversations",
      "Convert emails to tasks with a single action",
    ],
  },
  {
    id: "calendar",
    title: "Smart Scheduling",
    subtitle: "AI that understands your rhythm.",
    description:
      "The Smart Scheduling engine is powered by AI that understands your energy cycles and work patterns. It scans all participants' calendars across time zones and proposes optimal meeting times based on availability, workload balance, and energy levels. Focus blocks are automatically protected during your peak productivity hours, and the AI dynamically reorganizes your entire day when unexpected changes occur.",
    image: demoCalendar,
    badge: "Feature 5 of 8",
    highlights: [
      "Cross-timezone availability scanning for all participants",
      "Energy-based focus block protection during peak hours",
      "Dynamic schedule reorganization when plans change",
      "Meeting fatigue prevention with smart spacing",
    ],
  },
  {
    id: "automation",
    title: "Visual Automation Engine",
    subtitle: "Natural language triggers. Zero code.",
    description:
      'Beyond the AI Workflow Builder, the Visual Automation Engine provides a full drag-and-drop interface for creating complex, multi-step automations that chain actions across email, calendar, CRM, document tools, and team messaging platforms. The landing page showcases a live interactive demo of this engine, allowing visitors to experience the power of automation before signing up.',
    image: demoAutomation,
    badge: "Feature 6 of 8",
    highlights: [
      "Visual drag-and-drop flow builder",
      "Natural language workflow creation with AI",
      "Cross-platform action chains across 12+ tools",
      "Live interactive demo on the landing page",
    ],
  },
  {
    id: "commands",
    title: "Natural Language Control",
    subtitle: "Just tell Valyarolex.AI what you need.",
    description:
      'Natural Language Control puts the full power of Valyarolex.AI at your fingertips through voice or text commands. Type or speak commands like "Move all non-urgent meetings to next week," "Prepare tomorrow\'s schedule with two-hour focus blocks," or "Summarize all unread Slack messages." The AI understands context, handles batch operations with a single sentence, and executes instantly.',
    image: demoCommands,
    badge: "Feature 7 of 8",
    highlights: [
      "Voice and text command support with natural language",
      "Instant schedule reorganization with smart reasoning",
      "Batch operations across tools with one sentence",
      "Context-aware AI that learns your preferences",
    ],
  },
  {
    id: "integrations",
    title: "Deep Integrations",
    subtitle: "Connects to everything you use.",
    description:
      "Valyarolex.AI integrates deeply with over twelve enterprise tools including Gmail, Outlook, Slack, Microsoft Teams, Zoom, Google Meet, Salesforce, HubSpot, Notion, Asana, Jira, and more. All connections use secure OAuth authentication and sync bidirectionally in real-time. Setup requires zero configuration — just connect your accounts and Valyarolex.AI handles the rest.",
    image: demoIntegrations,
    badge: "Feature 8 of 8",
    highlights: [
      "12+ enterprise tool integrations out of the box",
      "Real-time bidirectional sync across all platforms",
      "Secure OAuth connections with encrypted data",
      "Zero-configuration setup — connect and go",
    ],
  },
  {
    id: "conclusion",
    title: "Ready to Transform?",
    subtitle: "One Workspace. Infinite Intelligence.",
    description:
      "That concludes our tour of Valyarolex.AI. To recap: a live AI Assistant for instant productivity, an AI Workflow Builder that turns plain English into automations, a unified Workspace for chat + build side by side, smart scheduling, unified inbox, deep integrations, and natural language control — all powered by an AI engine that continuously learns your work style. Sign up today for early access.",
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

  const { isNarrating, startNarration, stopNarration } = useNarrator({
    onStepChange: setCurrentStep,
    totalSteps: steps.length,
  });

  const goNext = useCallback(() => {
    setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const restart = useCallback(() => {
    setCurrentStep(0);
    setIsAutoPlaying(false);
    stopNarration();
  }, [stopNarration]);

  const toggleNarration = useCallback(() => {
    if (isNarrating) {
      stopNarration();
    } else {
      setIsAutoPlaying(false);
      startNarration(steps, currentStep);
    }
  }, [isNarrating, stopNarration, startNarration, currentStep]);

  useEffect(() => {
    if (!isAutoPlaying || isNarrating) return;
    if (isLast) {
      setIsAutoPlaying(false);
      return;
    }
    const timer = setTimeout(goNext, AUTOPLAY_INTERVAL);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStep, isLast, goNext, isNarrating]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (!isNarrating) goNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (!isNarrating) goPrev();
      }
      if (e.key === "Escape") {
        stopNarration();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, navigate, isNarrating, stopNarration]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <button
          onClick={() => {
            stopNarration();
            navigate("/");
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <div className="flex items-center gap-2">
            <img src={logo} alt="Valyarolex.AI" className="w-14 h-14 rounded-md object-cover" />
            <span className="font-semibold text-foreground hidden sm:inline">Valyarolex.AI</span>
          </div>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={isNarrating ? "default" : "ghost"}
            size="sm"
            onClick={toggleNarration}
            className="gap-1.5"
            title="AI Voice Narrator"
          >
            {isNarrating ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isNarrating ? "Stop Narrator" : "Narrate"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isNarrating) stopNarration();
              setIsAutoPlaying(!isAutoPlaying);
            }}
            className="gap-1.5"
            disabled={isNarrating}
          >
            {isAutoPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isAutoPlaying ? "Pause" : "Auto-play"}
            </span>
          </Button>
          <Button variant="ghost" size="sm" onClick={restart} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
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
        {isNarrating && (
          <motion.div
            className="absolute right-0 top-0 h-full w-2 bg-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="lg:w-[440px] xl:w-[500px] flex-shrink-0 flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-8 lg:py-0 border-b lg:border-b-0 lg:border-r border-border">
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                {step.title}
              </h1>
              <p className="text-base sm:text-lg text-primary/80 font-medium mb-4">
                {step.subtitle}
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6 text-sm sm:text-base">
                {step.description}
              </p>

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
                  <Button variant="hero" size="lg" onClick={() => navigate("/signup")}>
                    Get Early Access
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-4 mt-8 lg:mt-12">
            <Button
              variant="hero-outline"
              size="sm"
              onClick={goPrev}
              disabled={isFirst || isNarrating}
              className="gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => !isNarrating && setCurrentStep(i)}
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
              disabled={isLast || isNarrating}
              className="gap-1.5"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
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
                    alt={`${step.title} - Valyarolex.AI feature screen`}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 sm:py-20">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden mb-8 shadow-glow"
                  >
                    <img src={logo} alt="Valyarolex.AI" className="w-full h-full object-cover" />
                  </motion.div>
                  <p className="text-muted-foreground text-base sm:text-lg max-w-md px-4">
                    {isFirst
                      ? 'Click "Next" or press → to begin. Or try the voice narrator!'
                      : isLast
                      ? "Start your journey with Valyarolex.AI today."
                      : "This feature is built into your live workspace."}
                  </p>
                  {isFirst && (
                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                      <Button variant="hero" size="lg" onClick={goNext}>
                        Start Tour
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                      <Button
                        variant="hero-outline"
                        size="lg"
                        onClick={toggleNarration}
                      >
                        <Volume2 className="mr-2 w-4 h-4" />
                        Narrated Tour
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

      <div className="hidden lg:flex items-center justify-center gap-1 py-3 border-t border-border">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => !isNarrating && setCurrentStep(i)}
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
