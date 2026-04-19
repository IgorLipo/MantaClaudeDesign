# PRD-03: Report Builder

## Status: ✅ IN SCOPE (Demo Version)

## Problem
Finance teams spend hours manually assembling reports. This demo showcases the drag-and-drop report builder that makes report creation fast and intuitive.

## Success Criteria
- Users can drag modules onto a canvas
- Modules can be reordered and configured
- Preview shows realistic rendered output
- Export shows a demo/mock PDF download

## Screens & Flows

### Report Builder (`/reports/new`)

**Layout (2-panel):**

**Left Panel - Data Modules Sidebar (280px):**
- Collapsible categories with draggable modules
- Financial Metrics, Departmental, Visualizations

**Right Panel - Report Canvas:**
- Editable report title
- Period selector (Q1-Q4 options)
- Drop zone for modules
- Module actions (configure, reorder, delete)

**Interactions:**
- Drag module → drop on canvas
- Click settings gear → configuration modal with demo options
- Click Preview → modal with mock rendered report
- Click Export → toast "Report exported!" (demo)

**States:**
- Empty: "Drag modules here to build your report"
- With modules: Stacked module cards

**Mobile (390px):**
- Bottom sheet for module palette
- Full-width canvas
- Touch-friendly drag handles

### Report Templates (`/reports/templates`)

**Pre-built Templates (clickable demos):**
1. Monthly Financial Summary
2. Quarterly Board Report
3. Department Budget Review

Click template → pre-populates canvas with modules

## Data

### Mock Data Approach

```typescript
// src/data/mockReports.ts
export const availableModules = [
  { id: 'revenue', type: 'chart', name: 'Revenue Overview', icon: 'BarChart3' },
  { id: 'expenses', type: 'chart', name: 'Expense Breakdown', icon: 'PieChart' },
  { id: 'cash_flow', type: 'chart', name: 'Cash Flow', icon: 'TrendingUp' },
  { id: 'budget_table', type: 'table', name: 'Budget vs Actual', icon: 'Table' },
  // ...
];

export const demoTemplates = [
  { id: 'monthly', name: 'Monthly Financial Summary', modules: ['revenue', 'expenses', 'cash_flow'] },
  // ...
];
```

### Local State Only
- Report state stored in React useState
- No persistence between sessions (demo)
- Optional: localStorage for session persistence

## Technical Notes

- **Drag & Drop**: @dnd-kit/core
- **State**: Local React state (or Zustand if complex)
- **Export**: Mock download (toast notification)
- **No auth**: Anyone can build reports

## Acceptance Checklist

- [ ] Drag and drop works smoothly
- [ ] Modules can be reordered
- [ ] Configuration modal opens on settings click
- [ ] Preview modal shows mock report
- [ ] Export shows success toast
- [ ] Templates pre-populate canvas
- [ ] Works on mobile (390px)
- [ ] Empty state guides user
