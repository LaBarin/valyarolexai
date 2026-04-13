import { MapPin, Phone, Mail } from "lucide-react";
import logo from "@/assets/valyarolex-logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Valyarolex.AI" className="w-14 h-14 rounded-md object-cover" />
            <span className="font-semibold tracking-tight">Valyarolex.AI</span>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>12436 F.M. 1960 Rd W., Ste. 1669, Houston, TX 77065</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <a href="tel:+18888393469" className="hover:text-foreground transition-colors">
                +1 (888) 839-3469
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <a href="mailto:XyzDiverseServices@Gmail.Com" className="hover:text-foreground transition-colors">
                XyzDiverseServices@Gmail.Com
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-6">
          <p className="text-sm text-muted-foreground text-center">
            © 2026 Valyarolex.AI — One Workspace. Infinite Intelligence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
