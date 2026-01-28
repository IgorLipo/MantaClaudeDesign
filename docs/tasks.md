# Finance Pulse - Build Estimation & Task Breakdown

## Work Unit Inventory

### PRD-01: Authentication & User Roles
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Database tables | 2 (profiles, user_roles) | 0.25 | 0.50 |
| RLS policies | 4 (read own, admin all, roles function, trigger) | 0.10 | 0.40 |
| Pages/routes | 2 (/login, /forgot-password) | 0.50 | 1.00 |
| Complex components | 2 (Login form, Protected route wrapper) | 0.50 | 1.00 |
| Auth flow | 1 | 0.50 | 0.50 |
| Hooks with API | 2 (useAuth, useRole) | 0.25 | 0.50 |
| **PRD-01 Subtotal** | | | **3.90** |

### PRD-02: Dashboard (Command Center)
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Database tables | 4 (transactions, invoices, budgets, activity_log) | 0.25 | 1.00 |
| RLS policies | 4 | 0.10 | 0.40 |
| Pages/routes | 1 (/) | 0.50 | 0.50 |
| Complex components | 1 (BudgetUtilization with filters) | 0.50 | 0.50 |
| Simple components | 8 (Hero, KPIs, Ledger, Payables, Charts, Activity, Header) | 0.10 | 0.80 |
| Hooks with API | 4 (metrics, budgets, transactions, payables) | 0.25 | 1.00 |
| Real-time feature | 1 (Live Ledger) | 0.75 | 0.75 |
| **PRD-02 Subtotal** | | | **4.95** |

### PRD-03: Report Builder
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Database tables | 2 (reports, report_exports) | 0.25 | 0.50 |
| RLS policies | 4 (own, managers, admins, templates) | 0.10 | 0.40 |
| Edge functions | 1 (PDF generation) | 0.50 | 0.50 |
| Pages/routes | 3 (/reports/new, /reports/{id}, /reports/templates) | 0.50 | 1.50 |
| Complex components | 5 (Canvas, Sidebar, Config modal, Preview modal, Module system) | 0.50 | 2.50 |
| Simple components | 2 (Module cards, Template cards) | 0.10 | 0.20 |
| Hooks with API | 3 (useReports, useModules, useExport) | 0.25 | 0.75 |
| File upload | 1 (Export logo) | 0.50 | 0.50 |
| **PRD-03 Subtotal** | | | **6.85** |

### PRD-04: Productivity Tracker
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Database tables | 4 (cycles, tasks, checklists, comments) | 0.25 | 1.00 |
| RLS policies | 3 (contributor, manager, admin) | 0.10 | 0.30 |
| Pages/routes | 2 (/productivity, /productivity/templates) | 0.50 | 1.00 |
| Complex components | 5 (Timeline, List, Board, Detail sidebar, Task form) | 0.50 | 2.50 |
| Simple components | 2 (Task cards, Phase badges) | 0.10 | 0.20 |
| Hooks with API | 3 (useTasks, useCycles, useComments) | 0.25 | 0.75 |
| Real-time feature | 1 (Multi-user editing) | 0.75 | 0.75 |
| **PRD-04 Subtotal** | | | **6.50** |

### PRD-05: Notifications System
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Database tables | 2 (notifications, preferences) | 0.25 | 0.50 |
| RLS policies | 2 (own notifications, own preferences) | 0.10 | 0.20 |
| Edge functions | 1 (Email delivery) | 0.50 | 0.50 |
| Pages/routes | 1 (/notifications) | 0.50 | 0.50 |
| Complex components | 3 (Dropdown panel, Settings form, Bulk actions) | 0.50 | 1.50 |
| Simple components | 3 (Bell badge, Notification items, Filter tabs) | 0.10 | 0.30 |
| Hooks with API | 2 (useNotifications, usePreferences) | 0.25 | 0.50 |
| Real-time feature | 1 (Live notification updates) | 0.75 | 0.75 |
| **PRD-05 Subtotal** | | | **4.75** |

