import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Notification, demoNotifications } from "@/data/mockNotifications";

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getFilteredNotifications: (filter: string) => Notification[];
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const getFilteredNotifications = useCallback(
    (filter: string) => {
      if (filter === "all") return notifications;
      if (filter === "alerts") {
        return notifications.filter((n) =>
          ["invoice_due_soon", "budget_warning"].includes(n.type)
        );
      }
      if (filter === "updates") {
        return notifications.filter((n) =>
          ["payment_received", "report_ready", "task_assigned", "system"].includes(n.type)
        );
      }
      return notifications;
    },
    [notifications]
  );

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isDropdownOpen,
    setIsDropdownOpen,
    markAsRead,
    markAllAsRead,
    getFilteredNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
