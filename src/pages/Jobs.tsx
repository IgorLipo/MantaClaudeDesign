import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Briefcase, Pencil, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";

const statusMap: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", photo_review: "Photo Review",
  quote_pending: "Quote Pending", quote_submitted: "Quote Submitted",
  negotiating: "Negotiating", scheduled: "Scheduled",
  in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
};

const statusColor = (s: string) => {
  if (s === "completed") return "bg-success/10 text-success";
  if (s === "in_progress") return "bg-info/10 text-info";
  if (s === "cancelled") return "bg-destructive/10 text-destructive";
  return "bg-warning/10 text-warning";
};

const pendingStatuses = ["draft", "submitted", "photo_review", "quote_pending", "quote_submitted", "negotiating"];
const activeStatuses = ["scheduled", "in_progress"];

export default function Jobs() {
  const { role, user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", address: "", service_type: "installation" });
  const [submitting, setSubmitting] = useState(false);
  const [editJob, setEditJob] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", address: "", status: "", scheduled_date: undefined as Date | undefined, scheduled_duration: 4 });
  const [editSubmitting, setEditSubmitting] = useState(false);
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
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.address || "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "pending") return pendingStatuses.includes(j.status);
    if (statusFilter === "active") return activeStatuses.includes(j.status);
    if (statusFilter === "completed") return j.status === "completed";
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("jobs").insert({
      title: form.title, description: form.description,
      address: form.address, owner_id: user.id, status: "draft",
      service_type: form.service_type,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job created" });
      setForm({ title: "", description: "", address: "", service_type: "installation" });
      setCreateOpen(false);
      await fetchJobs();
    }
    setSubmitting(false);
  };

  const handleEdit = async () => {
    if (!editJob || !user) return;
    setEditSubmitting(true);
    const updates: any = {
      title: editForm.title, description: editForm.description,
      address: editForm.address, updated_at: new Date().toISOString(),
    };
    if (role === "admin" && editForm.status !== editJob.status) {
      updates.status = editForm.status;
    }
    if (role === "admin") {
      updates.scheduled_date = editForm.scheduled_date ? editForm.scheduled_date.toISOString() : null;
      updates.scheduled_duration = editForm.scheduled_duration || 4;
    }
    const { error } = await supabase.from("jobs").update(updates).eq("id", editJob.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job updated" });
      logAudit(user.id, "job_edited", "job", editJob.id, updates);
      setEditJob(null);
      await fetchJobs();
    }
    setEditSubmitting(false);
  };

  const openEdit = (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm({
      title: job.title, description: job.description || "", address: job.address || "", status: job.status,
      scheduled_date: job.scheduled_date ? new Date(job.scheduled_date) : undefined,
      scheduled_duration: job.scheduled_duration || 4,
    });
    setEditJob(job);
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
        <div className="flex gap-2">
          {statusFilter && (
            <Button size="sm" variant="outline" onClick={() => navigate("/jobs")}>
              Clear Filter
            </Button>
          )}
          {(role === "admin" || role === "owner") && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Job</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Job</DialogTitle></DialogHeader>
                <form onSubmit={handleCreate} className="space-y-3">
                  <Input placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                  <Input placeholder="Full address (street, city, postcode)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                  <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <div className="space-y-1.5">
                    <Label className="text-xs">Service Type</Label>
                    <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new_job">New Job</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="full_site_replacement">Full Site Replacement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Job"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search jobs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap", statusColor(job.status))}>
                    {statusMap[job.status] || job.status}
                  </span>
                  {role === "admin" && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => openEdit(job, e)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Admin Edit Job Dialog */}
      <Dialog open={!!editJob} onOpenChange={(open) => { if (!open) setEditJob(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Job</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            {role === "admin" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusMap).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Scheduled Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left text-sm", !editForm.scheduled_date && "text-muted-foreground")}>
                        <Calendar className="h-4 w-4 mr-2" />
                        {editForm.scheduled_date ? format(editForm.scheduled_date, "PPP") : "No date set"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker mode="single" selected={editForm.scheduled_date} onSelect={(d) => setEditForm({ ...editForm, scheduled_date: d })} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duration (hours)</Label>
                  <Input type="number" min={1} max={24} value={editForm.scheduled_duration} onChange={(e) => setEditForm({ ...editForm, scheduled_duration: parseInt(e.target.value) || 4 })} />
                </div>
              </>
            )}
            <Button className="w-full" disabled={editSubmitting} onClick={handleEdit}>
              {editSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
