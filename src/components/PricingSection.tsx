import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: " for 14 days",
    description: "For individuals getting started with AI productivity.",
    features: [
      "Unified inbox (1 account)",
      "Smart scheduling",
      "5 automations / month",
      "Basic AI commands",
      "Community support",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$24",
    period: "/mo",
    description: "For professionals who want full AI power across all tools.",
    features: [
      "Unlimited email accounts",
      "AI adaptive scheduling",
      "Unlimited automations",
      "Natural language commands",
      "50+ integrations",
      "Priority support",
      "Meeting summaries",
    ],
    cta: "Start Pro Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams and organizations with advanced security needs.",
    features: [
      "Everything in Pro",
      "Team workspaces",
      "SSO & SAML",
      "Admin dashboard",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "Audit logs",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Simple, <span className="text-gradient">transparent</span> pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready for the full AI executive assistant experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlight
                  ? "glass border-primary/40 shadow-glow relative"
                  : "glass"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-secondary-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "hero" : "hero-outline"}
                className="w-full"
              >
                {plan.cta}
                {plan.highlight && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
