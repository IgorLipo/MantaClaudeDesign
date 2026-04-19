# PRD-02: Dashboard (Command Center)

## Status: ✅ IN SCOPE (Demo Version)

## Problem
Finance teams lack a unified view of critical metrics. This demo showcases how Finance Pulse consolidates KPIs, budget tracking, and activity into a single command center.

## Success Criteria
- Dashboard loads instantly with realistic demo data
- All interactive elements work (filters, navigation)
- Charts animate and respond to interactions
- Mobile layout is fully functional

## Screens & Flows

### Dashboard Home (`/`)

**Layout (3-column grid on desktop):**

**Left Column (4/12):**
1. Liquidity Hero Card (dark, prominent) ✅ Built
2. KPI Grid (2x2) ✅ Built
3. Live Ledger ✅ Built

**Middle Column (5/12):**
1. Budget Utilization Panel ✅ Built
2. Accounts Payable Card ✅ Built

**Right Column (3/12):**
1. Operating Cash Chart ✅ Built
2. Spend Mix Donut Chart ✅ Built
3. Team Activity Feed ✅ Built

**Interactions:**
- Department filter buttons toggle data in Budget Utilization
- Hover on charts shows tooltips with values
- Click on cards shows detail (toast or modal for demo)

**States:**
- Loading: Skeleton placeholders (brief, demo data loads fast)
- Error: Not applicable (demo data always available)

**Mobile (390px):**
- Single column layout
- Collapsible sections
- Charts stack vertically

## Data

### Mock Data Approach
All data comes from static TypeScript files with realistic demo values:

```typescript
// src/data/mockDashboard.ts
export const dashboardMetrics = {
  liquidity: { total: 4285102, burn: 324000, runway_months: 18 },
  arr: { value: 12500000, change_pct: 12.4 },
  gross_margin: { value: 78.2, target: 80 },
  ltv_cac: { value: 4.1, progress: 82 },
  ndr: { value: 114, progress: 100 }
};

export const departments = [
  { id: 'eng', name: 'Engineering', spent: 142000, budget: 155000, utilization: 92, status: 'near-limit' },
  // ...
];
```

### No Database Required
- Data is bundled with the application
- Instant loading, no API calls
- Filters work client-side

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Filter returns no results | Show "No departments match filter" |
| Very large numbers | Format as $1.2B with abbreviation |

## Technical Notes

- **Data Source**: Static mock data in `/src/data/`
- **Charts**: Recharts (already integrated)
- **State**: React useState for filters
- **No auth checks**: All routes open

## Acceptance Checklist

- [ ] All KPI cards display mock data correctly
- [ ] Charts render with animations
- [ ] Department filters work
- [ ] Mobile layout is usable at 390px
- [ ] No loading spinners (instant render)
- [ ] Navigation links work (or show "Coming soon" toast)
