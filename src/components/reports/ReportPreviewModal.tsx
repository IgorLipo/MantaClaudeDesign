import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Printer, FileText, Mail, Share2 } from "lucide-react";
import { CanvasModule, getModuleById, iconMap, periodOptions } from "@/data/mockReports";
import { toast } from "sonner";
import { ModulePreview } from "./ModulePreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  period: string;
  modules: CanvasModule[];
}

export function ReportPreviewModal({
  open,
  onOpenChange,
  title,
  period,
  modules,
}: ReportPreviewModalProps) {
  const periodLabel = periodOptions.find((p) => p.value === period)?.label || period;

  const handleExport = (format: "pdf" | "csv" | "excel") => {
    toast.success(`Report exported as ${format.toUpperCase()}!`, {
      description: `${title} has been downloaded.`,
    });
  };

  const handlePrint = () => {
    toast.info("Opening print dialog...", {
      description: "Your report is ready to print.",
    });
    window.print();
  };

  const handleEmail = () => {
    toast.success("Report shared via email!", {
      description: "Recipients will receive the report shortly.",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-accent" />
              <div>
                <DialogTitle className="text-lg">{title}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {periodLabel} • {modules.length} sections • Generated {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Content - Simulated Document */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="bg-white dark:bg-card rounded-xl shadow-xl max-w-4xl mx-auto print:shadow-none">
            {/* Report Cover Header */}
            <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-8 rounded-t-xl border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-accent font-medium uppercase tracking-wider mb-2">
                    Financial Report
                  </p>
                  <h1 className="text-3xl font-bold text-foreground mb-3">{title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded">{periodLabel}</span>
                    <span>•</span>
                    <span>Generated: {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">FinancePulse</p>
                  <p className="text-xs text-muted-foreground">Confidential</p>
                </div>
              </div>
            </div>

            {/* Table of Contents */}
            {modules.length > 3 && (
              <div className="p-8 border-b border-border">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Contents
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {modules.map((canvasModule, index) => {
                    const module = getModuleById(canvasModule.moduleId);
                    if (!module) return null;
                    const displayTitle = (canvasModule.config.customTitle as string) || module.name;
                    return (
                      <div key={canvasModule.id} className="flex items-center gap-2 text-sm">
                        <span className="text-accent font-medium">{index + 1}.</span>
                        <span className="text-foreground">{displayTitle}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Report Modules */}
            <div className="p-8">
              {modules.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No modules added</p>
                  <p className="text-sm mt-2">Add modules from the sidebar to see them here.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {modules.map((canvasModule, index) => {
                    const module = getModuleById(canvasModule.moduleId);
                    if (!module) return null;

                    const IconComponent = iconMap[module.icon];
                    const displayTitle = (canvasModule.config.customTitle as string) || module.name;
                    const subtitle = canvasModule.config.subtitle as string;

                    return (
                      <section key={canvasModule.id} className="page-break-inside-avoid">
                        {/* Section Header */}
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-accent/10 text-accent text-xs font-bold">
                            {index + 1}
                          </span>
                          {IconComponent && (
                            <IconComponent className="h-5 w-5 text-accent" />
                          )}
                          <div>
                            <h2 className="text-lg font-semibold text-foreground">
                              {displayTitle}
                            </h2>
                            {subtitle && (
                              <p className="text-xs text-muted-foreground">{subtitle}</p>
                            )}
                          </div>
                        </div>

                        {/* Module Content with Live Preview */}
                        <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
                          <ModulePreview module={module} config={canvasModule.config} />
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Report Footer */}
            <div className="px-8 py-6 bg-muted/30 rounded-b-xl border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">FinancePulse</p>
                  <p>Real-Time Finance Analytics Dashboard</p>
                </div>
                <div className="text-right">
                  <p>Generated: {new Date().toLocaleString()}</p>
                  <p>Confidential • Internal Use Only</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
