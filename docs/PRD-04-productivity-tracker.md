# PRD-04: Productivity Tracker

## Status: ✅ IN SCOPE (Demo Version)

## Problem
Finance teams struggle to track reporting cycle progress. This demo showcases how Finance Pulse visualizes task progress with timeline, list, and board views.

## Success Criteria
- Timeline displays tasks at correct positions
- Tasks can be clicked to view details
- View toggle switches between Timeline/List/Board
- Status changes work (client-side)

## Screens & Flows

### Productivity Overview (`/productivity`)

**Header:**
- Page title: "Productivity Tracker"
- Period selector dropdown (demo periods)
- View toggle: Timeline | List | Board
- "Add Task" button (opens form modal)

**Timeline View (default):**
- Horizontal timeline with demo dates
- Task bars with status colors
- Click task → opens detail sidebar

**List View:**
- Table with columns: Task, Assignee, Due Date, Status
- Sortable by clicking headers
- Click row → opens detail sidebar

**Board View (Kanban):**
- Columns: Not Started | In Progress | In Review | Complete
- Drag cards between columns (client-side only)

**Task Detail Sidebar:**
- Task name (editable)
- Status dropdown
- Assignee dropdown (demo users)
- Due date display
- Description
- Close button

**Mobile (390px):**
- List view only
- Tap task → full-screen detail sheet
- Floating "Add Task" button

## Data

### Mock Data Approach

```typescript
// src/data/mockTasks.ts
export const demoCycle = {
  id: 'oct-2024',
  name: 'October 2024 Close',
  start_date: '2024-10-01',
  end_date: '2024-10-31'
};

export const demoTasks = [
  { id: '1', title: 'Reconcile bank statements', assignee: 'Sarah Chen', due: '2024-10-05', status: 'complete', phase: 'preparation' },
  { id: '2', title: 'Review AP aging report', assignee: 'Mike Johnson', due: '2024-10-10', status: 'in_progress', phase: 'execution' },
  { id: '3', title: 'Prepare accrual entries', assignee: 'Emma Davis', due: '2024-10-15', status: 'not_started', phase: 'execution' },
  // 10-15 realistic demo tasks
];

export const demoUsers = [
  { id: 'sc', name: 'Sarah Chen', initials: 'SC' },
  { id: 'mj', name: 'Mike Johnson', initials: 'MJ' },
  { id: 'ed', name: 'Emma Davis', initials: 'ED' },
];
```

### Local State Only
- Task state in React useState
- Changes persist during session only
- Drag between columns updates local state

## Technical Notes

- **Timeline**: Custom SVG/CSS grid component
- **Board**: @dnd-kit for drag between columns
- **State**: React useState or useReducer
- **No persistence**: Demo resets on refresh

## Acceptance Checklist

- [ ] Timeline renders tasks at correct horizontal positions
- [ ] Status colors match (green/yellow/red/gray)
- [ ] View toggle switches layouts
- [ ] Task click opens detail sidebar
- [ ] Status dropdown updates task
- [ ] Board drag-and-drop works
- [ ] Mobile list view is usable
- [ ] "Add Task" opens form modal
