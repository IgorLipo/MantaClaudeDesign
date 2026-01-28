import * as React from "react";

export type InvoiceStatus = "pending" | "scheduled" | "paid" | "overdue";
export type InvoiceCategory = "software" | "payroll" | "services" | "infrastructure";

export interface Invoice {
  id: string;
  vendor: string;
  dueInfo: string;
  invoiceNumber?: string;
  amount: number;
  status: InvoiceStatus;
  category: InvoiceCategory;
  dueDate: string; // yyyy-mm-dd
  createdAt: string;
}

function formatDueInfo(dueDate: string): { dueInfo: string; status: InvoiceStatus } {
  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(due.getTime())) {
    return { dueInfo: "Due Date Unknown", status: "pending" };
  }

  if (diffDays < 0) return { dueInfo: "Overdue", status: "overdue" };
  if (diffDays === 0) return { dueInfo: "Due Today", status: "pending" };
  if (diffDays === 1) return { dueInfo: "Due Tomorrow", status: "pending" };

  const label = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { dueInfo: label, status: diffDays <= 7 ? "pending" : "scheduled" };
}

const initialInvoices: Invoice[] = [
  {
    id: "1",
    vendor: "Salesforce Enterprise",
    dueDate: "2026-01-29",
    ...formatDueInfo("2026-01-29"),
    invoiceNumber: "#INV-2092",
    amount: 12500,
    category: "software",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    vendor: "Contractor Payouts",
    dueDate: "2026-02-15",
    ...formatDueInfo("2026-02-15"),
    amount: 8450,
    category: "payroll",
    createdAt: new Date().toISOString(),
  },
];

interface InvoicesContextValue {
  invoices: Invoice[];
  addInvoice: (input: {
    vendor: string;
    amount: number;
    dueDate: string;
    category: InvoiceCategory;
  }) => Invoice;
}

const InvoicesContext = React.createContext<InvoicesContextValue | null>(null);

export function InvoicesProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = React.useState<Invoice[]>(initialInvoices);

  const addInvoice: InvoicesContextValue["addInvoice"] = (input) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const invoiceNumber = `#INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const due = formatDueInfo(input.dueDate);

    const created: Invoice = {
      id,
      vendor: input.vendor,
      amount: input.amount,
      dueDate: input.dueDate,
      category: input.category,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      ...due,
    };

    setInvoices((prev) => [created, ...prev]);
    return created;
  };

  const value = React.useMemo(() => ({ invoices, addInvoice }), [invoices]);
  return <InvoicesContext.Provider value={value}>{children}</InvoicesContext.Provider>;
}

export function useInvoices() {
  const ctx = React.useContext(InvoicesContext);
  if (!ctx) throw new Error("useInvoices must be used within InvoicesProvider");
  return ctx;
}
