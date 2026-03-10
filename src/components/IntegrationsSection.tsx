import { motion } from "framer-motion";
import { useState } from "react";
import {
  Mail, Calendar, MessageSquare, Video, BarChart3, FileText,
  Briefcase, Database, Cloud, Shield, Globe, Smartphone,
  Headphones, BookOpen, Layers, PenTool, Share2, Cpu,
  Search
} from "lucide-react";

const categories = ["All", "Communication", "Productivity", "CRM & Sales", "Development", "Storage"] as const;

type CategoryColor = "text-primary" | "text-accent" | "text-[hsl(35,95%,55%)]";

const catColorMap: Record<string, { icon: CategoryColor; border: string }> = {
  Communication: { icon: "text-primary", border: "border-primary/30" },
  Productivity: { icon: "text-accent", border: "border-accent/30" },
  "CRM & Sales": { icon: "text-[hsl(35,95%,55%)]", border: "border-[hsl(35,95%,55%)]/30" },
  Development: { icon: "text-primary", border: "border-primary/30" },
  Storage: { icon: "text-accent", border: "border-accent/30" },
};

const integrations = [
  { name: "Gmail", icon: Mail, cat: "Communication" },
  { name: "Google Calendar", icon: Calendar, cat: "Productivity" },
  { name: "Outlook", icon: Mail, cat: "Communication" },
  { name: "Office 365", icon: Briefcase, cat: "Productivity" },
  { name: "Slack", icon: MessageSquare, cat: "Communication" },
  { name: "Microsoft Teams", icon: MessageSquare, cat: "Communication" },
  { name: "Zoom", icon: Video, cat: "Communication" },
  { name: "Google Meet", icon: Video, cat: "Communication" },
  { name: "Salesforce", icon: BarChart3, cat: "CRM & Sales" },
  { name: "HubSpot", icon: BarChart3, cat: "CRM & Sales" },
  { name: "Notion", icon: FileText, cat: "Productivity" },
  { name: "Asana", icon: Layers, cat: "Productivity" },
  { name: "Monday.com", icon: Layers, cat: "Productivity" },
  { name: "Jira", icon: Cpu, cat: "Development" },
  { name: "GitHub", icon: Database, cat: "Development" },
  { name: "GitLab", icon: Database, cat: "Development" },
  { name: "Linear", icon: Cpu, cat: "Development" },
  { name: "Trello", icon: Layers, cat: "Productivity" },
  { name: "ClickUp", icon: Layers, cat: "Productivity" },
  { name: "Pipedrive", icon: BarChart3, cat: "CRM & Sales" },
  { name: "Zendesk", icon: Headphones, cat: "CRM & Sales" },
  { name: "Intercom", icon: MessageSquare, cat: "Communication" },
  { name: "Discord", icon: MessageSquare, cat: "Communication" },
  { name: "Figma", icon: PenTool, cat: "Development" },
  { name: "Dropbox", icon: Cloud, cat: "Storage" },
  { name: "Google Drive", icon: Cloud, cat: "Storage" },
  { name: "OneDrive", icon: Cloud, cat: "Storage" },
  { name: "Box", icon: Cloud, cat: "Storage" },
  { name: "Confluence", icon: BookOpen, cat: "Productivity" },
  { name: "Airtable", icon: Database, cat: "Productivity" },
  { name: "Stripe", icon: Shield, cat: "CRM & Sales" },
  { name: "QuickBooks", icon: Briefcase, cat: "CRM & Sales" },
  { name: "Xero", icon: Briefcase, cat: "CRM & Sales" },
  { name: "Calendly", icon: Calendar, cat: "Productivity" },
  { name: "Loom", icon: Video, cat: "Communication" },
  { name: "Miro", icon: PenTool, cat: "Productivity" },
  { name: "Webflow", icon: Globe, cat: "Development" },
  { name: "Vercel", icon: Globe, cat: "Development" },
  { name: "AWS S3", icon: Cloud, cat: "Storage" },
  { name: "Twilio", icon: Smartphone, cat: "Communication" },
  { name: "SendGrid", icon: Mail, cat: "Communication" },
  { name: "Mailchimp", icon: Mail, cat: "Communication" },
  { name: "Shopify", icon: Briefcase, cat: "CRM & Sales" },
  { name: "Freshdesk", icon: Headphones, cat: "CRM & Sales" },
  { name: "Basecamp", icon: Layers, cat: "Productivity" },
  { name: "Todoist", icon: FileText, cat: "Productivity" },
  { name: "Evernote", icon: BookOpen, cat: "Productivity" },
  { name: "DocuSign", icon: FileText, cat: "Productivity" },
  { name: "Typeform", icon: Share2, cat: "Productivity" },
  { name: "Zapier", icon: Cpu, cat: "Development" },
];

const IntegrationsSection = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = integrations.filter((int) => {
    const matchesCat = activeCategory === "All" || int.cat === activeCategory;
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <section id="integrations" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="container max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            50+ Integrations
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Connects to <span className="text-gradient">everything</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Deep integrations with the tools your team already uses. Real-time sync, zero configuration.
          </p>
        </motion.div>

        {/* Search and filter */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-4 mb-10"
        >
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-full pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          layout
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
        >
          {filtered.map((int, i) => {
            const colors = catColorMap[int.cat] || { icon: "text-primary" as CategoryColor, border: "border-primary/30" };
            return (
              <motion.div
                key={int.name}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className={`glass rounded-xl p-4 flex flex-col items-center gap-2 hover:${colors.border} hover:shadow-glow transition-all duration-300 cursor-default group`}
              >
                <int.icon className={`w-5 h-5 ${colors.icon} transition-colors`} />
                <span className="text-xs font-medium text-center text-secondary-foreground group-hover:text-foreground transition-colors">
                  {int.name}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-8">
            No integrations found. Try a different search or category.
          </p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          + dozens more via API and webhook connectors
        </motion.p>
      </div>
    </section>
  );
};

export default IntegrationsSection;
