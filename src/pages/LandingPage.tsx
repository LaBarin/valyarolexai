import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/valyarolex-logo.png";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
        <div className="container max-w-6xl mx-auto glass rounded-full px-5 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Valyarolex.AI" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-bold tracking-tight">Valyarolex.AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Get Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/8 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <motion.img
            src={logo}
            alt="Valyarolex.AI Logo"
            className="w-24 h-24 rounded-2xl object-cover mx-auto mb-8 shadow-glow"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">AI-Powered Productivity Platform</span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
            One Workspace.
            <br />
            <span className="text-gradient">Infinite Intelligence.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Valyarolex.AI replaces six tools with one AI-powered workspace — unified inbox, smart scheduling,
            natural language automation, 50+ integrations, team dashboards, and a voice-guided demo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
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
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Replace 6 productivity tools with one unified AI workspace that adapts to your workflow.",
            },
            {
              icon: Shield,
              title: "Enterprise Secure",
              description: "Bank-grade encryption, SOC 2 compliance, and granular access controls for your team.",
            },
            {
              icon: Globe,
              title: "50+ Integrations",
              description: "Deep integrations with Gmail, Slack, Salesforce, GitHub, and dozens more — zero config.",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
              className="glass rounded-xl p-6 text-center hover:border-primary/30 hover:shadow-glow transition-all duration-300"
            >
              <card.icon className="w-8 h-8 text-primary mx-auto mb-4" />
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
