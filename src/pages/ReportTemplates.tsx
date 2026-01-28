import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, FileText, LayoutTemplate, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoTemplates, getModuleById, iconMap } from "@/data/mockReports";
import { toast } from "sonner";

export default function ReportTemplates() {
  const navigate = useNavigate();

  const handleUseTemplate = (templateId: string) => {
    const template = demoTemplates.find((t) => t.id === templateId);
    if (template) {
      // Store template selection in sessionStorage for the builder to pick up
      sessionStorage.setItem("selectedTemplate", JSON.stringify(template));
      toast.success(`Template loaded: ${template.name}`, {
        description: "Redirecting to the report builder...",
      });
      navigate("/reports/new");
    }
  };

  const getTemplateModuleIcons = (moduleIds: string[]) => {
    return moduleIds.slice(0, 5).map((id) => {
      const module = getModuleById(id);
      if (!module) return null;
      return iconMap[module.icon];
    }).filter(Boolean);
  };

  const getCategoryBadge = (templateId: string) => {
    const categories: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      board_deck: { label: "Executive", variant: "default" },
      monthly_close: { label: "Accounting", variant: "secondary" },
      investor_update: { label: "Investor Relations", variant: "default" },
      budget_review: { label: "Operations", variant: "secondary" },
      forecast_review: { label: "FP&A", variant: "outline" },
      audit_report: { label: "Compliance", variant: "outline" },
    };
    return categories[templateId] || { label: "General", variant: "secondary" };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card">
        <Link to="/reports">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">Report Templates</h1>
          <p className="text-sm text-muted-foreground">
            Start with a pre-built template or create from scratch
          </p>
        </div>
        <Link to="/reports/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Blank Report
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Featured Templates */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Featured Templates</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoTemplates.map((template) => {
              const Icons = getTemplateModuleIcons(template.moduleIds);
              const category = getCategoryBadge(template.id);

              return (
                <Card 
                  key={template.id} 
                  className="group hover:border-accent/50 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <LayoutTemplate className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant={category.variant} className="mt-1 text-xs">
                            {category.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 line-clamp-2">
                      {template.description}
                    </CardDescription>
                    
                    {/* Module Preview Icons */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-muted-foreground">Includes:</span>
                      <div className="flex items-center -space-x-1">
                        {Icons.map((Icon, idx) => Icon && (
                          <div
                            key={idx}
                            className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center"
                          >
                            <Icon className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ))}
                        {template.moduleIds.length > 5 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                            +{template.moduleIds.length - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      className="w-full group-hover:bg-accent group-hover:text-accent-foreground" 
                      variant="secondary"
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">Or Start Fresh</h2>
          <Card className="border-dashed border-2 hover:border-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Blank Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Start from scratch and build your own custom report
                  </p>
                </div>
              </div>
              <Link to="/reports/new">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blank
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <div className="mt-12 p-6 bg-muted/30 rounded-xl border border-border">
          <h3 className="font-medium text-foreground mb-3">💡 Pro Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Templates pre-populate modules but you can add, remove, or reorder them freely
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Click the settings icon on any module to customize its appearance and data options
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Use the Preview button to see how your report will look when exported
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              AI-powered text modules can auto-generate executive summaries from your data
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
