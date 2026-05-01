import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import { generateInviteToken } from "@/lib/inviteUtils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export function AdminCreateJobDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [caseNo, setCaseNo] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCaseNo(""); setTitle("");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleCreate = async () => {
    if (!user || !caseNo.trim()) return;
    setSubmitting(true);

    // 1. Create draft job
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        title: title.trim() || `Case ${caseNo.trim()}`,
        case_no: caseNo.trim(),
        status: "awaiting_owner_details" as any,
        owner_id: null,
      } as any)
      .select()
      .single();

    if (jobErr || !job) {
      toast({
        title: "Could not create job",
        description: jobErr?.message?.includes("unique") ? "Case No. already exists" : jobErr?.message,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Merge global default settings
    const { data: adminSettings } = await supabase
      .from("admin_settings")
      .select("default_job_settings")
      .eq("id", 1)
      .single();

    if (adminSettings?.default_job_settings && Object.keys(adminSettings.default_job_settings as Record<string, unknown>).length > 0) {
      await supabase
        .from("jobs")
        .update({ job_settings: adminSettings.default_job_settings })
        .eq("id", job.id);
    }

    // 2. Generate invite token (stored, but not shown immediately)
    const token = generateInviteToken();
    await supabase.from("job_invites").insert({
      job_id: job.id,
      token,
      created_by: user.id,
    } as any);

    logAudit(user.id, "admin_job_created", "job", job.id, { case_no: caseNo.trim() });
    toast({ title: "Job created" });
    setSubmitting(false);
    reset();
    onOpenChange(false);
    onCreated?.();

    // Navigate to the new job
    navigate(`/jobs/${job.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">SolarEdge Case No. *</Label>
            <Input
              placeholder="e.g. SE-2025-001"
              value={caseNo}
              onChange={(e) => setCaseNo(e.target.value)}
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground">Must be unique across all jobs.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Job Title (optional)</Label>
            <Input
              placeholder="Short label, e.g. Smith Residence"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={submitting || !caseNo.trim()} onClick={handleCreate}>
            {submitting ? "Creating..." : "Create Job"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            You can share this job with the System Owner from the job detail page.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
