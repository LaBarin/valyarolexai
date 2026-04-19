import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Explore the platform with core features — no credit card required.",
    features: [
      "Unified inbox (1 account)",
      "Smart scheduling",
      "5 AI automations / month",
      "Basic natural language commands",
      "Task management",
      "Community support",
    ],
    cta: "Get Started Free",
    priceId: null,
    productId: null,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$39",
    period: "/mo",
    description: "The full AI workspace — replaces 6+ tools for less than the cost of one.",
    features: [
      "Unlimited email accounts",
      "AI adaptive scheduling & focus blocks",
      "Unlimited automations",
      "Advanced natural language commands",
      "AI Pitch Deck Builder",
      "Video Studio",
      "Campaign Manager",
      "AI Agents",
      "50+ integrations",
      "Analytics & insights",
      "Priority support",
    ],
    cta: "Start 14-Day Free Trial",
    priceId: "pro_monthly",
    productId: "pro_plan",
    highlight: true,
    savings: "Replaces $150+/mo in tools",
  },
  {
    name: "Business",
    price: "$79",
    period: "/mo",
    description: "For growing teams that need collaboration, security, and scale.",
    features: [
      "Everything in Pro",
      "6,000 AI credits / month",
      "Team workspaces & collaboration",
      "Shared campaigns & pitch decks",
      "SSO & SAML authentication",
      "Admin dashboard & user roles",
      "Custom integrations & API access",
      "Dedicated account manager",
      "99.9% uptime SLA",
      "Audit logs & compliance",
    ],
    cta: "Subscribe to Business",
    priceId: "business_monthly",
    productId: "business_plan",
    highlight: false,
  },
];

const PricingSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, loading } = usePaddleCheckout();
  const { tier, isActive } = useSubscription();

  const handleSubscribe = async (priceId: string, productId: string) => {
    if (!user) {
      navigate(`/signup?plan=${productId}`);
      return;
    }
    if (tier !== "free" && tier === productId.replace("_plan", "")) {
      toast.info("You're already on this plan");
      return;
    }

    // Existing subscriber switching plans → prorated swap (no second checkout)
    if (isActive) {
      try {
        const { data, error } = await supabase.functions.invoke("change-subscription", {
          body: { newPriceId: priceId },
        });
        if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
        toast.success("Plan updated. Charges are prorated.");
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Could not change plan");
      }
      return;
    }

    try {
      await openCheckout({
        priceId,
        customerEmail: user.email,
        customData: { userId: user.id },
        successUrl: `${window.location.origin}/workspace?checkout=success`,
      });
    } catch (e) {
      toast.error("Failed to open checkout");
      console.error(e);
    }
  };

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
                plan.highlight ? "glass border-primary/40 shadow-glow relative" : "glass"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  Best Value
                </div>
              )}
              {"savings" in plan && plan.savings && (
                <div className="mb-3 inline-block text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">
                  {plan.savings}
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
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
              {plan.priceId && plan.productId ? (
                <Button
                  onClick={() => handleSubscribe(plan.priceId!, plan.productId!)}
                  disabled={loading}
                  variant={plan.highlight ? "hero" : "hero-outline"}
                  className="w-full"
                >
                  {loading ? "Loading..." : plan.cta}
                  {plan.highlight && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              ) : (
                <Link to="/signup">
                  <Button variant="hero-outline" className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Need custom enterprise pricing? Call <a href="tel:+18888393469" className="underline">+1 (888) 839-3469</a> or email{" "}
          <a href="mailto:XyzDiverseServices@Gmail.Com" className="underline">XyzDiverseServices@Gmail.Com</a>
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
