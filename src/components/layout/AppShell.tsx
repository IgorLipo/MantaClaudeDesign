import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  HardHat,
  MapPin,
  Bell,
  ScrollText,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Home,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import mantaLogo from "@/assets/manta-logo.png";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: "/jobs", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "scaffolder", "engineer"] },
  { path: "/my-job", label: "My Job", icon: Home, roles: ["owner"] },
  { path: "/my-quotes", label: "My Quotes", icon: ScrollText, roles: ["scaffolder"] },
  { path: "/site-reports", label: "Site Reports", icon: ScrollText, roles: ["engineer"] },
  { path: "/scaffolders", label: "Team", icon: HardHat, roles: ["admin"] },
  { path: "/regions", label: "Regions", icon: MapPin, roles: ["admin"] },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/audit", label: "Audit Log", icon: ScrollText, roles: ["admin"] },
  { path: "/admin/settings", label: "Job Defaults", icon: Settings, roles: ["admin"] },
  { path: "/settings", label: "Settings", icon: Settings },
];

const roleDisplayName = (role: string | null) => {
  if (role === "owner") return "System Owner";
  if (role) return role.charAt(0).toUpperCase() + role.slice(1);
  return "…";
};

function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("mr-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("mr-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { role, profile, signOut } = useAuth();
  const { dark, toggle } = useTheme();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || "User"
    : "User";

  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-sidebar text-sidebar-foreground",
          "border-r border-sidebar-border/60 shadow-xl",
          "transition-[width] duration-soft ease-soft",
          sidebarOpen ? "w-64" : "w-[68px]"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border/60 relative">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 overflow-hidden">
            <img src={mantaLogo} alt="Manta Ray Energy" className="h-7 w-7 object-contain" />
            <span className="absolute inset-0 rounded-lg bg-gradient-to-tr from-primary/0 via-primary/10 to-accent/10 pointer-events-none" />
          </div>
          {sidebarOpen && (
            <div className="animate-em-enter min-w-0">
              <h1 className="font-display text-[18px] leading-none tracking-tight truncate">Manta Ray</h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45 mt-1">
                {roleDisplayName(role)}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item, i) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                  "transition-[background-color,color,transform] duration-quick ease-quick",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* active rail */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary",
                    "transition-[opacity,transform] duration-soft ease-spring",
                    isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50"
                  )}
                />
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-colors duration-quick",
                    isActive ? "text-primary" : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground/90"
                  )}
                />
                {sidebarOpen && <span className="animate-em-enter">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 space-y-1 border-t border-sidebar-border/60">
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-sidebar-accent/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold ring-1 ring-primary/25">
                {initials || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</div>
                <div className="font-mono text-[10px] text-sidebar-foreground/45 truncate">
                  {roleDisplayName(role)}
                </div>
              </div>
            </div>
          )}
          <div className={cn("flex gap-1", !sidebarOpen && "flex-col")}>
            <button
              onClick={toggle}
              title={dark ? "Light mode" : "Dark mode"}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-quick"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {sidebarOpen && <span className="text-xs">{dark ? "Light" : "Dark"}</span>}
            </button>
            <button
              onClick={signOut}
              title="Sign Out"
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-quick"
            >
              <LogOut className="h-4 w-4" />
              {sidebarOpen && <span className="text-xs">Sign out</span>}
            </button>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 h-8 rounded-md text-sidebar-foreground/45 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors duration-quick"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform duration-soft ease-spring", !sidebarOpen && "rotate-180")}
            />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-md text-sidebar-foreground h-14 flex items-center justify-between px-4 border-b border-sidebar-border/60">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 overflow-hidden">
            <img src={mantaLogo} alt="Manta Ray Energy" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <div className="font-display text-sm leading-none">Manta Ray</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-sidebar-foreground/45 mt-0.5">
              {roleDisplayName(role)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="h-9 w-9 flex items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors duration-quick"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-quick"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-em-enter"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-14 left-0 right-0 z-50 bg-sidebar text-sidebar-foreground border-b border-sidebar-border/60 shadow-xl animate-em-enter">
          <nav className="py-2 px-2">
            {visibleItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors duration-quick",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
                  )}
                >
                  {isActive && (
                    <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
                  )}
                  <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => { signOut(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 w-full transition-colors duration-quick"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main */}
      <main
        className={cn(
          "flex-1 min-h-screen min-w-0 overflow-x-hidden",
          "transition-[margin] duration-soft ease-soft",
          "lg:ml-64 pt-14 lg:pt-0",
          !sidebarOpen && "lg:ml-[68px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}
