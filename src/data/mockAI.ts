// Mock AI Summarizer Data - Finance Pulse Demo

export type SummaryTone = "professional" | "concise" | "detailed";

export const toneOptions: { value: SummaryTone; label: string; description: string }[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Formal tone suitable for board presentations",
  },
  {
    value: "concise",
    label: "Concise",
    description: "Brief highlights and key takeaways only",
  },
  {
    value: "detailed",
    label: "Detailed",
    description: "Comprehensive analysis with recommendations",
  },
];

export const demoSummaries: Record<SummaryTone, string> = {
  professional: `## Executive Summary

Cash position remains strong at **$4.3M** with approximately 18 months of runway at the current burn rate.

### Financial Highlights
- Revenue grew **12.4% YoY**, exceeding the 10% target
- Engineering department came in under budget at 92% utilization
- Customer retention (NDR 114%) continues to drive sustainable growth

### Areas Requiring Attention
- Marketing spend is only 45% utilized—opportunity to accelerate growth initiatives
- Gross margin at 78.2% is slightly below the 80% target threshold

### Recommendation
Consider reallocating unused marketing budget to customer acquisition initiatives before Q4 close to maximize growth potential.`,

  concise: `**Key Metrics:**
- Cash: $4.3M (18 months runway)
- ARR: $12.5M (+12.4% YoY)
- Gross Margin: 78.2%
- NDR: 114%

**Action Items:**
1. Marketing underspent—reallocate to growth
2. Monitor gross margin toward 80% target`,

  detailed: `## Q3 2026 Comprehensive Financial Analysis

### Liquidity & Cash Position
The company maintains a healthy cash position of **$4.3M** with a monthly burn rate of approximately $324K. At current spending levels, this provides **18 months of runway**, giving ample time for strategic initiatives.

### Revenue Performance
Annual Recurring Revenue (ARR) reached **$12.5M**, representing a **12.4% year-over-year increase**. This performance exceeded our internal target of 10% growth, indicating strong market positioning and effective sales execution.

### Profitability Metrics
- **Gross Margin**: 78.2% (Target: 80%)
- **LTV:CAC Ratio**: 4.1x (Healthy above 3x benchmark)
- **Net Dollar Retention**: 114% (Excellent expansion revenue)

### Departmental Budget Analysis
| Department | Budget | Spent | Utilization |
|------------|--------|-------|-------------|
| Engineering | $155K | $142K | 92% |
| Marketing | $100K | $45K | 45% |
| Sales | $130K | $88K | 68% |
| Operations | $30K | $24K | 82% |

### Recommendations
1. **Immediate**: Investigate Marketing underspend and develop accelerated Q4 campaign
2. **Short-term**: Focus on improving gross margin through vendor renegotiation
3. **Long-term**: Maintain strong NDR through continued customer success investment`,
};

export const sampleReportData = `
Q3 2026 Financial Data:
- Total Cash: $4,285,102
- Monthly Burn: $324,000
- ARR: $12,500,000
- YoY Growth: 12.4%
- Gross Margin: 78.2%
- LTV:CAC: 4.1x
- NDR: 114%
- Engineering Budget: $155,000 (Spent: $142,000)
- Marketing Budget: $100,000 (Spent: $45,000)
- Sales Budget: $130,000 (Spent: $88,000)
`;
