import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface VarianceRow {
  item: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
  category?: string;
  isSubtotal?: boolean;
  isTotal?: boolean;
  notes?: string;
}

interface VarianceTableProps {
  data?: VarianceRow[];
  config: Record<string, unknown>;
  compact?: boolean;
}

const defaultData: VarianceRow[] = [
  // Revenue
  { item: "Product Revenue", budget: 8500000, actual: 9200000, variance: 700000, variancePercent: 8.2, category: "Revenue" },
  { item: "Service Revenue", budget: 2500000, actual: 2350000, variance: -150000, variancePercent: -6.0, category: "Revenue" },
  { item: "Other Revenue", budget: 500000, actual: 520000, variance: 20000, variancePercent: 4.0, category: "Revenue" },
  { item: "Total Revenue", budget: 11500000, actual: 12070000, variance: 570000, variancePercent: 5.0, isSubtotal: true },
  
  // Expenses
  { item: "Payroll & Benefits", budget: 4200000, actual: 4450000, variance: -250000, variancePercent: -6.0, category: "OpEx", notes: "New hires" },
  { item: "Software & Tools", budget: 850000, actual: 820000, variance: 30000, variancePercent: 3.5, category: "OpEx" },
  { item: "Infrastructure", budget: 620000, actual: 680000, variance: -60000, variancePercent: -9.7, category: "OpEx", notes: "Cloud costs up" },
  { item: "Marketing", budget: 520000, actual: 480000, variance: 40000, variancePercent: 7.7, category: "OpEx" },
  { item: "Total OpEx", budget: 6190000, actual: 6430000, variance: -240000, variancePercent: -3.9, isSubtotal: true },
  
  // Bottom line
  { item: "Operating Income", budget: 5310000, actual: 5640000, variance: 330000, variancePercent: 6.2, isTotal: true },
];

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

const formatVariance = (value: number, showSign: boolean = true) => {
  const formatted = formatCurrency(Math.abs(value));
  if (!showSign) return formatted;
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
};

export function VarianceTable({ data = defaultData, config, compact = false }: VarianceTableProps) {
  const showNotes = (config.showNotes as boolean) !== false;
  const highlightThreshold = (config.highlightThreshold as number) || 10;
  const favorableColor = (config.favorableColor as string) || "success";
  const unfavorableColor = (config.unfavorableColor as string) || "destructive";

  const getVarianceClass = (row: VarianceRow) => {
    if (row.isSubtotal || row.isTotal) return "";
    
    const isSignificant = Math.abs(row.variancePercent) >= highlightThreshold;
    const isFavorable = row.variance > 0;
    
    // For expenses, negative variance (under budget) is favorable
    const isExpenseCategory = row.category === "OpEx" || row.item.toLowerCase().includes("expense");
    const isActuallyFavorable = isExpenseCategory ? !isFavorable : isFavorable;
    
    if (isSignificant && isActuallyFavorable) {
      return favorableColor === "success" ? "text-success" : "text-primary";
    }
    if (isSignificant && !isActuallyFavorable) {
      return unfavorableColor === "destructive" ? "text-destructive" : "text-amber-500";
    }
    
    return "text-muted-foreground";
  };

  const getTrendIcon = (row: VarianceRow) => {
    if (row.isSubtotal || row.isTotal) return null;
    
    const isSignificant = Math.abs(row.variancePercent) >= highlightThreshold;
    const isExpenseCategory = row.category === "OpEx" || row.item.toLowerCase().includes("expense");
    const isUnfavorable = isExpenseCategory ? row.variance < 0 : row.variance < 0;
    
    if (Math.abs(row.variancePercent) < 1) {
      return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    
    if (isSignificant && isUnfavorable) {
      return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    }
    
    if (row.variance > 0) {
      return <TrendingUp className="h-3.5 w-3.5" />;
    }
    return <TrendingDown className="h-3.5 w-3.5" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Item</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Budget</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Actual</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Variance ($)</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Variance (%)</th>
            {showNotes && <th className="text-left py-2 px-3 font-medium text-muted-foreground">Notes</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={cn(
                "border-b border-border/50",
                row.isTotal && "bg-accent/10 font-bold",
                row.isSubtotal && "bg-muted/30 font-medium"
              )}
            >
              <td className={cn(
                "py-2.5 px-3 text-foreground",
                !row.isTotal && !row.isSubtotal && "pl-5"
              )}>
                {row.item}
              </td>
              <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">
                {formatCurrency(row.budget)}
              </td>
              <td className="py-2.5 px-3 text-right text-foreground tabular-nums font-medium">
                {formatCurrency(row.actual)}
              </td>
              <td className={cn("py-2.5 px-3 text-right tabular-nums", getVarianceClass(row))}>
                <div className="flex items-center justify-end gap-1">
                  {getTrendIcon(row)}
                  <span>{formatVariance(row.variance)}</span>
                </div>
              </td>
              <td className={cn("py-2.5 px-3 text-right tabular-nums", getVarianceClass(row))}>
                {row.variancePercent >= 0 ? "+" : ""}{row.variancePercent.toFixed(1)}%
              </td>
              {showNotes && (
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {row.notes}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Footer */}
      <div className="flex items-center justify-between mt-4 px-3 py-2 bg-muted/30 rounded-lg text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Favorable: <span className="text-success font-medium">{formatCurrency(data.filter(d => d.variance > 0 && !d.isSubtotal && !d.isTotal).reduce((sum, d) => sum + d.variance, 0))}</span>
          </span>
          <span className="text-muted-foreground">
            Unfavorable: <span className="text-destructive font-medium">{formatCurrency(Math.abs(data.filter(d => d.variance < 0 && !d.isSubtotal && !d.isTotal).reduce((sum, d) => sum + d.variance, 0)))}</span>
          </span>
        </div>
        <span className="text-muted-foreground">
          Threshold: ≥{highlightThreshold}% highlighted
        </span>
      </div>
    </div>
  );
}
