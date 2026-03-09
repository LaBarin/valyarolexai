import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroDashboard from "@/assets/hero-dashboard.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/8 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-4xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">AI-Powered Productivity Platform</span>
        </motion.div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
          Your AI
          <br />
          <span className="text-gradient">Executive Assistant</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Elevance replaces six tools with one AI-powered workspace — unified inbox, smart scheduling,
          natural language automation, 50+ integrations, team dashboards, and a voice-guided demo.
          Faster than Zapier. Smarter than the rest.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Button variant="hero" size="lg" className="text-base px-8">
            Get Early Access
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            variant="hero-outline"
            size="lg"
            className="text-base px-8"
            onClick={() => navigate("/demo")}
          >
            See How It Works
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.9, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl mx-auto"
      >
        <div className="relative rounded-xl overflow-hidden glow-border shadow-glow">
          <img
            src={heroDashboard}
            alt="Elevance AI productivity dashboard showing unified inbox, smart calendar, and task management"
            className="w-full h-auto"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
