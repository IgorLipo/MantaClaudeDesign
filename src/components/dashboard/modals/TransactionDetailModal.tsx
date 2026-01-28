import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Server, User, Calendar, Hash, CreditCard, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  type: 'credit' | 'debit';
}

interface TransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function TransactionDetailModal({ 
  open, 
  onOpenChange, 
  transaction 
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const isCredit = transaction.type === 'credit';
  const formattedAmount = `$${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCredit ? (
              <ArrowDownLeft className="h-5 w-5 text-success" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-foreground" />
            )}
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            {isCredit ? 'Incoming payment' : 'Outgoing payment'} from ledger
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Amount */}
          <div className={cn(
            "flex items-center justify-center rounded-xl p-6",
            isCredit ? "bg-success/10" : "bg-muted/50"
          )}>
            <p className={cn(
              "text-4xl font-semibold",
              isCredit ? "text-success" : "text-foreground"
            )}>
              {isCredit ? '+' : '-'}{formattedAmount}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              {transaction.category === 'Infrastructure' ? (
                <Server className="h-5 w-5 text-accent" />
              ) : (
                <User className="h-5 w-5 text-accent" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="text-sm font-medium text-foreground">{transaction.vendor}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium text-foreground">{transaction.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Transaction ID</p>
                <p className="text-sm font-mono text-foreground">TXN-{transaction.id.padStart(6, '0')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Timestamp</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Completed
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