### PRD-06: Settings & Preferences
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Database tables | 3 (export_prefs, schedules, invitations) | 0.25 | 0.75 |
| RLS policies | 4 (own prefs, own schedules, admin team, admin roles) | 0.10 | 0.40 |
| Edge functions | 2 (Email invitation, Scheduled cron) | 0.50 | 1.00 |
| Pages/routes | 5 (profile, exports, schedules, team, security) | 0.50 | 2.50 |
| Complex components | 5 (Profile form, Export settings, Schedule modal, Team mgmt, Security) | 0.50 | 2.50 |
| Simple components | 3 (Settings nav, Schedule cards, Invite list) | 0.10 | 0.30 |
| Hooks with API | 4 (useProfile, useExports, useSchedules, useTeam) | 0.25 | 1.00 |
| File upload | 2 (Avatar, PDF logo) | 0.50 | 1.00 |
| **PRD-06 Subtotal** | | | **9.45** |

### PRD-07: AI Report Summarizer
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Database tables | 2 (ai_summaries, usage_log) | 0.25 | 0.50 |
| RLS policies | 2 (own summaries, admin view) | 0.10 | 0.20 |
| Edge functions | 1 (AI summarize with streaming) | 0.50 | 0.50 |
| Pages/routes | 1 (/ai/summarize) | 0.50 | 0.50 |
| Complex components | 2 (Summary modal, Summary block) | 0.50 | 1.00 |
| Simple components | 3 (Tone selector, Progress, AI badge) | 0.10 | 0.30 |
| Hooks with API | 2 (useSummarize, useAIUsage) | 0.25 | 0.50 |
| External integration | 1 (Lovable AI) | 0.75 | 0.75 |
| **PRD-07 Subtotal** | | | **4.25** |

---

## Calculation Breakdown

### Base Work Units Total

| PRD | Subtotal |
|-----|----------|
| PRD-01: Authentication | 3.90 |
| PRD-02: Dashboard | 4.95 |
| PRD-03: Report Builder | 6.85 |
| PRD-04: Productivity Tracker | 6.50 |
| PRD-05: Notifications | 4.75 |
| PRD-06: Settings | 9.45 |
| PRD-07: AI Summarizer | 4.25 |
| **Base Total** | **40.65** |

### Applicable Multipliers

| Factor | Applicable? | Multiplier |
|--------|-------------|------------|
| Shared state across pages | ✅ Yes (auth, roles, user context) | ×1.20 |
| Custom design system | ✅ Yes (already created, slate/indigo) | ×1.15 |
| Complex responsive layouts | ✅ Yes (3-column dashboard, mobile) | ×1.15 |
| Multiple user roles | ✅ Yes (Admin, Manager, Contributor) | ×1.25 |

**Combined Multiplier**: 1.20 × 1.15 × 1.15 × 1.25 = **1.98**

### Final Calculation

```
Base Work Units:     40.65
× Combined Multiplier: 1.98
= Weighted Total:    80.49

+ Fixed Overhead:     4.50 (setup, auth, nav, testing, polish)
= EXPECTED LOOPS:    85 (rounded up)
```

---

## Loop Estimate

| Scenario | Loops | Notes |
|----------|-------|-------|
| **Minimum** | 70 | Best case: no blockers, familiar patterns, smooth integrations |
| **Expected** | 85 | Normal development with typical iterations |
| **Maximum** | 105 | Worst case: integration issues, scope creep, complex edge cases |

---

## Phase Breakdown with Estimated Loops

### Phase 1: Foundation (12-15 loops)
| Task | Loops |
|------|-------|
| Enable Lovable Cloud, create database schema | 2 |
| PRD-01: Authentication flow | 4 |
| PRD-01: Role-based access control | 3 |
| Navigation structure, layout components | 2 |
| Testing & polish | 2 |
| **Phase 1 Total** | **13** |

### Phase 2: Core Dashboard (15-20 loops)
| Task | Loops |
|------|-------|
| PRD-02: Database tables (transactions, invoices, budgets) | 3 |
| PRD-02: API hooks and data fetching | 3 |
| PRD-02: Connect existing UI to real data | 4 |
| PRD-02: Real-time Live Ledger | 3 |
| PRD-02: Mobile responsive polish | 2 |
| Testing & edge cases | 2 |
| **Phase 2 Total** | **17** |

