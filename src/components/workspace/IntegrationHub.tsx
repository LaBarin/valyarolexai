import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ExternalLink, Plug, Unplug, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ConnectedIntegration = {
  id: string;
  integration_name: string;
  status: string;
  connected_at: string;
};

const INTEGRATIONS = [
  { name: "Google", icon: "G", color: "#4285F4", description: "Gmail, Calendar, Drive, Meet", category: "Productivity" },
  { name: "Microsoft", icon: "M", color: "#00A4EF", description: "Outlook, Teams, OneDrive, Office 365", category: "Productivity" },
  { name: "Slack", icon: "S", color: "#4A154B", description: "Messaging, channels, workflow automation", category: "Communication" },
  { name: "Salesforce", icon: "SF", color: "#00A1E0", description: "CRM, leads, pipelines, reports", category: "CRM" },
  { name: "Notion", icon: "N", color: "#000000", description: "Docs, databases, wikis, project management", category: "Productivity" },
  { name: "HubSpot", icon: "H", color: "#FF7A59", description: "CRM, marketing, sales, service", category: "CRM" },
  { name: "Zoom", icon: "Z", color: "#2D8CFF", description: "Video meetings, webinars, recordings", category: "Communication" },
  { name: "GitHub", icon: "GH", color: "#ffffff", description: "Repos, PRs, issues, CI/CD", category: "Development" },
  { name: "Jira", icon: "J", color: "#0052CC", description: "Issues, sprints, boards, backlog", category: "Development" },
  { name: "Asana", icon: "A", color: "#F06A6A", description: "Tasks, projects, timelines, goals", category: "Productivity" },
  { name: "Linear", icon: "L", color: "#5E6AD2", description: "Issues, cycles, roadmaps", category: "Development" },
  { name: "Stripe", icon: "$", color: "#635BFF", description: "Payments, invoices, subscriptions", category: "Finance" },
];

const IntegrationHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState<ConnectedIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) fetchConnected();
  }, [user]);

  const fetchConnected = async () => {
    const { data } = await supabase.from("connected_integrations").select("*");
    setConnected(data || []);
    setLoading(false);
  };

  const connectIntegration = async (name: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("connected_integrations")
      .insert({ integration_name: name, user_id: user.id, status: "connected" })
      .select()
      .single();

    if (error?.code === "23505") {
      toast({ title: "Already connected", description: `${name} is already connected.` });
      return;
    }
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setConnected((prev) => [...prev, data]);
      toast({ title: `${name} Connected`, description: "Integration is now active." });
    }
  };

  const disconnectIntegration = async (name: string) => {
    await supabase.from("connected_integrations").delete().eq("integration_name", name);
    setConnected((prev) => prev.filter((c) => c.integration_name !== name));
    toast({ title: `${name} Disconnected` });
  };

  const isConnected = (name: string) => connected.some((c) => c.integration_name === name);

  const filtered = INTEGRATIONS.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4">
        <div className="glass rounded-lg px-4 py-2 text-center">
          <p className="text-lg font-bold text-primary">{connected.length}</p>
          <p className="text-[10px] text-muted-foreground">Connected</p>
        </div>
        <div className="glass rounded-lg px-4 py-2 text-center">
          <p className="text-lg font-bold">{INTEGRATIONS.length}</p>
          <p className="text-[10px] text-muted-foreground">Available</p>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto">
        {filtered.map((integration, i) => {
          const conn = isConnected(integration.name);
          return (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass rounded-xl p-4 flex items-center gap-4 transition-all ${conn ? "border-primary/30" : ""}`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: `${integration.color}20`, color: integration.color }}
              >
                {integration.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{integration.name}</p>
                  {conn && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{integration.description}</p>
              </div>
              <Button
                size="sm"
                variant={conn ? "outline" : "default"}
                onClick={() => conn ? disconnectIntegration(integration.name) : connectIntegration(integration.name)}
                className="gap-1.5 flex-shrink-0"
              >
                {conn ? <Unplug className="w-3 h-3" /> : <Plug className="w-3 h-3" />}
                <span className="hidden sm:inline">{conn ? "Disconnect" : "Connect"}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default IntegrationHub;
