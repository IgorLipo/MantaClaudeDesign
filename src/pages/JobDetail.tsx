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
import { STATUS_LABELS, STATUS_VARIANTS, STATUS_TRANSITIONS } from "@/constants/status";
import { StatusDropdown } from "@/components/jobs/StatusDropdown";
import { JobSettingsPanel } from "@/components/jobs/JobSettingsPanel";


// Owner-facing status messages
const ownerStatusInfo: Record<string, { title: string; message: string }> = {
  planning: {
    title: "Planning",
    message: "We're reviewing your property details. We'll update you once the team has reviewed your submission.",
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
  const [editForm, setEditForm] = useState({ title: "", description: "", address: "", status: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [counterOpen, setCounterOpen] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNotes, setCounterNotes] = useState("");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [chatTab, setChatTab] = useState("admin_scaffolder");
  const [profiles, setProfiles] = useState<Record<string, Scaffolder>>({});
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  // Runtime probe: only show the Share button when the browser can actually
  // share PDF files (mobile Safari/Chrome). Desktop Chrome has navigator.share
  // but no file support, so we fall back to plain Print/Download there.
  const [canShareFiles, setCanShareFiles] = useState(false);
  useEffect(() => {
    try {
      const probe = new File([new Blob(["x"], { type: "application/pdf" })], "probe.pdf", { type: "application/pdf" });
      setCanShareFiles(!!(navigator.canShare && navigator.canShare({ files: [probe] })));
    } catch {
      setCanShareFiles(false);
    }
  }, []);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [siteReport, setSiteReport] = useState<any>(null);
  const [mapsKey, setMapsKey] = useState("");

  function resolveSetting(key: string): boolean {
    const settings = (job as any)?.job_settings || {};
    if (key in settings) return settings[key] !== false;
    return true; // default: everything enabled
  }

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
    // Show success message when returning from site report submission
    if (location.state?.reportSubmitted) {
      toast({ title: "✅ Site report submitted successfully" });
      // Clear state to prevent showing again on refresh
      window.history.replaceState({}, document.title);
      fetchAll(); // refresh to get latest site report status
    }
  }, [location.hash, location.state]);

  // Removed: ensureEngineersAssigned — engineers are now assigned manually by admin only

  const updateStatus = async (newStatus: string) => {
    if (!id) return;

    const oldStatus = job.status;

    // Engineer: require site report before completing
    if (role === "engineer" && newStatus === "completed") {
      if (!siteReport || siteReport.status !== "submitted") {
        toast({ title: "Site report required", description: "Please complete and submit the site report before marking as finished.", variant: "destructive" });
        return;
      }
    }

    let updatedJob = null;
    let error = null;

    if (role === "engineer") {
      const response = await (supabase as any).rpc("engineer_update_job_status", {
        _job_id: id,
        _new_status: newStatus,
      });

      error = response.error;
      updatedJob = Array.isArray(response.data) ? response.data[0] : response.data;
    } else {
      const response = await supabase
        .from("jobs")
        .update({ status: newStatus as any, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      error = response.error;
      updatedJob = response.data;
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (updatedJob) {
        setJob(updatedJob);
      } else {
        setJob((prev: any) => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : prev);
      }

      toast({ title: `Status → ${STATUS_LABELS[newStatus]}` });
      logAudit(user?.id, "status_change", "job", id, { from: oldStatus, to: newStatus });
      const assignedIds = assignments.map((a) => a.scaffolder_id);
      notifyStatusChange(id!, job.title, newStatus, job.owner_id, assignedIds);
      await fetchAll();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string = "general") => {
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
    await supabase.from("photos").insert({ job_id: id, uploader_id: user.id, url: urlData.publicUrl, review_status: "pending", photo_category: category } as any);
    toast({ title: "Photo uploaded" });
    logAudit(user.id, "photo_upload", "photo", id);
    notifyPhotoUploaded(id, job.title, adminIds);
    setUploading(false);
    // Re-fetch photos only, preserve current job state
    const { data: freshPhotos } = await supabase.from("photos").select("*").eq("job_id", id).order("created_at", { ascending: false });
    if (freshPhotos) setPhotos(freshPhotos as Photo[]);
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
      // Engineers are assigned manually by admin only
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
    // Multi-assignment: do NOT delete existing — just add another
    // Prevent duplicate of same person
    const already = assignments.some(a => a.assignment_role !== "engineer" && a.scaffolder_id === selectedScaffolder);
    if (already) {
      toast({ title: "Already assigned", description: "This scaffolder is already on the job", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("job_assignments").insert({
      job_id: id, scaffolder_id: selectedScaffolder, assigned_by: user.id, assignment_role: "scaffolder",
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
    const already = assignments.some(a => a.assignment_role === "engineer" && a.scaffolder_id === selectedEngineer);
    if (already) {
      toast({ title: "Already assigned", description: "This engineer is already on the job", variant: "destructive" });
      return;
    }
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

  const removeAssignment = async (assignmentId: string) => {
    if (!user) return;
    await supabase.from("job_assignments").delete().eq("id", assignmentId);
    logAudit(user.id, "assignment_removed", "assignment", assignmentId);
    toast({ title: "Removed" });
    fetchAll();
  };

  const handleScaffolderRespondToCounter = async (quoteId: string, response: "accepted" | "rejected", newAmount?: number, newNotes?: string) => {
    if (!user || !id) return;
    if (response === "accepted") {
      // Scaffolder accepts the counter — update quote amount to counter_amount and mark accepted
      const quote = quotes.find(q => q.id === quoteId);
      const acceptedAmount = quote?.counter_amount || quote?.amount || 0;
      await supabase.from("quotes").update({
        review_decision: "accepted",
        reviewed_at: new Date().toISOString(),
        amount: acceptedAmount,
      } as any).eq("id", quoteId);
      toast({ title: `Counter offer of £${Number(acceptedAmount).toLocaleString()} accepted` });
      logAudit(user.id, "counter_accepted", "quote", quoteId, { accepted_amount: acceptedAmount });
      notifyQuoteSubmitted(id, job.title, acceptedAmount);
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
    if (!id || !user || !job) return;
    setEditSubmitting(true);
    const { error } = await supabase.from("jobs").update({
      title: editForm.title, description: editForm.description,
      address: editForm.address, updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setEditSubmitting(false);
      return;
    }
    logAudit(user.id, "job_edited", "job", id, {
      title: editForm.title, description: editForm.description, address: editForm.address,
    });
    notifyJobEdited(id, editForm.title, user.id);

    // Admin may change status from the edit dialog (useful to revive cancelled jobs).
    if (role === "admin" && editForm.status && editForm.status !== job.status) {
      await updateStatus(editForm.status);
    } else {
      toast({ title: "Job updated" });
      await fetchAll();
    }
    setEditOpen(false);
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

  const handleDownloadOwnerPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pw, 35, "F");
    doc.setTextColor(255);
    doc.setFontSize(18);
    doc.text("Manta Ray Energy", 15, 15);
    doc.setFontSize(12);
    doc.text("System Owner Application", 15, 25);

    y = 45;
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("Job Details", 15, y); y += 10;
    doc.setFontSize(10);
    const serviceLabels: Record<string, string> = { new_job: "New Job", service: "Service", full_site_replacement: "Full Site Replacement" };
    doc.text(`Job Type: ${serviceLabels[(job as any).service_type] || (job as any).service_type || "N/A"}`, 15, y); y += 7;
    doc.text(`Title: ${job.title}`, 15, y); y += 7;
    doc.text(`Address: ${job.address}`, 15, y); y += 7;
    if (job.lat && job.lng) {
      doc.text(`Coordinates: ${job.lat.toFixed(6)}, ${job.lng.toFixed(6)}`, 15, y); y += 7;
    }
    doc.text(`Created: ${new Date(job.created_at).toLocaleDateString("en-GB")}`, 15, y); y += 7;
    doc.text(`Status: ${STATUS_LABELS[job.status] || job.status}`, 15, y); y += 12;

    // Add static map image
    if (mapsKey && job.lat && job.lng) {
      try {
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${job.lat},${job.lng}&zoom=18&size=600x300&maptype=satellite&markers=color:red%7C${job.lat},${job.lng}&key=${mapsKey}`;
        const mapImg = await new Promise<string>((resolve, reject) => {
          const imgEl = new Image();
          imgEl.crossOrigin = "anonymous";
          imgEl.onload = () => {
            const c = document.createElement("canvas");
            c.width = imgEl.width; c.height = imgEl.height;
            c.getContext("2d")!.drawImage(imgEl, 0, 0);
            resolve(c.toDataURL("image/jpeg"));
          };
          imgEl.onerror = reject;
          imgEl.src = mapUrl;
        });
        doc.setFontSize(14);
        doc.text("Property Location", 15, y); y += 8;
        doc.addImage(mapImg, "JPEG", 15, y, pw - 30, 60);
        y += 65;
      } catch { /* map image failed, skip */ }
    }

    // Add photos
    const jobPhotos = photos.filter(p => !new Set(assignments.filter(a => a.assignment_role === "engineer").map((a: any) => a.scaffolder_id)).has(p.uploader_id || "") && !new Set(assignments.filter(a => a.assignment_role !== "engineer").map((a: any) => a.scaffolder_id)).has(p.uploader_id || ""));
    if (jobPhotos.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text("Uploaded Photos", 15, y); y += 8;
      for (const photo of jobPhotos) {
        if (y > 240) { doc.addPage(); y = 20; }
        try {
          const img = await new Promise<string>((resolve, reject) => {
            const imgEl = new Image();
            imgEl.crossOrigin = "anonymous";
            imgEl.onload = () => {
              const c = document.createElement("canvas");
              c.width = imgEl.width; c.height = imgEl.height;
              c.getContext("2d")!.drawImage(imgEl, 0, 0);
              resolve(c.toDataURL("image/jpeg"));
            };
            imgEl.onerror = reject;
            imgEl.src = photo.url;
          });
          doc.addImage(img, "JPEG", 15, y, 80, 50);
          y += 55;
        } catch { y += 5; }
      }
    }

    const filename = `system-owner-${job.title.replace(/\s+/g, "_")}.pdf`;
    const blob = doc.output("blob");
    const file = new File([blob], filename, { type: "application/pdf" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "System Owner Application", files: [file] }).catch(() => {});
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    }
  };

  const handleShareOrPrint = async () => {
    if (!id) return;
    toast({ title: "Generating PDF..." });
    try {
      // Fetch site report data for PDF generation
      const { data: report } = await (supabase as any)
        .from("site_reports").select("*").eq("job_id", id).maybeSingle();
      if (!report || !report.report_data) {
        toast({ title: "No site report found", variant: "destructive" });
        return;
      }
      const { generateSiteReportPdf } = await import("@/components/site-report/generateSiteReportPdf");
      const reportData = report.report_data;
      // Ensure evidence_photos from report_photos
      if (report.report_photos?.evidence_photos) {
        reportData.evidence_photos = report.report_photos.evidence_photos;
      }
      if (!reportData.materials) reportData.materials = [];
      const blob = await generateSiteReportPdf(reportData, id);
      const filename = `site-report-${id.slice(0, 8)}.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Site Report", files: [file] }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        toast({ title: "PDF downloaded" });
      }
    } catch (err: any) {
      toast({ title: "PDF generation failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!job) return <div className="p-8 text-muted-foreground">Job not found</div>;

  const assignedIds = assignments.map((a) => a.scaffolder_id);
  const assignedScaffolderIds = assignments.filter(a => a.assignment_role !== "engineer").map(a => a.scaffolder_id);
  const assignedEngineerIds = assignments.filter(a => a.assignment_role === "engineer").map(a => a.scaffolder_id);
  const hasScaffolder = assignedScaffolderIds.length > 0;
  const hasEngineer = assignedEngineerIds.length > 0;
  const allScaffolders = scaffolders;
  const allEngineers = engineers;
  const showScheduling = ["scheduled", "in_progress", "quote_submitted", "negotiating"].includes(job.status) || job.scheduled_date;
  const showSiteReport = ["in_progress", "completed"].includes(job.status);
  const canEdit = role === "admin" || (role === "owner" && job.owner_id === user?.id);

  const chatRecipients: Record<string, string[]> = {
    admin_scaffolder: [...adminIds, ...assignedIds],
    admin_engineer: [...adminIds],
  };

   // Separate photos by uploader role AND category
  const engineerAssignments = assignments.filter(a => a.assignment_role === "engineer");
  const engineerIds = new Set(engineerAssignments.map(a => a.scaffolder_id));
  const scaffolderAssignments = assignments.filter(a => a.assignment_role === "scaffolder" || !a.assignment_role || a.assignment_role === "scaffolder");
  const scaffolderIds = new Set(scaffolderAssignments.map(a => a.scaffolder_id));
  
  const ownerPhotos = photos.filter(p => !engineerIds.has(p.uploader_id || "") && !scaffolderIds.has(p.uploader_id || ""));
  const scaffolderBeforePhotos = photos.filter(p => scaffolderIds.has(p.uploader_id || "") && (p as any).photo_category === "before");
  const scaffolderAfterPhotos = photos.filter(p => scaffolderIds.has(p.uploader_id || "") && (p as any).photo_category === "after");
  const engineerBeforePhotos = photos.filter(p => engineerIds.has(p.uploader_id || "") && (p as any).photo_category === "before");
  const engineerAfterPhotos = photos.filter(p => engineerIds.has(p.uploader_id || "") && (p as any).photo_category === "after");

  const ownerStatus = ownerStatusInfo[job.status];

  return (
    <div className="p-4 lg:p-8 space-y-5 max-w-3xl mx-auto print:max-w-none animate-em-enter">
      {/* Back button — not for owner (single-job view) */}
      {role !== "owner" && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")} className="-ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to jobs
          </Button>
          {job?.case_no && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {job.case_no}
            </span>
          )}
        </div>
      )}

      {/* Owner Status Card */}
      {role === "owner" && ownerStatus && resolveSetting("owner_can_see_status") && (
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
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {job.case_no && (
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                    Case No. {job.case_no}
                  </Badge>
                )}
                {(job as any).service_type && (
                  <Badge variant="secondary" className="text-[10px]">
                    {(job as any).service_type === "new_job" ? "New Job" : (job as any).service_type === "service" ? "Service" : (job as any).service_type === "full_site_replacement" ? "Full Site Replacement" : (job as any).service_type}
                  </Badge>
                )}
                {(job as any).panel_count != null && (
                  <Badge variant="secondary" className="text-[10px]">
                    {(job as any).panel_count} panels
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {role !== "owner" && (
                <Badge variant={STATUS_VARIANTS[job.status] as any} className="whitespace-nowrap">
                  {STATUS_LABELS[job.status]}
                </Badge>
              )}
              {canEdit && role !== "owner" && (
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                  setEditForm({ title: job.title, description: job.description || "", address: job.address || "", status: job.status });
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

          {/* Assigned team — supports multiple */}
          {assignments.length > 0 && role !== "owner" && (
            <div className="pt-3 border-t border-border space-y-1.5">
              {assignments.filter(a => a.assignment_role !== "engineer").map((a) => {
                const p = profiles[a.scaffolder_id];
                return (
                  <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <HardHat className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Scaffolder — {p ? `${p.first_name} ${p.last_name}` : "Unknown"}</span>
                    </div>
                    {role === "admin" && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeAssignment(a.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {assignments.filter(a => a.assignment_role === "engineer").map((a) => {
                const p = profiles[a.scaffolder_id];
                return (
                  <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Engineer — {p ? `${p.first_name} ${p.last_name}` : "Unknown"}</span>
                    </div>
                    {role === "admin" && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeAssignment(a.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Admin: Assign more — multi-assign supported */}
          {role === "admin" && (
            <div className="pt-3 border-t border-border flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setAssignOpen(true)}>
                <UserPlus className="h-3 w-3 mr-1" /> {hasScaffolder ? "Add Another Scaffolder" : "Assign Scaffolder"}
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setAssignEngineerOpen(true)}>
                <UserPlus className="h-3 w-3 mr-1" /> {hasEngineer ? "Add Another Engineer" : "Assign Engineer"}
              </Button>
            </div>
          )}

          {/* Admin actions */}
          {role === "admin" && (
            <div className="pt-3 border-t border-border space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Update Status</p>
                <StatusDropdown
                  currentStatus={job.status}
                  role={role || ""}
                  onChange={updateStatus}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {showSiteReport && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/jobs/${id}/report`)}>
                    <ClipboardList className="h-3 w-3 mr-1" /> Site Report
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-xs" onClick={handleShareOrPrint}>
                  {canShareFiles ? <Share2 className="h-3 w-3 mr-1" /> : <Printer className="h-3 w-3 mr-1" />}
                  {canShareFiles ? "Share" : "Print / PDF"}
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={handleDownloadOwnerPdf}>
                  <FileText className="h-3 w-3 mr-1" /> System Owner PDF
                </Button>
              </div>
            </div>
          )}

          {/* Job Settings (Admin only) */}
          {role === "admin" && (
            <div className="pt-3 border-t border-border mt-3">
              <JobSettingsPanel jobId={id!} currentSettings={(job as any)?.job_settings || {}} onUpdated={fetchAll} />
            </div>
          )}

          {/* Engineer actions */}
          {role === "engineer" && (
            <div className="pt-3 border-t border-border space-y-3">
              {showSiteReport && resolveSetting("engineer_can_edit_site_report") && (
                <Button size="sm" onClick={() => navigate(`/jobs/${id}/report`)}>
                  <ClipboardList className="h-4 w-4 mr-1" /> Complete Site Report
                </Button>
              )}
              <StatusDropdown
                currentStatus={job.status}
                role={role || ""}
                onChange={updateStatus}
              />
              <Button size="sm" variant="outline" className="text-xs" onClick={handleShareOrPrint}>
                {canShareFiles ? <Share2 className="h-3 w-3 mr-1" /> : <Printer className="h-3 w-3 mr-1" />}
                {canShareFiles ? "Share PDF" : "Download PDF"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling Panel — hidden from owner */}
      {showScheduling && role !== "owner" && <SchedulingPanel job={job} role={role} onUpdate={fetchAll} />}

      {/* Guided Photo Upload for Owners — only if photos haven't been submitted yet */}
      {role === "owner" && ["draft"].includes(job.status) && resolveSetting("owner_can_upload_photos") && (
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

      {/* Quotes — before photos for scaffolder/engineer */}
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
                <QuoteTimeline
                  quotes={quotes}
                  profiles={profiles}
                  showScaffolderName={role === "admin"}
                  isScaffolder={role === "scaffolder"}
                  onRespondToCounter={handleScaffolderRespondToCounter}
                />
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
              {(role === "admin" || (role === "owner" && resolveSetting("owner_can_upload_photos"))) && (
                <div className="mb-3">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
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
              <span className="text-xs font-normal text-muted-foreground">({scaffolderBeforePhotos.length + scaffolderAfterPhotos.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-border rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Before Scaffolding</p>
                {role === "scaffolder" && resolveSetting("scaffolder_can_upload_photos") && (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={(e) => handlePhotoUpload(e, "before")} disabled={uploading} />
                    <Button size="sm" variant="outline" className="text-xs h-7 pointer-events-none" asChild>
                      <span><Camera className="h-3 w-3 mr-1" /> Upload Before</span>
                    </Button>
                  </label>
                )}
              </div>
              {scaffolderBeforePhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No before photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {scaffolderBeforePhotos.map((photo) => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden border border-border cursor-pointer" onClick={() => setFullscreenPhoto(photo.url)}>
                      <img src={photo.url} alt="Before scaffolding" className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border border-border rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">After Scaffolding</p>
                {role === "scaffolder" && resolveSetting("scaffolder_can_upload_photos") && (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={(e) => handlePhotoUpload(e, "after")} disabled={uploading} />
                    <Button size="sm" variant="outline" className="text-xs h-7 pointer-events-none" asChild>
                      <span><Camera className="h-3 w-3 mr-1" /> Upload After</span>
                    </Button>
                  </label>
                )}
              </div>
              {scaffolderAfterPhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No after photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {scaffolderAfterPhotos.map((photo) => (
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
      {(role === "engineer" || role === "admin") && (job.status === "in_progress" || job.status === "completed") && (
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Engineer Photos
              <span className="text-xs font-normal text-muted-foreground">({engineerBeforePhotos.length + engineerAfterPhotos.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-border rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Before Roof Work</p>
                {role === "engineer" && resolveSetting("engineer_can_upload_photos") && (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={(e) => handlePhotoUpload(e, "before")} disabled={uploading} />
                    <Button size="sm" variant="outline" className="text-xs h-7 pointer-events-none" asChild>
                      <span><Camera className="h-3 w-3 mr-1" /> Upload Before</span>
                    </Button>
                  </label>
                )}
              </div>
              {engineerBeforePhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No before photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {engineerBeforePhotos.map((photo) => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden border border-border cursor-pointer" onClick={() => setFullscreenPhoto(photo.url)}>
                      <img src={photo.url} alt="Before roof work" className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border border-border rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">After Roof Work</p>
                {role === "engineer" && resolveSetting("engineer_can_upload_photos") && (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={(e) => handlePhotoUpload(e, "after")} disabled={uploading} />
                    <Button size="sm" variant="outline" className="text-xs h-7 pointer-events-none" asChild>
                      <span><Camera className="h-3 w-3 mr-1" /> Upload After</span>
                    </Button>
                  </label>
                )}
              </div>
              {engineerAfterPhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No after photos yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {engineerAfterPhotos.map((photo) => (
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

      {/* Private Chat Channels — Admin↔Scaffolder and Admin↔Engineer only */}
      {role !== "owner" && (
        (role === "admin" && (resolveSetting("scaffolder_can_chat") || resolveSetting("engineer_can_chat"))) ||
        (role === "scaffolder" && resolveSetting("scaffolder_can_chat")) ||
        (role === "engineer" && resolveSetting("engineer_can_chat"))
      ) && (
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
                  {resolveSetting("scaffolder_can_chat") && (
                    <TabsTrigger value="admin_scaffolder" className="flex-1 text-xs">Scaffolder</TabsTrigger>
                  )}
                  {resolveSetting("engineer_can_chat") && (
                    <TabsTrigger value="admin_engineer" className="flex-1 text-xs">Engineer</TabsTrigger>
                  )}
                </TabsList>
                {resolveSetting("scaffolder_can_chat") && (
                  <TabsContent value="admin_scaffolder">
                    <JobComments jobId={id!} channel="admin_scaffolder" jobTitle={job.title} recipientIds={chatRecipients.admin_scaffolder} />
                  </TabsContent>
                )}
                {resolveSetting("engineer_can_chat") && (
                  <TabsContent value="admin_engineer">
                    <JobComments jobId={id!} channel="admin_engineer" jobTitle={job.title} recipientIds={chatRecipients.admin_engineer} />
                  </TabsContent>
                )}
              </Tabs>
            ) : role === "scaffolder" && resolveSetting("scaffolder_can_chat") ? (
              <JobComments jobId={id!} channel="admin_scaffolder" jobTitle={job.title} recipientIds={chatRecipients.admin_scaffolder} />
            ) : role === "engineer" && resolveSetting("engineer_can_chat") ? (
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
          <DialogHeader><DialogTitle>{hasScaffolder ? "Add Another Scaffolder" : "Assign Scaffolder"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedScaffolder} onValueChange={setSelectedScaffolder}>
              <SelectTrigger><SelectValue placeholder="Select scaffolder" /></SelectTrigger>
              <SelectContent>
                {allScaffolders
                  .filter(s => !assignments.some(a => a.assignment_role !== "engineer" && a.scaffolder_id === s.user_id))
                  .map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button className="w-full" disabled={!selectedScaffolder} onClick={assignScaffolder}>Assign</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Engineer Dialog */}
      <Dialog open={assignEngineerOpen} onOpenChange={setAssignEngineerOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{hasEngineer ? "Add Another Engineer" : "Assign Engineer"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
              <SelectTrigger><SelectValue placeholder="Select engineer" /></SelectTrigger>
              <SelectContent>
                {allEngineers
                  .filter(e => !assignments.some(a => a.assignment_role === "engineer" && a.scaffolder_id === e.user_id))
                  .map((e) => (
                    <SelectItem key={e.user_id} value={e.user_id}>{e.first_name} {e.last_name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button className="w-full" disabled={!selectedEngineer} onClick={assignEngineer}>Assign</Button>
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
            {role === "admin" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={job.status}>{STATUS_LABELS[job.status]} (current)</SelectItem>
                    {(STATUS_TRANSITIONS[job.status] || []).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {job.status === "cancelled" && editForm.status !== "cancelled" && (
                  <p className="text-[11px] text-muted-foreground">
                    Reviving a cancelled job will notify the owner and assigned team.
                  </p>
                )}
              </div>
            )}
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
