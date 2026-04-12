import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, MapPin, Calendar, Camera, FileText, Upload,
  CheckCircle2, XCircle, DollarSign, Send, UserPlus, HardHat,
  ClipboardList, ChevronDown, ImagePlus, Pencil, History,
  MessageSquare, X, Printer, Share2, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import { SchedulingPanel } from "@/components/jobs/SchedulingPanel";
import { GuidedPhotoUpload } from "@/components/jobs/GuidedPhotoUpload";
import { JobComments } from "@/components/jobs/JobComments";
import { QuoteTimeline } from "@/components/jobs/QuoteTimeline";
import { AdminPhotoGallery } from "@/components/jobs/AdminPhotoGallery";
import {
  notifyStatusChange, notifyQuoteSubmitted, notifyQuoteDecision,
  notifyPhotoUploaded, notifyScaffolderAssigned, notifyOwnerPhotoSubmitted,
  notifyOwnerFinalPrice, notifyJobEdited, notifyEngineerAssigned,
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

// Owner-facing status messages
const ownerStatusInfo: Record<string, { title: string; message: string }> = {
  submitted: {
    title: "Waiting for Approval",
    message: "We've sent your photos and location to Manta Ray Energy. We'll update you once the team has reviewed your submission.",
  },
  photo_review: {
    title: "Waiting for Approval",
    message: "We've sent your photos and location to Manta Ray Energy. We'll update you once the team has reviewed your submission.",
  },
  quote_pending: {
    title: "Getting Quotes",
    message: "We're gathering quotes from scaffolders. We'll be in touch once we have a price for you.",
  },
  quote_submitted: {
    title: "Getting Quotes",
    message: "Quotes are being reviewed. We'll update you shortly with the approved price.",
  },
  negotiating: {
    title: "Finalising Price",
    message: "We're finalising the best price for your installation. We'll confirm shortly.",
  },
  scheduled: {
    title: "Scheduled",
    message: "Your installation has been scheduled. Check the details below.",
  },
  in_progress: {
    title: "Work In Progress",
    message: "The installation team is currently working on your property.",
  },
  completed: {
    title: "Completed",
    message: "Your solar panel installation is complete! Thank you for choosing us.",
  },
  cancelled: {
    title: "Cancelled",
    message: "This job has been cancelled. Please contact us if you have questions.",
  },
};

interface Quote {
  id: string; amount: number; notes: string; submitted_at: string;
  review_decision: string | null; scaffolder_id: string; reviewed_by: string | null;
  reviewed_at: string | null; counter_amount: number | null; counter_notes: string | null;
}
interface Photo {
  id: string; url: string; review_status: string; created_at: string; uploader_id: string | null;
}
interface Scaffolder {
  user_id: string; first_name: string; last_name: string;
}
interface AuditEntry {
  id: string; action: string; entity: string; changes: any; created_at: string; user_id: string | null;
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [scaffolders, setScaffolders] = useState<Scaffolder[]>([]);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [engineers, setEngineers] = useState<Scaffolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignEngineerOpen, setAssignEngineerOpen] = useState(false);
  const [selectedScaffolder, setSelectedScaffolder] = useState("");
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [guidedUploadOpen, setGuidedUploadOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(true);
  const [quotesOpen, setQuotesOpen] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", address: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [counterOpen, setCounterOpen] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNotes, setCounterNotes] = useState("");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [chatTab, setChatTab] = useState("admin_scaffolder");
  const [profiles, setProfiles] = useState<Record<string, Scaffolder>>({});
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [siteReport, setSiteReport] = useState<any>(null);
  const [mapsKey, setMapsKey] = useState("");

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

    const [rolesRes, adminRolesRes, engRolesRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "scaffolder"),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
      supabase.from("user_roles").select("user_id").eq("role", "engineer"),
    ]);
    const allUserIds = [
      ...(rolesRes.data || []).map(r => r.user_id),
      ...(engRolesRes.data || []).map(r => r.user_id),
    ];
    if (allUserIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", allUserIds);
      if (profs) {
        const scaffolderUserIds = new Set((rolesRes.data || []).map(r => r.user_id));
        const engineerUserIds = new Set((engRolesRes.data || []).map(r => r.user_id));
        setScaffolders(profs.filter(p => scaffolderUserIds.has(p.user_id)));
        setEngineers(profs.filter(p => engineerUserIds.has(p.user_id)));
        const map: Record<string, Scaffolder> = {};
        profs.forEach((p) => { map[p.user_id] = p; });
        setProfiles(map);
      }
    }
    if (adminRolesRes.data) setAdminIds(adminRolesRes.data.map((r) => r.user_id));

    if (role === "admin") {
      const { data: logs } = await supabase.from("audit_logs")
        .select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(50);
      if (logs) setAuditLog(logs as AuditEntry[]);
    }

    // Fetch site report status for engineer flow
    if (role === "engineer" || role === "admin") {
      const { data: report } = await (supabase as any)
        .from("site_reports").select("id, status").eq("job_id", id).maybeSingle();
      if (report) setSiteReport(report);
    }

    setLoading(false);
  }, [id, role]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch maps key for static map (all roles)
  useEffect(() => {
    supabase.functions.invoke("get-maps-key").then(({ data }) => {
      if (data?.key) setMapsKey(data.key);
    }).catch(() => {});
  }, []);

  // Realtime: auto-refresh job when status changes (so owner sees updates instantly)
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`job-detail-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${id}` }, (payload) => {
        setJob((prev: any) => prev ? { ...prev, ...payload.new } : payload.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    const hash = location.hash;
    if (hash === "#photos") setPhotosOpen(true);
    if (hash === "#quotes") setQuotesOpen(true);
  }, [location.hash]);

  const ensureEngineersAssigned = async () => {
    if (!id || role !== "admin" || !user?.id) return;
    const { data: engRoles } = await supabase.from("user_roles").select("user_id").eq("role", "engineer");
    if (!engRoles?.length) return;
    const { data: existing } = await (supabase as any).from("job_assignments").select("scaffolder_id").eq("job_id", id).eq("assignment_role", "engineer");
    const existingIds = new Set((existing || []).map((a: any) => a.scaffolder_id));
    const toInsert = engRoles.filter((e) => !existingIds.has(e.user_id)).map((e) => ({
      job_id: id, scaffolder_id: e.user_id, assigned_by: user.id, assignment_role: "engineer",
    }));
    if (toInsert.length === 0) return;
    const { error } = await (supabase as any).from("job_assignments").insert(toInsert);
    if (error) return;
    for (const a of toInsert) {
      notifyEngineerAssigned(a.scaffolder_id, job.title, id);
      logAudit(user.id, "engineer_assigned", "assignment", id, { engineer_id: a.scaffolder_id });
    }
  };

  const updateStatus = async (newStatus: string) => {
    const oldStatus = job.status;

    // Engineer: require site report before completing
    if (role === "engineer" && newStatus === "completed") {
      if (!siteReport || siteReport.status !== "submitted") {
        toast({ title: "Site report required", description: "Please complete and submit the site report before marking as finished.", variant: "destructive" });
        return;
      }
    }

    const { error } = await supabase.from("jobs").update({ status: newStatus as any, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setJob({ ...job, status: newStatus });
      toast({ title: `Status → ${statusMap[newStatus]}` });
      logAudit(user?.id, "status_change", "job", id, { from: oldStatus, to: newStatus });
      const assignedIds = assignments.map((a) => a.scaffolder_id);
      notifyStatusChange(id!, job.title, newStatus, job.owner_id, assignedIds);
      if (role === "admin" && ["photo_review", "quote_pending"].includes(newStatus)) {
        await ensureEngineersAssigned();
      }
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

  const reviewPhoto = async (photoId: string, action: string, comment?: string) => {
    const status = action === "approved" ? "approved" : "rejected";
    await supabase.from("photos").update({ review_status: status }).eq("id", photoId);

    // If it's a rejection-type action, notify the owner with specific feedback
    if (action !== "approved" && job.owner_id) {
      const actionLabels: Record<string, string> = {
        reshoot_another: "Please upload another photo",
        reshoot_clearer: "Please upload a clearer photo",
        reshoot_wider: "Please upload a wider angle",
        reshoot_closer: "Please upload a closer photo",
      };
      const msg = actionLabels[action] || "Photo needs attention";
      const fullMsg = comment ? `${msg}. Admin comment: ${comment}` : msg;
      await (await import("@/hooks/useNotificationTriggers")).notify({
        userId: job.owner_id, type: "photo_feedback",
        title: "Photo Feedback",
        message: `For your job "${job.title}": ${fullMsg}`,
        data: { job_id: id },
      });
    }

    toast({ title: action === "approved" ? "Photo approved" : "Feedback sent to owner" });
    logAudit(user?.id, `photo_${action}`, "photo", photoId, comment ? { comment } : undefined);
    if (action === "approved" && role === "admin") {
      await ensureEngineersAssigned();
    }
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
      notifyQuoteSubmitted(id, job.title, amount);
      setQuoteOpen(false);
      setQuoteAmount("");
      setQuoteNotes("");
      fetchAll();
    }
    setSubmittingQuote(false);
  };

  const reviewQuote = async (quoteId: string, decision: "accepted" | "rejected" | "countered") => {
    if (!user) return;
    if (decision === "countered") {
      setCounterOpen(quoteId);
      return;
    }
    const quote = quotes.find((q) => q.id === quoteId);
    await supabase.from("quotes").update({ review_decision: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", quoteId);
    toast({ title: `Quote ${decision}` });
    logAudit(user.id, `quote_${decision}`, "quote", quoteId);
    if (quote) notifyQuoteDecision(quote.scaffolder_id, job.title, decision, id!);
    fetchAll();
  };

  const submitCounter = async () => {
    if (!counterOpen || !user || !id) return;
    const amount = parseFloat(counterAmount);
    if (isNaN(amount)) return;
    await supabase.from("quotes").update({
      review_decision: "countered", reviewed_by: user.id, reviewed_at: new Date().toISOString(),
      counter_amount: amount, counter_notes: counterNotes || null,
    } as any).eq("id", counterOpen);
    logAudit(user.id, "quote_countered", "quote", counterOpen, { counter_amount: amount, notes: counterNotes });
    const quote = quotes.find((q) => q.id === counterOpen);
    if (quote) notifyQuoteDecision(quote.scaffolder_id, job.title, `countered at £${amount.toLocaleString()}`, id!);
    toast({ title: `Counter offer of £${amount.toLocaleString()} sent` });
    setCounterOpen(null);
    setCounterAmount("");
    setCounterNotes("");
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

  const assignEngineer = async () => {
    if (!selectedEngineer || !id || !user) return;
    const { error } = await supabase.from("job_assignments").insert({
      job_id: id, scaffolder_id: selectedEngineer, assigned_by: user.id, assignment_role: "engineer",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Engineer assigned" });
      logAudit(user.id, "engineer_assigned", "assignment", id, { engineer_id: selectedEngineer });
      notifyEngineerAssigned(selectedEngineer, job.title, id);
      setAssignEngineerOpen(false);
      setSelectedEngineer("");
      fetchAll();
    }
  };

  const handleScaffolderRespondToCounter = async (quoteId: string, response: "accepted" | "rejected", newAmount?: number, newNotes?: string) => {
    if (!user || !id) return;
    if (response === "accepted") {
      // Scaffolder accepts the counter — mark the quote as accepted
      await supabase.from("quotes").update({
        review_decision: "accepted", reviewed_at: new Date().toISOString(),
      } as any).eq("id", quoteId);
      toast({ title: "Counter offer accepted" });
      logAudit(user.id, "counter_accepted", "quote", quoteId);
      notifyQuoteSubmitted(id, job.title, 0); // notify admin
    } else {
      // Scaffolder declines — submit a new quote with updated amount
      const amount = newAmount || 0;
      await supabase.from("quotes").insert({
        job_id: id, scaffolder_id: user.id, amount, notes: newNotes || "Counter declined — revised offer",
      });
      toast({ title: "Revised quote submitted" });
      logAudit(user.id, "counter_declined_new_quote", "quote", quoteId, { new_amount: amount });
      notifyQuoteSubmitted(id, job.title, amount);
    }
    fetchAll();
  };

  const handleEditJob = async () => {
    if (!id || !user) return;
    setEditSubmitting(true);
    const { error } = await supabase.from("jobs").update({
      title: editForm.title, description: editForm.description,
      address: editForm.address, updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job updated" });
      logAudit(user.id, "job_edited", "job", id, editForm);
      notifyJobEdited(id, editForm.title, user.id);
      setEditOpen(false);
      fetchAll();
    }
    setEditSubmitting(false);
  };

  const handleGuidedComplete = async () => {
    setGuidedUploadOpen(false);
    fetchAll();
    toast({ title: "Photos submitted for review" });
    if (job.status === "draft") {
      await supabase.from("jobs").update({ status: "submitted" as any, updated_at: new Date().toISOString() }).eq("id", id);
      setJob((prev: any) => ({ ...prev, status: "submitted" }));
    }
    if (user?.id && id) {
      notifyOwnerPhotoSubmitted(user.id, job.title, id);
    }
    if (id) {
      const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const aids = adminRoles?.map((r) => r.user_id) || [];
      notifyPhotoUploaded(id, job.title, aids);
    }
  };

  const handleShareOrPrint = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Job: ${job.title}`,
          text: `Job report for ${job.title} at ${job.address}`,
          url: window.location.href,
        });
      } catch { /* cancelled */ }
    } else {
      window.print();
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!job) return <div className="p-8 text-muted-foreground">Job not found</div>;

  const available = transitions[job.status] || [];
  const assignedIds = assignments.map((a) => a.scaffolder_id);
  const assignedScaffolderIds = assignments.filter(a => a.assignment_role !== "engineer").map(a => a.scaffolder_id);
  const assignedEngineerIds = assignments.filter(a => a.assignment_role === "engineer").map(a => a.scaffolder_id);
  const unassignedScaffolders = scaffolders.filter((s) => !assignedScaffolderIds.includes(s.user_id));
  const unassignedEngineers = engineers.filter((e) => !assignedEngineerIds.includes(e.user_id));
  const showScheduling = ["scheduled", "in_progress", "quote_submitted", "negotiating"].includes(job.status) || job.scheduled_date;
  const showSiteReport = ["in_progress", "completed"].includes(job.status);
  const canEdit = role === "admin" || (role === "owner" && job.owner_id === user?.id);

  const chatRecipients: Record<string, string[]> = {
    admin_scaffolder: [...adminIds, ...assignedIds],
    admin_engineer: [...adminIds],
  };

  // Separate photos by uploader role
  const engineerAssignments = assignments.filter(a => a.assignment_role === "engineer");
  const engineerIds = new Set(engineerAssignments.map(a => a.scaffolder_id));
  const scaffolderAssignments = assignments.filter(a => a.assignment_role === "scaffolder" || !a.assignment_role || a.assignment_role === "scaffolder");
  const scaffolderIds = new Set(scaffolderAssignments.map(a => a.scaffolder_id));
  
  const ownerPhotos = photos.filter(p => !engineerIds.has(p.uploader_id || "") && !scaffolderIds.has(p.uploader_id || ""));
  const scaffolderPhotos = photos.filter(p => scaffolderIds.has(p.uploader_id || ""));
  const engineerPhotos = photos.filter(p => engineerIds.has(p.uploader_id || ""));

  // Engineer status actions
  const engineerActions = role === "engineer" && job.status === "in_progress"
    ? [{ label: "Mark as Finished", status: "completed" }]
    : [];

  const ownerStatus = ownerStatusInfo[job.status];

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-3xl mx-auto print:max-w-none">
      {/* Back button — not for owner (single-job view) */}
      {role !== "owner" && (
        <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      )}

      {/* Owner Status Card */}
      {role === "owner" && ownerStatus && (
        <Card className="card-elevated border-primary/20">
          <CardContent className="p-5 text-center space-y-2">
            {job.status === "completed" ? (
              <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
            ) : job.status === "cancelled" ? (
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
            ) : (
              <Clock className="h-10 w-10 text-primary mx-auto" />
            )}
            <h2 className="text-lg font-bold text-foreground">{ownerStatus.title}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{ownerStatus.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Job Info */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{job.title}</CardTitle>
              {(job as any).service_type && (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {(job as any).service_type === "new_job" ? "New Job" : (job as any).service_type === "service" ? "Service" : (job as any).service_type === "full_site_replacement" ? "Full Site Replacement" : (job as any).service_type}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {role !== "owner" && (
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap", statusColor(job.status))}>
                  {statusMap[job.status]}
                </span>
              )}
              {canEdit && role !== "owner" && (
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                  setEditForm({ title: job.title, description: job.description || "", address: job.address || "" });
                  setEditOpen(true);
                }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {job.description && <p className="text-sm text-foreground">{job.description}</p>}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{job.address || "No address"}</span>
            </div>
            {role !== "owner" && job.scheduled_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" /> {new Date(job.scheduled_date).toLocaleDateString("en-GB")}
              </div>
            )}
          </div>

          {/* Static map with saved pin location — all roles */}
          {mapsKey && job.lat && job.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${job.lat},${job.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${job.lat},${job.lng}&zoom=18&size=600x200&maptype=satellite&markers=color:red%7C${job.lat},${job.lng}&key=${mapsKey}`}
                alt="Property location"
                className="w-full h-40 object-cover rounded-xl border border-border hover:opacity-90 transition-opacity"
              />
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Tap to open in Google Maps</p>
            </a>
          )}

          {/* Owner: show final price if set */}
          {role === "owner" && (job as any).final_price && (
            <div className="pt-3 border-t border-border">
              <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Approved Price</p>
                <p className="text-2xl font-bold text-success tabular-nums">£{Number((job as any).final_price).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Assigned team */}
          {assignments.length > 0 && role !== "owner" && (
            <div className="pt-3 border-t border-border space-y-1.5">
              {assignments.filter(a => a.assignment_role !== "engineer").map((a) => {
                const p = profiles[a.scaffolder_id];
                return (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <HardHat className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Scaffolder — {p ? `${p.first_name} ${p.last_name}` : "Unassigned"}</span>
                  </div>
                );
              })}
              {assignments.filter(a => a.assignment_role === "engineer").map((a) => {
                const p = profiles[a.scaffolder_id];
                return (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Engineer — {p ? `${p.first_name} ${p.last_name}` : "Unassigned"}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Admin: Assign Scaffolder & Engineer below map */}
          {role === "admin" && (
            <div className="pt-3 border-t border-border flex flex-wrap gap-2">
              {unassignedScaffolders.length > 0 && (
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setAssignOpen(true)}>
                  <UserPlus className="h-3 w-3 mr-1" /> Assign Scaffolder
                </Button>
              )}
              {unassignedEngineers.length > 0 && (
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setAssignEngineerOpen(true)}>
                  <UserPlus className="h-3 w-3 mr-1" /> Assign Engineer
                </Button>
              )}
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
                {showSiteReport && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/jobs/${id}/report`)}>
                    <ClipboardList className="h-3 w-3 mr-1" /> Site Report
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-xs" onClick={handleShareOrPrint}>
                  {navigator.share ? <Share2 className="h-3 w-3 mr-1" /> : <Printer className="h-3 w-3 mr-1" />}
                  {navigator.share ? "Share" : "Print / PDF"}
                </Button>
              </div>
            </div>
          )}

          {/* Engineer actions */}
          {role === "engineer" && (
            <div className="pt-3 border-t border-border space-y-3">
              {showSiteReport && (
                <Button size="sm" onClick={() => navigate(`/jobs/${id}/report`)}>
                  <ClipboardList className="h-4 w-4 mr-1" /> Complete Site Report
                </Button>
              )}
              {engineerActions.map((ea) => (
                <Button key={ea.status} size="sm" variant="outline" className="text-xs" onClick={() => updateStatus(ea.status)}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {ea.label}
                </Button>
              ))}
              <Button size="sm" variant="outline" className="text-xs" onClick={handleShareOrPrint}>
                {navigator.share ? <Share2 className="h-3 w-3 mr-1" /> : <Printer className="h-3 w-3 mr-1" />}
                {navigator.share ? "Share PDF" : "Download PDF"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling Panel — hidden from owner */}
      {showScheduling && role !== "owner" && <SchedulingPanel job={job} role={role} onUpdate={fetchAll} />}

      {/* Guided Photo Upload for Owners — only if photos haven't been submitted yet */}
      {role === "owner" && ["draft"].includes(job.status) && (
        <Card className="card-elevated border-primary/20">
          <CardContent className="p-4">
            {guidedUploadOpen ? (
              <GuidedPhotoUpload jobId={id!} onComplete={handleGuidedComplete} />
            ) : (
              <div className="text-center py-4">
                <ImagePlus className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Submit Property Photos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Take photos of your property exterior so scaffolders can provide an accurate quote
                </p>
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
                  <Camera className="h-4 w-4" /> Photos <span className="text-xs font-normal text-muted-foreground">({ownerPhotos.length})</span>
                </CardTitle>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", photosOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {/* Upload button for owner additional photos */}
              {(role === "owner" || role === "admin") && (
                <div className="mb-3">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    <Button size="sm" variant="outline" className="text-xs pointer-events-none" asChild>
                      <span><Upload className="h-3 w-3 mr-1" />{uploading ? "Uploading…" : "Upload Photo"}</span>
                    </Button>
                  </label>
                </div>
              )}
              {ownerPhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ownerPhotos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-xl overflow-hidden border border-border cursor-pointer"
                      onClick={() => {
                        if (role === "admin") {
                          setGalleryIndex(idx);
                          setGalleryOpen(true);
                        } else {
                          setFullscreenPhoto(photo.url);
                        }
                      }}
                    >
                      <img src={photo.url} alt="Site photo" className="w-full h-32 object-cover" />
                      <div className="absolute top-1.5 right-1.5">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          photo.review_status === "approved" && "bg-success/90 text-white",
                          photo.review_status === "rejected" && "bg-destructive/90 text-white",
                          photo.review_status === "pending" && "bg-warning/90 text-white",
                        )}>{photo.review_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Scaffolder Photos — Before/After Scaffolding */}
      {(role === "scaffolder" || role === "admin") && (
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HardHat className="h-4 w-4" /> Scaffolder Photos
              <span className="text-xs font-normal text-muted-foreground">({scaffolderPhotos.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {role === "scaffolder" && (
              <div className="mb-3">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  <Button size="sm" variant="outline" className="text-xs pointer-events-none" asChild>
                    <span><Upload className="h-3 w-3 mr-1" />{uploading ? "Uploading…" : "Upload Photo"}</span>
                  </Button>
                </label>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Before Scaffolding</p>
              {scaffolderPhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {scaffolderPhotos.slice(0, Math.ceil(scaffolderPhotos.length / 2)).map((photo) => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden border border-border cursor-pointer" onClick={() => setFullscreenPhoto(photo.url)}>
                      <img src={photo.url} alt="Before scaffolding" className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">After Scaffolding</p>
              {scaffolderPhotos.length <= 1 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {scaffolderPhotos.slice(Math.ceil(scaffolderPhotos.length / 2)).map((photo) => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden border border-border cursor-pointer" onClick={() => setFullscreenPhoto(photo.url)}>
                      <img src={photo.url} alt="After scaffolding" className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engineer Photos — Before/After Roof Work */}
      {(role === "engineer" || role === "admin") && showSiteReport && (
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Engineer Photos
              <span className="text-xs font-normal text-muted-foreground">({engineerPhotos.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {role === "engineer" && (
              <div className="mb-3">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  <Button size="sm" variant="outline" className="text-xs pointer-events-none" asChild>
                    <span><Upload className="h-3 w-3 mr-1" />{uploading ? "Uploading…" : "Upload Photo"}</span>
                  </Button>
                </label>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Before Roof Work</p>
              {engineerPhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {engineerPhotos.slice(0, Math.ceil(engineerPhotos.length / 2)).map((photo) => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden border border-border cursor-pointer" onClick={() => setFullscreenPhoto(photo.url)}>
                      <img src={photo.url} alt="Before roof work" className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">After Roof Work</p>
              {engineerPhotos.length <= 1 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {engineerPhotos.slice(Math.ceil(engineerPhotos.length / 2)).map((photo) => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden border border-border cursor-pointer" onClick={() => setFullscreenPhoto(photo.url)}>
                      <img src={photo.url} alt="After roof work" className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotes — Admin and Scaffolder see timeline */}
      {(role === "admin" || role === "scaffolder") && (
        <Collapsible open={quotesOpen} onOpenChange={setQuotesOpen}>
          <Card className="card-elevated">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Quote History <span className="text-xs font-normal text-muted-foreground">({quotes.length})</span>
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
                <QuoteTimeline quotes={quotes} profiles={profiles} showScaffolderName={role === "admin"} />
                {/* Admin review actions for pending quotes */}
                {role === "admin" && quotes.filter(q => !q.review_decision).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Pending Actions</p>
                    {quotes.filter(q => !q.review_decision).map(q => (
                      <div key={q.id} className="p-2 rounded-lg bg-secondary/30 space-y-2">
                        <span className="text-sm font-semibold">£{Number(q.amount).toLocaleString()}</span>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="text-xs h-7 flex-1 min-w-[70px] text-success border-success/30" onClick={() => reviewQuote(q.id, "accepted")}>Accept</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7 flex-1 min-w-[70px] text-destructive border-destructive/30" onClick={() => reviewQuote(q.id, "rejected")}>Reject</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7 flex-1 min-w-[70px] text-warning border-warning/30" onClick={() => reviewQuote(q.id, "countered")}>Counter</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Private Chat Channels — Admin↔Scaffolder and Admin↔Engineer only */}
      {role !== "owner" && (
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Private Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {role === "admin" ? (
              <Tabs value={chatTab} onValueChange={setChatTab}>
                <TabsList className="w-full mb-3">
                  <TabsTrigger value="admin_scaffolder" className="flex-1 text-xs">Scaffolder</TabsTrigger>
                  <TabsTrigger value="admin_engineer" className="flex-1 text-xs">Engineer</TabsTrigger>
                </TabsList>
                <TabsContent value="admin_scaffolder">
                  <JobComments jobId={id!} channel="admin_scaffolder" jobTitle={job.title} recipientIds={chatRecipients.admin_scaffolder} />
                </TabsContent>
                <TabsContent value="admin_engineer">
                  <JobComments jobId={id!} channel="admin_engineer" jobTitle={job.title} recipientIds={chatRecipients.admin_engineer} />
                </TabsContent>
              </Tabs>
            ) : role === "scaffolder" ? (
              <JobComments jobId={id!} channel="admin_scaffolder" jobTitle={job.title} recipientIds={chatRecipients.admin_scaffolder} />
            ) : role === "engineer" ? (
              <JobComments jobId={id!} channel="admin_engineer" jobTitle={job.title} recipientIds={chatRecipients.admin_engineer} />
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Activity Log (Admin only) */}
      {role === "admin" && (
        <Collapsible open={auditOpen} onOpenChange={setAuditOpen}>
          <Card className="card-elevated">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" /> Activity Log <span className="text-xs font-normal text-muted-foreground">({auditLog.length})</span>
                  </CardTitle>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", auditOpen && "rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {auditLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No activity recorded</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="p-2 rounded-lg bg-secondary/30 text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground capitalize">{entry.action.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {entry.changes && Object.keys(entry.changes).length > 0 && (
                          <p className="text-muted-foreground truncate">
                            {JSON.stringify(entry.changes).slice(0, 120)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

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

      {/* Counter Quote Dialog */}
      <Dialog open={!!counterOpen} onOpenChange={(open) => { if (!open) setCounterOpen(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Counter Offer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Counter Amount (£)</Label>
              <Input type="number" placeholder="e.g. 2000" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Reason for counter offer..." value={counterNotes} onChange={(e) => setCounterNotes(e.target.value)} rows={2} />
            </div>
            <Button className="w-full" disabled={!counterAmount} onClick={submitCounter}>
              Send Counter Offer
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
              <SelectTrigger><SelectValue placeholder="Select scaffolder" /></SelectTrigger>
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

      {/* Assign Engineer Dialog */}
      <Dialog open={assignEngineerOpen} onOpenChange={setAssignEngineerOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign Engineer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
              <SelectTrigger><SelectValue placeholder="Select engineer" /></SelectTrigger>
              <SelectContent>
                {unassignedEngineers.map((e) => (
                  <SelectItem key={e.user_id} value={e.user_id}>{e.first_name} {e.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" disabled={!selectedEngineer} onClick={assignEngineer}>
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Job Details</DialogTitle></DialogHeader>
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
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>
            <Button className="w-full" disabled={editSubmitting} onClick={handleEditJob}>
              {editSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Photo Gallery */}
      <AdminPhotoGallery
        photos={ownerPhotos}
        onReview={reviewPhoto}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        initialIndex={galleryIndex}
      />

      {/* Fullscreen Photo Viewer (non-admin) */}
      {fullscreenPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setFullscreenPhoto(null)}>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 z-10" onClick={() => setFullscreenPhoto(null)}>
            <X className="h-6 w-6" />
          </Button>
          <img src={fullscreenPhoto} alt="Full size photo" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
