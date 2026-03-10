import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";

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
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-6">
        <div className="container max-w-6xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Welcome to <span className="text-gradient">Valyarolex.AI</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore features, integrations, and everything your workspace has to offer.
          </p>
        </div>
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
