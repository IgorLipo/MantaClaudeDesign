import { useState, useCallback } from "react";
import { Notification, demoNotifications } from "@/data/mockNotifications";

export function useNotifications() {
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

  return {
    notifications,
    unreadCount,
    isDropdownOpen,
    setIsDropdownOpen,
    markAsRead,
    markAllAsRead,
    getFilteredNotifications,
  };
}
