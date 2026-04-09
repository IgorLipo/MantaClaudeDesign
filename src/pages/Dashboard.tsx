import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, HardHat, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface JobCounts {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

const statusMap: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", photo_review: "Photo Review",
  quote_pending: "Quote Pending", quote_submitted: "Quote Submitted",
  negotiating: "Negotiating", scheduled: "Scheduled",
  in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
};

const pendingStatuses = ["draft", "submitted", "photo_review", "quote_pending", "quote_submitted", "negotiating"];
const activeStatuses = ["scheduled", "in_progress"];

export default function Dashboard() {
  const { role, profile } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<JobCounts>({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: allJobs } = await supabase.from("jobs").select("id, status");
      const { data: recent } = await supabase.from("jobs").select("id, title, status, address, created_at").order("created_at", { ascending: false }).limit(10);
      if (allJobs) {
        const pending = allJobs.filter((j) => pendingStatuses.includes(j.status)).length;
        const inProgress = allJobs.filter((j) => activeStatuses.includes(j.status)).length;
        const completed = allJobs.filter((j) => j.status === "completed").length;
        setCounts({ total: allJobs.length, pending, inProgress, completed });
      }
      if (recent) setRecentJobs(recent);
      setLoading(false);
    };
    fetchData();
  }, []);

  const kpis = [
    { label: "Total Jobs", value: counts.total, icon: Briefcase, color: "text-primary", filter: "" },
    { label: "Pending", value: counts.pending, icon: Clock, color: "text-warning", filter: "pending" },
    { label: "In Progress", value: counts.inProgress, icon: HardHat, color: "text-info", filter: "active" },
    { label: "Completed", value: counts.completed, icon: CheckCircle2, color: "text-success", filter: "completed" },
  ];

  const greeting = profile?.first_name ? `Welcome back, ${profile.first_name}` : "Welcome back";

  const roleLabel = role === "owner" ? "System Owner" : role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-1">{roleLabel} Dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="card-elevated hover-lift cursor-pointer active:scale-[0.97] transition-transform"
            onClick={() => navigate(kpi.filter ? `/jobs?filter=${kpi.filter}` : "/jobs")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {loading ? "—" : kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Jobs */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No jobs yet</p>
              <p className="text-xs text-muted-foreground mt-1">Jobs will appear here once created</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2",
                    job.status === "completed" && "bg-success/10 text-success",
                    job.status === "in_progress" && "bg-info/10 text-info",
                    job.status === "cancelled" && "bg-destructive/10 text-destructive",
                    !["completed", "in_progress", "cancelled"].includes(job.status) && "bg-warning/10 text-warning"
                  )}>
                    {statusMap[job.status] || job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
