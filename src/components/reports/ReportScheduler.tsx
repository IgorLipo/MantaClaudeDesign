import { useState, useEffect } from "react";
import { CalendarClock, Mail, Clock, Trash2, Plus, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface ReportSchedule {
  id: string;
  reportId: string;
  reportTitle: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:MM format
  recipients: string[];
  isActive: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun: string;
}

interface ReportSchedulerProps {
  reportId: string;
  reportTitle: string;
  iconOnly?: boolean;
}

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

// Helper to calculate next run date
function calculateNextRun(
  frequency: "daily" | "weekly" | "monthly",
  time: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): string {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (frequency === "daily") {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly" && dayOfWeek !== undefined) {
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
      daysUntil += 7;
    }
    next.setDate(next.getDate() + daysUntil);
  } else if (frequency === "monthly" && dayOfMonth !== undefined) {
    next.setDate(dayOfMonth);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next.toISOString();
}

// Get schedules from sessionStorage
function getSchedules(): ReportSchedule[] {
  const data = sessionStorage.getItem("reportSchedules");
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save schedules to sessionStorage
function saveSchedules(schedules: ReportSchedule[]): void {
  sessionStorage.setItem("reportSchedules", JSON.stringify(schedules));
}

export function ReportScheduler({ reportId, reportTitle, iconOnly }: ReportSchedulerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState("1"); // Monday
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [time, setTime] = useState("09:00");
  const [recipients, setRecipients] = useState("");
  const [includeNotification, setIncludeNotification] = useState(true);

  // Load schedules for this report
  useEffect(() => {
    if (isOpen) {
      const allSchedules = getSchedules();
      setSchedules(allSchedules.filter((s) => s.reportId === reportId));
    }
  }, [isOpen, reportId]);

  const handleCreateSchedule = () => {
    const emailList = recipients
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes("@"));

    if (emailList.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    const newSchedule: ReportSchedule = {
      id: `schedule-${Date.now()}`,
      reportId,
      reportTitle,
      frequency,
      dayOfWeek: frequency === "weekly" ? parseInt(dayOfWeek) : undefined,
      dayOfMonth: frequency === "monthly" ? parseInt(dayOfMonth) : undefined,
      time,
      recipients: emailList,
      isActive: true,
      createdAt: new Date().toISOString(),
      nextRun: calculateNextRun(
        frequency,
        time,
        frequency === "weekly" ? parseInt(dayOfWeek) : undefined,
        frequency === "monthly" ? parseInt(dayOfMonth) : undefined
      ),
    };

    const allSchedules = getSchedules();
    allSchedules.push(newSchedule);
    saveSchedules(allSchedules);
    setSchedules([...schedules, newSchedule]);

    // Reset form
    setIsCreating(false);
    setRecipients("");
    setFrequency("weekly");
    setDayOfWeek("1");
    setTime("09:00");

    toast.success("Schedule created!", {
      description: `Report will be sent ${frequency} to ${emailList.length} recipient(s).`,
    });
  };

  const handleToggleActive = (scheduleId: string) => {
    const allSchedules = getSchedules();
    const updated = allSchedules.map((s) =>
      s.id === scheduleId ? { ...s, isActive: !s.isActive } : s
    );
    saveSchedules(updated);
    setSchedules(updated.filter((s) => s.reportId === reportId));
    toast.success("Schedule updated");
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const allSchedules = getSchedules();
    const updated = allSchedules.filter((s) => s.id !== scheduleId);
    saveSchedules(updated);
    setSchedules(updated.filter((s) => s.reportId === reportId));
    toast.success("Schedule deleted");
  };

  const formatNextRun = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFrequencyLabel = (schedule: ReportSchedule) => {
    if (schedule.frequency === "daily") return "Daily";
    if (schedule.frequency === "weekly") {
      return `Weekly on ${DAYS_OF_WEEK[schedule.dayOfWeek || 0].label}`;
    }
    return `Monthly on the ${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth || 1)}`;
  };

  const getOrdinalSuffix = (n: number) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <CalendarClock className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Report Scheduling
          </DialogTitle>
          <DialogDescription>
            Set up automated report delivery for "{reportTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!isCreating ? (
            <>
              {/* Existing schedules */}
              {schedules.length > 0 ? (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-3">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`p-4 rounded-lg border ${
                          schedule.isActive
                            ? "border-border bg-card"
                            : "border-border/50 bg-muted/30 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={schedule.isActive ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {schedule.isActive ? "Active" : "Paused"}
                              </Badge>
                              <span className="text-sm font-medium text-foreground">
                                {getFrequencyLabel(schedule)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                              <Clock className="h-3 w-3" />
                              <span>at {schedule.time}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">
                                {schedule.recipients.join(", ")}
                              </span>
                            </div>

                            <div className="text-xs text-accent">
                              Next run: {formatNextRun(schedule.nextRun)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={schedule.isActive}
                              onCheckedChange={() => handleToggleActive(schedule.id)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CalendarClock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    No schedules set up
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    Create a schedule to automatically generate and send this report.
                  </p>
                </div>
              )}

              <Button
                className="w-full mt-4 gap-2"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4" />
                Create Schedule
              </Button>
            </>
          ) : (
            /* Create new schedule form */
            <div className="space-y-4">
              {/* Frequency */}
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as typeof frequency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Day of week (for weekly) */}
              {frequency === "weekly" && (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Day of month (for monthly) */}
              {frequency === "monthly" && (
                <div className="space-y-2">
                  <Label>Day of Month</Label>
                  <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}
                          {getOrdinalSuffix(i + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Time */}
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <Input
                  type="text"
                  placeholder="email@example.com, team@company.com"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple emails with commas
                </p>
              </div>

              {/* Notification toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Send notification when delivered</span>
                </div>
                <Switch
                  checked={includeNotification}
                  onCheckedChange={setIncludeNotification}
                />
              </div>

              {/* Demo notice */}
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Demo Mode:</span>{" "}
                    Schedules are saved locally. In production, reports would be
                    automatically generated and emailed at the scheduled times.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isCreating && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule}>
              <CalendarClock className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}