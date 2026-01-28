// Comprehensive Report Builder Data - Finance Pulse
// World-class module library with realistic demo data

import { 
  BarChart3, PieChart, TrendingUp, TrendingDown, Table, DollarSign, Users, FileText, 
  Calendar, Target, Wallet, CreditCard, Building, Activity, LineChart, AreaChart,
  ArrowUpRight, ArrowDownRight, Percent, Hash, Clock, AlertCircle, CheckCircle,
  Globe, Briefcase, Calculator, Receipt, Landmark, Scale, ShieldCheck, Zap,
  LayoutGrid, Layers, ArrowLeftRight
} from "lucide-react";

export type ModuleType = "chart" | "table" | "metric" | "text" | "kpi" | "comparison";
export type ModuleCategory = "executive" | "financial" | "operational" | "departmental" | "compliance" | "forecasting";
export type ChartVariant = "bar" | "line" | "area" | "pie" | "donut" | "waterfall" | "combo";

export interface ReportModule {
  id: string;
  type: ModuleType;
  name: string;
  icon: string;
  category: ModuleCategory;
  description: string;
  defaultConfig: Record<string, unknown>;
  previewData?: unknown;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  moduleIds: string[];
  thumbnail?: string;
}

export interface CanvasModule {
  id: string;
  moduleId: string;
  config: Record<string, unknown>;
}

