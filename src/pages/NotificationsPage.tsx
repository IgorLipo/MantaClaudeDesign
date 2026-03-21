import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell, CheckCheck, Camera, FileText, Calendar, UserPlus,
  DollarSign, ClipboardList, MessageSquare, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Bell> = {
  status_change: ClipboardList,
  quote: DollarSign,
  quote_approved: DollarSign,
  photo: Camera,
  assignment: UserPlus,
  scheduling: Calendar,
  submission_confirmed: FileText,
  job_update: FileText,
  chat_message: MessageSquare,
  site_report: ClipboardList,
  system: Settings,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (n: any) => {
    // Mark as read
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    }
    // Navigate to job detail
    const jobId = n.data?.job_id;
    if (jobId) {
      // Build hash for section targeting
      let hash = "";
      if (n.type === "photo") hash = "#photos";
      else if (n.type === "quote" || n.type === "quote_approved") hash = "#quotes";
      else if (n.type === "scheduling") hash = "#scheduling";
      else if (n.type === "chat_message") hash = "#chat";
      navigate(`/jobs/${jobId}${hash}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : notifications.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <Card
                key={n.id}
                className={cn(
                  "card-elevated cursor-pointer hover:bg-secondary/30 transition-colors",
                  !n.read && "border-l-2 border-l-primary"
                )}
                onClick={() => handleClick(n)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", !n.read ? "font-medium text-foreground" : "text-muted-foreground")}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">
                      {new Date(n.created_at).toLocaleString("en-GB")}
                    </p>
                  </div>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
