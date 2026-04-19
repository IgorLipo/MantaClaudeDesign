import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Briefcase, FileSpreadsheet } from "lucide-react";
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

const statusColor = (s: string) => {
  if (s === "completed") return "bg-success/10 text-success";
  if (s === "in_progress") return "bg-info/10 text-info";
  if (s === "cancelled") return "bg-destructive/10 text-destructive";
  if (s === "awaiting_owner_details") return "bg-muted text-muted-foreground";
  return "bg-warning/10 text-warning";
};

const pendingStatuses = ["awaiting_owner_details", "draft", "submitted", "photo_review", "quote_pending", "quote_submitted", "negotiating"];
const activeStatuses = ["scheduled", "in_progress"];

export default function Jobs() {
  const { role } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const statusFilter = searchParams.get("filter");

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

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {statusFilter ? `${statusFilter}` : "total"} jobs
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilter && (
            <Button size="sm" variant="outline" onClick={() => navigate("/jobs")}>
              Clear Filter
            </Button>
          )}
          {role === "admin" && (
            <>
              <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> {exporting ? "Exporting..." : "Export to Excel"}
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Job
              </Button>
            </>
          )}
          {role === "owner" && (
            <Button size="sm" onClick={() => navigate("/new-job")}>
              <Plus className="h-4 w-4 mr-1" /> New Job
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by title, address, or Case No..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => (
            <Card key={job.id} className="card-elevated hover-lift cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                    {job.case_no && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-medium">
                        {job.case_no}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{job.address || "Address pending"}</p>
                </div>
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap", statusColor(job.status))}>
                  {statusMap[job.status] || job.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AdminCreateJobDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchJobs} />
    </div>
  );
}
