import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Check, Sparkles, Zap, Crown, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

type Pack = {
  id: string;
  priceId: string;
  name: string;
  credits: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  icon: typeof Sparkles;
  description: string;
};

const PACKS: Pack[] = [
  { id: "starter", priceId: "credits_starter_onetime", name: "Starter", credits: 100, price: 9, icon: Sparkles, description: "Perfect for trying things out" },
  { id: "pro", priceId: "credits_pro_onetime", name: "Pro Pack", credits: 500, price: 20, bonus: 50, popular: true, icon: Zap, description: "Best value for regular users" },
  { id: "power", priceId: "credits_power_onetime", name: "Power Pack", credits: 1500, price: 99, bonus: 250, icon: Crown, description: "Ideal for heavy automation workflows" },
];

type Tx = {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
};

const CreditsManager = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: credits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!credits) {
      await supabase.from("user_credits").insert({ user_id: user.id, balance: 0 });
      setBalance(0);
    } else {
      setBalance(credits.balance);
    }

    const { data: txs } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setTransactions(txs || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePurchase = async (pack: Pack) => {
    if (!user) return;
    setPurchasingId(pack.id);

    const totalCredits = pack.credits + (pack.bonus || 0);
    const newBalance = balance + totalCredits;

    const { error: updateErr } = await supabase
      .from("user_credits")
      .upsert({ user_id: user.id, balance: newBalance }, { onConflict: "user_id" });

    if (updateErr) {
      toast.error("Failed to add credits");
      setPurchasingId(null);
      return;
    }

    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: totalCredits,
      type: "purchase",
      description: `${pack.name} — ${pack.credits}${pack.bonus ? ` + ${pack.bonus} bonus` : ""} credits`,
    });

    toast.success(`Added ${totalCredits} credits to your account!`);
    setPurchasingId(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <div className="flex items-center gap-2">
                <Coins className="w-7 h-7 text-primary" />
                <span className="text-4xl font-bold">{loading ? "—" : balance.toLocaleString()}</span>
                <span className="text-muted-foreground">credits</span>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs text-muted-foreground">Use credits for AI generations,</p>
              <p className="text-xs text-muted-foreground">video rendering, and automations</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Packs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Add Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACKS.map((pack) => {
            const Icon = pack.icon;
            const total = pack.credits + (pack.bonus || 0);
            return (
              <Card
                key={pack.id}
                className={`p-5 relative transition-all hover:border-primary/50 ${
                  pack.popular ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                {pack.popular && (
                  <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{pack.name}</h3>
                </div>

                <div className="mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${pack.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{pack.description}</p>
                </div>

                <div className="space-y-1.5 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{pack.credits.toLocaleString()} credits</span>
                  </div>
                  {pack.bonus && (
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4" />
                      <span>+{pack.bonus} bonus credits</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4" />
                    <span>Never expires</span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pack)}
                  disabled={purchasingId === pack.id}
                  className="w-full"
                  variant={pack.popular ? "default" : "outline"}
                >
                  {purchasingId === pack.id ? "Adding..." : `Get ${total.toLocaleString()} credits`}
                </Button>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Note: Payment processing is in test mode. To enable live payments, connect a payment provider.
        </p>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Recent Activity
          </h2>
          <Card className="divide-y divide-border/50">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{tx.description || tx.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`font-semibold ${tx.amount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreditsManager;
