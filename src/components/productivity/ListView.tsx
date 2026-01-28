import { Task, statusLabels, statusColors, priorityColors } from "@/data/mockTasks";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface ListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

type SortField = "title" | "assignee" | "dueDate" | "status";

export function ListView({ tasks, onTaskClick }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "assignee":
        comparison = a.assignee.localeCompare(b.assignee);
        break;
      case "dueDate":
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortAsc ? comparison : -comparison;
  });

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors",
        sortField === field ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border">
        <div className="col-span-5">
          <SortHeader field="title" label="Task" />
        </div>
        <div className="col-span-2">
          <SortHeader field="assignee" label="Assignee" />
        </div>
        <div className="col-span-2">
          <SortHeader field="dueDate" label="Due Date" />
        </div>
        <div className="col-span-3">
          <SortHeader field="status" label="Status" />
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div className="col-span-5 flex items-center gap-3">
              <div className={cn(
                "h-2 w-2 rounded-full flex-shrink-0",
                priorityColors[task.priority].replace("text-", "bg-")
              )} />
              <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                {task.assigneeInitials}
              </div>
              <span className="text-sm text-muted-foreground truncate hidden sm:block">
                {task.assignee.split(" ")[0]}
              </span>
            </div>
            <div className="col-span-2 flex items-center">
              <span className="text-sm text-muted-foreground">
                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="col-span-3 flex items-center">
              <span className={cn(
                "px-2 py-1 text-xs rounded-full",
                statusColors[task.status]
              )}>
                {statusLabels[task.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
