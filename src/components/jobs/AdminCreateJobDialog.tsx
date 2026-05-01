import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Link2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import { generateInviteToken, buildInviteUrl, buildInviteMessage } from "@/lib/inviteUtils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export function AdminCreateJobDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [caseNo, setCaseNo] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ jobId: string; url: string; message: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const reset = () => {
    setCaseNo(""); setTitle(""); setCreated(null);
    setCopiedUrl(false); setCopiedMsg(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleCreate = async () => {
    if (!user || !caseNo.trim()) return;
    setSubmitting(true);

    // 1. Create draft job in awaiting_owner_details state
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

    // Merge global default settings into the new job
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

    // 2. Generate invite token
    const token = generateInviteToken();
    const { error: inviteErr } = await supabase.from("job_invites").insert({
      job_id: job.id,
      token,
      created_by: user.id,
    } as any);

    if (inviteErr) {
      toast({ title: "Job created, but invite failed", description: inviteErr.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const url = buildInviteUrl(token);
    const message = buildInviteMessage(caseNo.trim(), url);

    logAudit(user.id, "admin_job_created", "job", job.id, { case_no: caseNo.trim() });
    toast({ title: "Job created — share the link below" });
    setCreated({ jobId: job.id, url, message });
    setSubmitting(false);
    onCreated?.();
  };

  const copy = async (text: string, which: "url" | "msg") => {
    await navigator.clipboard.writeText(text);
    if (which === "url") { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 1500); }
    else { setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 1500); }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{created ? "Invite Created" : "Create New Job"}</DialogTitle>
        </DialogHeader>

        {!created ? (
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
              {submitting ? "Creating..." : "Create Job & Generate Invite"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              You'll get a secure shareable link to send the System Owner so they can complete the property details.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Link2 className="h-3 w-3" /> Secure Invite Link</Label>
              <div className="flex gap-2">
                <Input value={created.url} readOnly className="text-xs" />
                <Button size="sm" variant="outline" onClick={() => copy(created.url, "url")}>
                  {copiedUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Suggested Message</Label>
              <Textarea value={created.message} readOnly rows={6} className="text-xs" />
              <Button size="sm" variant="outline" className="w-full" onClick={() => copy(created.message, "msg")}>
                {copiedMsg ? <><Check className="h-3.5 w-3.5 mr-1" /> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copy Message</>}
              </Button>
            </div>

            <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
