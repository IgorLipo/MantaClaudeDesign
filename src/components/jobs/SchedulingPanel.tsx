import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Download, CheckCircle2, XCircle, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { notify } from "@/hooks/useNotificationTriggers";

interface SchedulingPanelProps {
  job: any;
  role: string | null;
  onUpdate: () => void;
}

function generateICS(job: any): string {
  const start = new Date(job.scheduled_date);
  const end = new Date(start.getTime() + (job.scheduled_duration || 4) * 3600000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SolarScaffoldPro//EN",
    "BEGIN:VEVENT", `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${job.title}`, `LOCATION:${job.address}`,
    `DESCRIPTION:Solar Scaffold Pro job — ${job.description || "No description"}`,
    `UID:${job.id}@solarscaffoldpro`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function SchedulingPanel({ job, role, onUpdate }: SchedulingPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(job.scheduled_date ? new Date(job.scheduled_date) : undefined);
  const [duration, setDuration] = useState(job.scheduled_duration || 4);
  const [saving, setSaving] = useState(false);
  const [responseNotes, setResponseNotes] = useState("");

  const saveSchedule = async () => {
    if (!date || !user) return;
    setSaving(true);
    const { error } = await supabase.from("jobs").update({
      scheduled_date: date.toISOString(),
      scheduled_duration: duration,
      schedule_confirmed: false,
      schedule_response: null,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Schedule set" });
      logAudit(user.id, "schedule_set", "job", job.id, { date: date.toISOString(), duration });
      // Notify owner
      if (job.owner_id) {
        await notify({
          userId: job.owner_id, type: "scheduling",
          title: "Job Scheduled",
          message: `Your job "${job.title}" has been scheduled for ${format(date, "dd MMM yyyy")}. Please confirm or request a change.`,
          data: { job_id: job.id },
        });
      }
      // Notify assigned scaffolders
      const { data: assigns } = await supabase.from("job_assignments").select("scaffolder_id").eq("job_id", job.id).eq("assignment_role", "scaffolder");
      if (assigns) {
        for (const a of assigns) {
          await notify({
            userId: a.scaffolder_id, type: "scheduling",
            title: "Job Scheduled",
            message: `Job "${job.title}" has been scheduled for ${format(date, "dd MMM yyyy")}.`,
            data: { job_id: job.id },
          });
        }
      }
      onUpdate();
    }
    setSaving(false);
  };

  const respondToSchedule = async (response: "confirmed" | "change_requested") => {
    if (!user) return;
    await supabase.from("jobs").update({
      schedule_confirmed: response === "confirmed",
      schedule_response: response,
      schedule_notes: responseNotes,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    toast({ title: response === "confirmed" ? "Schedule confirmed" : "Change requested" });
    logAudit(user.id, `schedule_${response}`, "job", job.id, { notes: responseNotes });

    const label = response === "confirmed" ? "Schedule Confirmed" : "Schedule Change Requested";
    const msg = `Owner ${response === "confirmed" ? "confirmed" : "requested a change for"} job "${job.title}".${responseNotes ? ` Notes: ${responseNotes}` : ""}`;

    // Notify all admins
    const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (adminRoles) {
      for (const ar of adminRoles) {
        await notify({ userId: ar.user_id, type: "scheduling", title: label, message: msg, data: { job_id: job.id } });
      }
    }
    // Notify assigned scaffolders
    const { data: assigns } = await supabase.from("job_assignments").select("scaffolder_id").eq("job_id", job.id).eq("assignment_role", "scaffolder");
    if (assigns) {
      for (const a of assigns) {
        await notify({ userId: a.scaffolder_id, type: "scheduling", title: label, message: msg, data: { job_id: job.id } });
      }
    }
    onUpdate();
  };

  const downloadICS = () => {
    if (!job.scheduled_date) return;
    const ics = generateICS(job);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job.title.replace(/\s+/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {job.scheduled_date && (
          <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">{format(new Date(job.scheduled_date), "EEE, dd MMM yyyy")}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {job.scheduled_duration || 4}h
              </div>
            </div>
            {job.schedule_response === "confirmed" ? (
              <div className="flex items-center gap-1.5 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Owner confirmed
              </div>
            ) : job.schedule_response === "change_requested" ? (
              <div className="flex items-center gap-1.5 text-xs text-warning">
                <XCircle className="h-3.5 w-3.5" /> Owner requested change
                {job.schedule_notes && <span className="text-muted-foreground">— {job.schedule_notes}</span>}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Awaiting owner confirmation</div>
            )}
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={downloadICS}>
              <Download className="h-3 w-3 mr-1" /> Download Calendar (.ics)
            </Button>
          </div>
        )}

        {role === "admin" && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">{job.scheduled_date ? "Update schedule" : "Set schedule"}</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left text-sm", !date && "text-muted-foreground")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <div className="space-y-1.5">
              <Label className="text-xs">Duration (hours)</Label>
              <Input type="number" min={1} max={24} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 4)} />
            </div>
            <Button size="sm" className="w-full" onClick={saveSchedule} disabled={!date || saving}>
              {saving ? "Saving..." : "Set Schedule"}
            </Button>
          </div>
        )}

        {role === "owner" && job.scheduled_date && !job.schedule_confirmed && job.schedule_response !== "change_requested" && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Confirm this date works for you</p>
            <Textarea
              placeholder="Notes (optional — e.g. preferred time, access instructions)"
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-success hover:bg-success/90" onClick={() => respondToSchedule("confirmed")}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-warning border-warning/30" onClick={() => respondToSchedule("change_requested")}>
                Request Change
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
