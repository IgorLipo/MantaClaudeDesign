import { Task, TaskStatus, statusLabels, statusColors, priorityColors } from "@/data/mockTasks";
import { cn } from "@/lib/utils";

interface BoardViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const columns: TaskStatus[] = ["not_started", "in_progress", "in_review", "complete"];

export function BoardView({ tasks, onTaskClick, onStatusChange }: BoardViewProps) {
  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((status) => {
        const columnTasks = getTasksByStatus(status);
        
        return (
          <div
            key={status}
            className="bg-muted/30 rounded-2xl p-4"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded", statusColors[status])} />
                <h3 className="text-sm font-medium text-foreground">{statusLabels[status]}</h3>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskClick(task)}
                  className={cn(
                    "bg-card rounded-xl p-4 border border-border cursor-pointer transition-all",
                    "hover:shadow-md hover:border-accent",
                    "active:scale-[0.98]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2">
                      {task.title}
                    </h4>
                    <div className={cn(
                      "h-2 w-2 rounded-full flex-shrink-0 mt-1.5",
                      priorityColors[task.priority].replace("text-", "bg-")
                    )} />
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                        {task.assigneeInitials}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {task.assignee.split(" ")[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">No tasks</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
