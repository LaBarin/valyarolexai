import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Sparkles, Megaphone, Inbox, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  {
    icon: Palette,
    title: "Set up your Brand Kit",
    description: "Add your logo, colors, fonts, and tagline once — every ad, deck, and campaign uses them automatically.",
    cta: "Open Brand Kit",
    tab: "brandkit",
  },
  {
    icon: Sparkles,
    title: "Make your first ad",
    description: "Describe what you want in plain English. Our AI scripts, scenes, voices, and music it for you.",
    cta: "Open Creative Studio",
    tab: "videos",
  },
  {
    icon: Megaphone,
    title: "Launch a campaign",
    description: "Plan multi-channel campaigns with AI — content calendar, copy, and assets in minutes.",
    cta: "Open Campaigns",
    tab: "campaigns",
  },
  {
    icon: Inbox,
    title: "Centralize your inbox",
    description: "All client messages from email, chat, and socials — answered with AI suggestions.",
    cta: "Open Inbox",
    tab: "inbox",
  },
];

interface Props {
  onNavigate: (tab: string) => void;
}

const OnboardingWizard = ({ onNavigate }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data?.onboarded_at) setOpen(true);
    })();
  }, [user]);

  const finish = async (navigateTo?: string) => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarded_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
    setOpen(false);
    if (navigateTo) setTimeout(() => onNavigate(navigateTo), 300);
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && finish()}>
      <DialogContent className="glass border-border/40 max-w-md p-0 overflow-hidden">
        <button
          onClick={() => finish()}
          className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-primary/80 font-semibold mb-2">
            Step {step + 1} of {steps.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold tracking-tight mb-2">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="p-5 flex items-center justify-between border-t border-border/30">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => finish()}>
              Skip
            </Button>
            <Button
              size="sm"
              onClick={() => (isLast ? finish(current.tab) : setStep(step + 1))}
              className="gap-1.5"
            >
              {isLast ? current.cta : "Next"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
