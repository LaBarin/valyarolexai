import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Demo from "./pages/Demo";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Workspace from "./pages/Workspace";
import SharedCampaign from "./pages/SharedCampaign";
import SharedVideo from "./pages/SharedVideo";
import SharedPitchDeck from "./pages/SharedPitchDeck";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Refund from "./pages/Refund";
import Privacy from "./pages/Privacy";
import SecurityCheck from "./pages/SecurityCheck";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/campaign/:token" element={<SharedCampaign />} />
            <Route path="/video/:token" element={<SharedVideo />} />
            <Route path="/deck/:token" element={<SharedPitchDeck />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/security-check" element={<SecurityCheck />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
