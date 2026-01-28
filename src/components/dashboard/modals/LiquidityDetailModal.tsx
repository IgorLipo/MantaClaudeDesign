import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, TrendingUp, Clock, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiquidityDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalLiquidity: string;
  monthlyBurn: string;
  runwayMonths: number;
}

const liquidityBreakdown = [
  { name: 'Operating Account', amount: '$2,450,000', percentage: 57 },
  { name: 'Savings Reserve', amount: '$1,200,000', percentage: 28 },
  { name: 'Investment Account', amount: '$450,000', percentage: 10 },
  { name: 'Petty Cash', amount: '$185,102', percentage: 5 },
];

const recentChanges = [
  { description: 'Stripe Revenue Deposit', amount: '+$142,500', type: 'credit' as const },
  { description: 'Payroll Processing', amount: '-$285,000', type: 'debit' as const },
  { description: 'Client Invoice #1089', amount: '+$45,000', type: 'credit' as const },
  { description: 'AWS Monthly Billing', amount: '-$12,450', type: 'debit' as const },
];

export function LiquidityDetailModal({ 
  open, 
  onOpenChange, 
  totalLiquidity,
  monthlyBurn,
  runwayMonths
}: LiquidityDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Liquidity Overview
          </DialogTitle>
          <DialogDescription>Complete cash position and runway analysis</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-primary/10 p-4 text-center">
              <Wallet className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-xs text-muted-foreground">Total Liquidity</p>
              <p className="text-lg font-semibold text-foreground">{totalLiquidity}</p>
            </div>
            <div className="rounded-xl bg-warning/10 p-4 text-center">
              <TrendingUp className="mx-auto mb-2 h-5 w-5 text-warning" />
              <p className="text-xs text-muted-foreground">Monthly Burn</p>
              <p className="text-lg font-semibold text-foreground">{monthlyBurn}</p>
            </div>
            <div className="rounded-xl bg-success/10 p-4 text-center">
              <Clock className="mx-auto mb-2 h-5 w-5 text-success" />
              <p className="text-xs text-muted-foreground">Runway</p>
              <p className="text-lg font-semibold text-foreground">{runwayMonths} mo</p>
            </div>
          </div>

          {/* Runway Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Runway Health</span>
              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                runwayMonths >= 18 ? "bg-success/10 text-success" :
                runwayMonths >= 12 ? "bg-warning/10 text-warning" :
                "bg-destructive/10 text-destructive"
              )}>
                {runwayMonths >= 18 ? 'Healthy' : runwayMonths >= 12 ? 'Adequate' : 'Low'}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  runwayMonths >= 18 ? "bg-success" :
                  runwayMonths >= 12 ? "bg-warning" :
                  "bg-destructive"
                )}
                style={{ width: `${Math.min((runwayMonths / 24) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Target: 24 months runway</p>
          </div>

          {/* Account Breakdown */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Account Breakdown</p>
            </div>
            <div className="space-y-2">
              {liquidityBreakdown.map((account, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-2 w-2 rounded-full bg-primary" 
                      style={{ opacity: 1 - (idx * 0.2) }} 
                    />
                    <span className="text-sm text-foreground">{account.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{account.amount}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right">{account.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Recent Changes</p>
            </div>
            <div className="space-y-2">
              {recentChanges.map((change, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {change.type === 'credit' ? (
                      <ArrowDownRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">{change.description}</span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    change.type === 'credit' ? "text-success" : "text-foreground"
                  )}>
                    {change.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
