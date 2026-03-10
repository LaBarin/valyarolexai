import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./LandingPage";
import Dashboard from "./Dashboard";

const Index = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Scroll to hash section after navigation from another page
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [location.hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
};

export default Index;
