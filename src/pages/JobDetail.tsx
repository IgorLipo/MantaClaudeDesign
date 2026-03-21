import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, MapPin, Calendar, Camera, FileText, Upload,
  CheckCircle2, XCircle, DollarSign, Send, UserPlus, HardHat,
  ClipboardList, ChevronDown, ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import { SchedulingPanel } from "@/components/jobs/SchedulingPanel";
import { GuidedPhotoUpload } from "@/components/jobs/GuidedPhotoUpload";
import {
  notifyStatusChange, notifyQuoteSubmitted, notifyQuoteDecision,
  notifyPhotoUploaded, notifyScaffolderAssigned,
} from "@/hooks/useNotificationTriggers";

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

const transitions: Record<string, string[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["photo_review", "cancelled"],
  photo_review: ["quote_pending", "cancelled"],
  quote_pending: ["quote_submitted"],
  quote_submitted: ["negotiating", "scheduled"],
  negotiating: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
};

interface Quote {
  id: string; amount: number; notes: string; submitted_at: string;
  review_decision: string | null; scaffolder_id: string; reviewed_by: string | null;
}
interface Photo {
  id: string; url: string; review_status: string; created_at: string; uploader_id: string | null;
}
interface Scaffolder {
  user_id: string; first_name: string; last_name: string;
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [scaffolders, setScaffolders] = useState<Scaffolder[]>([]);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedScaffolder, setSelectedScaffolder] = useState("");
  const [guidedUploadOpen, setGuidedUploadOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(true);
  const [quotesOpen, setQuotesOpen] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    const [jobRes, quotesRes, photosRes, assignRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", id).maybeSingle(),
      supabase.from("quotes").select("*").eq("job_id", id).order("submitted_at", { ascending: false }),
      supabase.from("photos").select("*").eq("job_id", id).order("created_at", { ascending: false }),
      supabase.from("job_assignments").select("*").eq("job_id", id),
    ]);
    if (jobRes.data) setJob(jobRes.data);
    if (quotesRes.data) setQuotes(quotesRes.data as Quote[]);
    if (photosRes.data) setPhotos(photosRes.data as Photo[]);
    if (assignRes.data) setAssignments(assignRes.data);

    // Fetch scaffolders + admin IDs
    const [rolesRes, adminRolesRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "scaffolder"),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    if (rolesRes.data && rolesRes.data.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", rolesRes.data.map((r) => r.user_id));
      if (profiles) setScaffolders(profiles);
    }
    if (adminRolesRes.data) setAdminIds(adminRolesRes.data.map((r) => r.user_id));
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (newStatus: string) => {
    const oldStatus = job.status;
    const { error } = await supabase.from("jobs").update({ status: newStatus as any, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setJob({ ...job, status: newStatus });
      toast({ title: `Status → ${statusMap[newStatus]}` });
      logAudit(user?.id, "status_change", "job", id, { from: oldStatus, to: newStatus });
      const assignedIds = assignments.map((a) => a.scaffolder_id);
      notifyStatusChange(id!, job.title, newStatus, job.owner_id, assignedIds);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("job-photos").upload(path, file);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(path);
    await supabase.from("photos").insert({ job_id: id, uploader_id: user.id, url: urlData.publicUrl, review_status: "pending" });
    toast({ title: "Photo uploaded" });
    logAudit(user.id, "photo_upload", "photo", id);
    notifyPhotoUploaded(id, job.title, adminIds);
    setUploading(false);
    fetchAll();
  };

  const reviewPhoto = async (photoId: string, status: "approved" | "rejected") => {
    await supabase.from("photos").update({ review_status: status }).eq("id", photoId);
    toast({ title: `Photo ${status}` });
    logAudit(user?.id, `photo_${status}`, "photo", photoId);
    fetchAll();
  };

  const submitQuote = async () => {
    if (!user || !id) return;
    setSubmittingQuote(true);
    const amount = parseFloat(quoteAmount);
    const { error } = await supabase.from("quotes").insert({ job_id: id, scaffolder_id: user.id, amount, notes: quoteNotes });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quote submitted" });
      logAudit(user.id, "quote_submit", "quote", id, { amount: quoteAmount });
      notifyQuoteSubmitted(id, job.title, amount, job.owner_id);
      setQuoteOpen(false);
      setQuoteAmount("");
      setQuoteNotes("");
      fetchAll();
    }
    setSubmittingQuote(false);
  };

  const reviewQuote = async (quoteId: string, decision: "accepted" | "rejected" | "countered") => {
    if (!user) return;
    const quote = quotes.find((q) => q.id === quoteId);
    await supabase.from("quotes").update({ review_decision: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", quoteId);
    toast({ title: `Quote ${decision}` });
    logAudit(user.id, `quote_${decision}`, "quote", quoteId);
    if (quote) notifyQuoteDecision(quote.scaffolder_id, job.title, decision, id!);
    fetchAll();
  };

  const assignScaffolder = async () => {
    if (!selectedScaffolder || !id || !user) return;
    const { error } = await supabase.from("job_assignments").insert({
      job_id: id, scaffolder_id: selectedScaffolder, assigned_by: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Scaffolder assigned" });
      logAudit(user.id, "scaffolder_assigned", "assignment", id, { scaffolder_id: selectedScaffolder });
      notifyScaffolderAssigned(selectedScaffolder, job.title, id);
      setAssignOpen(false);
      setSelectedScaffolder("");
      fetchAll();
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!job) return <div className="p-8 text-muted-foreground">Job not found</div>;

  const available = transitions[job.status] || [];
  const assignedIds = assignments.map((a) => a.scaffolder_id);
  const unassignedScaffolders = scaffolders.filter((s) => !assignedIds.includes(s.user_id));
  const showScheduling = ["scheduled", "in_progress", "quote_submitted", "negotiating"].includes(job.status) || job.scheduled_date;
  const showSiteReport = ["in_progress", "completed"].includes(job.status);

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Job Info */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap", statusColor(job.status))}>
              {statusMap[job.status]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {job.description && <p className="text-sm text-foreground">{job.description}</p>}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{job.address || "No address"}</span>
            </div>
            {job.scheduled_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" /> {new Date(job.scheduled_date).toLocaleDateString("en-GB")}
              </div>
            )}
          </div>

          {/* Assigned scaffolders */}
          {assignments.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Assigned Scaffolders</p>
              <div className="flex flex-wrap gap-1">
                {assignments.map((a) => {
                  const s = scaffolders.find((sc) => sc.user_id === a.scaffolder_id);
                  return (
                    <Badge key={a.id} variant="secondary" className="text-xs">
                      <HardHat className="h-3 w-3 mr-1" />
                      {s ? `${s.first_name} ${s.last_name}` : "Unknown"}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin actions */}
          {role === "admin" && (
            <div className="pt-3 border-t border-border space-y-3">
              {available.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {available.map((s) => (
                      <Button key={s} variant="outline" size="sm" className="text-xs" onClick={() => updateStatus(s)}>
                        {statusMap[s] || s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {unassignedScaffolders.length > 0 && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setAssignOpen(true)}>
                    <UserPlus className="h-3 w-3 mr-1" /> Assign Scaffolder
                  </Button>
                )}
                {showSiteReport && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/jobs/${id}/report`)}>
                    <ClipboardList className="h-3 w-3 mr-1" /> Site Report
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Engineer: site report link */}
          {role === "engineer" && showSiteReport && (
            <div className="pt-3 border-t border-border">
              <Button size="sm" onClick={() => navigate(`/jobs/${id}/report`)}>
                <ClipboardList className="h-4 w-4 mr-1" /> Complete Site Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling Panel */}
      {showScheduling && (
        <SchedulingPanel job={job} role={role} onUpdate={fetchAll} />
      )}

      {/* Guided Photo Upload for Owners */}
      {role === "owner" && ["draft", "submitted", "photo_review"].includes(job.status) && (
        <Card className="card-elevated border-primary/20">
          <CardContent className="p-4">
            {guidedUploadOpen ? (
              <GuidedPhotoUpload
                jobId={id!}
                onComplete={() => {
                  setGuidedUploadOpen(false);
                  fetchAll();
                  toast({ title: "Photos submitted for review" });
                }}
              />
            ) : (
              <div className="text-center py-4">
                <ImagePlus className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Submit Property Photos</p>
                <p className="text-xs text-muted-foreground mt-1">We'll guide you through each required photo step-by-step</p>
                <Button size="sm" className="mt-3" onClick={() => setGuidedUploadOpen(true)}>
                  <Camera className="h-4 w-4 mr-1" /> Start Photo Submission
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      <Collapsible open={photosOpen} onOpenChange={setPhotosOpen}>
        <Card className="card-elevated">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Photos <span className="text-xs font-normal text-muted-foreground">({photos.length})</span>
                </CardTitle>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", photosOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {(role === "admin" || role === "scaffolder") && (
                <div className="mb-3">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    <Button size="sm" variant="outline" className="text-xs pointer-events-none" asChild>
                      <span><Upload className="h-3 w-3 mr-1" />{uploading ? "Uploading…" : "Upload Photo"}</span>
                    </Button>
                  </label>
                </div>
              )}
              {photos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-border">
                      <img src={photo.url} alt="Site photo" className="w-full h-32 object-cover" />
                      <div className="absolute top-1.5 right-1.5">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          photo.review_status === "approved" && "bg-success/90 text-white",
                          photo.review_status === "rejected" && "bg-destructive/90 text-white",
                          photo.review_status === "pending" && "bg-warning/90 text-white",
                        )}>{photo.review_status}</span>
                      </div>
                      {role === "admin" && photo.review_status === "pending" && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 flex items-center justify-center gap-1 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-7 text-white hover:text-success hover:bg-transparent text-xs" onClick={() => reviewPhoto(photo.id, "approved")}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-white hover:text-destructive hover:bg-transparent text-xs" onClick={() => reviewPhoto(photo.id, "rejected")}>
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Quotes */}
      <Collapsible open={quotesOpen} onOpenChange={setQuotesOpen}>
        <Card className="card-elevated">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Quotes <span className="text-xs font-normal text-muted-foreground">({quotes.length})</span>
                </CardTitle>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", quotesOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {role === "scaffolder" && (
                <div className="mb-3">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setQuoteOpen(true)}>
                    <Send className="h-3 w-3 mr-1" /> Submit Quote
                  </Button>
                </div>
              )}
              {quotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No quotes submitted</p>
              ) : (
                <div className="space-y-3">
                  {quotes.map((q) => (
                    <div key={q.id} className="p-3 rounded-xl border border-border bg-secondary/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold tabular-nums">£{Number(q.amount).toLocaleString()}</span>
                        </div>
                        {q.review_decision ? (
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-medium capitalize",
                            q.review_decision === "accepted" && "bg-success/10 text-success",
                            q.review_decision === "rejected" && "bg-destructive/10 text-destructive",
                            q.review_decision === "countered" && "bg-warning/10 text-warning",
                          )}>{q.review_decision}</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">Pending</span>
                        )}
                      </div>
                      {q.notes && <p className="text-xs text-muted-foreground">{q.notes}</p>}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(q.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {(role === "owner" || role === "admin") && !q.review_decision && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="text-xs h-7 text-success border-success/30" onClick={() => reviewQuote(q.id, "accepted")}>Accept</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7 text-destructive border-destructive/30" onClick={() => reviewQuote(q.id, "rejected")}>Reject</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7 text-warning border-warning/30" onClick={() => reviewQuote(q.id, "countered")}>Counter</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Submit Quote Dialog */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Submit a Quote</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount (£)</Label>
              <Input type="number" placeholder="e.g. 2500" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Timeline, materials, exclusions..." value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} rows={3} />
            </div>
            <Button className="w-full" disabled={submittingQuote || !quoteAmount} onClick={submitQuote}>
              {submittingQuote ? "Submitting…" : "Submit Quote"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Scaffolder Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign Scaffolder</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedScaffolder} onValueChange={setSelectedScaffolder}>
              <SelectTrigger>
                <SelectValue placeholder="Select scaffolder" />
              </SelectTrigger>
              <SelectContent>
                {unassignedScaffolders.map((s) => (
                  <SelectItem key={s.user_id} value={s.user_id}>{s.first_name} {s.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" disabled={!selectedScaffolder} onClick={assignScaffolder}>
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
