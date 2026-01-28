import { User, FileOutput, Bell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const settingsTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "exports", label: "Export Preferences", icon: FileOutput },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const { tab } = useParams();
  const navigate = useNavigate();
  const currentTab = tab || "profile";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentTabData = settingsTabs.find((t) => t.id === currentTab);
  const CurrentIcon = currentTabData?.icon || User;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your preferences</p>
        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Navigation - Collapsible Dropdown */}
          <div className="lg:hidden">
            <Collapsible open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <CurrentIcon className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{currentTabData?.label || "Settings"}</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  mobileNavOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 bg-card border border-border rounded-lg overflow-hidden">
                {settingsTabs.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/settings/${item.id}`);
                        setMobileNavOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-all border-b border-border last:border-b-0",
                        isActive
                          ? "bg-accent/10 text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    navigate("/notifications");
                    setMobileNavOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                </button>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Desktop Sidebar Navigation */}
          <nav className="hidden lg:block lg:w-56 flex-shrink-0">
            <div className="flex flex-col gap-2">
              {settingsTabs.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <NavLink
                    key={item.id}
                    to={`/settings/${item.id}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
              <NavLink
                to="/notifications"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                Notifications
              </NavLink>
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
