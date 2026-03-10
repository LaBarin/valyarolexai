import logo from "@/assets/valyarolex-logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Valyarolex.AI" className="w-14 h-14 rounded-md object-cover" />
          <span className="font-semibold tracking-tight">Valyarolex.AI</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Valyarolex.AI — One Workspace. Infinite Intelligence.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
