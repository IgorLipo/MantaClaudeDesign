// src/components/jobs/KanbanBoard.tsx
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, User } from "lucide-react";
import { KANBAN_COLUMNS, STATUS_LABELS, STATUS_VARIANTS, STATUS_TRANSITIONS } from "@/constants/status";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import { useAuth } from "@/contexts/AuthContext";

interface JobCard {
  id: string;
  title: string;
  case_no: string | null;
  address: string | null;
  status: string;
}

interface AssignInfo {
  job_id: string;
  scaffolderNames: string[];
  engineerNames: string[];
}

export function KanbanBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [assigns, setAssigns] = useState<AssignInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [{ data: jobData }, { data: assignData }, { data: profileData }] = await Promise.all([
      supabase.from("jobs").select("id,title,case_no,address,status").order("created_at", { ascending: false }),
      supabase.from("job_assignments").select("job_id,scaffolder_id,assignment_role"),
      supabase.from("profiles").select("user_id,first_name,last_name"),
    ]);

    if (jobData) setJobs(jobData);

    if (assignData && profileData) {
      const profileMap = new Map<string, string>();
      (profileData || []).forEach((p: any) => {
        profileMap.set(p.user_id, `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown");
      });

      const grouped: Record<string, { scaffolderNames: string[]; engineerNames: string[] }> = {};
      (assignData || []).forEach((a: any) => {
        if (!grouped[a.job_id]) grouped[a.job_id] = { scaffolderNames: [], engineerNames: [] };
        const name = profileMap.get(a.scaffolder_id) || "Unknown";
        if (a.assignment_role === "engineer") {
          grouped[a.job_id].engineerNames.push(name);
        } else {
          grouped[a.job_id].scaffolderNames.push(name);
        }
      });

      setAssigns(
        Object.entries(grouped).map(([job_id, info]) => ({
          job_id,
          scaffolderNames: info.scaffolderNames,
          engineerNames: info.engineerNames,
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getAssigns = (jobId: string) =>
    assigns.find((a) => a.job_id === jobId) || { scaffolderNames: [], engineerNames: [] };

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    const jobId = draggableId;
    const oldStatus = source.droppableId;

    const allowed = STATUS_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
      toast({ title: "Invalid move", description: `Cannot move from ${STATUS_LABELS[oldStatus]} to ${STATUS_LABELS[newStatus]}`, variant: "destructive" });
      return;
    }

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus as any, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    if (error) {
      toast({ title: "Move failed", description: error.message, variant: "destructive" });
      fetchData();
    } else {
      logAudit(user?.id, "status_change", "job", jobId, { from: source.droppableId, to: newStatus, via: "kanban" });
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col} className="min-w-[280px] max-w-[320px] flex-1">
            <div className="h-8 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col);
          return (
            <div key={col} className="min-w-[280px] max-w-[320px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={STATUS_VARIANTS[col] as any}>{STATUS_LABELS[col]}</Badge>
                <span className="text-xs text-muted-foreground">{colJobs.length}</span>
              </div>
              <Droppable droppableId={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[120px] rounded-lg p-2 transition-colors duration-quick ${
                      snapshot.isDraggingOver ? "bg-subtle ring-1 ring-primary/30" : ""
                    }`}
                  >
                    {colJobs.map((job, idx) => {
                      const info = getAssigns(job.id);
                      return (
                        <Draggable key={job.id} draggableId={job.id} index={idx}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`shadow-xs transition-shadow duration-quick ${
                                snapshot.isDragging ? "shadow-md ring-1 ring-primary/30" : ""
                              }`}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  {job.case_no && (
                                    <span className="font-mono text-[10px] text-muted-foreground/70 truncate">
                                      {job.case_no}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm font-medium leading-tight truncate">
                                  {job.title}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{job.address || "No address"}</span>
                                </div>
                                {(info.scaffolderNames.length > 0 || info.engineerNames.length > 0) && (
                                  <div className="space-y-0.5 pt-1 border-t border-border/60">
                                    {info.scaffolderNames.length > 0 && (
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <User className="h-2.5 w-2.5 shrink-0" />
                                        <span className="truncate">S: {info.scaffolderNames.join(", ")}</span>
                                      </div>
                                    )}
                                    {info.engineerNames.length > 0 && (
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <User className="h-2.5 w-2.5 shrink-0" />
                                        <span className="truncate">E: {info.engineerNames.join(", ")}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
