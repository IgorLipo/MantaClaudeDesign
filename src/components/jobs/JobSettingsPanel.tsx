// src/components/jobs/JobSettingsPanel.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, GripVertical, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Checkpoint {
  id: string;
  step: string;
  label: string;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

interface JobSettings {
  scaffolder_can_chat: boolean;
  scaffolder_can_upload_photos: boolean;
  scaffolder_can_submit_quotes: boolean;
  scaffolder_can_see_owner_docs: boolean;
  engineer_can_chat: boolean;
  engineer_can_upload_photos: boolean;
  engineer_can_change_status: boolean;
  engineer_can_edit_site_report: boolean;
  owner_can_see_status: boolean;
  owner_can_see_docs: boolean;
  owner_can_edit_address: boolean;
  owner_can_upload_photos: boolean;
  safety_checklist_required: boolean;
  site_report_required: boolean;
  quote_approval_required: boolean;
  photo_evidence_required: boolean;
  custom_checkpoints: Checkpoint[];
}

const DEFAULTS: JobSettings = {
  scaffolder_can_chat: true,
  scaffolder_can_upload_photos: true,
  scaffolder_can_submit_quotes: true,
  scaffolder_can_see_owner_docs: true,
  engineer_can_chat: true,
  engineer_can_upload_photos: true,
  engineer_can_change_status: true,
  engineer_can_edit_site_report: true,
  owner_can_see_status: true,
  owner_can_see_docs: true,
  owner_can_edit_address: true,
  owner_can_upload_photos: true,
  safety_checklist_required: true,
  site_report_required: true,
  quote_approval_required: false,
  photo_evidence_required: false,
  custom_checkpoints: [],
};

interface Props {
  jobId: string;
  currentSettings: Record<string, any> | null;
  onUpdated?: () => void;
}

export function JobSettingsPanel({ jobId, currentSettings, onUpdated }: Props) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<JobSettings>(() => ({
    ...DEFAULTS,
    ...currentSettings,
    custom_checkpoints: (currentSettings as any)?.custom_checkpoints || [],
  }));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (currentSettings && Object.keys(currentSettings).length > 0) {
      setSettings((prev) => ({
        ...prev,
        ...currentSettings,
        custom_checkpoints: (currentSettings as any)?.custom_checkpoints || prev.custom_checkpoints,
      }));
    }
  }, [currentSettings]);

  const toggle = (key: keyof Omit<JobSettings, "custom_checkpoints">) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("jobs")
      .update({ job_settings: settings as any, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
      onUpdated?.();
    }
    setSaving(false);
  };

  const addCheckpoint = () => {
    const cp: Checkpoint = {
      id: crypto.randomUUID(),
      step: "planning",
      label: "",
      completed: false,
      completed_by: null,
      completed_at: null,
    };
    setSettings((prev) => ({
      ...prev,
      custom_checkpoints: [...prev.custom_checkpoints, cp],
    }));
  };

  const removeCheckpoint = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      custom_checkpoints: prev.custom_checkpoints.filter((c) => c.id !== id),
    }));
  };

  const updateCheckpoint = (id: string, field: Partial<Checkpoint>) => {
    setSettings((prev) => ({
      ...prev,
      custom_checkpoints: prev.custom_checkpoints.map((c) =>
        c.id === id ? { ...c, ...field } : c
      ),
    }));
  };

  const steps = ["planning", "scheduled", "in_progress", "completed"];

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-border/60 rounded-lg">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium text-sm">
        Job Settings
        <ChevronDown className={`h-4 w-4 transition-transform duration-quick ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Scaffolder
          </legend>
          {(["scaffolder_can_chat", "scaffolder_can_upload_photos", "scaffolder_can_submit_quotes", "scaffolder_can_see_owner_docs"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <Label className="text-xs cursor-pointer" htmlFor={k}>
                {k.replace(/^scaffolder_can_/, "").replace(/_/g, " ")}
              </Label>
              <Switch id={k} checked={settings[k]} onCheckedChange={() => toggle(k)} />
            </div>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Engineer
          </legend>
          {(["engineer_can_chat", "engineer_can_upload_photos", "engineer_can_change_status", "engineer_can_edit_site_report"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <Label className="text-xs cursor-pointer" htmlFor={k}>
                {k.replace(/^engineer_can_/, "").replace(/_/g, " ")}
              </Label>
              <Switch id={k} checked={settings[k]} onCheckedChange={() => toggle(k)} />
            </div>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Owner
          </legend>
          {(["owner_can_see_status", "owner_can_see_docs", "owner_can_edit_address", "owner_can_upload_photos"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <Label className="text-xs cursor-pointer" htmlFor={k}>
                {k.replace(/^owner_can_/, "").replace(/_/g, " ")}
              </Label>
              <Switch id={k} checked={settings[k]} onCheckedChange={() => toggle(k)} />
            </div>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Requirements
          </legend>
          {(["safety_checklist_required", "site_report_required", "quote_approval_required", "photo_evidence_required"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <Label className="text-xs cursor-pointer" htmlFor={k}>
                {k.replace(/_/g, " ")}
              </Label>
              <Switch id={k} checked={settings[k]} onCheckedChange={() => toggle(k)} />
            </div>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Custom Checkpoints
          </legend>
          {settings.custom_checkpoints.map((cp) => (
            <div key={cp.id} className="flex items-center gap-2">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                className="text-xs border border-border rounded px-1 py-0.5 bg-card"
                value={cp.step}
                onChange={(e) => updateCheckpoint(cp.id, { step: e.target.value })}
              >
                {steps.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Input
                className="h-7 text-xs flex-1"
                placeholder="Checkpoint label"
                value={cp.label}
                onChange={(e) => updateCheckpoint(cp.id, { label: e.target.value })}
              />
              <button onClick={() => removeCheckpoint(cp.id)} className="shrink-0">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={addCheckpoint}>
            <Plus className="h-3 w-3 mr-1" /> Add checkpoint
          </Button>
        </fieldset>

        <Button size="sm" className="w-full" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
