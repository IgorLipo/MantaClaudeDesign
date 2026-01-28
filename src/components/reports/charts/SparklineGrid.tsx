import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SparklineData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  sparkline: number[];
}

interface SparklineGridProps {
  data?: SparklineData[];
  config: Record<string, unknown>;
  compact?: boolean;
}

const defaultData: SparklineData[] = [
  { label: "Revenue", value: "$1.25M", change: "+12.4%", trend: "up", sparkline: [65, 72, 68, 80, 75, 82, 90, 88, 95, 100] },
  { label: "Users", value: "12,847", change: "+8.2%", trend: "up", sparkline: [40, 45, 42, 50, 55, 52, 60, 58, 65, 68] },
  { label: "Conversion", value: "3.2%", change: "-0.4%", trend: "down", sparkline: [80, 78, 82, 75, 72, 70, 68, 72, 65, 62] },
  { label: "Avg Order", value: "$89", change: "+$4", trend: "up", sparkline: [50, 55, 52, 58, 60, 62, 65, 68, 72, 75] },
];

function Sparkline({ data, trend, height = 24, width = 80 }: { data: number[]; trend: "up" | "down" | "stable"; height?: number; width?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const strokeColor = trend === "up" 
    ? "hsl(160, 84%, 39%)" 
    : trend === "down" 
      ? "hsl(0, 84%, 60%)" 
      : "hsl(215, 16%, 47%)";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r={2.5}
        fill={strokeColor}
      />
    </svg>
  );
}

export function SparklineGrid({ data = defaultData, config, compact = false }: SparklineGridProps) {
  const columns = (config.columns as number) || 4;
  const showSparklines = (config.showSparklines as boolean) !== false;

  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-3",
      columns === 4 && "grid-cols-2 sm:grid-cols-4",
    )}>
      {data.slice(0, compact ? 4 : 6).map((item, idx) => (
        <div key={idx} className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold text-foreground">{item.value}</p>
            </div>
            {showSparklines && (
              <Sparkline data={item.sparkline} trend={item.trend} />
            )}
          </div>
          <div className="flex items-center gap-1">
            {item.trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
            {item.trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
            {item.trend === "stable" && <Minus className="h-3 w-3 text-muted-foreground" />}
            <span className={cn(
              "text-xs font-medium",
              item.trend === "up" && "text-success",
              item.trend === "down" && "text-destructive",
              item.trend === "stable" && "text-muted-foreground"
            )}>
              {item.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
