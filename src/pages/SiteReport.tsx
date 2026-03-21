import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, Save, Send, CheckCircle2, ClipboardList,
  Camera, Upload, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";

const SECTIONS = [
  {
    id: "site_access",
    title: "Site Access",
    fields: [
      { key: "access_type", label: "Access type", type: "select", options: ["Front door", "Side gate", "Rear access", "Key safe", "Other"], required: true },
      { key: "access_notes", label: "Access notes", type: "textarea" },
      { key: "parking_available", label: "Parking available on-site?", type: "boolean", required: true },
      { key: "parking_notes", label: "Parking details", type: "text" },
    ],
  },
  {
    id: "roof_assessment",
    title: "Roof Assessment",
    fields: [
      { key: "roof_type", label: "Roof type", type: "select", options: ["Pitched tile", "Flat", "Slate", "Metal", "Concrete", "Other"], required: true },
      { key: "roof_orientation", label: "Roof orientation", type: "select", options: ["South", "South-East", "South-West", "East", "West", "North"], required: true },
      { key: "roof_pitch", label: "Estimated roof pitch (degrees)", type: "number" },
      { key: "roof_condition", label: "Roof condition", type: "select", options: ["Excellent", "Good", "Fair", "Poor", "Needs repair"], required: true },
      { key: "roof_condition_notes", label: "Condition notes", type: "textarea" },
      { key: "shading_present", label: "Any shading issues?", type: "boolean", required: true },
      { key: "shading_details", label: "Shading details", type: "textarea" },
    ],
  },
  {
    id: "electrical",
    title: "Electrical Assessment",
    fields: [
      { key: "meter_type", label: "Meter type", type: "select", options: ["Smart meter", "Standard", "Economy 7", "Prepayment", "Other"], required: true },
      { key: "consumer_unit_location", label: "Consumer unit location", type: "text", required: true },
      { key: "consumer_unit_condition", label: "Consumer unit condition", type: "select", options: ["Modern (RCD protected)", "Older (needs upgrade)", "Unknown"], required: true },
      { key: "earthing_type", label: "Earthing arrangement", type: "select", options: ["TN-S", "TN-C-S (PME)", "TT", "Unknown"], required: true },
      { key: "spare_ways", label: "Spare ways available?", type: "boolean" },
      { key: "electrical_notes", label: "Additional electrical notes", type: "textarea" },
    ],
  },
  {
    id: "panel_layout",
    title: "Panel Layout & Specification",
    fields: [
      { key: "panel_count", label: "Number of panels", type: "number", required: true },
      { key: "panel_model", label: "Panel model", type: "text" },
      { key: "panel_wattage", label: "Panel wattage (W)", type: "number" },
      { key: "inverter_model", label: "Inverter model", type: "text" },
      { key: "inverter_location", label: "Inverter proposed location", type: "text" },
      { key: "battery_included", label: "Battery storage included?", type: "boolean" },
      { key: "battery_model", label: "Battery model", type: "text" },
      { key: "layout_notes", label: "Layout notes", type: "textarea" },
    ],
  },
  {
    id: "scaffolding",
    title: "Scaffolding Assessment",
    fields: [
      { key: "scaffold_required", label: "Scaffolding required?", type: "boolean", required: true },
      { key: "scaffold_height", label: "Estimated scaffold height (m)", type: "number" },
      { key: "scaffold_sides", label: "Number of sides", type: "select", options: ["1", "2", "3", "4"] },
      { key: "ground_conditions", label: "Ground conditions", type: "select", options: ["Solid/paved", "Grass/soft", "Sloped", "Restricted access"] },
      { key: "scaffold_notes", label: "Scaffolding notes", type: "textarea" },
    ],
  },
  {
    id: "health_safety",
    title: "Health & Safety",
    fields: [
      { key: "asbestos_risk", label: "Asbestos risk identified?", type: "boolean", required: true },
      { key: "asbestos_notes", label: "Asbestos details", type: "textarea" },
      { key: "hazards_identified", label: "Other hazards identified?", type: "boolean" },
      { key: "hazard_notes", label: "Hazard details", type: "textarea" },
      { key: "ppe_requirements", label: "PPE requirements", type: "text" },
      { key: "risk_level", label: "Overall risk assessment", type: "select", options: ["Low", "Medium", "High"], required: true },
    ],
  },
  {
    id: "summary",
    title: "Summary & Recommendations",
    fields: [
      { key: "installation_viable", label: "Installation viable?", type: "boolean", required: true },
      { key: "estimated_system_size", label: "Estimated system size (kWp)", type: "number" },
      { key: "estimated_annual_yield", label: "Estimated annual yield (kWh)", type: "number" },
      { key: "recommendations", label: "Recommendations", type: "textarea", required: true },
      { key: "additional_work_required", label: "Additional work required", type: "textarea" },
      { key: "engineer_comments", label: "Final comments", type: "textarea" },
    ],
  },
];

