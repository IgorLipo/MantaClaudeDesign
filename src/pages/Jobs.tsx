import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Briefcase, FileSpreadsheet, ArrowUpRight, MapPin, X, LayoutList, Columns2, Clock, HardHat, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AdminCreateJobDialog } from "@/components/jobs/AdminCreateJobDialog";
import { KanbanBoard } from "@/components/jobs/KanbanBoard";
import { exportAllJobsToExcel } from "@/lib/exportJobsXlsx";
import { STATUS_LABELS, STATUS_VARIANTS, PENDING_STATUSES, ACTIVE_FILTER_STATUSES } from "@/constants/status";

const filterTabs = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "In flight" },
  { key: "completed", label: "Completed" },
];

export default function Jobs() {
  const { role, profile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const { toast } = useToast();

  const statusFilter = searchParams.get("filter") || "";

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (data) setJobs(data);
    setLoading(false);
  };

  // KPI counts from the full job list
  const pendingCount = jobs.filter((j) => PENDING_STATUSES.includes(j.status)).length;
  const inFlightCount = jobs.filter((j) => ACTIVE_FILTER_STATUSES.includes(j.status)).length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const completionRate = jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0;

  const firstName = profile?.first_name || "";
  const roleLabel = role === "owner" ? "System Owner" : role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  useEffect(() => { fetchJobs(); }, []);

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matches =
      j.title.toLowerCase().includes(q) ||
      (j.address || "").toLowerCase().includes(q) ||
      (j.case_no || "").toLowerCase().includes(q);
    if (!matches) return false;
    if (statusFilter === "pending") return PENDING_STATUSES.includes(j.status);
    if (statusFilter === "active") return ACTIVE_FILTER_STATUSES.includes(j.status);
    if (statusFilter === "completed") return j.status === "completed";
    return true;
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAllJobsToExcel();
      toast({ title: "Export ready", description: "Spreadsheet downloaded" });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
    setExporting(false);
  };

  const setFilter = (key: string) => {
    const params = new URLSearchParams(searchParams);
    if (key) params.set("filter", key); else params.delete("filter");
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border/60">
        <div className="p-4 lg:p-10 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 animate-em-enter">
            <div className="space-y-2 min-w-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{roleLabel} · overview</span>
              <h1 className="font-display text-4xl lg:text-5xl leading-[1.02] tracking-tight text-foreground">
                {firstName ? (
                  <>Welcome back, <span className="font-display-italic text-primary">{firstName}.</span></>
                ) : (
                  <>Every <span className="font-display-italic text-primary">install</span>,<br className="hidden sm:block" /> in one ledger.</>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading…" : `${inFlightCount} in flight · ${pendingCount} waiting · ${completionRate}% complete · ${filtered.length} ${statusFilter ? filterTabs.find(t => t.key === statusFilter)?.label?.toLowerCase() || statusFilter : "total"} job${filtered.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {jobs.length > 0 && (
                <div className="flex items-baseline gap-2">
                  <div className="font-display text-5xl lg:text-6xl tabular-nums text-foreground leading-none">
                    {completionRate}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-xl text-primary leading-none">%</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">done</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {role === "admin" && (
                  <>
                    <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
                      <FileSpreadsheet className="h-4 w-4" />
                      {exporting ? "Exporting…" : "Export"}
                    </Button>
                    <Button size="sm" onClick={() => setCreateOpen(true)} className="shadow-sm hover:shadow-glow">
                      <Plus className="h-4 w-4" /> New job
                    </Button>
                  </>
                )}
                {role === "owner" && (
                  <Button size="sm" onClick={() => navigate("/new-job")} className="shadow-sm hover:shadow-glow">
                    <Plus className="h-4 w-4" /> New job
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mt-6">
            {([
              { label: "Total", value: jobs.length, icon: Briefcase, tone: "primary", filter: "" },
              { label: "Pending", value: pendingCount, icon: Clock, tone: "pending", filter: "pending" },
              { label: "In flight", value: inFlightCount, icon: HardHat, tone: "active", filter: "active" },
              { label: "Completed", value: completedCount, icon: CheckCircle2, tone: "complete", filter: "completed" },
            ] as const).map((kpi, i) => {
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
                  onClick={() => kpi.filter ? setFilter(kpi.filter) : setFilter("")}
                  className={cn(
                    "group text-left rounded-lg bg-card ring-1 ring-border/80 p-3 lg:p-4",
                    "shadow-xs hover:shadow-md hover-lift",
                    "transition-[transform,box-shadow,border-color] duration-soft ease-spring",
                  )}
                  style={{ animationDelay: `${140 + i * 60}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn("h-7 w-7 rounded-md ring-1 flex items-center justify-center", toneClasses[kpi.tone])}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors duration-quick -translate-x-1 group-hover:translate-x-0" />
                  </div>
                  <div className="font-display text-2xl lg:text-3xl leading-none tabular-nums text-foreground">
                    {loading ? <span className="inline-block h-6 w-6 bg-muted rounded animate-pulse" /> : kpi.value}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-1.5">{kpi.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 animate-em-enter" style={{ animationDelay: "80ms" }}>
          {/* Filter tabs */}
          <div className="inline-flex items-center gap-1 bg-muted/60 ring-1 ring-border/60 rounded-md p-1">
            {filterTabs.map((t) => (
              <button
                key={t.key || "all"}
                onClick={() => setFilter(t.key)}
                className={cn(
                  "px-3 h-8 rounded text-xs font-medium transition-[background-color,color,box-shadow] duration-quick ease-quick",
                  statusFilter === t.key
                    ? "bg-card text-foreground shadow-xs ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View toggle (admin only) */}
          {role === "admin" && (
            <div className="inline-flex items-center gap-1 bg-muted/60 ring-1 ring-border/60 rounded-md p-1">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-3 h-8 rounded text-xs font-medium transition-all duration-quick",
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-xs ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "px-3 h-8 rounded text-xs font-medium transition-all duration-quick",
                  viewMode === "kanban"
                    ? "bg-card text-foreground shadow-xs ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Columns2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search title, address, or case no."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="h-3.5 w-3.5 mx-auto" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {viewMode === "kanban" && role === "admin" ? (
          <div className="animate-em-enter" style={{ animationDelay: "160ms" }}>
            <KanbanBoard onStatusChange={fetchJobs} />
          </div>
        ) : loading ? (
          <div className="rounded-lg bg-card ring-1 ring-border/80 divide-y divide-border/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                <div className="h-3 w-56 bg-muted rounded animate-pulse" />
                <div className="h-5 w-24 bg-muted rounded-full animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg bg-card ring-1 ring-border/80 py-20 text-center animate-em-enter">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-3">
              <Briefcase className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">No jobs match</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || statusFilter ? "Try clearing filters." : "Jobs will appear here once created."}
            </p>
            {(search || statusFilter) && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => { setSearch(""); setFilter(""); }}
              >
                Clear
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-card ring-1 ring-border/80 shadow-xs overflow-hidden animate-em-enter" style={{ animationDelay: "160ms" }}>
            {filtered.map((job, i) => (
              <button
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className={cn(
                  "group w-full text-left px-5 py-4 flex items-center gap-4",
                  "hover:bg-subtle/60 transition-colors duration-quick",
                  i !== 0 && "border-t border-border/60"
                )}
              >
                {job.case_no && (
                  <span className="font-mono text-[11px] text-muted-foreground/80 w-24 truncate shrink-0">
                    {job.case_no}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-quick">
                    {job.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{job.address || "Address pending"}</span>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANTS[job.status] as any} className="shrink-0">
                  {STATUS_LABELS[job.status] || job.status}
                </Badge>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-[color,transform] duration-quick -translate-x-1 group-hover:translate-x-0 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <AdminCreateJobDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchJobs} />
    </div>
  );
}
