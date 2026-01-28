import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Calendar, DollarSign, Building, Hash, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Invoice {
  id: string;
  vendor: string;
  dueInfo: string;
  invoiceNumber?: string;
  amount: number;
  status: 'pending' | 'scheduled' | 'paid' | 'overdue';
  category: 'software' | 'payroll' | 'services' | 'infrastructure';
}

interface InvoiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'pending':
      return { text: 'Pending Approval', className: 'bg-warning/10 text-warning' };
    case 'scheduled':
      return { text: 'Scheduled', className: 'bg-info/10 text-info' };
    case 'paid':
      return { text: 'Paid', className: 'bg-success/10 text-success' };
    case 'overdue':
      return { text: 'Overdue', className: 'bg-destructive/10 text-destructive' };
    default:
      return { text: 'Unknown', className: 'bg-muted text-muted-foreground' };
  }
}

function getCategoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function InvoiceDetailModal({ 
  open, 
  onOpenChange, 
  invoice 
}: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const statusInfo = getStatusInfo(invoice.status);
  const formattedAmount = `$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const handleApprove = () => {
    toast.success("Invoice Approved", {
      description: `${invoice.invoiceNumber || invoice.vendor} has been approved for payment.`,
    });
    onOpenChange(false);
  };

  const handleSchedule = () => {
    toast.success("Payment Scheduled", {
      description: `Payment for ${invoice.vendor} has been scheduled.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invoice Details
          </DialogTitle>
          <DialogDescription>
            {invoice.invoiceNumber || `Invoice from ${invoice.vendor}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Amount */}
          <div className="flex items-center justify-center rounded-xl bg-muted/50 p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-4xl font-semibold text-foreground">{formattedAmount}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", statusInfo.className)}>
              {statusInfo.text}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="text-sm font-medium text-foreground">{invoice.vendor}</p>
              </div>
            </div>

            {invoice.invoiceNumber && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Invoice Number</p>
                  <p className="text-sm font-mono text-foreground">{invoice.invoiceNumber}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-sm font-medium text-foreground">{invoice.dueInfo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium text-foreground">{getCategoryLabel(invoice.category)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {invoice.status === 'pending' && (
              <>
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Reject
                </Button>
                <Button className="flex-1" onClick={handleApprove}>
                  Approve
                </Button>
              </>
            )}
            {invoice.status === 'scheduled' && (
              <>
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Reschedule
                </Button>
                <Button className="flex-1" onClick={handleSchedule}>
                  Pay Now
                </Button>
              </>
            )}
            {(invoice.status === 'paid' || invoice.status === 'overdue') && (
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
