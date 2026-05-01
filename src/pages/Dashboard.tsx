import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Clock, HardHat, CheckCircle2, ArrowUpRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_VARIANTS, PENDING_STATUSES, ACTIVE_FILTER_STATUSES } from "@/constants/status";

interface JobCounts {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export default function Dashboard() {
  const { role, profile } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<JobCounts>({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: allJobs } = await supabase.from("jobs").select("id, status");
      const { data: recent } = await supabase.from("jobs")
        .select("id, title, status, address, case_no, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (allJobs) {
        const pending = allJobs.filter((j) => PENDING_STATUSES.includes(j.status)).length;
        const inProgress = allJobs.filter((j) => ACTIVE_FILTER_STATUSES.includes(j.status)).length;
        const completed = allJobs.filter((j) => j.status === "completed").length;
        setCounts({ total: allJobs.length, pending, inProgress, completed });
      }
      if (recent) setRecentJobs(recent);
      setLoading(false);
    };
    fetchData();
  }, []);

  const kpis = [
    { label: "Total", value: counts.total, icon: Briefcase, tone: "primary", filter: "" },
    { label: "Pending review", value: counts.pending, icon: Clock, tone: "pending", filter: "pending" },
    { label: "In flight", value: counts.inProgress, icon: HardHat, tone: "active", filter: "active" },
    { label: "Completed", value: counts.completed, icon: CheckCircle2, tone: "complete", filter: "completed" },
  ] as const;

  const firstName = profile?.first_name || "";
  const roleLabel = role === "owner" ? "System Owner" : role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="absolute -top-24 -right-16 h-72 w-72 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(closest-side, hsl(22 96% 46% / 0.25), transparent)" }}
        />
        <div className="relative p-4 lg:p-10 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 animate-em-enter">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  {roleLabel} · overview
                </span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl leading-[1.02] tracking-tight text-foreground">
                {firstName ? (
                  <>Welcome back, <span className="font-display-italic text-primary">{firstName}.</span></>
                ) : (
                  <>Welcome <span className="font-display-italic text-primary">back.</span></>
                )}
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                {counts.total === 0
                  ? "No jobs yet — when they land, you'll see them here."
                  : `${counts.inProgress} in flight · ${counts.pending} waiting on you · ${completionRate}% complete.`}
              </p>
            </div>
            {counts.total > 0 && (
              <div className="flex items-baseline gap-2 animate-em-enter" style={{ animationDelay: "80ms" }}>
                <div className="font-display text-6xl lg:text-7xl tabular-nums text-foreground leading-none">
                  {completionRate}
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-2xl text-primary leading-none">%</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    completed
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            const toneClasses: Record<string, string> = {
              primary: "bg-primary-soft text-primary ring-primary/20",
              pending: "bg-status-pending-soft text-status-pending ring-status-pending/20",
              active: "bg-status-active-soft text-status-active ring-status-active/20",
              complete: "bg-status-complete-soft text-status-complete ring-status-complete/20",
            };
            return (
              <button
                key={kpi.label}
                onClick={() => navigate(kpi.filter ? `/jobs?filter=${kpi.filter}` : "/jobs")}
                className={cn(
                  "group text-left relative overflow-hidden rounded-lg bg-card ring-1 ring-border/80 p-4 lg:p-5",
                  "shadow-xs hover:shadow-md hover-lift",
                  "transition-[transform,box-shadow,border-color] duration-soft ease-spring",
                  "animate-em-enter"
                )}
                style={{ animationDelay: `${140 + i * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("h-9 w-9 rounded-md ring-1 flex items-center justify-center", toneClasses[kpi.tone])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors duration-quick -translate-x-1 group-hover:translate-x-0" />
                </div>
                <div className="font-display text-[40px] leading-none tabular-nums text-foreground">
                  {loading ? (
                    <span className="inline-block h-10 w-10 bg-muted rounded animate-pulse" />
                  ) : (
                    kpi.value
                  )}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-3">
                  {kpi.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Recent Jobs */}
        <section className="rounded-lg bg-card ring-1 ring-border/80 shadow-xs animate-em-enter" style={{ animationDelay: "380ms" }}>
          <header className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div>
              <h2 className="font-display text-xl text-foreground">Recent activity</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                Last 10 jobs
              </p>
            </div>
            <button
              onClick={() => navigate("/jobs")}
              className="text-xs font-medium text-primary hover:text-primary-emphasis transition-colors duration-quick inline-flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </header>

          <div className="divide-y divide-border/60">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  <div className="ml-auto h-5 w-20 bg-muted rounded-full animate-pulse" />
                </div>
              ))
            ) : recentJobs.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">No jobs yet</p>
                <p className="text-xs text-muted-foreground mt-1">Jobs will appear here once created.</p>
              </div>
            ) : (
              recentJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="group w-full px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-4 hover:bg-subtle/60 transition-colors duration-quick text-left"
                >
                  {job.case_no && (
                    <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground/70 w-16 sm:w-20 truncate shrink-0">
                      {job.case_no}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-quick">
                      {job.title}
                    </div>
                    {job.address && (
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{job.address}</div>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANTS[job.status] as any} className="shrink-0 text-[9px] px-1.5 py-0 h-5 leading-none">
                    {STATUS_LABELS[job.status] || job.status}
                  </Badge>
                  <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-[color,transform] duration-quick -translate-x-1 group-hover:translate-x-0 shrink-0" />
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
