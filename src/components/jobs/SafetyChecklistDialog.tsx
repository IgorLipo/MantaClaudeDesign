import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, HardHat, Zap, Wind, Home, Radio,
  Eye, Flame, Cross, ClipboardCheck, Camera, Building2,
  X, ImagePlus, Check, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/hooks/useAuditLog";
import { notifySafetyChecklistComplete } from "@/hooks/useNotificationTriggers";

/* ──────── Safety Checklist Data ──────── */

interface SafetyItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  section: "personal" | "site" | "emergency" | "docs";
}

const SAFETY_ITEMS: SafetyItem[] = [
  // Personal Safety
  { id: "ppe", label: "PPE worn", description: "Hard hat, harness, gloves, steel-toe boots, high-vis vest", icon: HardHat, section: "personal" },
  { id: "ladder", label: "Ladder safety", description: "Secure, stable ground, correct 4:1 angle ratio", icon: ShieldCheck, section: "personal" },
  { id: "communication", label: "Communication plan", description: "Radio/phone charged, emergency contacts known, buddy system active", icon: Radio, section: "personal" },
  // Site Safety
  { id: "electrical", label: "Electrical isolation", description: "Array isolated, inverter off, no exposed live cables", icon: Zap, section: "site" },
  { id: "weather", label: "Weather conditions", description: "No high winds (>25mph), rain, ice, or lightning risk", icon: Wind, section: "site" },
  { id: "roof", label: "Roof condition", description: "Structure safe to walk on, no loose tiles or fragile surfaces", icon: Home, section: "site" },
  { id: "site", label: "Site hazards marked", description: "Trip hazards, overhead cables, confined spaces identified", icon: Eye, section: "site" },
  // Emergency
  { id: "fire", label: "Fire safety", description: "Extinguisher accessible, no flammables near electrical, exits clear", icon: Flame, section: "emergency" },
  { id: "firstaid", label: "First aid ready", description: "Kit on site, designated first-aider identified", icon: Cross, section: "emergency" },
  // Documentation
  { id: "signoff", label: "Toolbox talk done", description: "All team briefed on tasks, risks, and emergency procedures", icon: ClipboardCheck, section: "docs" },
  { id: "building_photo", label: "Building exterior", description: "Clear photo of the building from outside", icon: Building2, section: "docs" },
];

const SECTION_LABELS: Record<string, string> = {
  personal: "Personal Safety",
  site: "Site Conditions",
  emergency: "Emergency Prep",
  docs: "Documentation",
};

interface ChecklistStateItem {
  id: string;
  checked: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  engineerId: string;
  onComplete: () => void;
}

