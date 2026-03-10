import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import logo from "@/assets/valyarolex-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link to="/" className="mb-8">
        <img src={logo} alt="Valyarolex.AI" className="w-24 h-24 rounded-2xl object-cover shadow-glow" />
      </Link>
      <h1 className="mb-4 text-6xl font-bold text-gradient">404</h1>
      <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
      <Link to="/" className="text-primary hover:underline font-medium">
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
