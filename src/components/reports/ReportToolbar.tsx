import { Eye, Download, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportDatePicker } from "./ReportDatePicker";
import { toast } from "sonner";
import { exportToPDF, quickExportCSV } from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";

interface ReportToolbarProps {
  title: string;
  period: string;
  dateRange?: DateRange;
  onTitleChange: (title: string) => void;
  onPeriodChange: (period: string) => void;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onPreview: () => void;
  onSave: () => void;
  onClear: () => void;
  moduleCount: number;
  hasUnsavedChanges?: boolean;
}

export function ReportToolbar({
  title,
  period,
  dateRange,
  onTitleChange,
  onPeriodChange,
  onDateRangeChange,
  onPreview,
  onSave,
  onClear,
  moduleCount,
  hasUnsavedChanges,
}: ReportToolbarProps) {
  const handleExportPDF = () => {
    exportToPDF(
      {
        title: title || 'Financial Report',
        sections: [{
          heading: 'Report Summary',
          data: [
            ['Report', 'Period', 'Modules'],
            [title, period, `${moduleCount} modules`]
          ]
        }]
      },
      { filename: `${title.toLowerCase().replace(/\s+/g, '-')}-${period}`, title }
    );
  };

  const handleExportCSV = () => {
    quickExportCSV(
      ['Report Title', 'Period', 'Module Count', 'Generated'],
      [[title, period, `${moduleCount}`, new Date().toISOString()]],
      `${title.toLowerCase().replace(/\s+/g, '-')}-${period}`
    );
  };

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-border bg-card">
      {/* Row 1: Title + Period */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="relative w-full sm:w-auto">
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-base sm:text-lg font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 w-full sm:max-w-xs"
            placeholder="Report Title"
          />
          {hasUnsavedChanges && (
            <Badge variant="outline" className="absolute -top-2 right-0 sm:-right-12 text-xs text-muted-foreground">
              Unsaved
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ReportDatePicker
            period={period}
            onPeriodChange={onPeriodChange}
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full whitespace-nowrap">
            {moduleCount} {moduleCount === 1 ? "module" : "modules"}
          </span>
        </div>
      </div>

      {/* Row 2: Action buttons - stacked on mobile */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear} title="Start fresh" className="h-8 px-2 sm:px-3">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Reset</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onPreview} className="h-8 px-2 sm:px-3">
          <Eye className="h-4 w-4" />
          <span className="ml-1 sm:ml-2">Preview</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onSave} className="h-8 px-2 sm:px-3">
          <Save className="h-4 w-4" />
          <span className="ml-1 sm:ml-2">Save</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 px-2 sm:px-3">
              <Download className="h-4 w-4" />
              <span className="ml-1 sm:ml-2">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover z-50">
            <DropdownMenuItem onClick={handleExportPDF}>
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              toast.success("Excel export", { description: "Coming soon!" });
            }}>
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
