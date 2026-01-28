import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ArrowLeftRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonMetric {
  name: string;
  period1Value: string;
  period2Value: string;
  change: number;
  trend: "up" | "down" | "stable";
}

interface ReportComparisonViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Demo comparison data
const comparisonData: ComparisonMetric[] = [
  { name: "Total Revenue", period1Value: "$11.2M", period2Value: "$12.5M", change: 11.6, trend: "up" },
  { name: "Gross Margin", period1Value: "74.8%", period2Value: "78.2%", change: 4.5, trend: "up" },
  { name: "Operating Expenses", period1Value: "$6.8M", period2Value: "$7.2M", change: 5.9, trend: "up" },
  { name: "Net Income", period1Value: "$1.52M", period2Value: "$1.78M", change: 17.1, trend: "up" },
  { name: "Cash Position", period1Value: "$4.2M", period2Value: "$3.8M", change: -9.5, trend: "down" },
  { name: "Headcount", period1Value: "142", period2Value: "156", change: 9.9, trend: "up" },
  { name: "Customer Count", period1Value: "847", period2Value: "923", change: 9.0, trend: "up" },
  { name: "ARR", period1Value: "$10.2M", period2Value: "$12.5M", change: 22.5, trend: "up" },
  { name: "Churn Rate", period1Value: "3.2%", period2Value: "2.1%", change: -34.4, trend: "down" },
  { name: "NPS Score", period1Value: "42", period2Value: "48", change: 14.3, trend: "up" },
  { name: "Burn Rate", period1Value: "$385K/mo", period2Value: "$342K/mo", change: -11.2, trend: "down" },
  { name: "Runway", period1Value: "14 months", period2Value: "18 months", change: 28.6, trend: "up" },
];

const periods = [
  { value: "q2-2024", label: "Q2 2024" },
  { value: "q3-2024", label: "Q3 2024" },
  { value: "q4-2024", label: "Q4 2024" },
  { value: "jan-2024", label: "January 2024" },
  { value: "feb-2024", label: "February 2024" },
  { value: "mar-2024", label: "March 2024" },
];

export function ReportComparisonView({ open, onOpenChange }: ReportComparisonViewProps) {
  const [period1, setPeriod1] = useState("q2-2024");
  const [period2, setPeriod2] = useState("q3-2024");

  const period1Label = periods.find((p) => p.value === period1)?.label || period1;
  const period2Label = periods.find((p) => p.value === period2)?.label || period2;

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4" />;
      case "down":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getChangeColor = (metric: ComparisonMetric) => {
    // Some metrics are better when they go down
    const invertedMetrics = ["churn", "burn", "expense", "cost"];
    const isInverted = invertedMetrics.some((m) => metric.name.toLowerCase().includes(m));

    if (metric.trend === "stable") return "text-muted-foreground";
    
    const isPositive = isInverted ? metric.change < 0 : metric.change > 0;
    return isPositive ? "text-success" : "text-destructive";
  };

  const swapPeriods = () => {
    const temp = period1;
    setPeriod1(period2);
    setPeriod2(temp);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-accent" />
              Period Comparison
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Period Selectors */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Base Period</label>
              <Select value={period1} onValueChange={setPeriod1}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 mt-4"
              onClick={swapPeriods}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Comparison Period</label>
              <Select value={period2} onValueChange={setPeriod2}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-success font-medium">Improved</p>
                <p className="text-2xl font-bold text-success">
                  {comparisonData.filter((m) => {
                    const invertedMetrics = ["churn", "burn", "expense", "cost"];
                    const isInverted = invertedMetrics.some((x) => m.name.toLowerCase().includes(x));
                    return isInverted ? m.change < 0 : m.change > 0;
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">metrics</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive font-medium">Declined</p>
                <p className="text-2xl font-bold text-destructive">
                  {comparisonData.filter((m) => {
                    const invertedMetrics = ["churn", "burn", "expense", "cost"];
                    const isInverted = invertedMetrics.some((x) => m.name.toLowerCase().includes(x));
                    return isInverted ? m.change > 0 : m.change < 0;
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">metrics</p>
              </div>
              <div className="p-4 rounded-lg bg-muted border border-border">
                <p className="text-xs text-muted-foreground font-medium">Unchanged</p>
                <p className="text-2xl font-bold text-foreground">
                  {comparisonData.filter((m) => m.trend === "stable").length}
                </p>
                <p className="text-xs text-muted-foreground">metrics</p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-sm text-foreground">Metric</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-foreground">{period1Label}</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-foreground">{period2Label}</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-foreground">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((metric, idx) => (
                    <tr
                      key={metric.name}
                      className={cn(
                        "border-t border-border/50 hover:bg-muted/30 transition-colors",
                        idx % 2 === 0 && "bg-muted/10"
                      )}
                    >
                      <td className="py-3 px-4 font-medium text-foreground">{metric.name}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">
                        {metric.period1Value}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground tabular-nums">
                        {metric.period2Value}
                      </td>
                      <td className={cn("py-3 px-4 text-right tabular-nums", getChangeColor(metric))}>
                        <div className="flex items-center justify-end gap-1.5">
                          {getTrendIcon(metric.trend)}
                          <span>
                            {metric.change >= 0 ? "+" : ""}
                            {metric.change.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Export Actions */}
            <div className="flex items-center justify-end gap-2 mt-6">
              <Button variant="outline" size="sm">
                Export to CSV
              </Button>
              <Button size="sm">
                Add to Report
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
