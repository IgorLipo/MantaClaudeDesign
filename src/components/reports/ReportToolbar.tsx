import { Eye, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { periodOptions } from "@/data/mockReports";
import { toast } from "sonner";
import { exportToPDF, quickExportCSV } from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReportToolbarProps {
  title: string;
  period: string;
  onTitleChange: (title: string) => void;
  onPeriodChange: (period: string) => void;
  onPreview: () => void;
  moduleCount: number;
}

export function ReportToolbar({
  title,
  period,
  onTitleChange,
  onPeriodChange,
  onPreview,
  moduleCount,
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

  const handleSave = () => {
    toast.success("Report saved!", {
      description: `"${title}" has been saved locally.`,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-border bg-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 max-w-xs"
          placeholder="Report Title"
        />

        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground">
          {moduleCount} {moduleCount === 1 ? "module" : "modules"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV}>
              Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
