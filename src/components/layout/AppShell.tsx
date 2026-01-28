import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  ListTodo, 
  Settings, 
  Sparkles,
  Wallet,
  Menu,
  X,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/productivity", label: "Productivity", icon: ListTodo },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/ai", label: "AI Summarizer", icon: Sparkles },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const {
    notifications,
    unreadCount,
    isDropdownOpen,
    setIsDropdownOpen,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-primary text-primary-foreground transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 px-4 h-16 border-b border-primary-foreground/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10">
              <Wallet className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="text-sm font-medium">
                  Finance<span className="text-primary-foreground/60">Pulse</span>
                </h1>
                <p className="text-[10px] text-primary-foreground/50">Demo Mode</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <NotificationBell
              unreadCount={unreadCount}
              notifications={notifications}
              isOpen={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
              onMarkAllRead={markAllAsRead}
              onNotificationClick={markAsRead}
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-2 border-t border-primary-foreground/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              !sidebarOpen && "rotate-180"
            )} />
            {sidebarOpen && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">FinancePulse</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell
            unreadCount={unreadCount}
            notifications={notifications}
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            onMarkAllRead={markAllAsRead}
            onNotificationClick={markAsRead}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed top-14 left-0 right-0 z-50 bg-primary text-primary-foreground animate-in slide-in-from-top duration-200"
        >
          <nav className="py-2 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "text-primary-foreground/70 hover:bg-primary-foreground/10"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          "lg:ml-64 pt-14 lg:pt-0",
          !sidebarOpen && "lg:ml-16"
        )}
      >
        {children}
      </main>
    </div>
  );
}
