import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Mail, Calendar, FileText, MessageSquare, Check, Loader2, Plus, X, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const iconMap: Record<string, React.ElementType> = {
  email: Mail,
  calendar: Calendar,
  document: FileText,
  message: MessageSquare,
  automation: Zap,
};

const colorMap: Record<string, string> = {
  email: "hsl(190 100% 50%)",
  calendar: "hsl(150 70% 50%)",
  document: "hsl(35 95% 55%)",
  message: "hsl(280 70% 60%)",
  automation: "hsl(350 70% 55%)",
};

type WorkflowStep = {
  label: string;
  type: string;
};

type GeneratedWorkflow = {
  trigger: string;
  steps: WorkflowStep[];
  summary: string;
};

const WorkflowBuilder = ({ className = "" }: { className?: string }) => {
  const [prompt, setPrompt] = useState("");
  const [workflow, setWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  const generateWorkflow = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setWorkflow(null);
    setActiveStep(-1);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "workflow",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      let parsed: GeneratedWorkflow;

      try {
        const raw = data.result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("Failed to parse workflow");
      }

      setWorkflow(parsed);
      animateSteps(parsed.steps.length);
    } catch (e: any) {
      toast({
        title: "Workflow Error",
        description: e.message || "Failed to generate workflow",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const animateSteps = (count: number) => {
    setIsAnimating(true);
    setActiveStep(-1);
    let step = 0;
    const interval = setInterval(() => {
      if (step >= count) {
        clearInterval(interval);
        setIsAnimating(false);
        return;
      }
      setActiveStep(step);
      step++;
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      generateWorkflow();
    }
  };

  const clearWorkflow = () => {
    setWorkflow(null);
    setPrompt("");
    setActiveStep(-1);
  };

  return (
    <div className={`glass rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          AI Workflow Builder
        </span>
        {workflow && (
          <button onClick={clearWorkflow} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your workflow in plain English..."
            className="bg-background/50 border-border/50"
            disabled={isGenerating}
          />
          <Button
            onClick={generateWorkflow}
            disabled={!prompt.trim() || isGenerating}
            size="icon"
            className="flex-shrink-0"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {!workflow && !isGenerating && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "When a client emails, auto-draft a reply and schedule a call",
              "After a meeting ends, generate notes and notify the team",
              "When a new lead arrives, enrich data and send welcome email",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setPrompt(suggestion);
                }}
                className="text-xs px-3 py-1.5 rounded-full glass border border-border/50 hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generated Workflow */}
      {(workflow || isGenerating) && (
        <div className="px-4 pb-6">
          {isGenerating && !workflow && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Building your workflow...</p>
            </div>
          )}

          {workflow && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Trigger */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-3 glass rounded-xl px-5 py-3 border border-primary/30"
                >
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{workflow.trigger}</span>
                </motion.div>

                {/* Steps */}
                {workflow.steps.map((step, i) => {
                  const StepIcon = iconMap[step.type] || Zap;
                  const color = colorMap[step.type] || "hsl(190 100% 50%)";

                  return (
                    <div key={i} className="flex flex-col items-center gap-4">
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: activeStep >= i ? 32 : 0,
                          opacity: activeStep >= i ? 1 : 0.2,
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-px"
                        style={{ backgroundColor: color }}
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
                          borderColor: activeStep >= i ? color : undefined,
                          borderWidth: activeStep >= i ? 1 : undefined,
                        }}
                      >
                        <StepIcon className="w-5 h-5" style={{ color }} />
                        <span className="text-sm font-medium">{step.label}</span>
                        {activeStep >= i && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: color }}
                          >
                            <Check className="w-3 h-3 text-background" />
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  );
                })}

                {/* Summary */}
                {activeStep >= workflow.steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-sm text-primary font-medium flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    {workflow.summary}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
