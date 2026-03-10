import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./LandingPage";
import Dashboard from "./Dashboard";

const Index = () => {
  const { user, loading } = useAuth();

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
