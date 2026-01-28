import { Settings } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { exportChartData, exportToPDF } from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const data = [
  { name: 'Payroll', value: 65, color: 'hsl(239, 84%, 67%)' },
  { name: 'Software', value: 20, color: 'hsl(215, 16%, 47%)' },
  { name: 'Other', value: 15, color: 'hsl(160, 84%, 39%)' },
];

export function SpendMixChart() {
  const fixedPercentage = data[0].value + data[1].value;
  
  return (
    <article className="card-elevated h-80 rounded-3xl bg-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-foreground">Spend Mix</h2>
          <p className="text-xs text-muted-foreground">By category</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition">
              <Settings className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => toast.info("Configure Categories", { description: "Category settings would open here." })}>
              Edit Categories
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("View Breakdown", { description: "Detailed spend breakdown would display." })}>
              Full Breakdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportChartData('Spend Mix', data.map(d => ({ label: d.name, value: `${d.value}%` })))}>
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToPDF(
              { title: 'Spend Mix Report', sections: [{ heading: 'Category Breakdown', data: [['Category', 'Percentage'], ...data.map(d => [d.name, `${d.value}%`])] }] },
              { filename: 'spend-mix-report', title: 'Spend Mix Report' }
            )}>
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="relative h-32 w-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-xl font-semibold text-foreground">{fixedPercentage}%</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Fixed</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium text-foreground">{item.value}%</span>
          </div>
        ))}
      </div>
    </article>
  );
}
