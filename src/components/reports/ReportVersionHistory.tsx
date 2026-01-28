import { useState, useEffect } from "react";
import { History, RotateCcw, Clock, Layers, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { toast } from "sonner";
import { ReportState } from "@/hooks/useReportBuilder";

export interface ReportVersion {
  id: string;
  reportId: string;
  title: string;
  moduleCount: number;
  savedAt: string;
  snapshot: ReportState;
}

interface ReportVersionHistoryProps {
  reportId: string;
  currentTitle: string;
  onRestore: (snapshot: ReportState) => void;
  iconOnly?: boolean;
}

// Helper to get version history from sessionStorage
export function getReportVersions(reportId: string): ReportVersion[] {
  const key = `report-versions-${reportId}`;
  const data = sessionStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to save a new version
export function saveReportVersion(report: ReportState): void {
  const key = `report-versions-${report.id}`;
  const existing = getReportVersions(report.id);
  
  const newVersion: ReportVersion = {
    id: `version-${Date.now()}`,
    reportId: report.id,
    title: report.title,
    moduleCount: report.modules.length,
    savedAt: new Date().toISOString(),
    snapshot: { ...report },
  };

  // Keep max 10 versions
  const updated = [newVersion, ...existing].slice(0, 10);
  sessionStorage.setItem(key, JSON.stringify(updated));
}

export function ReportVersionHistory({ reportId, currentTitle, onRestore, iconOnly }: ReportVersionHistoryProps) {
  const [versions, setVersions] = useState<ReportVersion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [restoreVersion, setRestoreVersion] = useState<ReportVersion | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVersions(getReportVersions(reportId));
    }
  }, [isOpen, reportId]);

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
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const handleRestore = () => {
    if (!restoreVersion) return;
    onRestore(restoreVersion.snapshot);
    setRestoreVersion(null);
    setIsOpen(false);
    toast.success("Version restored", {
      description: `Restored to version from ${getRelativeTime(restoreVersion.savedAt)}`,
    });
  };

  const getModuleNames = (snapshot: ReportState) => {
    return snapshot.modules.map((m) => m.moduleId.replace(/-/g, " ")).slice(0, 3);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {iconOnly ? (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <History className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </SheetTitle>
            <SheetDescription>
              View and restore previous versions of "{currentTitle}"
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <History className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No version history</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Versions are created each time you save the report.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2 pr-4">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className="group rounded-lg border border-border bg-card p-3 hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {index === 0 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Latest
                              </Badge>
                            )}
                            <span className="text-sm font-medium text-foreground truncate">
                              {version.title}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getRelativeTime(version.savedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              {version.moduleCount} modules
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setRestoreVersion(version)}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Restore
                        </Button>
                      </div>

                      {/* Expandable details */}
                      <button
                        className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                      >
                        <ChevronRight
                          className={`h-3 w-3 transition-transform ${
                            expandedVersion === version.id ? "rotate-90" : ""
                          }`}
                        />
                        View details
                      </button>

                      {expandedVersion === version.id && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Saved at</span>
                              <span className="text-foreground">
                                {formatDate(version.savedAt)} at {formatTime(version.savedAt)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Period</span>
                              <span className="text-foreground">{version.snapshot.period.toUpperCase()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block mb-1">Modules</span>
                              <div className="flex flex-wrap gap-1">
                                {getModuleNames(version.snapshot).map((name, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] capitalize">
                                    {name}
                                  </Badge>
                                ))}
                                {version.moduleCount > 3 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    +{version.moduleCount - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Restore confirmation dialog */}
      <AlertDialog open={!!restoreVersion} onOpenChange={() => setRestoreVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current report with the version from{" "}
              <strong>{restoreVersion && getRelativeTime(restoreVersion.savedAt)}</strong>.
              Your current changes will be lost unless you save them first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}