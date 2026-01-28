# Finance Pulse - Changelog

## [Phase 4] - January 2026

### Added
- **Notification System**
  - `NotificationBell.tsx` - Bell icon with unread badge and dropdown
  - `Notifications.tsx` - Full notifications page with filtering
  - `useNotifications.ts` - Notification state management hook
  - `mockNotifications.ts` - 8 demo notifications with types/priorities

- **Settings Pages**
  - `SettingsLayout.tsx` - Settings navigation sidebar
  - `ProfileForm.tsx` - User profile editing form
  - `ExportPreferencesForm.tsx` - Export format preferences
  - `mockSettings.ts` - Demo profile and export preferences

- **Updated AppShell** - Added notification bell to header

### Technical Notes
- Bell shows unread count badge (9+ for >9)
- Notification dropdown shows 5 most recent
- Filter buttons: All, Alerts, Updates
- Profile form: name, department, timezone
- Export form: format (PDF/CSV/Excel), page size, orientation

---

## [Phase 3] - January 2026

### Added
- **Productivity Tracker** (`src/pages/Productivity.tsx`)
  - Full task tracking interface with 3 view modes
  - Cycle selector for different reporting periods
  - Add Task button (demo mode notification)

- **Productivity Components** (`src/components/productivity/`)
  - `TimelineView.tsx` - Horizontal timeline with task bars and due date markers
  - `ListView.tsx` - Sortable table view with click-to-sort headers
  - `BoardView.tsx` - Kanban board with drag-and-drop between columns
  - `TaskDetailSidebar.tsx` - Full task editing sidebar
  - `ViewToggle.tsx` - Toggle between timeline/list/board views

- **Task Data** (`src/data/mockTasks.ts`)
  - 10 demo tasks across 4 phases
  - 4 demo users with initials
  - Status/priority labels and colors

- **Task Hook** (`src/hooks/useTasks.ts`)
  - Full state management for task updates
  - View mode switching
  - Task selection and sidebar state

### Technical Notes
- Timeline shows full month with week markers
- Board uses native HTML5 drag-and-drop
- Task updates persist during session only
- Mobile shows list view by default (timeline complex for touch)

---

## [Phase 2] - January 2026

### Added
- **Report Builder** (`src/pages/ReportBuilder.tsx`)
  - Full drag-and-drop interface using @dnd-kit
  - Module sidebar with collapsible categories
  - Report canvas with sortable module cards
  - Toolbar with title editing, period selector, preview/save/export actions

- **Report Components** (`src/components/reports/`)
  - `ModuleSidebar.tsx` - Draggable module palette with 3 categories
  - `ReportCanvas.tsx` - Drop zone with sortable module cards
  - `ReportToolbar.tsx` - Report header controls
  - `ModuleConfigModal.tsx` - Per-module configuration options
  - `ReportPreviewModal.tsx` - Simulated PDF preview

- **Reports Page** (`src/pages/Reports.tsx`)
  - Template quick-start cards
  - Empty state for saved reports

- **Templates Page** (`src/pages/ReportTemplates.tsx`)
  - Full template browsing with module listings
  - "Use Template" buttons

- **Report Data** (`src/data/mockReports.ts`)
  - 10 available modules across 3 categories
  - 3 demo templates
  - Period options and helper functions

- **Report Builder Hook** (`src/hooks/useReportBuilder.ts`)
  - Full state management for report building
  - Module add/remove/reorder/configure

### Dependencies Added
- `@dnd-kit/core` - Drag and drop core
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - CSS utilities

### Technical Notes
- Modules have 4 types: chart, table, metric, text
- Config modal shows type-specific options
- Preview shows simulated report output
- Mobile shows "use desktop" message (touch D&D complex)

---

## [Phase 1] - January 2026

### Added
- **App Shell with Sidebar Navigation** (`src/components/layout/AppShell.tsx`)
  - Collapsible desktop sidebar with logo and nav items
  - Mobile hamburger menu with slide-down navigation
  - Active route highlighting
  - Responsive: sidebar at 1024px+, header menu below

- **All Page Routes** (placeholders)
  - `/reports` - Reports list page
  - `/reports/new` and `/reports/:id` - Report builder page
  - `/productivity` - Productivity tracker page
  - `/notifications` - Notifications page
  - `/settings` and `/settings/:tab` - Settings pages
  - `/ai` - AI Summarizer page
  - All placeholders show "Coming in Phase X" messaging

- **Mock Data Extraction** (`src/data/mockDashboard.ts`)
  - Extracted dashboard metrics from inline data
  - Structured exports: `dashboardMetrics`, `departments`, `transactions`, `invoices`, `cashFlowData`, `spendMixData`, `teamActivities`
  - Type definitions for department status

- **Updated Sources of Truth** (`docs/sources-of-truth.md`)
  - Created new documentation file
  - Documented all routes, navigation items, data files, component directories

### Changed
- `src/App.tsx` - Added all routes with AppShell wrapper
- `src/pages/Index.tsx` - Now imports from mock data file

### Technical Notes
- Sidebar width: 256px expanded, 64px collapsed
- Mobile breakpoint: 1024px (lg:)
- Animation: fade-in on route content

---

## [Initial] - January 2026

### Added
- Dashboard UI components (Hero, KPIs, Charts, Activity)
- Design system (slate/indigo palette, Inter font)
- PRD documentation for all 7 features
- Build estimation and task breakdown
