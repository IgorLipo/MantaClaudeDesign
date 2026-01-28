import { Task, TaskStatus, statusLabels, statusColors, demoUsers, priorityColors } from "@/data/mockTasks";
import { cn } from "@/lib/utils";
import { X, Calendar, User, Flag, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface TaskDetailSidebarProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskDetailSidebar({ task, isOpen, onClose, onUpdate, onDelete }: TaskDetailSidebarProps) {
  if (!task) return null;

  const handleSave = () => {
    toast.success("Task saved!", {
      description: `"${task.title}" has been updated.`,
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id);
      onClose();
      toast.success("Task deleted", {
        description: "The task has been removed.",
      });
    } else {
      toast.info("Delete Task", {
        description: "Task deletion is simulated in demo mode.",
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-96 bg-card border-l border-border z-50 transition-transform duration-300",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Task Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={task.title}
              onChange={(e) => onUpdate(task.id, { title: e.target.value })}
              className="text-base font-medium"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={task.status}
              onValueChange={(value: TaskStatus) => onUpdate(task.id, { status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(statusLabels) as TaskStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded", statusColors[status])} />
                      {statusLabels[status]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Assignee
            </Label>
            <Select
              value={task.assignee}
              onValueChange={(value) => {
                const user = demoUsers.find((u) => u.name === value);
                if (user) {
                  onUpdate(task.id, { 
                    assignee: user.name, 
                    assigneeInitials: user.initials 
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {demoUsers.map((user) => (
                  <SelectItem key={user.id} value={user.name}>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                        {user.initials}
                      </div>
                      {user.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
            </Label>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-foreground">
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Priority
            </Label>
            <Select
              value={task.priority}
              onValueChange={(value: "low" | "medium" | "high") => 
                onUpdate(task.id, { priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["low", "medium", "high"] as const).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        priorityColors[priority].replace("text-", "bg-")
                      )} />
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={task.description}
              onChange={(e) => onUpdate(task.id, { description: e.target.value })}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Phase Badge */}
          <div className="space-y-2">
            <Label>Phase</Label>
            <div className="inline-flex px-3 py-1.5 bg-accent/10 text-accent text-sm rounded-full capitalize">
              {task.phase}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </aside>
    </>
  );
}
