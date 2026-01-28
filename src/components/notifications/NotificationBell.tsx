import { Bell, FileText, AlertTriangle, DollarSign, FileCheck, ListTodo, Settings } from "lucide-react";
import { Notification, NotificationType } from "@/data/mockNotifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "react-router-dom";
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

interface NotificationBellProps {
  unreadCount: number;
  notifications: Notification[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAllRead: () => void;
  onNotificationClick: (id: string) => void;
}

export function NotificationBell({
  unreadCount,
  notifications,
  isOpen,
  onOpenChange,
  onMarkAllRead,
  onNotificationClick,
}: NotificationBellProps) {
  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick(notification.id);
    toast.info(`Navigating to ${notification.title}...`, {
      description: "Navigation is simulated in demo mode.",
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-accent hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.slice(0, 5).map((notification) => {
            const Icon = iconMap[notification.type];
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                  !notification.isRead && "bg-accent/5"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  priorityStyles[notification.priority]
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm truncate",
                      !notification.isRead ? "font-medium text-foreground" : "text-muted-foreground"
                    )}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{notification.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{notification.timestamp}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <Link
            to="/notifications"
            onClick={() => onOpenChange(false)}
            className="text-sm text-accent hover:underline block text-center"
          >
            View All Notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
