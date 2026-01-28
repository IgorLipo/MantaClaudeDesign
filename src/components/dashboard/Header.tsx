import { Wallet, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { exportToPDF } from "@/lib/exportUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  period?: string;
}

export function Header({ period = "Q3 FY2024 Reporting" }: HeaderProps) {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    vendor: '',
    amount: '',
    dueDate: '',
    category: 'software',
  });

  const handleExport = () => {
    exportToPDF(
      {
        title: 'Dashboard Summary',
        sections: [
          {
            heading: 'Key Metrics',
            data: [
              ['Metric', 'Value', 'Status'],
              ['Total Liquidity', '$4,285,102', 'Healthy'],
              ['ARR', '$2.8M', '+24% YoY'],
              ['Gross Margin', '68%', 'Stable'],
              ['LTV:CAC', '4.2x', 'On Track'],
              ['NDR', '112%', 'Strong'],
            ]
          },
          {
            heading: 'Budget Summary',
            data: [
              ['Department', 'Utilization', 'Status'],
              ['Engineering', '92%', 'Near Limit'],
              ['Marketing', '45%', 'Under Budget'],
              ['Sales', '68%', 'On Track'],
              ['Operations', '82%', 'On Track'],
            ]
          }
        ]
      },
      { filename: `dashboard-summary-${new Date().toISOString().split('T')[0]}`, title: 'Finance Pulse Dashboard' }
    );
  };

  const handleCreateInvoice = () => {
    if (!invoiceData.vendor || !invoiceData.amount || !invoiceData.dueDate) {
      toast.error("Missing Fields", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    toast.success("Invoice Created", {
      description: `Invoice for ${invoiceData.vendor} - $${parseFloat(invoiceData.amount).toLocaleString()} has been created.`,
    });
    
    setInvoiceData({ vendor: '', amount: '', dueDate: '', category: 'software' });
    setIsInvoiceModalOpen(false);
  };

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Wallet className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-medium tracking-tight text-foreground">
              Finance<span className="text-muted-foreground">Pulse</span>
            </h1>
            <p className="text-xs text-muted-foreground">{period}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2 shadow-md shadow-primary/10" onClick={() => setIsInvoiceModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </header>

      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Add a new invoice to accounts payable. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vendor">Vendor Name *</Label>
              <Input
                id="vendor"
                placeholder="e.g., Salesforce Enterprise"
                value={invoiceData.vendor}
                onChange={(e) => setInvoiceData({ ...invoiceData, vendor: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 12500"
                value={invoiceData.amount}
                onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={invoiceData.category}
                onValueChange={(value) => setInvoiceData({ ...invoiceData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
