import { Code, Megaphone, HandCoins, Building, MoreHorizontal, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Department {
  id: string;
  name: string;
  subcategory: string;
  icon: LucideIcon;
  iconColor: string;
  utilization: number;
  spent: string;
  budget: string;
  status: 'on-track' | 'near-limit' | 'under-budget' | 'over-budget';
}

const departments: Department[] = [
  {
    id: 'eng',
    name: 'Engineering',
    subcategory: 'Cloud & Salaries',
    icon: Code,
    iconColor: 'text-accent',
    utilization: 92,
    spent: '$142k',
    budget: '$155k',
    status: 'near-limit'
  },
  {
    id: 'mkt',
    name: 'Marketing',
    subcategory: 'Ad Spend & Events',
    icon: Megaphone,
    iconColor: 'text-chart-pink',
    utilization: 45,
    spent: '$45k',
    budget: '$100k',
    status: 'under-budget'
  },
  {
    id: 'sales',
    name: 'Sales',
    subcategory: 'Commissions & Travel',
    icon: HandCoins,
    iconColor: 'text-success',
    utilization: 68,
    spent: '$88k',
    budget: '$130k',
    status: 'on-track'
  },
  {
    id: 'ops',
    name: 'Operations',
    subcategory: 'Rent & Office',
    icon: Building,
    iconColor: 'text-info',
    utilization: 82,
    spent: '$24k',
    budget: '$30k',
    status: 'on-track'
  }
];

const filters = ['All Depts', 'Engineering', 'Marketing', 'G&A'];

function getStatusLabel(status: Department['status']): { text: string; className: string } {
  switch (status) {
    case 'near-limit':
      return { text: 'Near Limit', className: 'text-warning' };
    case 'under-budget':
      return { text: 'Under Budget', className: 'text-success' };
    case 'over-budget':
      return { text: 'Over Budget', className: 'text-destructive' };
    default:
      return { text: 'On Track', className: 'text-muted-foreground' };
  }
}

function getProgressColor(status: Department['status']): string {
  switch (status) {
    case 'near-limit':
      return 'bg-warning';
    case 'under-budget':
      return 'bg-success';
    case 'over-budget':
      return 'bg-destructive';
    default:
      return 'bg-accent';
  }
}

export function BudgetUtilization() {
  const [activeFilter, setActiveFilter] = useState('All Depts');

  return (
    <article className="card-elevated flex h-[580px] flex-col rounded-3xl bg-card p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-medium tracking-tight text-foreground">Budget Utilization</h2>
          <p className="text-xs text-muted-foreground">Departmental breakdown for October</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => toast.info("Budget Export", { description: "Downloading budget report as CSV..." })}>
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Budget Settings", { description: "Budget configuration would open here." })}>
              Configure Budgets
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("View History", { description: "Historical budget data would display here." })}>
              View History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeFilter === filter
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Department List */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {departments.map((dept) => {
          const Icon = dept.icon;
          const statusInfo = getStatusLabel(dept.status);
          
          return (
            <div 
              key={dept.id}
              className="hover-lift rounded-2xl border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-sm ring-1 ring-border",
                    dept.iconColor
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">{dept.subcategory}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{dept.utilization}%</p>
                </div>
              </div>
              
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-700", getProgressColor(dept.status))}
                  style={{ width: `${dept.utilization}%` }}
                />
              </div>
              
              <div className="mt-2 flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">{dept.spent} / {dept.budget}</span>
                <span className={statusInfo.className}>{statusInfo.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
