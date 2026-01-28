// Mock Productivity Tracker Data - Finance Pulse Demo

export type TaskStatus = "not_started" | "in_progress" | "in_review" | "complete";
export type TaskPhase = "preparation" | "execution" | "review" | "close";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeInitials: string;
  dueDate: string;
  status: TaskStatus;
  phase: TaskPhase;
  priority: "low" | "medium" | "high";
}

export interface ReportingCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export const demoCycle: ReportingCycle = {
  id: "oct-2026",
  name: "October 2026 Close",
  startDate: "2026-10-01",
  endDate: "2026-10-31",
};

export const demoUsers = [
  { id: "sc", name: "Sarah Chen", initials: "SC" },
  { id: "mj", name: "Mike Johnson", initials: "MJ" },
  { id: "ed", name: "Emma Davis", initials: "ED" },
  { id: "jw", name: "James Wilson", initials: "JW" },
];

export const demoTasks: Task[] = [
  {
    id: "1",
    title: "Reconcile bank statements",
    description: "Match all bank transactions with ledger entries for October",
    assignee: "Sarah Chen",
    assigneeInitials: "SC",
    dueDate: "2026-10-05",
    status: "complete",
    phase: "preparation",
    priority: "high",
  },
  {
    id: "2",
    title: "Review AP aging report",
    description: "Analyze outstanding payables and flag overdue items",
    assignee: "Mike Johnson",
    assigneeInitials: "MJ",
    dueDate: "2026-10-10",
    status: "in_progress",
    phase: "execution",
    priority: "high",
  },
  {
    id: "3",
    title: "Prepare accrual entries",
    description: "Create journal entries for accrued expenses and revenue",
    assignee: "Emma Davis",
    assigneeInitials: "ED",
    dueDate: "2026-10-15",
    status: "not_started",
    phase: "execution",
    priority: "medium",
  },
  {
    id: "4",
    title: "Validate revenue recognition",
    description: "Ensure all revenue is properly recognized per ASC 606",
    assignee: "Sarah Chen",
    assigneeInitials: "SC",
    dueDate: "2026-10-12",
    status: "in_review",
    phase: "execution",
    priority: "high",
  },
  {
    id: "5",
    title: "Reconcile intercompany",
    description: "Match intercompany transactions and resolve discrepancies",
    assignee: "James Wilson",
    assigneeInitials: "JW",
    dueDate: "2026-10-08",
    status: "complete",
    phase: "preparation",
    priority: "medium",
  },
  {
    id: "6",
    title: "Review fixed assets",
    description: "Verify depreciation schedules and asset additions",
    assignee: "Mike Johnson",
    assigneeInitials: "MJ",
    dueDate: "2026-10-18",
    status: "not_started",
    phase: "execution",
    priority: "low",
  },
  {
    id: "7",
    title: "Prepare variance analysis",
    description: "Analyze budget vs actual variances for all departments",
    assignee: "Emma Davis",
    assigneeInitials: "ED",
    dueDate: "2026-10-20",
    status: "not_started",
    phase: "review",
    priority: "medium",
  },
  {
    id: "8",
    title: "Draft financial statements",
    description: "Prepare P&L, balance sheet, and cash flow statement",
    assignee: "Sarah Chen",
    assigneeInitials: "SC",
    dueDate: "2026-10-25",
    status: "not_started",
    phase: "review",
    priority: "high",
  },
  {
    id: "9",
    title: "Management review meeting",
    description: "Present preliminary results to leadership team",
    assignee: "James Wilson",
    assigneeInitials: "JW",
    dueDate: "2026-10-28",
    status: "not_started",
    phase: "close",
    priority: "high",
  },
  {
    id: "10",
    title: "Final close sign-off",
    description: "Obtain controller approval and lock the period",
    assignee: "Sarah Chen",
    assigneeInitials: "SC",
    dueDate: "2026-10-31",
    status: "not_started",
    phase: "close",
    priority: "high",
  },
];

export const cycleOptions = [
  { value: "oct-2026", label: "October 2026 Close" },
  { value: "sep-2026", label: "September 2026 Close" },
  { value: "q3-2026", label: "Q3 2026 Quarter End" },
];

export const statusLabels: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  in_review: "In Review",
  complete: "Complete",
};

export const statusColors: Record<TaskStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/20 text-warning-foreground",
  in_review: "bg-accent/20 text-accent",
  complete: "bg-success/20 text-success",
};

export const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-warning",
  high: "text-destructive",
};
