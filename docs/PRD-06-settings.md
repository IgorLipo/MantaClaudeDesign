# PRD-06: Settings & Preferences

## Status: ✅ IN SCOPE (Demo Version - Minimal)

## Problem
Users need a settings area for customization. This demo showcases the settings UI structure without real persistence.

## Success Criteria
- Settings navigation works
- Forms display and accept input
- Changes show success feedback (but don't persist)

## Screens & Flows

### Settings Navigation (`/settings`)

**Simplified Sidebar (Demo):**
- Profile
- Export Preferences
- ~~Notifications~~ (link to /notifications)
- ~~Team Management~~ (removed - no auth)
- ~~Security~~ (removed - no auth)
- ~~Billing~~ (removed - no auth)

### Profile (`/settings/profile`)

**Layout:**
- Avatar display (placeholder image)
- Full Name input (demo: "Demo User")
- Email display (demo: "demo@financepulse.app")
- Department dropdown
- Timezone dropdown
- "Save Changes" button → success toast

**No real persistence** - values reset on refresh

### Export Preferences (`/settings/exports`)

**Layout:**
- Default Format: PDF | CSV | Excel radio
- PDF Settings (page size, orientation toggles)
- Naming pattern input

**Interactions:**
- Change setting → show "Saved" toast
- No real persistence

**Mobile (390px):**
- Settings nav becomes hamburger or top tabs
- Full-width forms

## Data

### Mock Data Approach

```typescript
// src/data/mockSettings.ts
export const demoProfile = {
  name: 'Demo User',
  email: 'demo@financepulse.app',
  department: 'Finance',
  timezone: 'America/New_York',
  avatar: null // placeholder
};

export const demoExportPrefs = {
  format: 'pdf',
  pageSize: 'letter',
  orientation: 'portrait',
  namingPattern: '{report_name}_{date}'
};
```

## Removed from Demo Scope

- ❌ Team Management (requires auth)
- ❌ Security settings (requires auth)
- ❌ Billing (requires auth)
- ❌ Avatar upload
- ❌ Scheduled reports
- ❌ Real persistence

## Technical Notes

- **State**: React useState with demo defaults
- **Feedback**: Toast on "save" actions
- **No backend**: All client-side

## Acceptance Checklist

- [ ] Settings navigation works
- [ ] Profile form displays demo data
- [ ] Export preferences form works
- [ ] "Save" buttons show success toast
- [ ] Mobile layout works
