import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Code, Megaphone, HandCoins, Building, Calendar, TrendingUp, DollarSign, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: {
    id: string;
    name: string;
    subcategory: string;
    icon: LucideIcon;
    iconColor: string;
    utilization: number;
    spent: string;
    budget: string;
    status: 'on-track' | 'near-limit' | 'under-budget' | 'over-budget';
  } | null;
}

const departmentBreakdowns: Record<string, { items: { name: string; amount: string; percentage: number }[]; monthlyTrend: { month: string; spent: number }[] }> = {
  'eng': {
    items: [
      { name: 'AWS/GCP Cloud', amount: '$62,000', percentage: 44 },
      { name: 'Developer Salaries', amount: '$55,000', percentage: 39 },
      { name: 'Software Licenses', amount: '$15,000', percentage: 11 },
      { name: 'Equipment', amount: '$10,000', percentage: 6 },
    ],
    monthlyTrend: [
      { month: 'Jul', spent: 128000 },
      { month: 'Aug', spent: 135000 },
      { month: 'Sep', spent: 138000 },
      { month: 'Oct', spent: 142000 },
    ],
  },
  'mkt': {
    items: [
      { name: 'Digital Ads', amount: '$22,000', percentage: 49 },
      { name: 'Events & Conferences', amount: '$12,000', percentage: 27 },
      { name: 'Content Production', amount: '$7,000', percentage: 16 },
      { name: 'Tools & Analytics', amount: '$4,000', percentage: 8 },
    ],
    monthlyTrend: [
      { month: 'Jul', spent: 52000 },
      { month: 'Aug', spent: 48000 },
      { month: 'Sep', spent: 42000 },
      { month: 'Oct', spent: 45000 },
    ],
  },
  'sales': {
    items: [
      { name: 'Commissions', amount: '$45,000', percentage: 51 },
      { name: 'Travel & Entertainment', amount: '$22,000', percentage: 25 },
      { name: 'CRM & Tools', amount: '$12,000', percentage: 14 },
      { name: 'Training', amount: '$9,000', percentage: 10 },
    ],
    monthlyTrend: [
      { month: 'Jul', spent: 78000 },
      { month: 'Aug', spent: 82000 },
      { month: 'Sep', spent: 85000 },
      { month: 'Oct', spent: 88000 },
    ],
  },
  'ops': {
    items: [
      { name: 'Office Rent', amount: '$12,000', percentage: 50 },
      { name: 'Utilities', amount: '$4,500', percentage: 19 },
      { name: 'Office Supplies', amount: '$3,500', percentage: 15 },
      { name: 'Insurance', amount: '$4,000', percentage: 16 },
    ],
    monthlyTrend: [
      { month: 'Jul', spent: 23000 },
      { month: 'Aug', spent: 23500 },
      { month: 'Sep', spent: 24000 },
      { month: 'Oct', spent: 24000 },
    ],
  },
};

function getStatusLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'near-limit':
      return { text: 'Near Limit', className: 'bg-warning/10 text-warning' };
    case 'under-budget':
      return { text: 'Under Budget', className: 'bg-success/10 text-success' };
    case 'over-budget':
      return { text: 'Over Budget', className: 'bg-destructive/10 text-destructive' };
    default:
      return { text: 'On Track', className: 'bg-primary/10 text-primary' };
  }
}

export function DepartmentDetailModal({ 
  open, 
  onOpenChange, 
  department 
}: DepartmentDetailModalProps) {
  if (!department) return null;

  const breakdown = departmentBreakdowns[department.id] || {
    items: [],
    monthlyTrend: [],
  };

  const statusInfo = getStatusLabel(department.status);
  const Icon = department.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg bg-muted",
              department.iconColor
            )}>
              <Icon className="h-5 w-5" />
            </div>
            {department.name} Budget
          </DialogTitle>
          <DialogDescription>{department.subcategory}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-xl font-semibold text-foreground">{department.spent}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-xl font-semibold text-foreground">{department.budget}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">Utilization</p>
              <p className="text-xl font-semibold text-foreground">{department.utilization}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Budget Progress</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusInfo.className)}>
                {statusInfo.text}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  department.status === 'near-limit' ? 'bg-warning' :
                  department.status === 'under-budget' ? 'bg-success' :
                  department.status === 'over-budget' ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${Math.min(department.utilization, 100)}%` }}
              />
            </div>
          </div>

          {/* Spend Breakdown */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Spend Breakdown</p>
            </div>
            <div className="space-y-2">
              {breakdown.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" style={{ opacity: 1 - (idx * 0.2) }} />
                    <span className="text-sm text-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{item.amount}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Monthly Spend</p>
            </div>
            <div className="flex items-end justify-between gap-2 h-20 px-2">
              {breakdown.monthlyTrend.map((item, idx) => {
                const maxSpent = Math.max(...breakdown.monthlyTrend.map(t => t.spent));
                const height = (item.spent / maxSpent) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                    <div 
                      className="w-full rounded-t bg-primary/80 transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
