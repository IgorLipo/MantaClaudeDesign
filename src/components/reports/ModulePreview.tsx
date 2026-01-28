import { ReportModule, iconMap } from "@/data/mockReports";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { WaterfallChart } from "./charts/WaterfallChart";
import { ComboChart } from "./charts/ComboChart";
import { ForecastChart } from "./charts/ForecastChart";
import { GaugeChart } from "./charts/GaugeChart";
import { SparklineGrid } from "./charts/SparklineGrid";

interface ModulePreviewProps {
  module: ReportModule;
  config: Record<string, unknown>;
  compact?: boolean;
}

// Chart colors
const COLORS = [
  "hsl(239, 84%, 67%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(215, 16%, 47%)",
  "hsl(340, 82%, 52%)",
];

// Sample data for charts
const revenueData = [
  { month: "Jan", value: 980000 },
  { month: "Feb", value: 1020000 },
  { month: "Mar", value: 1080000 },
  { month: "Apr", value: 1150000 },
  { month: "May", value: 1180000 },
  { month: "Jun", value: 1250000 },
];

const pieData = [
  { name: "Enterprise", value: 6500000 },
  { name: "Mid-Market", value: 3800000 },
  { name: "SMB", value: 1900000 },
  { name: "Self-Serve", value: 800000 },
];

