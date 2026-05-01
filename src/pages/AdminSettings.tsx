import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface DefaultSettings {
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
}

const DEFAULTS: DefaultSettings = {
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
};

export default function AdminSettings() {
  const { role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<DefaultSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role !== "admin") {
      navigate("/");
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("default_job_settings")
        .eq("id", 1)
        .single();

      if (data?.default_job_settings) {
        setSettings({ ...DEFAULTS, ...(data.default_job_settings as any) });
      }
      setLoading(false);
    };
    load();
  }, [role, navigate]);

  const toggle = (key: keyof DefaultSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_settings")
      .upsert({ id: 1, default_job_settings: settings as any, updated_at: new Date().toISOString() });

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Default settings saved" });
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen">
      <section className="border-b border-border/60">
        <div className="p-4 lg:p-10 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="font-display text-3xl lg:text-4xl tracking-tight text-foreground">
            Default Job Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            These defaults apply to all new jobs. Per-job overrides in Job Settings take precedence.
          </p>
        </div>
      </section>

      <div className="p-4 lg:p-10 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Global Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Scaffolder
              </legend>
              {(["scaffolder_can_chat", "scaffolder_can_upload_photos", "scaffolder_can_submit_quotes", "scaffolder_can_see_owner_docs"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <Label className="text-xs cursor-pointer" htmlFor={`g-${k}`}>
                    {k.replace(/^scaffolder_can_/, "").replace(/_/g, " ")}
                  </Label>
                  <Switch id={`g-${k}`} checked={settings[k]} onCheckedChange={() => toggle(k)} />
                </div>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Engineer
              </legend>
              {(["engineer_can_chat", "engineer_can_upload_photos", "engineer_can_change_status", "engineer_can_edit_site_report"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <Label className="text-xs cursor-pointer" htmlFor={`g-${k}`}>
                    {k.replace(/^engineer_can_/, "").replace(/_/g, " ")}
                  </Label>
                  <Switch id={`g-${k}`} checked={settings[k]} onCheckedChange={() => toggle(k)} />
                </div>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Owner
              </legend>
              {(["owner_can_see_status", "owner_can_see_docs", "owner_can_edit_address", "owner_can_upload_photos"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <Label className="text-xs cursor-pointer" htmlFor={`g-${k}`}>
                    {k.replace(/^owner_can_/, "").replace(/_/g, " ")}
                  </Label>
                  <Switch id={`g-${k}`} checked={settings[k]} onCheckedChange={() => toggle(k)} />
                </div>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Requirements
              </legend>
              {(["safety_checklist_required", "site_report_required", "quote_approval_required", "photo_evidence_required"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <Label className="text-xs cursor-pointer" htmlFor={`g-${k}`}>
                    {k.replace(/_/g, " ")}
                  </Label>
                  <Switch id={`g-${k}`} checked={settings[k]} onCheckedChange={() => toggle(k)} />
                </div>
              ))}
            </fieldset>

            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Default Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
