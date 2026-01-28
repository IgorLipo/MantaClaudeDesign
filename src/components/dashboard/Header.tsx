import { Wallet, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { exportToPDF } from "@/lib/exportUtils";
import { useInvoices } from "@/hooks/useInvoices";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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

const invoiceSchema = z.object({
  vendor: z
    .string()
    .trim()
    .min(1, { message: "Vendor name is required" })
    .max(100, { message: "Vendor name must be under 100 characters" }),
  amount: z
    .string()
    .trim()
    .min(1, { message: "Amount is required" })
    .refine(
      (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 && n <= 100_000_000;
      },
      { message: "Amount must be a positive number" }
    ),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Due date is required" }),
  category: z.enum(["software", "payroll", "services", "infrastructure"]),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function Header({ period = "Q3 FY2026 Reporting" }: HeaderProps) {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const { addInvoice } = useInvoices();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      vendor: "",
      amount: "",
      dueDate: "",
      category: "software",
    },
    mode: "onSubmit",
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

  const handleCreateInvoice = form.handleSubmit((values) => {
    const created = addInvoice({
      vendor: values.vendor.trim(),
      amount: Number(values.amount),
      dueDate: values.dueDate,
      category: values.category,
    });

    toast.success("Invoice Created", {
      description: `${created.invoiceNumber} • ${created.vendor} • $${created.amount.toLocaleString()}`,
    });

    form.reset();
    setIsInvoiceModalOpen(false);
  });

  const handleOpenChange = (open: boolean) => {
    setIsInvoiceModalOpen(open);
    if (!open) form.reset();
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

      <Dialog open={isInvoiceModalOpen} onOpenChange={handleOpenChange}>
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
                {...form.register("vendor")}
              />
              {form.formState.errors.vendor && (
                <p className="text-xs text-destructive">{form.formState.errors.vendor.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 12500"
                inputMode="decimal"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate")}
              />
              {form.formState.errors.dueDate && (
                <p className="text-xs text-destructive">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
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
