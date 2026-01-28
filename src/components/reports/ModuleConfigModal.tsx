import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CanvasModule, getModuleById, iconMap } from "@/data/mockReports";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface ModuleConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasModule: CanvasModule | null;
  onSave: (canvasId: string, config: Record<string, unknown>) => void;
}

export function ModuleConfigModal({
  open,
  onOpenChange,
  canvasModule,
  onSave,
}: ModuleConfigModalProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (canvasModule) {
      const module = getModuleById(canvasModule.moduleId);
      // Merge default config with saved config
      setConfig({ ...module?.defaultConfig, ...canvasModule.config });
    }
  }, [canvasModule]);

  if (!canvasModule) return null;

  const module = getModuleById(canvasModule.moduleId);
  if (!module) return null;

  const IconComponent = iconMap[module.icon];

  const handleSave = () => {
    onSave(canvasModule.id, config);
    onOpenChange(false);
    toast.success("Module configured", {
      description: `${module.name} settings have been updated.`,
    });
  };

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {IconComponent && <IconComponent className="h-5 w-5 text-accent" />}
            Configure: {module.name}
          </DialogTitle>
          <DialogDescription>
            Customize how this module appears in your report.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="display" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="data">Data Options</TabsTrigger>
          </TabsList>

          <TabsContent value="display" className="space-y-4 mt-4">
            {/* Common options for all module types */}
            <div className="space-y-2">
              <Label htmlFor="custom-title">Custom Title</Label>
              <Input
                id="custom-title"
                placeholder={module.name}
                value={(config.customTitle as string) || ""}
                onChange={(e) => updateConfig("customTitle", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default title
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (optional)</Label>
              <Input
                id="subtitle"
                placeholder="e.g., 'As of October 2026'"
                value={(config.subtitle as string) || ""}
                onChange={(e) => updateConfig("subtitle", e.target.value)}
              />
            </div>

            {/* Chart-specific options */}
            {module.type === "chart" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select
                    value={(config.chartType as string) || "bar"}
                    onValueChange={(value) => updateConfig("chartType", value)}
                  >
                    <SelectTrigger id="chart-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="donut">Donut Chart</SelectItem>
                      <SelectItem value="waterfall">Waterfall Chart</SelectItem>
                      <SelectItem value="combo">Combo Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color-scheme">Color Scheme</Label>
                  <Select
                    value={(config.colorScheme as string) || "default"}
                    onValueChange={(value) => updateConfig("colorScheme", value)}
                  >
                    <SelectTrigger id="color-scheme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="financial">Financial (Green/Red)</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="vibrant">Vibrant</SelectItem>
                      <SelectItem value="monochrome">Monochrome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-legend">Show Legend</Label>
                  <Switch
                    id="show-legend"
                    checked={(config.showLegend as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("showLegend", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-labels">Show Data Labels</Label>
                  <Switch
                    id="show-labels"
                    checked={(config.showLabels as boolean) ?? false}
                    onCheckedChange={(checked) => updateConfig("showLabels", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-grid">Show Grid Lines</Label>
                  <Switch
                    id="show-grid"
                    checked={(config.showGrid as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("showGrid", checked)}
                  />
                </div>
              </>
            )}

            {/* Table-specific options */}
            {module.type === "table" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rows-per-page">Rows to Display</Label>
                  <Select
                    value={String((config.rowsPerPage as number) || 10)}
                    onValueChange={(value) => updateConfig("rowsPerPage", parseInt(value))}
                  >
                    <SelectTrigger id="rows-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 rows</SelectItem>
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="15">15 rows</SelectItem>
                      <SelectItem value="25">25 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-totals">Show Totals Row</Label>
                  <Switch
                    id="show-totals"
                    checked={(config.showTotals as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("showTotals", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="striped-rows">Striped Rows</Label>
                  <Switch
                    id="striped-rows"
                    checked={(config.stripedRows as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("stripedRows", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="highlight-negative">Highlight Negative Values</Label>
                  <Switch
                    id="highlight-negative"
                    checked={(config.highlightNegative as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("highlightNegative", checked)}
                  />
                </div>
              </>
            )}

            {/* KPI/Metric-specific options */}
            {(module.type === "metric" || module.type === "kpi") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="layout">Layout Style</Label>
                  <Select
                    value={(config.layout as string) || "grid"}
                    onValueChange={(value) => updateConfig("layout", value)}
                  >
                    <SelectTrigger id="layout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid (2-4 columns)</SelectItem>
                      <SelectItem value="horizontal">Horizontal Row</SelectItem>
                      <SelectItem value="vertical">Vertical Stack</SelectItem>
                      <SelectItem value="cards">Cards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Grid Columns</Label>
                    <span className="text-sm text-muted-foreground">
                      {(config.columns as number) || 4}
                    </span>
                  </div>
                  <Slider
                    value={[(config.columns as number) || 4]}
                    min={2}
                    max={6}
                    step={1}
                    onValueChange={([value]) => updateConfig("columns", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-trend">Show Trend Indicators</Label>
                  <Switch
                    id="show-trend"
                    checked={(config.showTrend as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("showTrend", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-target">Show Target Progress</Label>
                  <Switch
                    id="show-target"
                    checked={(config.showTarget as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("showTarget", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-sparklines">Show Sparklines</Label>
                  <Switch
                    id="show-sparklines"
                    checked={(config.showSparklines as boolean) ?? false}
                    onCheckedChange={(checked) => updateConfig("showSparklines", checked)}
                  />
                </div>
              </>
            )}

            {/* Text-specific options */}
            {module.type === "text" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="use-ai">AI-Generated Content</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Auto-generate summary from report data
                    </p>
                  </div>
                  <Switch
                    id="use-ai"
                    checked={(config.useAI as boolean) ?? false}
                    onCheckedChange={(checked) => updateConfig("useAI", checked)}
                  />
                </div>

                {(config.useAI as boolean) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="tone">Writing Tone</Label>
                      <Select
                        value={(config.tone as string) || "professional"}
                        onValueChange={(value) => updateConfig("tone", value)}
                      >
                        <SelectTrigger id="tone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="executive">Executive Brief</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="length">Content Length</Label>
                      <Select
                        value={(config.length as string) || "medium"}
                        onValueChange={(value) => updateConfig("length", value)}
                      >
                        <SelectTrigger id="length">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short (1-2 paragraphs)</SelectItem>
                          <SelectItem value="medium">Medium (3-4 paragraphs)</SelectItem>
                          <SelectItem value="long">Long (5+ paragraphs)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {!(config.useAI as boolean) && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-text">Custom Content</Label>
                    <Textarea
                      id="custom-text"
                      placeholder="Enter your text content..."
                      value={(config.customText as string) || ""}
                      onChange={(e) => updateConfig("customText", e.target.value)}
                      rows={6}
                    />
                  </div>
                )}
              </>
            )}

            {/* Comparison-specific options */}
            {module.type === "comparison" && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="highlight-best">Highlight Best Values</Label>
                  <Switch
                    id="highlight-best"
                    checked={(config.highlightBest as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("highlightBest", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-variance">Show Variance Column</Label>
                  <Switch
                    id="show-variance"
                    checked={(config.showVariance as boolean) ?? true}
                    onCheckedChange={(checked) => updateConfig("showVariance", checked)}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-4">
            {/* Data source and filtering options */}
            <div className="space-y-2">
              <Label htmlFor="comparison-period">Comparison Period</Label>
              <Select
                value={(config.comparisonPeriod as string) || "prior_period"}
                onValueChange={(value) => updateConfig("comparisonPeriod", value)}
              >
                <SelectTrigger id="comparison-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prior_period">Prior Period</SelectItem>
                  <SelectItem value="prior_quarter">Prior Quarter</SelectItem>
                  <SelectItem value="prior_year">Prior Year (YoY)</SelectItem>
                  <SelectItem value="budget">vs Budget</SelectItem>
                  <SelectItem value="forecast">vs Forecast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-comparison">Show Comparison</Label>
              <Switch
                id="show-comparison"
                checked={(config.showComparison as boolean) ?? true}
                onCheckedChange={(checked) => updateConfig("showComparison", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-percentages">Show Percentages</Label>
              <Switch
                id="show-percentages"
                checked={(config.showPercentages as boolean) ?? true}
                onCheckedChange={(checked) => updateConfig("showPercentages", checked)}
              />
            </div>

            {(module.type === "chart" || module.type === "table") && (
              <div className="space-y-2">
                <Label htmlFor="sort-by">Sort By</Label>
                <Select
                  value={(config.sortBy as string) || "default"}
                  onValueChange={(value) => updateConfig("sortBy", value)}
                >
                  <SelectTrigger id="sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Order</SelectItem>
                    <SelectItem value="value_asc">Value (Low to High)</SelectItem>
                    <SelectItem value="value_desc">Value (High to Low)</SelectItem>
                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="number-format">Number Format</Label>
              <Select
                value={(config.numberFormat as string) || "abbreviated"}
                onValueChange={(value) => updateConfig("numberFormat", value)}
              >
                <SelectTrigger id="number-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full ($1,234,567)</SelectItem>
                  <SelectItem value="abbreviated">Abbreviated ($1.2M)</SelectItem>
                  <SelectItem value="compact">Compact (1.2M)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimal-places">Decimal Places</Label>
              <Select
                value={String((config.decimalPlaces as number) ?? 1)}
                onValueChange={(value) => updateConfig("decimalPlaces", parseInt(value))}
              >
                <SelectTrigger id="decimal-places">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None (1,234)</SelectItem>
                  <SelectItem value="1">One (1,234.5)</SelectItem>
                  <SelectItem value="2">Two (1,234.56)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
