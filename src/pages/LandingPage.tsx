import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import logo from "@/assets/valyarolex-logo.png";

const OnboardingDemo = lazy(() => import("@/components/OnboardingDemo"));
const ToolBreakdown = lazy(() => import("@/components/ToolBreakdown"));
const AutomationBuilderSection = lazy(() => import("@/components/AutomationBuilderSection"));
const IntegrationsSection = lazy(() => import("@/components/IntegrationsSection"));
const ComparisonSection = lazy(() => import("@/components/ComparisonSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));

const SectionFallback = () => (
  <div className="py-32 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden min-h-[90vh]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/8 blur-[180px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] rounded-full bg-[hsl(35,95%,55%)]/5 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mb-8"
        >
          <div className="relative">
            <img
              src={logo}
              alt="Valyarolex.AI Logo"
              className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-3xl object-cover shadow-glow"
            />
            <div className="absolute inset-0 rounded-3xl glow-border" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative z-10 inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">AI-Powered Productivity Platform</span>
        </motion.div>

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
            Valyarolex.AI unifies six tools into one AI-powered workspace. 
            No drag-and-drop complexity — just plain English.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/signup">
              <Button variant="hero" size="lg" className="text-base px-8 w-full sm:w-auto">
                Get Early Access
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="hero-outline" size="lg" className="text-base px-8 w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="relative z-10 w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: "50+", label: "Integrations", icon: Globe },
            { value: "6→1", label: "Tools Replaced", icon: Zap },
            { value: "2.4s", label: "Avg. Automation", icon: Sparkles },
            { value: "99.9%", label: "Uptime SLA", icon: Shield },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
              className="glass rounded-xl p-4 text-center"
            >
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Interactive Onboarding Demo */}
      <Suspense fallback={<SectionFallback />}>
        <OnboardingDemo />
      </Suspense>

      {/* Full Feature/Tool Breakdown */}
      <Suspense fallback={<SectionFallback />}>
        <ToolBreakdown />
      </Suspense>

      {/* Workflow Builder Showcase */}
      <Suspense fallback={<SectionFallback />}>
        <AutomationBuilderSection />
      </Suspense>

      {/* Integration Marketplace */}
      <Suspense fallback={<SectionFallback />}>
        <IntegrationsSection />
      </Suspense>

      {/* Comparison Table */}
      <Suspense fallback={<SectionFallback />}>
        <ComparisonSection />
      </Suspense>

      {/* Pricing */}
      <Suspense fallback={<SectionFallback />}>
        <PricingSection />
      </Suspense>

      {/* CTA */}
      <Suspense fallback={<SectionFallback />}>
        <CTASection />
      </Suspense>

      {/* Footer */}
      <Suspense fallback={<SectionFallback />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default LandingPage;
