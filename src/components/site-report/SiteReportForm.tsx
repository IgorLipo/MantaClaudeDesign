import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Camera, X, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/* ──────── Types ──────── */
export interface MaterialRow {
  description: string;
  quantity: string;
  serial_old: string;
  serial_new: string;
}

export interface ReportFormData {
  engineer_name: string;
  date_of_visit: string;
  address: string;
  case_no: string;
  site_id: string;
  fse_attendees: string;
  installer_details: string;
  end_customer_details: string;
  other_parties: string;
  purpose_of_visit: string;
  summary: string;
  materials: MaterialRow[];
  engineer_comments: string;
  follow_up_action: string;
  evidence_photos: string[];
}

const PURPOSE_PRESETS = [
  "Routine maintenance",
  "Warranty call-out",
  "Inverter replacement",
  "Optimiser replacement",
  "Panel inspection",
  "System commissioning",
  "Fault diagnosis",
  "Performance check",
  "Customer complaint",
  "Other",
];

const emptyMaterial = (): MaterialRow => ({
  description: "",
  quantity: "1",
  serial_old: "",
  serial_new: "",
});

interface Props {
  data: ReportFormData;
  onChange: (data: ReportFormData) => void;
  jobId: string;
  userId: string;
}

export default function SiteReportForm({ data, onChange, jobId, userId }: Props) {
  const { toast } = useToast();
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const set = <K extends keyof ReportFormData>(key: K, value: ReportFormData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const setMaterial = (idx: number, field: keyof MaterialRow, value: string) => {
    const updated = [...data.materials];
    updated[idx] = { ...updated[idx], [field]: value };
    set("materials", updated);
  };

  const addMaterial = () => set("materials", [...data.materials, emptyMaterial()]);

  const removeMaterial = (idx: number) => {
    const updated = data.materials.filter((_, i) => i !== idx);
    set("materials", updated.length === 0 ? [emptyMaterial()] : updated);
  };

  const handleEvidenceUpload = async (file: File) => {
    setUploadingEvidence(true);
    const ext = file.name.split(".").pop();
    const path = `${jobId}/report/evidence_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("job-photos").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingEvidence(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(path);
    set("evidence_photos", [...data.evidence_photos, urlData.publicUrl]);
    setUploadingEvidence(false);
    toast({ title: "Photo added" });
  };

  const removeEvidence = (idx: number) => {
    set("evidence_photos", data.evidence_photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {/* ── 1. General Details ── */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">General Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Engineer Name">
              <Input value={data.engineer_name} onChange={(e) => set("engineer_name", e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Date of Visit">
              <Input type="date" value={data.date_of_visit} onChange={(e) => set("date_of_visit", e.target.value)} />
            </Field>
          </div>
          <Field label="Address">
            <Textarea value={data.address} onChange={(e) => set("address", e.target.value)} rows={2} placeholder="Site address" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Case No.">
              <Input value={data.case_no} onChange={(e) => set("case_no", e.target.value)} placeholder="e.g. MRE-001" />
            </Field>
            <Field label="Site ID">
              <Input value={data.site_id} onChange={(e) => set("site_id", e.target.value)} placeholder="e.g. S-12345" />
            </Field>
          </div>
          <Field label="FSEs / Other Attendees">
            <Input value={data.fse_attendees} onChange={(e) => set("fse_attendees", e.target.value)} placeholder="Names of attendees" />
          </Field>
          <Field label="Installer Details">
            <Input value={data.installer_details} onChange={(e) => set("installer_details", e.target.value)} placeholder="Installer company / contact" />
          </Field>
          <Field label="End-Customer Details">
            <Input value={data.end_customer_details} onChange={(e) => set("end_customer_details", e.target.value)} placeholder="Customer name / contact" />
          </Field>
          <Field label="Other Parties">
            <Input value={data.other_parties} onChange={(e) => set("other_parties", e.target.value)} placeholder="Any other relevant parties" />
          </Field>
        </CardContent>
      </Card>

      {/* ── 2. Purpose of Visit ── */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Purpose of Visit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {PURPOSE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("purpose_of_visit", p)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full font-medium transition-colors border",
                  data.purpose_of_visit === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Textarea
            value={data.purpose_of_visit}
            onChange={(e) => set("purpose_of_visit", e.target.value)}
            rows={2}
            placeholder="Describe the purpose of the visit..."
          />
        </CardContent>
      </Card>

      {/* ── 3. Summary ── */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.summary}
            onChange={(e) => set("summary", e.target.value)}
            rows={4}
            placeholder="Summarise what was achieved during the visit..."
          />
        </CardContent>
      </Card>

      {/* ── 4. Supplied Materials Used ── */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Supplied Materials Used</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.materials.map((mat, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMaterial(idx)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Description" compact>
                  <Input value={mat.description} onChange={(e) => setMaterial(idx, "description", e.target.value)} placeholder="e.g. Optimiser" className="h-8 text-sm" />
                </Field>
                <Field label="Qty" compact>
                  <Input type="number" value={mat.quantity} onChange={(e) => setMaterial(idx, "quantity", e.target.value)} className="h-8 text-sm" />
                </Field>
                <Field label="Old Serial No." compact>
                  <Input value={mat.serial_old} onChange={(e) => setMaterial(idx, "serial_old", e.target.value)} placeholder="Old serial" className="h-8 text-sm" />
                </Field>
                <Field label="New Serial No." compact>
                  <Input value={mat.serial_new} onChange={(e) => setMaterial(idx, "serial_new", e.target.value)} placeholder="New serial" className="h-8 text-sm" />
                </Field>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addMaterial} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Add Material
          </Button>
        </CardContent>
      </Card>

      {/* ── 5. Engineer Comments ── */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Comments from Engineers / Attendees</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.engineer_comments}
            onChange={(e) => set("engineer_comments", e.target.value)}
            rows={4}
            placeholder="Any comments, observations, or notes..."
          />
        </CardContent>
      </Card>

      {/* ── 6. Follow-Up Action ── */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Follow-Up Action</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.follow_up_action}
            onChange={(e) => set("follow_up_action", e.target.value)}
            rows={3}
            placeholder="Required follow-up actions or next steps..."
          />
        </CardContent>
      </Card>

      {/* ── 7. Evidence / Pictures ── */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Evidence of System Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.evidence_photos.map((url, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-border aspect-square">
                <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                <Button
                  size="icon" variant="ghost"
                  className="absolute top-1 right-1 h-6 w-6 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => removeEvidence(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <label className="cursor-pointer">
              <input
                type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEvidenceUpload(f); }}
                disabled={uploadingEvidence}
              />
              <div className="border-2 border-dashed border-border rounded-lg aspect-square flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                {uploadingEvidence ? (
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-[10px] text-muted-foreground text-center px-2">Add photo</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, compact }: { label: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      <Label className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>{label}</Label>
      {children}
    </div>
  );
}