### Phase 3: Report Builder (18-22 loops)
| Task | Loops |
|------|-------|
| PRD-03: Reports database and API | 3 |
| PRD-03: Drag-and-drop module system | 5 |
| PRD-03: Module configuration modals | 3 |
| PRD-03: Autosave functionality | 2 |
| PRD-03: PDF export edge function | 4 |
| PRD-03: Templates system | 2 |
| Testing & polish | 2 |
| **Phase 3 Total** | **21** |

### Phase 4: Productivity Tracker (14-18 loops)
| Task | Loops |
|------|-------|
| PRD-04: Tasks database and API | 3 |
| PRD-04: Timeline view | 4 |
| PRD-04: List and Board views | 3 |
| PRD-04: Task detail sidebar | 2 |
| PRD-04: Real-time collaboration | 2 |
| PRD-04: Task templates | 2 |
| Testing & polish | 2 |
| **Phase 4 Total** | **18** |

### Phase 5: Notifications & Settings (12-15 loops)
| Task | Loops |
|------|-------|
| PRD-05: Notifications database and realtime | 3 |
| PRD-05: Notification UI (bell, dropdown, page) | 3 |
| PRD-05: Email notification edge function | 2 |
| PRD-06: Settings pages (profile, exports, security) | 3 |
| PRD-06: Team management (admin) | 2 |
| PRD-06: Scheduled reports cron | 2 |
| Testing & polish | 2 |
| **Phase 5 Total** | **17** |

### Phase 6: AI & Premium (6-8 loops)
| Task | Loops |
|------|-------|
| PRD-07: AI summarize edge function | 2 |
| PRD-07: Streaming response UI | 2 |
| PRD-07: Summary block in reports | 1 |
| Testing & rate limiting | 1 |
| **Phase 6 Total** | **6** |

### Total by Phase

| Phase | Feature | Est. Loops |
|-------|---------|------------|
| 1 | Foundation (Auth, Setup) | 13 |
| 2 | Dashboard | 17 |
| 3 | Report Builder | 21 |
| 4 | Productivity Tracker | 18 |
| 5 | Notifications & Settings | 17 |
| 6 | AI Summarizer | 6 |
| **TOTAL** | | **92** |

*Note: Overlaps between phases may reduce total. Expected range: 70-105 loops.*

---

## Risk Factors That Could Add Loops

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **PDF generation complexity** | +5-8 | Medium | Use proven library, simplify template |
| **Drag-and-drop accessibility** | +3-5 | Medium | Use @dnd-kit which has built-in a11y |
| **Real-time sync conflicts** | +3-5 | Low | Use optimistic updates with rollback |
| **AI rate limiting edge cases** | +2-3 | Medium | Cache aggressively, queue requests |
| **Mobile timeline view** | +3-5 | High | Consider list-only on mobile |
| **Email deliverability** | +2-4 | Medium | Use established service (Resend/SendGrid) |
| **Role-based UI complexity** | +3-5 | Medium | Create role context early, test all permutations |
| **Performance with large data** | +3-5 | Low | Implement pagination/virtualization early |

### Potential Additional Loops: +5 to +25

---

## Recommendations

1. **Start with Phase 1** - Auth is the foundation; everything depends on it
2. **Build Dashboard data first** - UI exists, needs backend connection
3. **Defer Timeline view on mobile** - Use list view only to save complexity
4. **Test PDF export early** - High risk, validate approach in Phase 3
5. **Implement role checks in shared component** - Avoid scattered role logic
6. **Cache AI responses aggressively** - Reduce API calls and costs

---

## Summary

| Metric | Value |
|--------|-------|
| **Total PRDs** | 7 |
| **Total Work Units** | 40.65 base → 80.49 weighted |
| **Minimum Loops** | 70 |
| **Expected Loops** | 85 |
| **Maximum Loops** | 105 |
| **Phases** | 6 |
| **Highest Risk Phase** | Phase 3 (Report Builder) |

*Last updated: January 2026*
