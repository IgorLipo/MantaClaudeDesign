import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Briefcase, FileSpreadsheet, ArrowUpRight, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AdminCreateJobDialog } from "@/components/jobs/AdminCreateJobDialog";
import { exportAllJobsToExcel } from "@/lib/exportJobsXlsx";

const statusMap: Record<string, string> = {
  awaiting_owner_details: "Awaiting Owner",
  draft: "Draft", submitted: "Submitted", photo_review: "Photo Review",
  quote_pending: "Quote Pending", quote_submitted: "Quote Submitted",
  negotiating: "Negotiating", scheduled: "Scheduled",
  in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
};

const statusVariant = (s: string) => {
  if (s === "completed") return "complete";
  if (s === "in_progress") return "active";
  if (s === "scheduled") return "scheduled";
  if (s === "cancelled") return "cancelled";
  if (s === "awaiting_owner_details" || s === "draft") return "draft";
  if (["quote_pending", "quote_submitted", "negotiating"].includes(s)) return "review";
  return "pending";
};

const pendingStatuses = ["awaiting_owner_details", "draft", "submitted", "photo_review", "quote_pending", "quote_submitted", "negotiating"];
const activeStatuses = ["scheduled", "in_progress"];

const filterTabs = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "In flight" },
  { key: "completed", label: "Completed" },
];

export default function Jobs() {
  const { role } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const statusFilter = searchParams.get("filter") || "";

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (data) setJobs(data);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matches =
      j.title.toLowerCase().includes(q) ||
      (j.address || "").toLowerCase().includes(q) ||
      (j.case_no || "").toLowerCase().includes(q);
    if (!matches) return false;
    if (statusFilter === "pending") return pendingStatuses.includes(j.status);
    if (statusFilter === "active") return activeStatuses.includes(j.status);
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
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Jobs</span>
              <h1 className="font-display text-4xl lg:text-5xl leading-[1.02] tracking-tight text-foreground">
                Every <span className="font-display-italic text-primary">install</span>,
                <br className="hidden sm:block" /> in one ledger.
              </h1>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading…" : `${filtered.length} ${statusFilter ? statusFilter : "total"} job${filtered.length === 1 ? "" : "s"}`}
              </p>
            </div>
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
        {loading ? (
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
                <Badge variant={statusVariant(job.status) as any} className="shrink-0">
                  {statusMap[job.status] || job.status}
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
