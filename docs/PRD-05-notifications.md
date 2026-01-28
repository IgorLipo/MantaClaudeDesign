# PRD-05: Notifications System

## Status: ✅ IN SCOPE (Demo Version - Simplified)

## Problem
Finance teams miss critical events. This demo showcases the notification system UI without real-time backend triggers.

## Success Criteria
- Notification bell shows unread count
- Dropdown displays mock notifications
- Mark as read works (client-side)
- Notifications page shows full list

## Screens & Flows

### Notification Bell (Global Header)

**Layout:**
- Bell icon in header
- Badge with unread count
- Click opens dropdown

**Dropdown Panel (400px):**
- "Notifications" header + "Mark all read" link
- Mock notification list (5-8 items)
- Each shows: icon, title, description, timestamp
- "View All" link → `/notifications`

**Interactions:**
- Click notification → show toast "Navigating to [item]..."
- "Mark all read" → clears badge

### Notifications Page (`/notifications`)

**Layout:**
- Full list of demo notifications
- Filter buttons (All, Alerts, Updates)
- Date groupings

**Mobile (390px):**
- Full-screen dropdown on bell click
- Swipe gestures not required for demo

## Data

### Mock Data Approach

```typescript
// src/data/mockNotifications.ts
export const demoNotifications = [
  { 
    id: '1', 
    type: 'invoice_due_soon', 
    title: 'Invoice due tomorrow', 
    body: 'Salesforce Enterprise - $12,500',
    timestamp: '2 hours ago',
    isRead: false,
    priority: 'high'
  },
  { 
    id: '2', 
    type: 'budget_warning', 
    title: 'Engineering at 92% budget', 
    body: 'Approaching monthly limit',
    timestamp: '5 hours ago',
    isRead: false,
    priority: 'medium'
  },
  // 6-10 demo notifications
];
```

### Local State Only
- Read/unread state in React useState
- No persistence between sessions
- No real triggers (static demo data)

## Removed from Demo Scope

- ❌ Email notifications
- ❌ Notification preferences/settings
- ❌ Real-time updates
- ❌ Push notifications

## Technical Notes

- **State**: React useState for read/unread
- **No backend**: All client-side
- **Badge count**: Derived from unread count

## Acceptance Checklist

- [ ] Bell shows correct unread count
- [ ] Dropdown opens on click
- [ ] Clicking notification shows feedback
- [ ] "Mark all read" clears unread state
- [ ] Notifications page displays list
- [ ] Filter buttons work (client-side filter)
- [ ] Mobile dropdown works