export default function SiteReport() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [reportId, setReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportStatus, setReportStatus] = useState("draft");

  useEffect(() => {
    const load = async () => {
      if (!jobId) return;
      const { data } = await (supabase as any)
        .from("site_reports")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setReportId(data.id);
        setReportData(data.report_data || {});
        setReportStatus(data.status);
      }
      setLoading(false);
    };
    load();
  }, [jobId]);

  const setValue = (key: string, value: any) => {
    setReportData((prev) => ({ ...prev, [key]: value }));
  };

  const saveProgress = async () => {
    if (!jobId || !user) return;
    setSaving(true);
    if (reportId) {
      await (supabase as any).from("site_reports").update({
        report_data: reportData,
        updated_at: new Date().toISOString(),
      }).eq("id", reportId);
    } else {
      const { data } = await (supabase as any).from("site_reports").insert({
        job_id: jobId,
        engineer_id: user.id,
        report_data: reportData,
      }).select("id").single();
      if (data) setReportId(data.id);
    }
    toast({ title: "Progress saved" });
    setSaving(false);
  };

  const submitReport = async () => {
    if (!reportId || !user) return;
    // Validate required fields
    const missing: string[] = [];
    SECTIONS.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required && (reportData[field.key] === undefined || reportData[field.key] === "" || reportData[field.key] === null)) {
          missing.push(`${section.title}: ${field.label}`);
        }
      });
    });
    if (missing.length > 0) {
      toast({ title: "Missing required fields", description: missing.slice(0, 3).join(", ") + (missing.length > 3 ? ` and ${missing.length - 3} more` : ""), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await supabase.from("site_reports").update({
      status: "submitted",
      report_data: reportData as any,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", reportId);
    setReportStatus("submitted");
    logAudit(user.id, "site_report_submitted", "site_report", reportId, { job_id: jobId });
    toast({ title: "Site report submitted" });
    setSubmitting(false);
  };

  const section = SECTIONS[currentSection];
  const progress = ((currentSection + 1) / SECTIONS.length) * 100;
  const filledCount = SECTIONS.reduce((acc, s) => {
    return acc + s.fields.filter((f) => reportData[f.key] !== undefined && reportData[f.key] !== "" && reportData[f.key] !== null).length;
  }, 0);
  const totalFields = SECTIONS.reduce((acc, s) => acc + s.fields.length, 0);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  const isReadOnly = reportStatus === "submitted" || reportStatus === "approved";

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/jobs/${jobId}`)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Job
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" /> Site Report
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filledCount}/{totalFields} fields completed
        </p>
        <Progress value={(filledCount / totalFields) * 100} className="mt-2 h-2" />
      </div>

      {/* Section navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentSection(i)}
            className={cn(
              "text-[10px] px-2.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors",
              i === currentSection
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Current section form */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{section.title}</CardTitle>
            <span className="text-xs text-muted-foreground">{currentSection + 1}/{SECTIONS.length}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {section.fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>

              {field.type === "text" && (
                <Input
                  value={reportData[field.key] || ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  disabled={isReadOnly}
                />
              )}

              {field.type === "number" && (
                <Input
                  type="number"
                  value={reportData[field.key] || ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  disabled={isReadOnly}
                />
              )}

              {field.type === "textarea" && (
                <Textarea
                  value={reportData[field.key] || ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  rows={3}
                  disabled={isReadOnly}
                />
              )}

              {field.type === "select" && (
                <Select
                  value={reportData[field.key] || ""}
                  onValueChange={(v) => setValue(field.key, v)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === "boolean" && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!reportData[field.key]}
                    onCheckedChange={(v) => setValue(field.key, v)}
                    disabled={isReadOnly}
                  />
                  <span className="text-sm text-muted-foreground">{reportData[field.key] ? "Yes" : "No"}</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation + Save */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentSection === 0}
          onClick={() => setCurrentSection((p) => p - 1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        <div className="flex gap-2">
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={saveProgress} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          )}

          {currentSection < SECTIONS.length - 1 ? (
            <Button size="sm" onClick={() => { saveProgress(); setCurrentSection((p) => p + 1); }}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : !isReadOnly ? (
            <Button size="sm" onClick={submitReport} disabled={submitting} className="bg-success hover:bg-success/90">
              <Send className="h-4 w-4 mr-1" /> {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          ) : null}
        </div>
      </div>

      {isReadOnly && (
        <Card className="border-success/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
            <p className="text-sm text-foreground">This report has been submitted and is read-only.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
