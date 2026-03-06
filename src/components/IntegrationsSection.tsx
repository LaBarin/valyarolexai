import { motion } from "framer-motion";

const integrations = [
  "Gmail", "Google Calendar", "Outlook", "Office 365",
  "Slack", "Teams", "Zoom", "Google Meet",
  "Salesforce", "HubSpot", "Notion", "Asana",
];

const IntegrationsSection = () => {
  return (
    <section id="integrations" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="container max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            Integrations
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Connects to <span className="text-gradient">everything</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Deep integrations with the tools your team already uses. Real-time sync, zero configuration.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {integrations.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-full px-6 py-3 text-sm font-medium text-secondary-foreground hover:border-primary/30 hover:text-foreground transition-all duration-300 cursor-default"
            >
              {name}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
