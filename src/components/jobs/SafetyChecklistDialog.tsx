import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertTriangle, HardHat, Zap, Wind, Thermometer, Radio, Eye, Droplets, ClipboardCheck, ArrowUpDown, Camera, Building2, X, Printer, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/hooks/useAuditLog";
import { notifySafetyChecklistComplete } from "@/hooks/useNotificationTriggers";

/* ──────── Safety Checklist Items ──────── */
export interface SafetyChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
}

const DEFAULT_ITEMS: SafetyChecklistItem[] = [
  {
    id: "ppe",
    label: "PPE worn",
    description: "Hard hat, safety harness, gloves, steel-toe boots, high-vis vest",
    icon: <HardHat className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "ladder",
    label: "Ladder safety",
    description: "Ladder is secure, on stable ground, at correct angle (4:1 ratio)",
    icon: <ArrowUpDown className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "electrical",
    label: "Electrical isolation",
    description: "Solar array isolated, inverter powered down, no exposed live cables",
    icon: <Zap className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "weather",
    label: "Weather conditions safe",
    description: "No high winds (>25mph), rain, ice, or lightning risk",
    icon: <Wind className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "roof",
    label: "Roof condition assessed",
    description: "Roof structure safe to walk on, no loose tiles or fragile surfaces",
    icon: <Thermometer className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "communication",
    label: "Communication plan",
    description: "Radio/mobile phone charged, emergency contacts known, buddy system in place",
    icon: <Radio className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "site",
    label: "Site hazards identified",
    description: "Trip hazards, overhead cables, confined spaces, sharp edges identified and marked",
    icon: <Eye className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "fire",
    label: "Fire safety",
    description: "Fire extinguisher accessible, no flammable materials near electrical work, exit routes clear",
    icon: <AlertTriangle className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "firstaid",
    label: "First aid kit available",
    description: "First aid kit on site, designated first-aider identified",
    icon: <Droplets className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "signoff",
    label: "Toolbox talk completed",
    description: "All team members briefed on today's tasks, risks, and emergency procedures",
    icon: <ClipboardCheck className="h-4 w-4" />,
    checked: false,
  },
  {
    id: "building_photo",
    label: "Building exterior photo",
    description: "Upload or capture a clear photo of the building from the outside",
    icon: <Building2 className="h-4 w-4" />,
    checked: false,
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  engineerId: string;
  onComplete: () => void;
}

export default function SafetyChecklistDialog({ open, onOpenChange, jobId, engineerId, onComplete }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<SafetyChecklistItem[]>(DEFAULT_ITEMS);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buildingPhoto, setBuildingPhoto] = useState<File | null>(null);
  const [buildingPhotoUrl, setBuildingPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing checklist if one exists
  useEffect(() => {
    if (!open || !jobId) return;
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("safety_checklists")
        .select("*")
        .eq("job_id", jobId)
        .eq("engineer_id", engineerId)
        .maybeSingle();

      if (data) {
        const savedItems: SafetyChecklistItem[] = data.items || [];
        // Merge saved items with defaults to handle any new items added later
        const merged = DEFAULT_ITEMS.map((defaultItem) => {
          const saved = savedItems.find((s: any) => s.id === defaultItem.id);
          return saved ? { ...defaultItem, checked: saved.checked } : defaultItem;
        });
        setItems(merged);
        setNotes(data.notes || "");
        if (data.building_photo_url) {
          setBuildingPhotoUrl(data.building_photo_url);
          setItems((prev) => prev.map((i) => (i.id === "building_photo" ? { ...i, checked: true } : i)));
        }
      } else {
        setItems(DEFAULT_ITEMS.map((i) => ({ ...i })));
        setNotes("");
        setBuildingPhoto(null);
        setBuildingPhotoUrl(null);
      }
      setLoading(false);
    };
    load();
  }, [open, jobId, engineerId]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const allChecked = items.every((item) => item.checked);
  const checkedCount = items.filter((i) => i.checked).length;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBuildingPhoto(file);
    setBuildingPhotoUrl(URL.createObjectURL(file));
    setItems((prev) => prev.map((i) => (i.id === "building_photo" ? { ...i, checked: true } : i)));
  };

  const clearPhoto = () => {
    setBuildingPhoto(null);
    setBuildingPhotoUrl(null);
    setItems((prev) => prev.map((i) => (i.id === "building_photo" ? { ...i, checked: false } : i)));
  };

  const handleSubmit = async () => {
    if (!allChecked) {
      toast({ title: "All items must be checked", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Upload building photo if new one selected
    let uploadedPhotoUrl = buildingPhotoUrl;
    if (buildingPhoto && jobId) {
      const ext = buildingPhoto.name.split(".").pop();
      const path = `${jobId}/safety/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("job-photos").upload(path, buildingPhoto);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(path);
        uploadedPhotoUrl = urlData.publicUrl;
      }
    }

    const { error } = await (supabase as any).rpc("upsert_safety_checklist", {
      _job_id: jobId,
      _items: items.map(({ id, checked }) => ({ id, checked })),
      _notes: notes,
      _building_photo_url: uploadedPhotoUrl || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    logAudit(engineerId, "safety_checklist_completed", "job", jobId);
    notifySafetyChecklistComplete(jobId, notes, engineerId);

    toast({ title: "✅ Safety checklist completed" });
    setSubmitting(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>Safety Checklist</DialogTitle>
          </div>
          <DialogDescription>
            Complete all safety checks before starting work on site.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    allChecked ? "bg-success" : "bg-primary"
                  )}
                  style={{ width: `${(checkedCount / items.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {checkedCount}/{items.length}
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              {items.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    item.checked
                      ? "border-success/30 bg-success/5"
                      : "border-border bg-card hover:bg-secondary/50"
                  )}
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item.id)}
                    className={cn(
                      "mt-0.5",
                      item.checked && "border-success bg-success text-success-foreground"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "shrink-0",
                        item.checked ? "text-success" : "text-muted-foreground"
                      )}>
                        {item.icon}
                      </span>
                      <span className={cn(
                        "text-sm font-medium",
                        item.checked ? "text-success line-through" : "text-foreground"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs mt-0.5",
                      item.checked ? "text-success/70" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Building exterior photo - mandatory */}
            <div className="space-y-2 p-3 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Building Exterior Photo *</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a clear photo of the building from the outside. This is mandatory before starting work.
              </p>
              {buildingPhotoUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={buildingPhotoUrl} alt="Building exterior" className="w-full h-40 object-cover" />
                  <button
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-3 w-3 mr-1" /> Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-3 w-3 mr-1" /> Upload Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Additional Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional safety observations or concerns..."
                rows={2}
              />
            </div>

            {/* Submit */}
            <Button
              className="w-full"
              disabled={!allChecked || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Saving..." : allChecked ? "✓ Confirm & Start Work" : `Check all ${items.length} items to continue`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