// Comprehensive module library
export const availableModules: ReportModule[] = [
  // Executive Summary Modules
  {
    id: "executive_summary",
    type: "text",
    name: "Executive Summary",
    icon: "FileText",
    category: "executive",
    description: "AI-generated narrative overview of financial performance",
    defaultConfig: { useAI: true, tone: "professional", length: "medium" },
  },
  {
    id: "key_highlights",
    type: "kpi",
    name: "Key Highlights",
    icon: "Zap",
    category: "executive",
    description: "Top 3-5 performance highlights with callouts",
    defaultConfig: { highlightCount: 4, showIcons: true },
    previewData: [
      { label: "Revenue Growth", value: "+24.3%", trend: "up", color: "success" },
      { label: "Cost Reduction", value: "-12.1%", trend: "down", color: "success" },
      { label: "Customer Growth", value: "+847", trend: "up", color: "success" },
      { label: "Churn Rate", value: "2.1%", trend: "stable", color: "warning" },
    ],
  },
  {
    id: "kpi_scorecard",
    type: "kpi",
    name: "KPI Scorecard",
    icon: "Target",
    category: "executive",
    description: "Grid of key performance indicators with targets",
    defaultConfig: { layout: "grid", columns: 4, showTarget: true, showTrend: true },
    previewData: [
      { label: "ARR", value: "$12.5M", target: "$14M", progress: 89 },
      { label: "Gross Margin", value: "78.2%", target: "80%", progress: 98 },
      { label: "LTV:CAC", value: "4.1x", target: "5.0x", progress: 82 },
      { label: "NDR", value: "114%", target: "110%", progress: 100 },
      { label: "Runway", value: "18 mo", target: "24 mo", progress: 75 },
      { label: "Burn Multiple", value: "1.4x", target: "1.2x", progress: 85 },
    ],
  },
  {
    id: "ceo_dashboard",
    type: "metric",
    name: "CEO Dashboard",
    icon: "Briefcase",
    category: "executive",
    description: "High-level metrics designed for executive consumption",
    defaultConfig: { showSparklines: true, comparisonPeriod: "yoy" },
  },

  // Financial Metrics Modules
  {
    id: "revenue_waterfall",
    type: "chart",
    name: "Revenue Waterfall",
    icon: "BarChart3",
    category: "financial",
    description: "Starting revenue, additions, churns, ending revenue",
    defaultConfig: { chartType: "waterfall", showLabels: true, colorScheme: "financial" },
    previewData: [
      { name: "Starting ARR", value: 10200000, type: "start" },
      { name: "New Business", value: 2800000, type: "positive" },
      { name: "Expansion", value: 1200000, type: "positive" },
      { name: "Churn", value: -800000, type: "negative" },
      { name: "Contraction", value: -400000, type: "negative" },
      { name: "Ending ARR", value: 13000000, type: "end" },
    ],
  },
  {
    id: "revenue_breakdown",
    type: "chart",
    name: "Revenue by Segment",
    icon: "PieChart",
    category: "financial",
    description: "Revenue distribution across business segments",
    defaultConfig: { chartType: "donut", showLegend: true, showPercentages: true },
    previewData: [
      { name: "Enterprise", value: 6500000, color: "hsl(239, 84%, 67%)" },
      { name: "Mid-Market", value: 3800000, color: "hsl(215, 16%, 47%)" },
      { name: "SMB", value: 1900000, color: "hsl(160, 84%, 39%)" },
      { name: "Self-Serve", value: 800000, color: "hsl(38, 92%, 50%)" },
    ],
  },
  {
    id: "revenue_trend",
    type: "chart",
    name: "Revenue Trend",
    icon: "TrendingUp",
    category: "financial",
    description: "Monthly/quarterly revenue over time with growth rates",
    defaultConfig: { chartType: "area", showGrowthRate: true, period: "monthly" },
    previewData: [
      { month: "Jan", revenue: 980000, growth: null },
      { month: "Feb", revenue: 1020000, growth: 4.1 },
      { month: "Mar", revenue: 1080000, growth: 5.9 },
      { month: "Apr", revenue: 1150000, growth: 6.5 },
      { month: "May", revenue: 1180000, growth: 2.6 },
      { month: "Jun", revenue: 1250000, growth: 5.9 },
    ],
  },
  {
    id: "expense_breakdown",
    type: "chart",
    name: "Expense Breakdown",
    icon: "PieChart",
    category: "financial",
    description: "Operating expenses by category",
    defaultConfig: { chartType: "pie", showLegend: true },
    previewData: [
      { name: "Payroll", value: 4200000, percentage: 58 },
      { name: "Software", value: 850000, percentage: 12 },
      { name: "Infrastructure", value: 620000, percentage: 9 },
      { name: "Marketing", value: 520000, percentage: 7 },
      { name: "Office & Admin", value: 480000, percentage: 7 },
      { name: "Other", value: 530000, percentage: 7 },
    ],
  },
  {
    id: "cash_flow_statement",
    type: "table",
    name: "Cash Flow Statement",
    icon: "Wallet",
    category: "financial",
    description: "Operating, investing, and financing activities",
    defaultConfig: { rowsPerPage: 15, showTotals: true, highlightNegative: true },
    previewData: {
      sections: [
        {
          title: "Operating Activities",
          items: [
            { label: "Net Income", value: 2400000 },
            { label: "Depreciation", value: 180000 },
            { label: "Changes in Working Capital", value: -320000 },
          ],
          total: 2260000,
        },
        {
          title: "Investing Activities",
          items: [
            { label: "Capital Expenditures", value: -450000 },
            { label: "Acquisitions", value: 0 },
          ],
          total: -450000,
        },
        {
          title: "Financing Activities",
          items: [
            { label: "Stock Compensation", value: 120000 },
            { label: "Debt Repayment", value: -200000 },
          ],
          total: -80000,
        },
      ],
      netChange: 1730000,
    },
  },
  {
    id: "profitability_metrics",
    type: "metric",
    name: "Profitability Metrics",
    icon: "DollarSign",
    category: "financial",
    description: "Gross margin, operating margin, net margin, EBITDA",
    defaultConfig: { showComparison: true, comparisonPeriod: "prior_quarter" },
    previewData: [
      { label: "Gross Margin", value: "78.2%", change: "+2.1pp", trend: "up" },
      { label: "Operating Margin", value: "18.4%", change: "+1.8pp", trend: "up" },
      { label: "Net Margin", value: "14.2%", change: "+0.9pp", trend: "up" },
      { label: "EBITDA Margin", value: "22.6%", change: "+2.4pp", trend: "up" },
    ],
  },
  {
    id: "income_statement",
    type: "table",
    name: "Income Statement",
    icon: "Receipt",
    category: "financial",
    description: "Condensed P&L with comparisons",
    defaultConfig: { showVariance: true, showPercentOfRevenue: true },
    previewData: [
      { item: "Total Revenue", current: 12500000, prior: 10100000, variance: 23.8 },
      { item: "Cost of Revenue", current: 2725000, prior: 2323000, variance: 17.3 },
      { item: "Gross Profit", current: 9775000, prior: 7777000, variance: 25.7 },
      { item: "Operating Expenses", current: 7475000, prior: 6161000, variance: 21.3 },
      { item: "Operating Income", current: 2300000, prior: 1616000, variance: 42.3 },
      { item: "Net Income", current: 1775000, prior: 1212000, variance: 46.5 },
    ],
  },
  {
    id: "balance_sheet",
    type: "table",
    name: "Balance Sheet Summary",
    icon: "Scale",
    category: "financial",
    description: "Assets, liabilities, and equity overview",
    defaultConfig: { condensed: true, showChanges: true },
  },

  // Operational Modules
  {
    id: "burn_rate_analysis",
    type: "chart",
    name: "Burn Rate Analysis",
    icon: "Activity",
    category: "operational",
    description: "Monthly burn rate with runway projections",
    defaultConfig: { chartType: "combo", showRunway: true },
    previewData: [
      { month: "Jul", burn: 320000, cumulative: 320000 },
      { month: "Aug", burn: 335000, cumulative: 655000 },
      { month: "Sep", burn: 318000, cumulative: 973000 },
      { month: "Oct", burn: 342000, cumulative: 1315000 },
      { month: "Nov", burn: 328000, cumulative: 1643000 },
      { month: "Dec", burn: 355000, cumulative: 1998000 },
    ],
  },
  {
    id: "runway_projection",
    type: "metric",
    name: "Runway Projection",
    icon: "Clock",
    category: "operational",
    description: "Cash runway under different scenarios",
    defaultConfig: { showScenarios: true },
    previewData: [
      { scenario: "Conservative", months: 14, confidence: "high" },
      { scenario: "Base Case", months: 18, confidence: "medium" },
      { scenario: "Optimistic", months: 24, confidence: "low" },
    ],
  },
  {
    id: "vendor_spend",
    type: "table",
    name: "Top Vendor Spend",
    icon: "CreditCard",
    category: "operational",
    description: "Largest vendors by spend with trends",
    defaultConfig: { topN: 10, showTrend: true },
    previewData: [
      { vendor: "AWS", category: "Infrastructure", spend: 245000, change: "+12%" },
      { vendor: "Salesforce", category: "Software", spend: 180000, change: "+5%" },
      { vendor: "Google Cloud", category: "Infrastructure", spend: 142000, change: "+18%" },
      { vendor: "Slack", category: "Software", spend: 48000, change: "0%" },
      { vendor: "HubSpot", category: "Marketing", spend: 36000, change: "-8%" },
    ],
  },
  {
    id: "accounts_payable",
    type: "table",
    name: "Accounts Payable Aging",
    icon: "Calendar",
    category: "operational",
    description: "AP aging buckets with totals",
    defaultConfig: { agingBuckets: ["Current", "1-30", "31-60", "61-90", "90+"] },
    previewData: [
      { bucket: "Current", amount: 245000, count: 12 },
      { bucket: "1-30 Days", amount: 128000, count: 8 },
      { bucket: "31-60 Days", amount: 42000, count: 3 },
      { bucket: "61-90 Days", amount: 18000, count: 2 },
      { bucket: "90+ Days", amount: 5000, count: 1 },
    ],
  },
  {
    id: "accounts_receivable",
    type: "table",
    name: "Accounts Receivable Aging",
    icon: "Calendar",
    category: "operational",
    description: "AR aging with collection probability",
    defaultConfig: { showCollectionProbability: true },
  },

  // Departmental Modules
  {
    id: "budget_vs_actual",
    type: "table",
    name: "Budget vs Actual",
    icon: "Table",
    category: "departmental",
    description: "Department budget comparison with variances",
    defaultConfig: { showVariance: true, highlightOverBudget: true },
    previewData: [
      { dept: "Engineering", budget: 155000, actual: 142000, variance: -8.4, status: "under" },
      { dept: "Marketing", budget: 100000, actual: 45000, variance: -55.0, status: "under" },
      { dept: "Sales", budget: 130000, actual: 88000, variance: -32.3, status: "under" },
      { dept: "Operations", budget: 30000, actual: 24000, variance: -20.0, status: "under" },
      { dept: "Product", budget: 85000, actual: 92000, variance: 8.2, status: "over" },
    ],
  },
  {
    id: "headcount_summary",
    type: "metric",
    name: "Headcount Summary",
    icon: "Users",
    category: "departmental",
    description: "Team size, growth, and open positions",
    defaultConfig: { showOpenRoles: true, showAttrition: true },
    previewData: {
      total: 156,
      change: 12,
      departments: [
        { name: "Engineering", count: 68, openRoles: 8 },
        { name: "Sales", count: 34, openRoles: 4 },
        { name: "Marketing", count: 18, openRoles: 2 },
        { name: "Operations", count: 14, openRoles: 1 },
        { name: "Product", count: 12, openRoles: 3 },
        { name: "Finance", count: 10, openRoles: 0 },
      ],
      attritionRate: 8.2,
    },
  },
  {
    id: "department_spend_trend",
    type: "chart",
    name: "Department Spend Trend",
    icon: "BarChart3",
    category: "departmental",
    description: "Monthly spend by department over time",
    defaultConfig: { chartType: "bar", stacked: true },
  },
  {
    id: "cost_per_employee",
    type: "metric",
    name: "Cost per Employee",
    icon: "Calculator",
    category: "departmental",
    description: "Fully-loaded cost analysis by department",
    defaultConfig: { includeOverhead: true },
  },

  // Compliance & Audit Modules
  {
    id: "audit_trail",
    type: "table",
    name: "Audit Trail",
    icon: "ShieldCheck",
    category: "compliance",
    description: "Recent financial transactions and approvals",
    defaultConfig: { limit: 20, sortBy: "date", descending: true },
  },
  {
    id: "policy_compliance",
    type: "kpi",
    name: "Policy Compliance",
    icon: "CheckCircle",
    category: "compliance",
    description: "Expense policy adherence metrics",
    defaultConfig: { showViolations: true },
    previewData: [
      { policy: "Expense Limits", compliance: 94, violations: 12 },
      { policy: "Approval Workflow", compliance: 99, violations: 2 },
      { policy: "Receipt Submission", compliance: 87, violations: 28 },
      { policy: "Vendor Approval", compliance: 100, violations: 0 },
    ],
  },
  {
    id: "risk_indicators",
    type: "kpi",
    name: "Risk Indicators",
    icon: "AlertCircle",
    category: "compliance",
    description: "Financial risk metrics and flags",
    defaultConfig: { thresholds: { high: 80, medium: 60, low: 40 } },
  },

  // Forecasting Modules
  {
    id: "revenue_forecast",
    type: "chart",
    name: "Revenue Forecast",
    icon: "TrendingUp",
    category: "forecasting",
    description: "Projected revenue with confidence intervals",
    defaultConfig: { chartType: "area", showConfidenceInterval: true, forecastMonths: 6 },
    previewData: {
      historical: [
        { month: "Jul", value: 1050000, type: "actual" },
        { month: "Aug", value: 1120000, type: "actual" },
        { month: "Sep", value: 1180000, type: "actual" },
      ],
      forecast: [
        { month: "Oct", low: 1200000, mid: 1250000, high: 1300000 },
        { month: "Nov", low: 1250000, mid: 1320000, high: 1390000 },
        { month: "Dec", low: 1300000, mid: 1400000, high: 1500000 },
      ],
    },
  },
  {
    id: "expense_forecast",
    type: "chart",
    name: "Expense Forecast",
    icon: "TrendingDown",
    category: "forecasting",
    description: "Projected expenses by category",
    defaultConfig: { chartType: "line", byCategory: true },
  },
  {
    id: "scenario_comparison",
    type: "comparison",
    name: "Scenario Comparison",
    icon: "Globe",
    category: "forecasting",
    description: "Side-by-side scenario analysis",
    defaultConfig: { scenarios: ["conservative", "base", "aggressive"] },
    previewData: [
      { metric: "Year-End Revenue", conservative: "$14.2M", base: "$15.8M", aggressive: "$17.5M" },
      { metric: "Year-End Margin", conservative: "72%", base: "76%", aggressive: "78%" },
      { metric: "Headcount", conservative: "165", base: "180", aggressive: "195" },
      { metric: "Cash Position", conservative: "$3.2M", base: "$4.1M", aggressive: "$4.8M" },
    ],
  },
  {
    id: "monthly_projections",
    type: "table",
    name: "Monthly Projections",
    icon: "Calendar",
    category: "forecasting",
    description: "12-month financial projections",
    defaultConfig: { months: 12, metrics: ["revenue", "expenses", "cash"] },
  },

  // Custom/Utility Modules
  {
    id: "custom_text",
    type: "text",
    name: "Custom Text Block",
    icon: "FileText",
    category: "executive",
    description: "Add custom narrative or notes",
    defaultConfig: { useAI: false, placeholder: "Enter your text here..." },
  },
  {
    id: "section_header",
    type: "text",
    name: "Section Header",
    icon: "Hash",
    category: "executive",
    description: "Visual section divider with title",
    defaultConfig: { style: "divider", showLine: true },
  },

  // Advanced Visualization Modules
  {
    id: "treemap_expenses",
    type: "chart",
    name: "Expense Treemap",
    icon: "LayoutGrid",
    category: "financial",
    description: "Hierarchical view of expenses by category and subcategory",
    defaultConfig: { chartType: "treemap", colorBy: "category", showLabels: true },
    previewData: [
      { name: "Payroll", value: 4200000, category: "OpEx", children: [
        { name: "Engineering", value: 2100000 },
        { name: "Sales", value: 1200000 },
        { name: "Marketing", value: 500000 },
        { name: "Other", value: 400000 },
      ]},
      { name: "Infrastructure", value: 850000, category: "OpEx" },
      { name: "Marketing", value: 520000, category: "OpEx" },
    ],
  },
  {
    id: "contribution_margin",
    type: "chart",
    name: "Contribution Margin Analysis",
    icon: "Layers",
    category: "financial",
    description: "Revenue, costs, and margin by product line",
    defaultConfig: { chartType: "stacked", showMarginLine: true },
  },
  {
    id: "customer_cohort",
    type: "chart",
    name: "Customer Cohort Analysis",
    icon: "Users",
    category: "operational",
    description: "Retention and revenue by customer cohort",
    defaultConfig: { chartType: "heatmap", cohortMonths: 12 },
  },
  {
    id: "unit_economics",
    type: "kpi",
    name: "Unit Economics",
    icon: "Calculator",
    category: "financial",
    description: "CAC, LTV, payback period, and efficiency metrics",
    defaultConfig: { layout: "cards", showTrends: true },
    previewData: [
      { label: "CAC", value: "$1,240", trend: "down", change: "-8%" },
      { label: "LTV", value: "$5,100", trend: "up", change: "+12%" },
      { label: "LTV:CAC", value: "4.1x", trend: "up", change: "+0.5x" },
      { label: "Payback", value: "8.2 mo", trend: "down", change: "-1.1mo" },
    ],
  },
  {
    id: "working_capital",
    type: "metric",
    name: "Working Capital Analysis",
    icon: "Wallet",
    category: "operational",
    description: "Current assets, liabilities, and working capital ratios",
    defaultConfig: { showRatios: true },
  },
  {
    id: "quarterly_comparison",
    type: "comparison",
    name: "Quarterly Comparison",
    icon: "ArrowLeftRight",
    category: "executive",
    description: "Side-by-side comparison of key metrics across quarters",
    defaultConfig: { quarters: 4, highlightChanges: true },
  },
];

