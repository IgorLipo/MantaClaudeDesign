import { Task, statusColors, statusLabels, priorityColors, demoCycle } from "@/data/mockTasks";
import { cn } from "@/lib/utils";

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TimelineView({ tasks, onTaskClick }: TimelineViewProps) {
  // Calculate timeline range (full month)
  const startDate = new Date(demoCycle.startDate);
  const endDate = new Date(demoCycle.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const getTaskPosition = (dueDate: string) => {
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (daysDiff / totalDays) * 100;
  };

  // Generate week markers
  const weekMarkers = [];
  for (let i = 0; i < totalDays; i += 7) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    weekMarkers.push({
      position: (i / totalDays) * 100,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      {/* Timeline Header */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-1">{demoCycle.name}</h3>
        <p className="text-xs text-muted-foreground">
          {new Date(demoCycle.startDate).toLocaleDateString()} - {new Date(demoCycle.endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Timeline Scale */}
      <div className="relative mb-8">
        <div className="h-1 bg-muted rounded-full" />
        {weekMarkers.map((marker, idx) => (
          <div
            key={idx}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${marker.position}%` }}
          >
            <div className="w-0.5 h-3 bg-border" />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-1 block">
              {marker.label}
            </span>
          </div>
        ))}
      </div>

      {/* Task Bars */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const position = getTaskPosition(task.dueDate);
          
          return (
            <div
              key={task.id}
              className="relative h-12 group cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              {/* Task Bar */}
              <div
                className={cn(
                  "absolute top-1 h-10 rounded-lg px-3 py-2 flex items-center gap-2 transition-all",
                  "hover:shadow-md hover:scale-[1.02]",
                  statusColors[task.status]
                )}
                style={{
                  left: `${Math.max(0, position - 15)}%`,
                  width: "30%",
                  maxWidth: "300px",
                  minWidth: "200px",
                }}
              >
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0",
                  "bg-background/50"
                )}>
                  {task.assigneeInitials}
                </div>
                <span className="text-xs font-medium truncate">{task.title}</span>
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0 ml-auto", priorityColors[task.priority].replace("text-", "bg-"))} />
              </div>

              {/* Due Date Marker */}
              <div
                className="absolute top-0 h-12 w-0.5 bg-foreground/20"
                style={{ left: `${position}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-4 border-t border-border flex flex-wrap gap-4">
        {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded", statusColors[status])} />
            <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
