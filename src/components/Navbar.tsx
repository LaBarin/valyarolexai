import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/valyarolex-logo.png";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#automation", label: "Automation" },
  { href: "#integrations", label: "Integrations" },
  { href: "#comparison", label: "Compare" },
  { href: "#pricing", label: "Pricing" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
    }
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4"
    >
      <div className="container max-w-6xl mx-auto glass rounded-full px-5 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Valyarolex.AI" className="w-16 h-16 rounded-lg object-cover" />
          <span className="text-lg font-bold tracking-tight">Valyarolex.AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/demo" className="hover:text-foreground transition-colors">
            Demo
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/workspace" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Workspace
              </Link>
              <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center gap-1.5">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-sm font-medium bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-90 transition-opacity hidden sm:block"
              >
                Get Access
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 mx-2 glass rounded-2xl p-4 flex flex-col gap-1"
          >
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleAnchorClick(e, l.href)}
                className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/demo"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Demo
            </Link>
            <div className="border-t border-border my-2" />
            {user ? (
              <button onClick={() => { setMobileOpen(false); signOut(); }} className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="mx-4 mt-1 text-center text-sm font-medium bg-gradient-primary text-primary-foreground px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                >
                  Get Access
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
