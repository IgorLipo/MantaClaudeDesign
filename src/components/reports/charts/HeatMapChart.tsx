import { cn } from "@/lib/utils";

interface HeatMapData {
  row: string;
  col: string;
  value: number;
  label?: string;
}

interface HeatMapChartProps {
  data?: HeatMapData[];
  config: Record<string, unknown>;
  compact?: boolean;
}

const defaultData: HeatMapData[] = [
  // Revenue by Quarter x Department
  { row: "Engineering", col: "Q1", value: 85, label: "$1.2M" },
  { row: "Engineering", col: "Q2", value: 92, label: "$1.4M" },
  { row: "Engineering", col: "Q3", value: 88, label: "$1.3M" },
  { row: "Engineering", col: "Q4", value: 95, label: "$1.5M" },
  { row: "Sales", col: "Q1", value: 78, label: "$890K" },
  { row: "Sales", col: "Q2", value: 82, label: "$950K" },
  { row: "Sales", col: "Q3", value: 90, label: "$1.1M" },
  { row: "Sales", col: "Q4", value: 88, label: "$1.0M" },
  { row: "Marketing", col: "Q1", value: 65, label: "$420K" },
  { row: "Marketing", col: "Q2", value: 72, label: "$480K" },
  { row: "Marketing", col: "Q3", value: 68, label: "$450K" },
  { row: "Marketing", col: "Q4", value: 75, label: "$520K" },
  { row: "Operations", col: "Q1", value: 50, label: "$280K" },
  { row: "Operations", col: "Q2", value: 55, label: "$310K" },
  { row: "Operations", col: "Q3", value: 52, label: "$290K" },
  { row: "Operations", col: "Q4", value: 60, label: "$340K" },
];

function getHeatColor(value: number, colorScheme: string = "blue") {
  // Value from 0-100
  const intensity = Math.max(0, Math.min(100, value));
  
  const schemes: Record<string, { light: string; dark: string }> = {
    blue: { light: "239, 84%, 67%", dark: "239, 84%, 35%" },
    green: { light: "160, 84%, 45%", dark: "160, 84%, 25%" },
    red: { light: "0, 84%, 60%", dark: "0, 84%, 35%" },
    amber: { light: "38, 92%, 50%", dark: "38, 92%, 30%" },
  };

  const scheme = schemes[colorScheme] || schemes.blue;
  const opacity = 0.15 + (intensity / 100) * 0.75;

  return `hsla(${scheme.light}, ${opacity})`;
}

function getTextColor(value: number): string {
  return value > 70 ? "text-white" : "text-foreground";
}

export function HeatMapChart({ data = defaultData, config, compact = false }: HeatMapChartProps) {
  const colorScheme = (config.colorScheme as string) || "blue";
  const showValues = (config.showValues as boolean) !== false;
  const showLabels = (config.showLabels as boolean) !== false;

  // Extract unique rows and columns
  const rows = [...new Set(data.map((d) => d.row))];
  const cols = [...new Set(data.map((d) => d.col))];

  // Create a lookup for values
  const valueMap = new Map<string, HeatMapData>();
  data.forEach((d) => {
    valueMap.set(`${d.row}-${d.col}`, d);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-xs font-medium text-muted-foreground text-left"></th>
            {cols.map((col) => (
              <th key={col} className="p-2 text-xs font-medium text-muted-foreground text-center">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td className="p-2 text-xs font-medium text-foreground">{row}</td>
              {cols.map((col) => {
                const cell = valueMap.get(`${row}-${col}`);
                const value = cell?.value || 0;
                const label = cell?.label;

                return (
                  <td
                    key={`${row}-${col}`}
                    className={cn(
                      "p-2 text-center transition-colors",
                      compact ? "min-w-[50px]" : "min-w-[70px]"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-md py-2 px-1",
                        getTextColor(value)
                      )}
                      style={{ backgroundColor: getHeatColor(value, colorScheme) }}
                    >
                      {showLabels && label ? (
                        <span className="text-xs font-medium">{label}</span>
                      ) : showValues ? (
                        <span className="text-xs font-medium">{value}%</span>
                      ) : null}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      {(config.showLegend as boolean) !== false && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xs text-muted-foreground">Low</span>
          <div className="flex h-3 rounded overflow-hidden">
            {[20, 40, 60, 80, 100].map((v) => (
              <div
                key={v}
                className="w-6"
                style={{ backgroundColor: getHeatColor(v, colorScheme) }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      )}
    </div>
  );
}
