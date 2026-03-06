import { Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Elevance</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Elevance. The AI productivity operating system.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
