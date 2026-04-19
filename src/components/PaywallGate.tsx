import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { ReactNode } from "react";

interface PaywallGateProps {
  feature: string;
  description?: string;
  onUpgrade: () => void;
  children: ReactNode;
}

export function PaywallGate({ feature, description, onUpgrade, children }: PaywallGateProps) {
  const { isActive, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isActive) return <>{children}</>;

  return (
    <Card className="p-8 max-w-xl mx-auto text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{feature} is a premium feature</h2>
      <p className="text-muted-foreground mb-6">
        {description || `Upgrade to Pro to unlock ${feature} along with all other premium tools.`}
      </p>
      <Button onClick={onUpgrade} size="lg" className="gap-2">
        <Sparkles className="w-4 h-4" />
        Upgrade to Pro
      </Button>
      <p className="text-xs text-muted-foreground mt-4">
        Includes a 14-day free trial. Cancel anytime.
      </p>
    </Card>
  );
}
