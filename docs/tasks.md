# Finance Pulse - Build Estimation (Demo Version)

## Scope Changes

### Removed from Scope
- ❌ PRD-01: Authentication (entirely removed)
- ❌ All database tables and RLS policies
- ❌ All edge functions (except AI)
- ❌ Real-time features
- ❌ File uploads
- ❌ Team management
- ❌ Email notifications
- ❌ Persistence (data resets on refresh)

### What Remains
- ✅ All UI/UX features
- ✅ Client-side interactivity
- ✅ Mock data for demo
- ✅ AI Summarizer (with fallback)

---

## Work Unit Inventory (Demo Version)

### PRD-02: Dashboard (Polish Existing)
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Pages/routes | 0 (exists) | 0.50 | 0.00 |
| Simple components | 2 (nav, data extraction) | 0.10 | 0.20 |
| Mock data files | 1 | 0.10 | 0.10 |
| **PRD-02 Subtotal** | | | **0.30** |

### PRD-03: Report Builder
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Pages/routes | 2 (/reports/new, /reports/templates) | 0.50 | 1.00 |
| Complex components | 4 (canvas, sidebar, config modal, preview) | 0.50 | 2.00 |
| Simple components | 3 (module cards, template cards, toolbar) | 0.10 | 0.30 |
| Hooks (local state) | 1 | 0.15 | 0.15 |
| Mock data files | 1 | 0.10 | 0.10 |
| **PRD-03 Subtotal** | | | **3.55** |

### PRD-04: Productivity Tracker
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Pages/routes | 1 (/productivity) | 0.50 | 0.50 |
| Complex components | 4 (timeline, list, board, sidebar) | 0.50 | 2.00 |
| Simple components | 3 (task cards, view toggle, add modal) | 0.10 | 0.30 |
| Hooks (local state) | 1 | 0.15 | 0.15 |
| Mock data files | 1 | 0.10 | 0.10 |
| **PRD-04 Subtotal** | | | **3.05** |

### PRD-05: Notifications (Simplified)
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Pages/routes | 1 (/notifications) | 0.50 | 0.50 |
| Complex components | 1 (dropdown panel) | 0.50 | 0.50 |
| Simple components | 3 (bell, items, page list) | 0.10 | 0.30 |
| Hooks (local state) | 1 | 0.15 | 0.15 |
| Mock data files | 1 | 0.10 | 0.10 |
| **PRD-05 Subtotal** | | | **1.55** |

### PRD-06: Settings (Minimal)
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Pages/routes | 2 (/settings/profile, /settings/exports) | 0.50 | 1.00 |
| Complex components | 2 (profile form, export form) | 0.50 | 1.00 |
| Simple components | 1 (settings nav) | 0.10 | 0.10 |
| Mock data files | 1 | 0.10 | 0.10 |
| **PRD-06 Subtotal** | | | **2.20** |

### PRD-07: AI Summarizer
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Pages/routes | 1 (/ai/summarize) | 0.50 | 0.50 |
| Complex components | 2 (summary modal, summary block) | 0.50 | 1.00 |
| Simple components | 2 (tone selector, progress) | 0.10 | 0.20 |
| Hooks | 1 | 0.15 | 0.15 |
| Edge function (optional) | 1 | 0.50 | 0.50 |
| External integration | 1 (Lovable AI) | 0.75 | 0.75 |
| **PRD-07 Subtotal** | | | **3.10** |

### Navigation & Layout (New)
| Work Type | Count | Weight | Subtotal |
|-----------|-------|--------|----------|
| Complex components | 1 (app shell/sidebar) | 0.50 | 0.50 |
| Simple components | 2 (nav links, mobile menu) | 0.10 | 0.20 |
| **Layout Subtotal** | | | **0.70** |

---

## Calculation Breakdown

### Base Work Units Total

| PRD | Subtotal |
|-----|----------|
| PRD-02: Dashboard Polish | 0.30 |
| PRD-03: Report Builder | 3.55 |
| PRD-04: Productivity Tracker | 3.05 |
| PRD-05: Notifications | 1.55 |
| PRD-06: Settings | 2.20 |
| PRD-07: AI Summarizer | 3.10 |
| Navigation & Layout | 0.70 |
| **Base Total** | **14.45** |

