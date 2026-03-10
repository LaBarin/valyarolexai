import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const AutomationBuilderSection = lazy(() => import("@/components/AutomationBuilderSection"));
const IntegrationsSection = lazy(() => import("@/components/IntegrationsSection"));
const ComparisonSection = lazy(() => import("@/components/ComparisonSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));

const SectionFallback = () => (
  <div className="py-32 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container max-w-6xl mx-auto"
        >
          <div className="glass rounded-2xl p-8 md:p-10">
            <p className="text-sm text-muted-foreground mb-1">Welcome back,</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {displayName} <span className="text-gradient">👋</span>
            </h1>
          </div>
        </motion.div>
      </div>

      <Suspense fallback={<SectionFallback />}>
        <FeaturesSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <AutomationBuilderSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <IntegrationsSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <ComparisonSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <PricingSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <CTASection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Dashboard;
