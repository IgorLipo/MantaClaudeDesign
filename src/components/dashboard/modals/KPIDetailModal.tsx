import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Minus, Calendar, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  trend?: {
    direction: 'up' | 'stable' | 'down';
    value?: string;
    label?: string;
  };
  progress?: number;
}

const historicalData = [
  { period: 'Q1 2024', value: '-', change: '-' },
  { period: 'Q2 2024', value: '-', change: '-' },
  { period: 'Q3 2024', value: '-', change: '-' },
  { period: 'Q4 2024', value: '-', change: '-' },
];

const kpiDetails: Record<string, { description: string; target: string; history: typeof historicalData }> = {
  'ARR': {
    description: 'Annual Recurring Revenue represents predictable revenue from subscriptions.',
    target: '$3.2M by EOY',
    history: [
      { period: 'Q1 2024', value: '$2.1M', change: '+8%' },
      { period: 'Q2 2024', value: '$2.4M', change: '+14%' },
      { period: 'Q3 2024', value: '$2.8M', change: '+17%' },
      { period: 'Q4 2024 (Proj)', value: '$3.1M', change: '+11%' },
    ],
  },
  'Gross Margin': {
    description: 'Revenue remaining after deducting direct costs of goods sold.',
    target: '80% by Q4',
    history: [
      { period: 'Q1 2024', value: '74%', change: '-' },
      { period: 'Q2 2024', value: '76%', change: '+2pp' },
      { period: 'Q3 2024', value: '78%', change: '+2pp' },
      { period: 'Q4 2024 (Proj)', value: '80%', change: '+2pp' },
    ],
  },
  'LTV:CAC': {
    description: 'Lifetime Value to Customer Acquisition Cost ratio measures unit economics.',
    target: '5.0x by 2025',
    history: [
      { period: 'Q1 2024', value: '3.2x', change: '-' },
      { period: 'Q2 2024', value: '3.6x', change: '+0.4x' },
      { period: 'Q3 2024', value: '4.1x', change: '+0.5x' },
      { period: 'Q4 2024 (Proj)', value: '4.5x', change: '+0.4x' },
    ],
  },
  'NDR': {
    description: 'Net Dollar Retention measures revenue expansion from existing customers.',
    target: '120% target',
    history: [
      { period: 'Q1 2024', value: '108%', change: '-' },
      { period: 'Q2 2024', value: '110%', change: '+2pp' },
      { period: 'Q3 2024', value: '114%', change: '+4pp' },
      { period: 'Q4 2024 (Proj)', value: '118%', change: '+4pp' },
    ],
  },
};

export function KPIDetailModal({ 
  open, 
  onOpenChange, 
  title, 
  value, 
  trend, 
  progress 
}: KPIDetailModalProps) {
  const details = kpiDetails[title] || {
    description: 'Key performance indicator for business health.',
    target: 'See dashboard for targets',
    history: historicalData,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {title} Details
          </DialogTitle>
          <DialogDescription>{details.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Current Value */}
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-3xl font-semibold text-foreground">{value}</p>
            </div>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-1.5",
                trend.direction === 'up' ? "bg-success/10 text-success" :
                trend.direction === 'down' ? "bg-destructive/10 text-destructive" :
                "bg-muted text-muted-foreground"
              )}>
                {trend.direction === 'up' && <TrendingUp className="h-4 w-4" />}
                {trend.direction === 'down' && <TrendingDown className="h-4 w-4" />}
                {trend.direction === 'stable' && <Minus className="h-4 w-4" />}
                <span className="text-sm font-medium">{trend.value || 'Stable'}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {progress !== undefined && (
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to Target</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    progress >= 100 ? "bg-success" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Target */}
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-sm font-medium text-foreground">{details.target}</p>
            </div>
          </div>

          {/* Historical Data */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Historical Trend</p>
            </div>
            <div className="space-y-2">
              {details.history.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">{item.period}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                    <span className={cn(
                      "text-xs",
                      item.change.startsWith('+') ? "text-success" : "text-muted-foreground"
                    )}>{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