export const demoTemplates: ReportTemplate[] = [
  {
    id: "board_deck",
    name: "Board Deck",
    description: "Comprehensive quarterly board presentation with all key metrics",
    moduleIds: ["executive_summary", "key_highlights", "kpi_scorecard", "revenue_waterfall", "revenue_trend", "budget_vs_actual", "headcount_summary", "runway_projection", "revenue_forecast"],
  },
  {
    id: "monthly_close",
    name: "Monthly Financial Close",
    description: "Standard month-end close report with P&L and cash flow",
    moduleIds: ["key_highlights", "income_statement", "cash_flow_statement", "expense_breakdown", "accounts_payable", "budget_vs_actual"],
  },
  {
    id: "investor_update",
    name: "Investor Update",
    description: "Concise investor-focused metrics and milestones",
    moduleIds: ["executive_summary", "kpi_scorecard", "revenue_trend", "burn_rate_analysis", "runway_projection", "key_highlights"],
  },
  {
    id: "budget_review",
    name: "Budget Review",
    description: "Department-focused budget analysis and variance reporting",
    moduleIds: ["budget_vs_actual", "department_spend_trend", "expense_breakdown", "vendor_spend", "headcount_summary"],
  },
  {
    id: "forecast_review",
    name: "Forecast Review",
    description: "Forward-looking projections and scenario analysis",
    moduleIds: ["executive_summary", "revenue_forecast", "expense_forecast", "scenario_comparison", "monthly_projections", "runway_projection"],
  },
  {
    id: "audit_report",
    name: "Audit & Compliance",
    description: "Compliance metrics, audit trail, and risk indicators",
    moduleIds: ["policy_compliance", "risk_indicators", "audit_trail", "accounts_payable", "accounts_receivable"],
  },
];

