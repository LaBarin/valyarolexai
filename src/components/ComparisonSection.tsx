import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

type CellValue = "yes" | "no" | "partial" | string;

const features: { name: string; elevance: CellValue; zapier: CellValue; motion: CellValue; superhuman: CellValue }[] = [
  { name: "Unified inbox (email + chat)", elevance: "yes", zapier: "no", motion: "no", superhuman: "partial" },
  { name: "AI-powered scheduling", elevance: "yes", zapier: "no", motion: "yes", superhuman: "no" },
  { name: "Natural language commands", elevance: "yes", zapier: "no", motion: "partial", superhuman: "no" },
  { name: "Cross-app automation", elevance: "yes", zapier: "yes", motion: "no", superhuman: "no" },
  { name: "No-code workflow builder", elevance: "yes", zapier: "yes", motion: "no", superhuman: "no" },
  { name: "Team workspaces & dashboards", elevance: "yes", zapier: "no", motion: "partial", superhuman: "no" },
  { name: "Behavioral learning / adaptive AI", elevance: "yes", zapier: "no", motion: "partial", superhuman: "partial" },
  { name: "Meeting summaries & action items", elevance: "yes", zapier: "no", motion: "no", superhuman: "no" },
  { name: "CRM & project tool sync", elevance: "yes", zapier: "yes", motion: "no", superhuman: "no" },
  { name: "Zero configuration setup", elevance: "yes", zapier: "no", motion: "partial", superhuman: "yes" },
];

const renderCell = (value: CellValue) => {
  if (value === "yes") return <Check className="w-5 h-5 text-primary mx-auto" />;
  if (value === "no") return <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />;
  if (value === "partial") return <Minus className="w-5 h-5 text-muted-foreground/60 mx-auto" />;
  return <span className="text-sm text-muted-foreground">{value}</span>;
};

const ComparisonSection = () => {
  return (
    <section id="comparison" className="relative py-32 px-6">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            Why Elevance
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            One platform to <span className="text-gradient">replace them all</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Other tools solve one piece. Elevance is the full picture — AI scheduling, automation, inbox, and team collaboration in a single workspace.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-5 px-6 text-muted-foreground font-medium">Feature</th>
                  <th className="py-5 px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold px-4 py-1.5 rounded-full text-sm">
                      Elevance
                    </div>
                  </th>
                  <th className="py-5 px-4 text-center text-muted-foreground font-medium">Zapier</th>
                  <th className="py-5 px-4 text-center text-muted-foreground font-medium">Motion</th>
                  <th className="py-5 px-4 text-center text-muted-foreground font-medium">Superhuman</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <motion.tr
                    key={f.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-foreground">{f.name}</td>
                    <td className="py-4 px-4 text-center">{renderCell(f.elevance)}</td>
                    <td className="py-4 px-4 text-center">{renderCell(f.zapier)}</td>
                    <td className="py-4 px-4 text-center">{renderCell(f.motion)}</td>
                    <td className="py-4 px-4 text-center">{renderCell(f.superhuman)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-5 border-t border-border bg-primary/[0.03] text-center">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-semibold">10/10</span> features with Elevance vs{" "}
              <span className="font-medium">3/10</span> Zapier ·{" "}
              <span className="font-medium">3/10</span> Motion ·{" "}
              <span className="font-medium">2/10</span> Superhuman
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
