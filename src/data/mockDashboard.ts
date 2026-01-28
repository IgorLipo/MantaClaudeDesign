// Mock Dashboard Data - Finance Pulse Demo
// All data is static for demo purposes

export const dashboardMetrics = {
  liquidity: {
    total: 4285102,
    burn: 324000,
    runway_months: 18,
  },
  arr: {
    value: 12500000,
    change_pct: 12.4,
  },
  gross_margin: {
    value: 78.2,
    target: 80,
  },
  ltv_cac: {
    value: 4.1,
    progress: 82,
  },
  ndr: {
    value: 114,
    progress: 100,
  },
};

export const departments = [
  {
    id: "eng",
    name: "Engineering",
    subcategory: "Cloud & Salaries",
    spent: 142000,
    budget: 155000,
    utilization: 92,
    status: "near-limit" as const,
    iconColor: "text-accent",
  },
  {
    id: "mkt",
    name: "Marketing",
    subcategory: "Ad Spend & Events",
    spent: 45000,
    budget: 100000,
    utilization: 45,
    status: "under-budget" as const,
    iconColor: "text-chart-pink",
  },
  {
    id: "sales",
    name: "Sales",
    subcategory: "Commissions & Travel",
    spent: 88000,
    budget: 130000,
    utilization: 68,
    status: "on-track" as const,
    iconColor: "text-success",
  },
  {
    id: "ops",
    name: "Operations",
    subcategory: "Rent & Office",
    spent: 24000,
    budget: 30000,
    utilization: 82,
    status: "on-track" as const,
    iconColor: "text-info",
  },
];

export type DepartmentStatus = "on-track" | "near-limit" | "under-budget" | "over-budget";

export const transactions = [
  {
    id: "1",
    vendor: "AWS Inc.",
    category: "Infrastructure",
    amount: 2450,
    type: "debit" as const,
  },
  {
    id: "2",
    vendor: "Stripe Payout",
    category: "Merchant ID **88",
    amount: 14230.5,
    type: "credit" as const,
  },
  {
    id: "3",
    vendor: "Slack Technologies",
    category: "Software",
    amount: 1250,
    type: "debit" as const,
  },
  {
    id: "4",
    vendor: "Client Payment",
    category: "Invoice #1042",
    amount: 28500,
    type: "credit" as const,
  },
];

export const invoices = [
  {
    id: "1",
    vendor: "Salesforce Enterprise",
    dueInfo: "Due Tomorrow",
    invoiceNumber: "#INV-2092",
    amount: 12500,
    status: "pending" as const,
    category: "software" as const,
  },
  {
    id: "2",
    vendor: "Contractor Payouts",
    dueInfo: "Oct 24",
    amount: 8450,
    status: "scheduled" as const,
    category: "payroll" as const,
  },
  {
    id: "3",
    vendor: "Google Cloud Platform",
    dueInfo: "Oct 28",
    invoiceNumber: "#INV-2095",
    amount: 4200,
    status: "scheduled" as const,
    category: "software" as const,
  },
];

export const cashFlowData = [
  { month: "May", value: 1.8 },
  { month: "Jun", value: 2.1 },
  { month: "Jul", value: 2.05 },
  { month: "Aug", value: 2.4 },
  { month: "Sep", value: 2.8 },
  { month: "Oct", value: 3.2 },
];

export const spendMixData = [
  { name: "Payroll", value: 65, color: "hsl(239, 84%, 67%)" },
  { name: "Software", value: 20, color: "hsl(215, 16%, 47%)" },
  { name: "Other", value: 15, color: "hsl(160, 84%, 39%)" },
];

export const teamActivities = [
  {
    id: "1",
    initials: "SC",
    name: "Sarah Chen",
    action: "Approved budget increase",
    timeAgo: "2h",
    highlight: false,
  },
  {
    id: "2",
    initials: "MJ",
    name: "Mike Johnson",
    action: "Exported Q3 P&L Report",
    timeAgo: "5h",
    highlight: false,
  },
  {
    id: "3",
    initials: "ED",
    name: "Emma Davis",
    action: "Reconciled Stripe payouts",
    timeAgo: "1d",
    highlight: true,
  },
];

export const currentPeriod = "Q3 FY2026 Reporting";
