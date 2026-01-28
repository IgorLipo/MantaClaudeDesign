import { useState } from "react";
import { Bell, FileText, AlertTriangle, DollarSign, FileCheck, ListTodo, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationFilters, NotificationType } from "@/data/mockNotifications";
import { toast } from "sonner";

const iconMap: Record<NotificationType, typeof Bell> = {
  invoice_due_soon: FileText,
  budget_warning: AlertTriangle,
  payment_received: DollarSign,
  report_ready: FileCheck,
  task_assigned: ListTodo,
  system: Settings,
};

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, getFilteredNotifications } = useNotifications();
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredNotifications = getFilteredNotifications(activeFilter);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    toast.info("Notification clicked", {
      description: "Navigation is simulated in demo mode.",
    });
  };

  // Group notifications by date
  const today = filteredNotifications.filter((n) => 
    n.timestamp.includes("hour") || n.timestamp.includes("minute")
  );
  const earlier = filteredNotifications.filter((n) => 
    n.timestamp.includes("day")
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-accent hover:underline self-start sm:self-auto"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Buttons - Wrap on mobile */}
        <div className="flex flex-wrap gap-2 mb-6">
          {notificationFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeFilter === filter.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Notification Groups */}
        <div className="space-y-6">
          {today.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Today
              </h2>
              <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {today.map((notification) => {
                  const Icon = iconMap[notification.type];
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 text-left hover:bg-muted/30 transition-colors",
                        !notification.isRead && "bg-accent/5"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                        priorityStyles[notification.priority]
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm",
                            !notification.isRead ? "font-medium text-foreground" : "text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {earlier.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Earlier
              </h2>
              <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {earlier.map((notification) => {
                  const Icon = iconMap[notification.type];
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 text-left hover:bg-muted/30 transition-colors",
                        !notification.isRead && "bg-accent/5"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                        priorityStyles[notification.priority]
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm",
                            !notification.isRead ? "font-medium text-foreground" : "text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-16">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
