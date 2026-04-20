import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Sun } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden px-4">
      <div
        aria-hidden
        className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(closest-side, hsl(22 96% 46% / 0.35), transparent)" }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(closest-side, hsl(43 100% 51% / 0.3), transparent)" }}
      />

      <div className="relative max-w-md text-center space-y-6 animate-em-enter">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 ring-1 ring-primary/25 px-3 py-1">
          <Sun className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Off the grid</span>
        </div>

        <div className="font-display text-[140px] leading-none tracking-tight text-foreground tabular-nums">
          4<span className="font-display-italic text-primary">0</span>4
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl text-foreground">
            This page isn't <span className="font-display-italic">wired</span> up.
          </h1>
          <p className="text-sm text-muted-foreground">
            Route <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted text-foreground">{location.pathname}</code> doesn't exist.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:shadow-glow hover:bg-primary-emphasis transition-[background-color,box-shadow] duration-quick ease-quick"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