### Applicable Multipliers (Reduced)

| Factor | Applicable? | Multiplier |
|--------|-------------|------------|
| Shared state across pages | ✅ Yes (minimal) | ×1.10 |
| Custom design system | ✅ Yes (exists) | ×1.00 (already done) |
| Complex responsive layouts | ✅ Yes | ×1.10 |
| Multiple user roles | ❌ No (removed) | ×1.00 |

**Combined Multiplier**: 1.10 × 1.00 × 1.10 × 1.00 = **1.21**

### Final Calculation

```
Base Work Units:     14.45
× Combined Multiplier: 1.21
= Weighted Total:    17.48

+ Fixed Overhead:     2.00 (setup, nav, testing - reduced)
= EXPECTED LOOPS:    20 (rounded up)
```

---

## Loop Estimate (Demo Version)

| Scenario | Loops | Notes |
|----------|-------|-------|
| **Minimum** | 15 | Best case: smooth execution, no blockers |
| **Expected** | 20 | Normal development with iterations |
| **Maximum** | 28 | Worst case: complex DnD issues, mobile polish |

---

## Phase Breakdown with Estimated Loops

### Phase 1: Navigation & Structure (3 loops)
| Task | Loops |
|------|-------|
| App shell with sidebar navigation | 1 |
| Create all page routes (placeholder) | 1 |
| Extract dashboard mock data to files | 1 |
| **Phase 1 Total** | **3** |

### Phase 2: Report Builder (6 loops)
| Task | Loops |
|------|-------|
| Module sidebar with categories | 1 |
| Drag-and-drop canvas | 2 |
| Module configuration modal | 1 |
| Preview modal | 1 |
| Templates page | 1 |
| **Phase 2 Total** | **6** |

### Phase 3: Productivity Tracker (5 loops)
| Task | Loops |
|------|-------|
| Mock task data and state | 1 |
| Timeline view | 2 |
| List and Board views | 1 |
| Task detail sidebar | 1 |
| **Phase 3 Total** | **5** |

### Phase 4: Notifications & Settings (4 loops)
| Task | Loops |
|------|-------|
| Notification bell and dropdown | 1 |
| Notifications page | 1 |
| Settings pages (profile, exports) | 2 |
| **Phase 4 Total** | **4** |

### Phase 5: AI & Polish (2 loops)
| Task | Loops |
|------|-------|
| AI summarizer (with fallback) | 1 |
| Final polish and mobile testing | 1 |
| **Phase 5 Total** | **2** |

---

## Summary Comparison

| Metric | Original (Full) | Demo Version | Reduction |
|--------|-----------------|--------------|-----------|
| PRDs Active | 7 | 6 | -14% |
| Work Units | 40.65 | 14.45 | -64% |
| Multiplier | 1.98 | 1.21 | -39% |
| Expected Loops | 85 | 20 | **-76%** |
| Database Tables | 15 | 0 | -100% |
| Edge Functions | 5 | 1 (optional) | -80% |
| Auth Flows | 1 | 0 | -100% |

---

## Risk Factors

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Drag-and-drop complexity | +2-3 | Medium | Use @dnd-kit examples |
| Timeline rendering | +1-2 | Medium | Simplify to CSS grid |
| Mobile responsive issues | +1-2 | Low | Test early, iterate |
| AI fallback complexity | +1 | Low | Simple conditional |

### Potential Additional Loops: +2 to +8

---

## Final Answer

# 🎯 Expected Loops: 20

**Range: 15 minimum → 20 expected → 28 maximum**

### Breakdown:
- Phase 1 (Nav/Structure): 3 loops
- Phase 2 (Report Builder): 6 loops
- Phase 3 (Productivity): 5 loops
- Phase 4 (Notifications/Settings): 4 loops
- Phase 5 (AI/Polish): 2 loops

*Last updated: January 2026*
