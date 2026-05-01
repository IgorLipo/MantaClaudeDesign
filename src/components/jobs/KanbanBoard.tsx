import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, User, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { KANBAN_COLUMNS, STATUS_LABELS, STATUS_VARIANTS, STATUS_TRANSITIONS } from "@/constants/status";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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

interface Props {
  onStatusChange?: () => void;
}

export function KanbanBoard({ onStatusChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [assigns, setAssigns] = useState<AssignInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

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

  const onDragStart = () => {
    isDragging.current = true;
  };

  const onDragEnd = async (result: DropResult) => {
    isDragging.current = false;
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
      onStatusChange?.();
    }
  };

  const handleCardClick = useCallback((jobId: string) => {
    // Only navigate if user wasn't dragging
    setTimeout(() => {
      if (!isDragging.current) {
        navigate(`/jobs/${jobId}`);
      }
    }, 0);
  }, [navigate]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col} className="min-w-[80vw] sm:min-w-[260px] max-w-[320px] flex-1">
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
    <div className="relative">
      {/* Scroll controls */}
      <button
        onClick={() => scroll("left")}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card ring-1 ring-border shadow-md hidden sm:flex items-center justify-center hover:bg-subtle transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card ring-1 ring-border shadow-md hidden sm:flex items-center justify-center hover:bg-subtle transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
        >
          {KANBAN_COLUMNS.map((col) => {
            const colJobs = jobs.filter((j) => j.status === col);
            return (
              <div
                key={col}
                className="min-w-[82vw] sm:min-w-[250px] max-w-[320px] flex-1 snap-start"
              >
                <div className="flex items-center gap-2 mb-2 sticky left-0">
                  <Badge variant={STATUS_VARIANTS[col] as any} className="text-[10px] sm:text-[11px]">
                    {STATUS_LABELS[col]}
                  </Badge>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground font-mono tabular-nums">
                    {colJobs.length}
                  </span>
                </div>
                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "space-y-2 min-h-[140px] rounded-lg p-1.5 sm:p-2 transition-colors duration-quick",
                        snapshot.isDraggingOver && "bg-subtle ring-2 ring-primary/30"
                      )}
                    >
                      {colJobs.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-20 text-[10px] sm:text-[11px] text-muted-foreground/50 border border-dashed border-border/60 rounded-lg">
                          Drop jobs here
                        </div>
                      )}
                      {colJobs.map((job, idx) => {
                        const info = getAssigns(job.id);
                        return (
                          <Draggable key={job.id} draggableId={job.id} index={idx}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "shadow-xs transition-shadow duration-quick",
                                  snapshot.isDragging
                                    ? "shadow-lg ring-2 ring-primary/30"
                                    : "hover:shadow-md"
                                )}
                              >
                                <CardContent className="p-2.5 sm:p-3 space-y-1.5">
                                  <div className="flex items-start gap-1">
                                    {/* Clickable area - whole card except grip */}
                                    <button
                                      type="button"
                                      className="flex-1 min-w-0 text-left cursor-pointer"
                                      onClick={() => handleCardClick(job.id)}
                                    >
                                      {job.case_no && (
                                        <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground/70 truncate block">
                                          {job.case_no}
                                        </span>
                                      )}
                                      <div className="text-xs sm:text-sm font-medium leading-tight truncate mt-0.5">
                                        {job.title}
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground mt-1">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{job.address || "No address"}</span>
                                      </div>
                                    </button>
                                    <div
                                      {...provided.dragHandleProps}
                                      className="shrink-0 p-1 rounded hover:bg-muted/60 transition-colors cursor-grab active:cursor-grabbing touch-manipulation"
                                    >
                                      <GripVertical className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground/50" />
                                    </div>
                                  </div>
                                  {(info.scaffolderNames.length > 0 || info.engineerNames.length > 0) && (
                                    <div className="space-y-0.5 pt-1.5 border-t border-border/60">
                                      {info.scaffolderNames.length > 0 && (
                                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
                                          <User className="h-2.5 w-2.5 shrink-0" />
                                          <span className="truncate">S: {info.scaffolderNames.join(", ")}</span>
                                        </div>
                                      )}
                                      {info.engineerNames.length > 0 && (
                                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
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

      {/* Mobile scroll hint */}
      <div className="flex sm:hidden items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground/60">
        <ChevronLeft className="h-3 w-3" />
        <span>Swipe to see all statuses</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </div>
  );
}
