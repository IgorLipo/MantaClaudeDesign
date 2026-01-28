import { User, FileOutput, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useParams, Navigate } from "react-router-dom";

const settingsTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "exports", label: "Export Preferences", icon: FileOutput },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const { tab } = useParams();
  const currentTab = tab || "profile";

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
          {/* Sidebar Navigation */}
          <nav className="lg:w-56 flex-shrink-0">
            <div className="flex lg:flex-col gap-2">
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
