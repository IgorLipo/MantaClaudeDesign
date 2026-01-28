import { ReportModule } from "@/data/mockReports";
import { cn } from "@/lib/utils";

interface GaugeChartProps {
  module: ReportModule;
  config: Record<string, unknown>;
  compact?: boolean;
}

interface GaugeData {
  label: string;
  value: number;
  max: number;
  target?: number;
  color?: string;
}

export function GaugeChart({ module, config, compact = false }: GaugeChartProps) {
  const gauges: GaugeData[] = (module.previewData as GaugeData[]) || [
    { label: "Revenue Target", value: 89, max: 100, target: 100, color: "hsl(239, 84%, 67%)" },
    { label: "Margin Goal", value: 78, max: 100, target: 80, color: "hsl(160, 84%, 39%)" },
    { label: "Efficiency", value: 92, max: 100, target: 90, color: "hsl(38, 92%, 50%)" },
  ];

  const size = compact ? 80 : 100;
  const strokeWidth = compact ? 8 : 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle

  return (
    <div className={cn(
      "grid gap-4",
      gauges.length === 2 && "grid-cols-2",
      gauges.length === 3 && "grid-cols-3",
      gauges.length >= 4 && "grid-cols-2 md:grid-cols-4"
    )}>
      {gauges.slice(0, compact ? 3 : 4).map((gauge, idx) => {
        const percentage = Math.min((gauge.value / gauge.max) * 100, 100);
        const offset = circumference - (percentage / 100) * circumference;
        const targetOffset = gauge.target 
          ? circumference - (Math.min(gauge.target / gauge.max, 1) * circumference)
          : null;

        const getStatusColor = () => {
          if (!gauge.target) return gauge.color || "hsl(239, 84%, 67%)";
          if (gauge.value >= gauge.target) return "hsl(160, 84%, 39%)";
          if (gauge.value >= gauge.target * 0.8) return "hsl(38, 92%, 50%)";
          return "hsl(0, 84%, 60%)";
        };

        return (
          <div key={idx} className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
              <svg
                width={size}
                height={size / 2 + 10}
                className="transform -rotate-180"
                style={{ overflow: "visible" }}
              >
                {/* Background arc */}
                <path
                  d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                  fill="none"
                  stroke="hsl(215, 16%, 90%)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="dark:stroke-muted"
                />
                
                {/* Value arc */}
                <path
                  d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                  fill="none"
                  stroke={getStatusColor()}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />

                {/* Target marker */}
                {targetOffset !== null && (
                  <circle
                    cx={size / 2 + Math.cos(Math.PI * (1 - gauge.target! / gauge.max)) * radius}
                    cy={size / 2 - Math.sin(Math.PI * (1 - gauge.target! / gauge.max)) * radius}
                    r={4}
                    fill="white"
                    stroke="hsl(215, 16%, 47%)"
                    strokeWidth={2}
                  />
                )}
              </svg>
              
              {/* Value display */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <p className="text-xl font-bold text-foreground">{gauge.value}%</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">{gauge.label}</p>
            {gauge.target && (config.showTarget as boolean) !== false && (
              <p className="text-xs text-muted-foreground/60">Target: {gauge.target}%</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
