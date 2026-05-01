// src/constants/status.ts
// Single source of truth for all job status labels, variants, transitions, and filter groups.

export const ACTIVE_STATUSES = [
  'awaiting_owner_details',
  'planning',
  'scheduled',
  'in_progress',
  'completed',
] as const;

export const ALL_STATUSES = [...ACTIVE_STATUSES, 'cancelled'] as const;

export type JobStatus = (typeof ALL_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  awaiting_owner_details: 'Awaiting Owner',
  planning: 'Planning',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  // Legacy fallbacks — keep for DB rows not yet migrated
  draft: 'Planning',
  submitted: 'Planning',
  photo_review: 'Planning',
  quote_pending: 'Planning',
  quote_submitted: 'Planning',
  negotiating: 'Planning',
};

export const STATUS_VARIANTS: Record<string, string> = {
  awaiting_owner_details: 'draft',
  planning: 'pending',
  scheduled: 'scheduled',
  in_progress: 'active',
  completed: 'complete',
  cancelled: 'cancelled',
  // Legacy fallbacks
  draft: 'pending',
  submitted: 'pending',
  photo_review: 'pending',
  quote_pending: 'pending',
  quote_submitted: 'pending',
  negotiating: 'pending',
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  awaiting_owner_details: ['planning', 'cancelled'],
  planning: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['cancelled'],
  cancelled: ['planning'],
};

export const KANBAN_COLUMNS = [...ACTIVE_STATUSES];

export const PENDING_STATUSES: string[] = ['awaiting_owner_details', 'planning'];
export const ACTIVE_FILTER_STATUSES: string[] = ['scheduled', 'in_progress'];