export function ModulePreview({ module, config, compact = false }: ModulePreviewProps) {
  const chartType = (config.chartType as string) || "bar";
  const showLegend = (config.showLegend as boolean) ?? true;
  const showSparklines = (config.showSparklines as boolean) ?? false;

  // CEO Dashboard with sparklines
  if (module.id === "ceo_dashboard" && showSparklines) {
    return <SparklineGrid config={config} compact={compact} />;
  }

  // Gauge charts for compliance/risk indicators
  if (module.id === "policy_compliance" || module.id === "risk_indicators") {
    return <GaugeChart module={module} config={config} compact={compact} />;
  }


  // KPI Grid Preview
  if (module.type === "kpi" || (module.type === "metric" && module.id !== "profitability_metrics")) {
    const kpis = (module.previewData as Array<{ label: string; value: string; trend?: string; change?: string; progress?: number }>) || [
      { label: "ARR", value: "$12.5M", trend: "up", change: "+24%" },
      { label: "Gross Margin", value: "78.2%", trend: "stable", change: "+2.1pp" },
      { label: "LTV:CAC", value: "4.1x", trend: "up", change: "+0.5x" },
      { label: "NDR", value: "114%", trend: "up", change: "+4pp" },
    ];

    const columns = (config.columns as number) || 4;

    return (
      <div className={cn(
        "grid gap-3",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
        columns >= 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      )}>
        {kpis.slice(0, compact ? 4 : 6).map((kpi, idx) => (
          <div key={idx} className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-lg font-semibold text-foreground">{kpi.value}</p>
            {kpi.change && (config.showTrend as boolean) !== false && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {kpi.trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
                {kpi.trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                {kpi.trend === "stable" && <Minus className="h-3 w-3 text-muted-foreground" />}
                <span className={cn(
                  "text-xs",
                  kpi.trend === "up" && "text-success",
                  kpi.trend === "down" && "text-destructive",
                  kpi.trend === "stable" && "text-muted-foreground"
                )}>
                  {kpi.change}
                </span>
              </div>
            )}
            {kpi.progress !== undefined && (config.showTarget as boolean) !== false && (
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(kpi.progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Chart Preview - Handle special chart types
  if (module.type === "chart") {
    // Waterfall chart
    if (chartType === "waterfall" || module.id === "revenue_waterfall") {
      return <WaterfallChart module={module} config={config} compact={compact} />;
    }

    // Combo chart (for burn rate analysis)
    if (chartType === "combo" || module.id === "burn_rate_analysis") {
      return <ComboChart module={module} config={config} compact={compact} />;
    }

    // Forecast chart with confidence intervals
    if (module.id === "revenue_forecast" || module.id === "expense_forecast") {
      return <ForecastChart module={module} config={config} compact={compact} />;
    }

    const height = compact ? 120 : 180;
    
    if (chartType === "pie" || chartType === "donut") {
      return (
        <div className="flex items-center gap-4">
          <div style={{ height, width: height }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={chartType === "donut" ? "50%" : 0}
                  outerRadius="80%"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {showLegend && (
            <div className="space-y-2">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (chartType === "line") {
      return (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(222, 47%, 11%)', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Revenue']}
              />
              <Line type="monotone" dataKey="value" stroke="hsl(239, 84%, 67%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chartType === "area") {
      return (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(222, 47%, 11%)', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Revenue']}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(239, 84%, 67%)" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Default: Bar chart
    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(222, 47%, 11%)', border: 'none', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Revenue']}
            />
            <Bar dataKey="value" fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Table Preview
  if (module.type === "table") {
    const tableData = [
      { dept: "Engineering", budget: "$155,000", actual: "$142,000", variance: "-8.4%", status: "under" },
      { dept: "Marketing", budget: "$100,000", actual: "$45,000", variance: "-55.0%", status: "under" },
      { dept: "Sales", budget: "$130,000", actual: "$88,000", variance: "-32.3%", status: "under" },
      { dept: "Operations", budget: "$30,000", actual: "$24,000", variance: "-20.0%", status: "under" },
    ];

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Department</th>
              <th className="text-right py-2 px-3 font-medium text-muted-foreground">Budget</th>
              <th className="text-right py-2 px-3 font-medium text-muted-foreground">Actual</th>
              <th className="text-right py-2 px-3 font-medium text-muted-foreground">Variance</th>
            </tr>
          </thead>
          <tbody>
            {tableData.slice(0, compact ? 3 : 4).map((row, idx) => (
              <tr key={idx} className={cn("border-b border-border/50", (config.stripedRows as boolean) !== false && idx % 2 === 1 && "bg-muted/30")}>
                <td className="py-2 px-3 text-foreground">{row.dept}</td>
                <td className="py-2 px-3 text-right text-foreground">{row.budget}</td>
                <td className="py-2 px-3 text-right text-foreground">{row.actual}</td>
                <td className={cn("py-2 px-3 text-right font-medium", row.status === "under" ? "text-success" : "text-destructive")}>
                  {row.variance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Text Preview
  if (module.type === "text") {
    const customText = config.customText as string;
    const useAI = config.useAI as boolean;

    if (customText) {
      return (
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p>{customText}</p>
        </div>
      );
    }

    if (useAI) {
      return (
        <div className="prose prose-sm max-w-none text-muted-foreground italic">
          <p>
            This quarter demonstrated strong performance across key financial metrics.
            Revenue grew 12.4% year-over-year while maintaining healthy gross margins of 78.2%.
            Operating expenses remained under control, with most departments coming in under budget.
            Cash runway remains stable at 18 months based on current burn rate.
          </p>
          <p className="text-xs text-muted-foreground/60 not-italic mt-2">
            ✨ AI-generated summary based on report data
          </p>
        </div>
      );
    }

    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <p>Configure this module to add content</p>
      </div>
    );
  }

  // Comparison Preview
  if (module.type === "comparison") {
    const comparisonData = (module.previewData as Array<{ metric: string; conservative: string; base: string; aggressive: string }>) || [];

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Metric</th>
              <th className="text-center py-2 px-3 font-medium text-muted-foreground">Conservative</th>
              <th className="text-center py-2 px-3 font-medium text-muted-foreground bg-accent/5">Base Case</th>
              <th className="text-center py-2 px-3 font-medium text-muted-foreground">Aggressive</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.slice(0, compact ? 3 : 4).map((row, idx) => (
              <tr key={idx} className="border-b border-border/50">
                <td className="py-2 px-3 text-foreground font-medium">{row.metric}</td>
                <td className="py-2 px-3 text-center text-muted-foreground">{row.conservative}</td>
                <td className="py-2 px-3 text-center text-foreground font-medium bg-accent/5">{row.base}</td>
                <td className="py-2 px-3 text-center text-muted-foreground">{row.aggressive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Metric Preview (simple)
  if (module.type === "metric") {
    const metrics = (module.previewData as Array<{ label: string; value: string; change?: string; trend?: string }>) || [
      { label: "Gross Margin", value: "78.2%", change: "+2.1pp", trend: "up" },
      { label: "Operating Margin", value: "18.4%", change: "+1.8pp", trend: "up" },
      { label: "Net Margin", value: "14.2%", change: "+0.9pp", trend: "up" },
    ];

    return (
      <div className="grid grid-cols-3 gap-4">
        {metrics.slice(0, 3).map((metric, idx) => (
          <div key={idx} className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-xl font-bold text-foreground">{metric.value}</p>
            {metric.change && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {metric.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                )}
                <span className={cn("text-xs", metric.trend === "up" ? "text-success" : "text-destructive")}>
                  {metric.change}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Fallback
  const IconComponent = iconMap[module.icon];
  return (
    <div className="h-32 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg flex items-center justify-center">
      <div className="text-center">
        {IconComponent && <IconComponent className="h-8 w-8 text-accent/30 mx-auto mb-2" />}
        <p className="text-sm text-muted-foreground">{module.name}</p>
      </div>
    </div>
  );
}