export const periodOptions = [
  { value: "jan-2024", label: "January 2024" },
  { value: "feb-2024", label: "February 2024" },
  { value: "mar-2024", label: "March 2024" },
  { value: "q1-2024", label: "Q1 2024" },
  { value: "apr-2024", label: "April 2024" },
  { value: "may-2024", label: "May 2024" },
  { value: "jun-2024", label: "June 2024" },
  { value: "q2-2024", label: "Q2 2024" },
  { value: "jul-2024", label: "July 2024" },
  { value: "aug-2024", label: "August 2024" },
  { value: "sep-2024", label: "September 2024" },
  { value: "q3-2024", label: "Q3 2024" },
  { value: "oct-2024", label: "October 2024" },
  { value: "nov-2024", label: "November 2024" },
  { value: "dec-2024", label: "December 2024" },
  { value: "q4-2024", label: "Q4 2024" },
  { value: "fy-2024", label: "FY 2024" },
  { value: "ytd-2024", label: "YTD 2024" },
];

export const getModuleById = (id: string): ReportModule | undefined => {
  return availableModules.find((m) => m.id === id);
};

export const getModulesByCategory = (category: ModuleCategory): ReportModule[] => {
  return availableModules.filter((m) => m.category === category);
};

export const getAllCategories = (): { id: ModuleCategory; label: string; icon: string }[] => [
  { id: "executive", label: "Executive Summary", icon: "Briefcase" },
  { id: "financial", label: "Financial Metrics", icon: "DollarSign" },
  { id: "operational", label: "Operational", icon: "Activity" },
  { id: "departmental", label: "Departmental", icon: "Users" },
  { id: "compliance", label: "Compliance & Audit", icon: "ShieldCheck" },
  { id: "forecasting", label: "Forecasting", icon: "TrendingUp" },
];

// Icon mapping for dynamic rendering
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Table,
  DollarSign,
  Users,
  FileText,
  Calendar,
  Target,
  Wallet,
  CreditCard,
  Building,
  Activity,
  LineChart,
  AreaChart,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Hash,
  Clock,
  AlertCircle,
  CheckCircle,
  Globe,
  Briefcase,
  Calculator,
  Receipt,
  Landmark,
  Scale,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Layers,
  ArrowLeftRight,
};
