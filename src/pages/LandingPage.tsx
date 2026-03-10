import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/valyarolex-logo.png";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Full-width hero with large logo */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-16 pb-20 overflow-hidden min-h-screen">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/8 blur-[180px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] rounded-full bg-[hsl(35,95%,55%)]/5 blur-[100px] pointer-events-none" />

        {/* Large logo at top */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mb-10"
        >
          <div className="relative">
            <img
              src={logo}
              alt="Valyarolex.AI Logo"
              className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-3xl object-cover shadow-glow"
            />
            <div className="absolute inset-0 rounded-3xl glow-border" />
          </div>
        </motion.div>

        {/* Brand name */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative z-10 text-2xl sm:text-3xl font-bold tracking-tight mb-6 text-gradient"
        >
          Valyarolex.AI
        </motion.h2>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative z-10 inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">AI-Powered Productivity Platform</span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
            One Workspace.
            <br />
            <span className="text-gradient">Infinite Intelligence.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Valyarolex.AI replaces six tools with one AI-powered workspace — unified inbox, smart scheduling,
            natural language automation, 50+ integrations, team dashboards, and a voice-guided demo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link to="/signup">
              <Button variant="hero" size="lg" className="text-base px-8 w-full sm:w-auto">
                Get Early Access
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="hero-outline" size="lg" className="text-base px-8 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* About cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Replace 6 productivity tools with one unified AI workspace that adapts to your workflow.",
              color: "text-primary",
            },
            {
              icon: Shield,
              title: "Enterprise Secure",
              description: "Bank-grade encryption, SOC 2 compliance, and granular access controls for your team.",
              color: "text-accent",
            },
            {
              icon: Globe,
              title: "50+ Integrations",
              description: "Deep integrations with Gmail, Slack, Salesforce, GitHub, and dozens more — zero config.",
              color: "text-[hsl(35,95%,55%)]",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
              className="glass rounded-xl p-6 text-center hover:border-primary/30 hover:shadow-glow transition-all duration-300"
            >
              <card.icon className={`w-8 h-8 ${card.color} mx-auto mb-4`} />
              <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Valyarolex.AI" className="w-5 h-5 rounded object-cover" />
            <span>© 2026 Valyarolex.AI. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">Get Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
