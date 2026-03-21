import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, HardHat, CheckCircle2, AlertTriangle } from "lucide-react";
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
  draft: "Draft",
  submitted: "Submitted",
  photo_review: "Photo Review",
  quote_pending: "Quote Pending",
  quote_submitted: "Quote Submitted",
  negotiating: "Negotiating",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function Dashboard() {
  const { role, profile } = useAuth();
  const [counts, setCounts] = useState<JobCounts>({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: jobs } = await supabase.from("jobs").select("id, title, status, address, created_at").order("created_at", { ascending: false }).limit(10);
      if (jobs) {
        setRecentJobs(jobs);
        const pending = jobs.filter((j) => ["draft", "submitted", "photo_review", "quote_pending", "quote_submitted", "negotiating"].includes(j.status)).length;
        const inProgress = jobs.filter((j) => ["scheduled", "in_progress"].includes(j.status)).length;
        const completed = jobs.filter((j) => j.status === "completed").length;
        setCounts({ total: jobs.length, pending, inProgress, completed });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const kpis = [
    { label: "Total Jobs", value: counts.total, icon: Briefcase, color: "text-primary" },
    { label: "Pending", value: counts.pending, icon: Clock, color: "text-warning" },
    { label: "In Progress", value: counts.inProgress, icon: HardHat, color: "text-info" },
    { label: "Completed", value: counts.completed, icon: CheckCircle2, color: "text-success" },
  ];

  const greeting = profile?.first_name ? `Welcome back, ${profile.first_name}` : "Welcome back";

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{role} Dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="card-elevated hover-lift">
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
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2",
                      job.status === "completed" && "bg-success/10 text-success",
                      job.status === "in_progress" && "bg-info/10 text-info",
                      job.status === "cancelled" && "bg-destructive/10 text-destructive",
                      !["completed", "in_progress", "cancelled"].includes(job.status) && "bg-warning/10 text-warning"
                    )}
                  >
                    {statusMap[job.status] || job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin-only: quick alerts */}
      {role === "admin" && (
        <Card className="card-elevated border-warning/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Admin Notice</p>
              <p className="text-xs text-muted-foreground mt-1">
                Seed demo data by creating users through the demo credentials on the login page, then create jobs from the Jobs page.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
