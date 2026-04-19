import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save, Send, Share2, ClipboardList, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import { notifySiteReportSubmitted } from "@/hooks/useNotificationTriggers";
import SiteReportForm, { type ReportFormData, type MaterialRow } from "@/components/site-report/SiteReportForm";
import { generateSiteReportPdf } from "@/components/site-report/generateSiteReportPdf";

const emptyForm = (address = "", caseNo = ""): ReportFormData => ({
  engineer_name: "",
  date_of_visit: new Date().toISOString().slice(0, 10),
  address,
  case_no: caseNo,
  optimizer_no: "",
  site_id: "",
  fse_attendees: "",
  installer_details: "",
  end_customer_details: "",
  other_parties: "",
  purpose_of_visit: "",
  summary: "",
  materials: [{ description: "", quantity: "1", serial_old: "", serial_new: "" }],
  engineer_comments: "",
  follow_up_action: "",
  evidence_photos: [],
});

export default function SiteReport() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ReportFormData>(emptyForm());
  const [reportId, setReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportStatus, setReportStatus] = useState("draft");
  const [panelCount, setPanelCount] = useState<number | null>(null);

  // Load existing report + job address
  useEffect(() => {
    const load = async () => {
      if (!jobId) return;

      // Fetch job address + case_no + panel_count for prefill
      const { data: job } = await supabase.from("jobs").select("address, case_no, panel_count").eq("id", jobId).maybeSingle();
      const jobAddress = job?.address || "";
      const jobCaseNo = (job as any)?.case_no || "";
      setPanelCount((job as any)?.panel_count ?? null);

      // Fetch existing report
      const { data: report } = await (supabase as any)
        .from("site_reports").select("*").eq("job_id", jobId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();

      if (report) {
        setReportId(report.id);
        setReportStatus(report.status);
        const saved = report.report_data || {};
        const photos = report.report_photos || {};
        setFormData({
          ...emptyForm(jobAddress, jobCaseNo),
          ...saved,
          case_no: saved.case_no || jobCaseNo,
          optimizer_no: saved.optimizer_no || report.optimizer_no || "",
          evidence_photos: Array.isArray(photos.evidence_photos) ? photos.evidence_photos : (saved.evidence_photos || []),
        });
      } else {
        let engineerName = "";
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).maybeSingle();
          if (profile) engineerName = `${profile.first_name} ${profile.last_name}`.trim();
        }
        setFormData({
          ...emptyForm(jobAddress, jobCaseNo),
          engineer_name: engineerName,
          case_no: jobCaseNo || `MRE-${jobId?.slice(0, 6).toUpperCase()}`,
        });
      }
      setLoading(false);
    };
    load();
  }, [jobId, user]);

  // Progress calculation
  const totalFields = 9; // key fields
  const filledCount = [
    formData.engineer_name,
    formData.date_of_visit,
    formData.address,
    formData.purpose_of_visit,
    formData.summary,
    formData.materials.some((m) => m.description),
    formData.engineer_comments,
    formData.follow_up_action,
    formData.evidence_photos.length > 0,
  ].filter(Boolean).length;

  const saveProgress = async () => {
    if (!jobId || !user) return;
    setSaving(true);
    const payload = {
      report_data: formData,
      report_photos: { evidence_photos: formData.evidence_photos },
      optimizer_no: formData.optimizer_no || null,
      updated_at: new Date().toISOString(),
    };
    if (reportId) {
      await (supabase as any).from("site_reports").update(payload).eq("id", reportId);
    } else {
      const { data } = await (supabase as any).from("site_reports").insert({
        job_id: jobId, engineer_id: user.id, ...payload,
      }).select("id").single();
      if (data) setReportId(data.id);
    }
    toast({ title: "Progress saved" });
    setSaving(false);
  };

  const submitReport = async () => {
    if (!user || !jobId) return;
    
    // Validate only required fields
    if (!formData.engineer_name.trim()) {
      toast({ title: "Engineer name is required", variant: "destructive" });
      return;
    }
    if (!formData.date_of_visit) {
      toast({ title: "Date of visit is required", variant: "destructive" });
      return;
    }
    if (!formData.address.trim()) {
      toast({ title: "Address is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const payload = {
      report_data: formData,
      report_photos: { evidence_photos: formData.evidence_photos },
      optimizer_no: formData.optimizer_no || null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let rid = reportId;
    if (rid) {
      await (supabase as any).from("site_reports").update(payload).eq("id", rid);
    } else {
      const { data } = await (supabase as any).from("site_reports").insert({
        job_id: jobId,
        engineer_id: user.id,
        ...payload,
      }).select("id").single();
      if (data) rid = data.id;
    }

    if (rid) {
      setReportStatus("submitted");
      logAudit(user.id, "site_report_submitted", "site_report", rid, { job_id: jobId });
      notifySiteReportSubmitted(jobId, `Job ${jobId?.slice(0, 8)}`, user.id);
      toast({ title: "✅ Site report submitted successfully" });
      navigate(`/jobs/${jobId}`, { state: { reportSubmitted: true } });
    }
    setSubmitting(false);
  };

  const shareReport = async () => {
    if (!jobId) return;
    toast({ title: "Generating PDF..." });
    try {
      const blob = await generateSiteReportPdf(formData, jobId, { panelCount });
      const file = new File([blob], `site-report-${jobId.slice(0, 8)}.pdf`, { type: "application/pdf" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: "Site Report", files: [file] });
          return;
        } catch { /* user cancelled */ }
      }

      // Desktop fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded" });
    } catch (err: any) {
      toast({ title: "PDF generation failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/jobs/${jobId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Job
        </Button>
        <Button variant="outline" size="sm" onClick={shareReport}>
          <FileDown className="h-4 w-4 mr-1" /> PDF
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" /> Site Visit Report
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{filledCount}/{totalFields} sections completed</p>
        <Progress value={(filledCount / totalFields) * 100} className="mt-2 h-2" />
        {reportStatus === "submitted" && (
          <p className="text-xs text-primary mt-1">✓ Submitted — you can still edit and re-export</p>
        )}
      </div>

      {/* Form */}
      <SiteReportForm
        data={formData}
        onChange={setFormData}
        jobId={jobId || ""}
        userId={user?.id || ""}
      />

      {/* Actions */}
      <div className="flex gap-2 pb-8">
        <Button variant="outline" className="flex-1" onClick={saveProgress} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={submitReport} disabled={submitting}>
          <Send className="h-4 w-4 mr-1" /> {submitting ? "Submitting..." : reportStatus === "submitted" ? "Re-Submit" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
