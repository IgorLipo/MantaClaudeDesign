import { useState, useEffect } from "react";
import { FileText, Plus, LayoutTemplate, Trash2, Edit, Clock, Calendar, Layers, BarChart3, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoTemplates, getModuleById, iconMap } from "@/data/mockReports";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedReport {
  id: string;
  title: string;
  period: string;
  moduleCount: number;
  createdAt: string;
  updatedAt: string;
}

// Dashboard stats component
function DashboardStats({ reports }: { reports: SavedReport[] }) {
  const totalReports = reports.length;
  const totalModules = reports.reduce((acc, r) => acc + r.moduleCount, 0);
  const recentlyUpdated = reports.filter((r) => {
    const updated = new Date(r.updatedAt);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return updated > dayAgo;
  }).length;

  const stats = [
    { label: "Total Reports", value: totalReports, icon: FileText, color: "text-accent" },
    { label: "Total Modules", value: totalModules, icon: Layers, color: "text-primary" },
    { label: "Updated Today", value: recentlyUpdated, icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Report card component
function ReportCard({
  report,
  onEdit,
  onDelete,
}: {
  report: SavedReport;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      "q1-2026": "Q1 2026",
      "q2-2026": "Q2 2026",
      "q3-2026": "Q3 2026",
      "q4-2026": "Q4 2026",
      "ytd-2026": "YTD 2026",
    };
    return labels[period] || period.toUpperCase();
  };

  return (
    <Card className="group hover:border-accent/50 hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-medium truncate">{report.title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {getRelativeTime(report.updatedAt)}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {getPeriodLabel(report.period)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium text-foreground">{report.moduleCount}</span>
              <span className="text-muted-foreground ml-1">modules</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatDate(report.createdAt)}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Clock className="h-3 w-3" />
          <span>Modified {formatDate(report.updatedAt)} at {formatTime(report.updatedAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(report.id)}
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit Report
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(report.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved reports from sessionStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const reports = sessionStorage.getItem("savedReports");
      if (reports) {
        try {
          setSavedReports(JSON.parse(reports));
        } catch {
          setSavedReports([]);
        }
      }
      setIsLoading(false);
    }, 300); // Brief loading state for polish

    return () => clearTimeout(timer);
  }, []);

  const handleUseTemplate = (templateId: string) => {
    const template = demoTemplates.find((t) => t.id === templateId);
    if (template) {
      sessionStorage.setItem("selectedTemplate", JSON.stringify(template));
      toast.success(`Loading "${template.name}"`, {
        description: "Template modules added to your report.",
      });
      navigate("/reports/new");
    }
  };

  const handleEditReport = (reportId: string) => {
    sessionStorage.setItem("editReportId", reportId);
    navigate("/reports/new");
  };

  const handleDeleteReport = () => {
    if (!deleteId) return;
    const updated = savedReports.filter((r) => r.id !== deleteId);
    setSavedReports(updated);
    sessionStorage.setItem("savedReports", JSON.stringify(updated));
    sessionStorage.removeItem(`report-${deleteId}`);
    toast.success("Report deleted");
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Build, manage, and track your financial reports</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/reports/templates">
              <Button variant="outline" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Templates
              </Button>
            </Link>
            <Link to="/reports/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Stats */}
        {savedReports.length > 0 && <DashboardStats reports={savedReports} />}

        {/* Your Reports Section */}
        {isLoading ? (
          <section className="mb-12">
            <h2 className="text-lg font-medium text-foreground mb-4">Your Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full rounded-lg mb-4" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : savedReports.length > 0 ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">Your Reports</h2>
              <span className="text-sm text-muted-foreground">{savedReports.length} reports</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onEdit={handleEditReport}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Templates Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <LayoutTemplate className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-medium text-foreground">Quick Start Templates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoTemplates.slice(0, 3).map((template) => (
              <Card
                key={template.id}
                className="group cursor-pointer hover:border-accent hover:shadow-md transition-all"
                onClick={() => handleUseTemplate(template.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {template.moduleIds.slice(0, 3).map((moduleId) => {
                      const module = getModuleById(moduleId);
                      if (!module) return null;
                      const IconComponent = iconMap[module.icon];
                      return (
                        <span
                          key={moduleId}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-full text-muted-foreground"
                        >
                          {IconComponent && <IconComponent className="h-3 w-3" />}
                          {module.name}
                        </span>
                      );
                    })}
                    {template.moduleIds.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                        +{template.moduleIds.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link to="/reports/templates">
              <Button variant="ghost" size="sm">
                View all templates →
              </Button>
            </Link>
          </div>
        </section>

        {/* Empty State */}
        {!isLoading && savedReports.length === 0 && (
          <section>
            <h2 className="text-lg font-medium text-foreground mb-4">Your Reports</h2>
            <Card className="border-2 border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-2">No saved reports</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Reports you create will appear here. Save reports to access them later in this session.
                </p>
                <Link to="/reports/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Report
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The report will be permanently removed from your session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
