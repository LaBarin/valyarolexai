import { motion } from "framer-motion";
import { MapPin, Mail, Linkedin, Target, Users, Lightbulb, Globe } from "lucide-react";
import logo from "@/assets/valyarolex-logo.png";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-6">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-primary mb-4 block">
            About Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            The Vision Behind{" "}
            <span className="text-gradient">Valyarolex.AI</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Built to eliminate workflow fragmentation and empower teams with unified AI intelligence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center mb-16">
          {/* Left — Mission cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            {[
              {
                icon: Target,
                title: "Our Mission",
                desc: "To unify the fragmented world of productivity tools into one AI-powered workspace — so teams can focus on what matters, not on managing software.",
              },
              {
                icon: Lightbulb,
                title: "Our Vision",
                desc: "A future where every professional has an intelligent workspace that understands context, anticipates needs, and executes with precision.",
              },
              {
                icon: Users,
                title: "Who We Serve",
                desc: "Entrepreneurs, small businesses, marketing teams, and professionals who demand efficiency without the complexity of juggling six different tools.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="glass rounded-xl p-5 flex gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right — Founder & Company */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="glass rounded-2xl p-8 text-center">
              <img
                src={logo}
                alt="Valyarolex.AI"
                className="w-20 h-20 rounded-xl object-cover mx-auto mb-4 shadow-glow"
              />
              <h3 className="text-xl font-bold mb-1">Founded by LaBarin Crosby</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Visionary behind Valyarolex.AI — building the future of unified AI productivity.
              </p>
              <a
                href="https://www.linkedin.com/in/labarin-crosby"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Linkedin className="w-4 h-4" />
                Connect on LinkedIn
              </a>
            </div>

            <div className="glass rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Houston, TX</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <a
                  href="mailto:XyzDiverseServices@Gmail.Com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  XyzDiverseServices@Gmail.Com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                <a
                  href="https://www.valyarolexai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  www.valyarolexai.com
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
