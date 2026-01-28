import { useState, useCallback } from "react";
import { Task, TaskStatus, demoTasks } from "@/data/mockTasks";

export type ViewMode = "timeline" | "list" | "board";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status } : task
      )
    );
    // Also update selected task if it's the one being modified
    setSelectedTask((prev) =>
      prev?.id === taskId ? { ...prev, status } : prev
    );
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
    setSelectedTask((prev) =>
      prev?.id === taskId ? { ...prev, ...updates } : prev
    );
  }, []);

  const openTaskDetail = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsSidebarOpen(true);
  }, []);

  const closeTaskDetail = useCallback(() => {
    setIsSidebarOpen(false);
    // Delay clearing selected task for animation
    setTimeout(() => setSelectedTask(null), 300);
  }, []);

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  }, [tasks]);

  return {
    tasks,
    selectedTask,
    viewMode,
    isSidebarOpen,
    setViewMode,
    updateTaskStatus,
    updateTask,
    openTaskDetail,
    closeTaskDetail,
    getTasksByStatus,
  };
}
