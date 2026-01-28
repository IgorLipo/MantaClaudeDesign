import { FileCheck, Users, Calendar, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useInvoices, type Invoice } from "@/hooks/useInvoices";

function getStatusBadge(status: Invoice['status']) {
  const styles = {
    pending: 'bg-warning/10 text-warning',
    scheduled: 'bg-muted text-muted-foreground',
    paid: 'bg-success/10 text-success',
    overdue: 'bg-destructive/10 text-destructive'
  };
  
  const labels = {
    pending: 'Pending',
    scheduled: 'Scheduled',
    paid: 'Paid',
    overdue: 'Overdue'
  };
  
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
      styles[status]
    )}>
      {labels[status]}
    </span>
  );
}

function getCategoryIcon(category: Invoice['category']) {
  const icons = {
    software: { icon: FileCheck, bg: 'bg-warning/10', color: 'text-warning' },
    payroll: { icon: Users, bg: 'bg-accent/10', color: 'text-accent' },
    services: { icon: FileCheck, bg: 'bg-info/10', color: 'text-info' },
    infrastructure: { icon: Server, bg: 'bg-success/10', color: 'text-success' },
  };
  
  const { icon: Icon, bg, color } = icons[category];
  
  return (
    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", bg, color)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function AccountsPayable() {
  const { invoices } = useInvoices();

  const handleCalendar = () => {
    toast.info("Payment Calendar", {
      description: "Calendar view of upcoming payments would open here.",
    });
  };

  const handleInvoiceClick = (invoice: Invoice) => {
    toast.info(`Invoice: ${invoice.vendor}`, {
      description: `Invoice details for ${invoice.invoiceNumber || "payment"} - $${invoice.amount.toLocaleString()}`,
    });
  };

  return (
    <article className="card-elevated rounded-3xl bg-card p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-medium tracking-tight text-foreground">Accounts Payable</h2>
          <p className="text-sm text-muted-foreground">{invoices.length} open invoices</p>
        </div>
        <button 
          onClick={handleCalendar}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted text-muted-foreground transition"
        >
          <Calendar className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div 
            key={invoice.id}
            onClick={() => handleInvoiceClick(invoice)}
            className="hover-lift flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition-all cursor-pointer"
          >
            {getCategoryIcon(invoice.category)}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{invoice.vendor}</p>
              <p className="text-xs text-muted-foreground">
                {invoice.dueInfo}{invoice.invoiceNumber ? ` • ${invoice.invoiceNumber}` : ''}
              </p>
            </div>
            
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-foreground tabular-nums">
                ${invoice.amount.toLocaleString()}
              </p>
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
