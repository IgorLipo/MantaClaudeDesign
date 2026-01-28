import { useState } from "react";
import { FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  demoExportPrefs,
  exportFormatOptions,
  pageSizeOptions,
  orientationOptions,
} from "@/data/mockSettings";
import { toast } from "sonner";

export function ExportPreferencesForm() {
  const [prefs, setPrefs] = useState(demoExportPrefs);

  const handleSave = () => {
    toast.success("Export preferences saved!", {
      description: "Changes are not persisted in demo mode.",
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
          <FileOutput className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Export Preferences</h2>
          <p className="text-sm text-muted-foreground">Default settings for report exports</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Default Format */}
        <div className="space-y-3">
          <Label>Default Format</Label>
          <RadioGroup
            value={prefs.format}
            onValueChange={(value: "pdf" | "csv" | "excel") =>
              setPrefs({ ...prefs, format: value })
            }
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            {exportFormatOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`format-${opt.value}`} />
                <Label htmlFor={`format-${opt.value}`} className="font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* PDF Settings */}
        {prefs.format === "pdf" && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
            <h3 className="text-sm font-medium text-foreground">PDF Settings</h3>
            
            {/* Page Size */}
            <div className="space-y-2">
              <Label>Page Size</Label>
              <Select
                value={prefs.pageSize}
                onValueChange={(value: "letter" | "a4") =>
                  setPrefs({ ...prefs, pageSize: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <Label>Orientation</Label>
              <RadioGroup
                value={prefs.orientation}
                onValueChange={(value: "portrait" | "landscape") =>
                  setPrefs({ ...prefs, orientation: value })
                }
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                {orientationOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`orientation-${opt.value}`} />
                    <Label htmlFor={`orientation-${opt.value}`} className="font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Naming Pattern */}
        <div className="space-y-2">
          <Label htmlFor="naming-pattern">File Naming Pattern</Label>
          <Input
            id="naming-pattern"
            value={prefs.namingPattern}
            onChange={(e) => setPrefs({ ...prefs, namingPattern: e.target.value })}
            placeholder="{report_name}_{date}"
          />
          <p className="text-xs text-muted-foreground">
            Available tokens: {"{report_name}"}, {"{date}"}, {"{period}"}
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </div>
    </div>
  );
}
