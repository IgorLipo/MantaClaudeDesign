import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cycleOptions, demoCycle } from "@/data/mockTasks";
import { useTasks } from "@/hooks/useTasks";
import { ViewToggle } from "@/components/productivity/ViewToggle";
import { TimelineView } from "@/components/productivity/TimelineView";
import { ListView } from "@/components/productivity/ListView";
import { BoardView } from "@/components/productivity/BoardView";
import { TaskDetailSidebar } from "@/components/productivity/TaskDetailSidebar";
import { toast } from "sonner";

export default function Productivity() {
  const {
    tasks,
    selectedTask,
    viewMode,
    isSidebarOpen,
    setViewMode,
    updateTaskStatus,
    updateTask,
    openTaskDetail,
    closeTaskDetail,
  } = useTasks();

  const handleAddTask = () => {
    toast.info("Add Task", {
      description: "Task creation is not available in demo mode.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Productivity Tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              Track reporting cycles and team tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select 
              defaultValue={demoCycle.id}
              onValueChange={(value) => {
                const selected = cycleOptions.find(c => c.value === value);
                if (selected) {
                  toast.info(`Switched to ${selected.label}`, {
                    description: "Cycle data would update in production.",
                  });
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cycleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddTask} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        {/* Views */}
        {viewMode === "timeline" && (
          <TimelineView tasks={tasks} onTaskClick={openTaskDetail} />
        )}
        {viewMode === "list" && (
          <ListView tasks={tasks} onTaskClick={openTaskDetail} />
        )}
        {viewMode === "board" && (
          <BoardView
            tasks={tasks}
            onTaskClick={openTaskDetail}
            onStatusChange={updateTaskStatus}
          />
        )}
      </div>

      {/* Task Detail Sidebar */}
      <TaskDetailSidebar
        task={selectedTask}
        isOpen={isSidebarOpen}
        onClose={closeTaskDetail}
        onUpdate={updateTask}
      />
    </div>
  );
}