export default function SafetyChecklistDialog({ open, onOpenChange, jobId, engineerId, onComplete }: Props) {
  const { toast } = useToast();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buildingPhoto, setBuildingPhoto] = useState<File | null>(null);
  const [buildingPhotoUrl, setBuildingPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalCount = SAFETY_ITEMS.length;
  const allChecked = checkedCount === totalCount;

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
        const saved: ChecklistStateItem[] = data.items || [];
        const merged: Record<string, boolean> = {};
        SAFETY_ITEMS.forEach((item) => {
          const savedItem = saved.find((s) => s.id === item.id);
          merged[item.id] = savedItem ? savedItem.checked : false;
        });
        setChecked(merged);
        setNotes(data.notes || "");
        if (data.building_photo_url) {
          setBuildingPhotoUrl(data.building_photo_url);
          setChecked((prev) => ({ ...prev, building_photo: true }));
        }
      } else {
        const fresh: Record<string, boolean> = {};
        SAFETY_ITEMS.forEach((item) => { fresh[item.id] = false; });
        setChecked(fresh);
        setNotes("");
        setBuildingPhoto(null);
        setBuildingPhotoUrl(null);
      }
      setLoading(false);
    };
    load();
  }, [open, jobId, engineerId]);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBuildingPhoto(file);
    setBuildingPhotoUrl(URL.createObjectURL(file));
    setChecked((prev) => ({ ...prev, building_photo: true }));
  };

  const clearPhoto = () => {
    setBuildingPhoto(null);
    setBuildingPhotoUrl(null);
    setChecked((prev) => ({ ...prev, building_photo: false }));
  };

  const handleSubmit = async () => {
    if (!allChecked) {
      toast({ title: "Complete all checklist items before submitting", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    let photoUrl = buildingPhotoUrl;
    if (buildingPhoto && jobId) {
      const ext = buildingPhoto.name.split(".").pop();
      const path = `${jobId}/safety/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("job-photos").upload(path, buildingPhoto);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }
    }

    const items: ChecklistStateItem[] = Object.entries(checked).map(([id, val]) => ({ id, checked: val }));
    const { error } = await (supabase as any).rpc("upsert_safety_checklist", {
      _job_id: jobId,
      _items: items,
      _notes: notes,
      _building_photo_url: photoUrl || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    logAudit(engineerId, "safety_checklist_completed", "job", jobId);
    notifySafetyChecklistComplete(jobId, notes, engineerId);
    toast({ title: "Safety checklist completed" });
    setSubmitting(false);
    onComplete();
  };

  // Group items by section
  const sections = SAFETY_ITEMS.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, SafetyItem[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border/60 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold leading-tight">Site Safety Checklist</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  All items must be verified before work begins
                </DialogDescription>
              </div>
            </div>
            {/* Progress ring */}
            <div className="flex flex-col items-center shrink-0">
              <svg width="48" height="48" viewBox="0 0 48 48" className={cn(
                "-rotate-90 transition-all duration-700",
                allChecked ? "text-emerald-500" : "text-amber-500"
              )}>
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
                <circle
                  cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(checkedCount / totalCount) * 125.66} 125.66`}
                  className="transition-[stroke-dasharray] duration-500"
                />
              </svg>
              <span className="text-[10px] font-mono tabular-nums text-muted-foreground -mt-5">
                {checkedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading checklist…</div>
        ) : (
          <div className="px-6 py-5 space-y-8">
            {Object.entries(sections).map(([sectionKey, sectionItems]) => (
              <div key={sectionKey}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {SECTION_LABELS[sectionKey]}
                  </span>
                  <span className="flex-1 h-px bg-border/60" />
                </div>
                <div className="space-y-1.5">
                  {sectionItems.map((item) => {
                    const isChecked = checked[item.id] || false;
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "group flex items-center gap-3 px-3 py-2.5 -mx-1 rounded-lg cursor-pointer",
                          "transition-all duration-150",
                          isChecked
                            ? "bg-emerald-500/5 ring-1 ring-emerald-500/15"
                            : "hover:bg-muted/60"
                        )}
                      >
                        <button
                          onClick={() => toggle(item.id)}
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-150",
                            isChecked
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-muted-foreground/30 hover:border-muted-foreground/50"
                          )}
                        >
                          {isChecked && <Check className="h-3 w-3" strokeWidth={3} />}
                        </button>
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors duration-150",
                          isChecked ? "text-emerald-500" : "text-muted-foreground"
                        )} />
                        <div className="min-w-0 flex-1">
                          <span className={cn(
                            "text-sm font-medium transition-all duration-150",
                            isChecked ? "text-emerald-600 line-through decoration-emerald-300/60" : "text-foreground"
                          )}>
                            {item.label}
                          </span>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Building Photo Upload */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Site Evidence
                </span>
                <span className="flex-1 h-px bg-border/60" />
              </div>

              {buildingPhotoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border/80 shadow-sm group">
                  <img
                    src={buildingPhotoUrl}
                    alt="Building exterior"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <button
                    onClick={clearPhoto}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs">
                    <Check className="h-3 w-3 text-emerald-400" />
                    Photo captured
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-muted-foreground hover:text-primary group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium">Add building exterior photo</div>
                  <div className="text-[11px] text-muted-foreground/70">Required before starting work</div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Additional notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any safety observations, concerns, or crew notes…"
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border/60 px-6 py-4 space-y-2">
          {allChecked && !loading && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 ring-1 ring-emerald-500/15 text-[11px] text-emerald-600 animate-em-enter">
              <Check className="h-3.5 w-3.5" />
              All {totalCount} safety checks verified — ready to proceed
            </div>
          )}
          <Button
            size="lg"
            className="w-full font-semibold tracking-tight"
            disabled={!allChecked || submitting || loading}
            onClick={handleSubmit}
          >
            {submitting ? (
              "Saving…"
            ) : allChecked ? (
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Confirm &amp; Start Work
              </span>
            ) : (
              `${checkedCount} of ${totalCount} checks completed`
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            By submitting, you confirm all safety checks have been physically verified on site.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
