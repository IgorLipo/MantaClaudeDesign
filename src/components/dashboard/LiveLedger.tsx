import { Server, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Transaction {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  type: 'credit' | 'debit';
}

interface LiveLedgerProps {
  transactions: Transaction[];
  currentTime?: string;
}

export function LiveLedger({ 
  transactions,
  currentTime = "14:02:45 UTC"
}: LiveLedgerProps) {
  return (
    <div className="card-elevated rounded-3xl bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="pulse-live absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <p className="text-xs font-medium text-muted-foreground">Live Ledger</p>
        </div>
        <p className="text-xs font-medium text-muted-foreground tabular-nums">{currentTime}</p>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <div 
            key={tx.id}
            onClick={() => toast.info(`Transaction: ${tx.vendor}`, { description: `${tx.category} - ${tx.type === 'credit' ? '+' : '-'}$${Math.abs(tx.amount).toLocaleString()}` })}
            className="flex items-center justify-between rounded-xl bg-muted/50 p-3 ring-1 ring-border cursor-pointer hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-accent ring-1 ring-border">
                {tx.category === 'Infrastructure' ? (
                  <Server className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{tx.vendor}</p>
                <p className="text-[10px] text-muted-foreground">{tx.category}</p>
              </div>
            </div>
            <span className={cn(
              "text-xs font-medium",
              tx.type === 'credit' ? "text-success" : "text-foreground"
            )}>
              {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
