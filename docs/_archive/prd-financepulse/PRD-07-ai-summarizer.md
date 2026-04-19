# PRD-07: AI Report Summarizer

## Status: ✅ IN SCOPE (Full Feature - Requires Cloud)

## Problem
Finance reports are dense with numbers. This feature demonstrates AI-powered executive summary generation.

## Success Criteria
- Users can generate summaries with one click
- Summary streams in progressively
- Tone selector changes output style
- Works with Report Builder integration

## Implementation Note

**This feature requires Lovable Cloud** for the AI edge function. This is the only feature in the demo that needs backend infrastructure.

## Screens & Flows

### Summary Generation

**Entry Points:**
1. Report Builder toolbar: "✨ Generate Summary" button
2. Standalone page: `/ai/summarize`

**Generation Flow:**
1. User clicks "Generate Summary"
2. Modal shows progress: "Generating executive summary..."
3. Summary text streams in
4. User can edit, regenerate, or copy

**Summary Output:**
- Distinct card styling
- "Executive Summary" heading
- Editable text area
- Tone selector: Professional | Concise | Detailed
- "Copy" and "Insert" buttons

### Standalone Summarizer (`/ai/summarize`)

**Layout:**
- Textarea for pasting data (or use demo data button)
- "Summarize" button
- Output area with streaming response
- Tone selector

## Technical Requirements

### Edge Function Required

```typescript
// supabase/functions/summarize/index.ts
// Calls Lovable AI gateway with report context
// Streams response back to client
```

### Fallback for No Cloud

If Cloud is not connected, show:
- "AI features require Lovable Cloud"
- "Connect Cloud to enable AI summaries"
- Demo mode: Show pre-written sample summary

## Data

### Demo Mode (No Cloud)

```typescript
// src/data/mockAI.ts
export const demoSummary = `
Cash position remains strong at $4.3M with 18 months of runway at current burn rate.

**Highlights:**
• Revenue grew 12.4% YoY, exceeding the 10% target
• Engineering came in under budget at 92% utilization
• Customer retention (NDR 114%) continues to drive growth

**Watch Items:**
• Marketing spend is only 45% utilized—opportunity to accelerate growth
• Gross margin at 78.2% is below the 80% target

**Recommendation:** Consider reallocating unused marketing budget to customer acquisition before Q4 close.
`;
```

### With Cloud Connected
- Real Lovable AI integration
- Streaming responses
- Actual report context analysis

## Acceptance Checklist

- [ ] "Generate Summary" button visible
- [ ] Loading state with progress indicator
- [ ] Summary displays (streaming if Cloud, static if demo)
- [ ] Tone selector works
- [ ] "Copy" button copies text
- [ ] Fallback message if Cloud not connected
- [ ] Mobile modal works
