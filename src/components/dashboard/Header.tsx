import { Wallet, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HeaderProps {
  period?: string;
}

export function Header({ period = "Q3 FY2024 Reporting" }: HeaderProps) {
  const handleExport = () => {
    toast.success("Dashboard exported!", {
      description: "Your dashboard summary has been downloaded as PDF.",
    });
  };

  const handleNewInvoice = () => {
    toast.info("New Invoice", {
      description: "Invoice creation form would open here.",
    });
  };

  return (
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
        <Button size="sm" className="gap-2 shadow-md shadow-primary/10" onClick={handleNewInvoice}>
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>
    </header>
  );
}
