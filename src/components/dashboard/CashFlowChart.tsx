import { MoreHorizontal } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { toast } from "sonner";
import { exportChartData, exportToPDF } from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const data = [
  { month: 'May', value: 1.8 },
  { month: 'Jun', value: 2.1 },
  { month: 'Jul', value: 2.05 },
  { month: 'Aug', value: 2.4 },
  { month: 'Sep', value: 2.8 },
  { month: 'Oct', value: 3.2 },
];

export function CashFlowChart() {
  return (
    <article className="glass-dark h-80 overflow-hidden rounded-3xl p-6 shadow-dark">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-primary-foreground">Operating Cash</h2>
          <p className="text-xs text-primary-foreground/60">Trailing 6 months</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-primary-foreground/60 hover:text-primary-foreground transition">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => exportChartData('Operating Cash Flow', data.map(d => ({ label: d.month, value: `$${d.value}M` })))}>
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToPDF(
              { title: 'Operating Cash Flow Report', sections: [{ heading: 'Monthly Cash Flow', data: [['Month', 'Value'], ...data.map(d => [d.month, `$${d.value}M`])] }] },
              { filename: 'cash-flow-report', title: 'Cash Flow Report' }
            )}>
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("View Forecast", { description: "12-month cash forecast would display here." })}>
              View Forecast
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Full Report", { description: "Opening detailed cash flow report..." })}>
              Full Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 10 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 10 }}
              tickFormatter={(value) => `$${value}M`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(217, 33%, 17%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`$${value}M`, 'Cash Flow']}
              labelStyle={{ color: 'hsl(215, 20%, 65%)' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(160, 84%, 39%)"
              strokeWidth={2}
              fill="url(#cashGradient)"
              dot={{ fill: 'hsl(222, 47%, 11%)', stroke: 'hsl(160, 84%, 39%)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 flex items-center gap-2 text-xs text-primary-foreground/60">
        <div className="h-2 w-2 rounded-full bg-success" />
        <span>Positive Trend</span>
      </div>
    </article>
  );
}
