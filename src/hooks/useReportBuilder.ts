import { useState, useCallback, useEffect } from "react";
import { CanvasModule, getModuleById, demoTemplates } from "@/data/mockReports";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

export interface ReportState {
  id: string;
  title: string;
  period: string;
  dateRange?: DateRange;
  modules: CanvasModule[];
  createdAt: string;
  updatedAt: string;
}

const generateId = () => `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useReportBuilder() {
  const [report, setReport] = useState<ReportState>({
    id: generateId(),
    title: "Untitled Report",
    period: "q3-2026",
    modules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [selectedModule, setSelectedModule] = useState<CanvasModule | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check for template selection or edit report on mount
  useEffect(() => {
    // Check for editing existing report
    const editReportId = sessionStorage.getItem("editReportId");
    if (editReportId) {
      const savedReport = sessionStorage.getItem(`report-${editReportId}`);
      if (savedReport) {
        try {
          const parsed = JSON.parse(savedReport);
          setReport(parsed);
          sessionStorage.removeItem("editReportId");
          return;
        } catch (e) {
          console.error("Failed to load report:", e);
        }
      }
      sessionStorage.removeItem("editReportId");
    }

    // Check for template selection
    const templateData = sessionStorage.getItem("selectedTemplate");
    if (templateData) {
      try {
        const template = JSON.parse(templateData);
        setReport({
          id: generateId(),
          title: template.name,
          period: "q3-2026",
          modules: template.moduleIds.map((moduleId: string) => {
            const module = getModuleById(moduleId);
            return {
              id: `${moduleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              moduleId,
              config: module?.defaultConfig || {},
            };
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        sessionStorage.removeItem("selectedTemplate");
      } catch (e) {
        console.error("Failed to load template:", e);
      }
    }
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (report.modules.length > 0 || report.title !== "Untitled Report") {
      setHasUnsavedChanges(true);
    }
  }, [report.modules, report.title]);

  const addModule = useCallback((moduleId: string) => {
    const module = getModuleById(moduleId);
    if (!module) return;

    const newCanvasModule: CanvasModule = {
      id: `${moduleId}-${Date.now()}`,
      moduleId,
      config: { ...module.defaultConfig },
    };

    setReport((prev) => ({
      ...prev,
      modules: [...prev.modules, newCanvasModule],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const duplicateModule = useCallback((canvasModule: CanvasModule) => {
    const newCanvasModule: CanvasModule = {
      id: `${canvasModule.moduleId}-${Date.now()}`,
      moduleId: canvasModule.moduleId,
      config: { ...canvasModule.config },
    };

    setReport((prev) => {
      const index = prev.modules.findIndex((m) => m.id === canvasModule.id);
      const newModules = [...prev.modules];
      newModules.splice(index + 1, 0, newCanvasModule);
      return { ...prev, modules: newModules, updatedAt: new Date().toISOString() };
    });
    
    toast.success("Module duplicated");
  }, []);

  const removeModule = useCallback((canvasId: string) => {
    setReport((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== canvasId),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const reorderModules = useCallback((activeId: string, overId: string) => {
    setReport((prev) => {
      const oldIndex = prev.modules.findIndex((m) => m.id === activeId);
      const newIndex = prev.modules.findIndex((m) => m.id === overId);

      if (oldIndex === -1 || newIndex === -1) return prev;

      const newModules = [...prev.modules];
      const [removed] = newModules.splice(oldIndex, 1);
      newModules.splice(newIndex, 0, removed);

      return { ...prev, modules: newModules, updatedAt: new Date().toISOString() };
    });
  }, []);

  const updateModuleConfig = useCallback((canvasId: string, config: Record<string, unknown>) => {
    setReport((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === canvasId ? { ...m, config: { ...m.config, ...config } } : m
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setReport((prev) => ({ ...prev, title, updatedAt: new Date().toISOString() }));
  }, []);

  const setPeriod = useCallback((period: string) => {
    setReport((prev) => ({ ...prev, period, updatedAt: new Date().toISOString() }));
  }, []);

  const setDateRange = useCallback((dateRange: DateRange | undefined) => {
    setReport((prev) => ({ ...prev, dateRange, updatedAt: new Date().toISOString() }));
  }, []);

  const loadTemplate = useCallback((moduleIds: string[]) => {
    const modules: CanvasModule[] = moduleIds.map((moduleId) => {
      const module = getModuleById(moduleId);
      return {
        id: `${moduleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        moduleId,
        config: module?.defaultConfig || {},
      };
    });

    setReport((prev) => ({
      ...prev,
      modules,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const saveReport = useCallback(() => {
    // Save report to sessionStorage
    const reportData = { ...report, updatedAt: new Date().toISOString() };
    sessionStorage.setItem(`report-${report.id}`, JSON.stringify(reportData));

    // Save version history
    const { saveReportVersion } = require("@/components/reports/ReportVersionHistory");
    saveReportVersion(reportData);

    // Update saved reports list
    const savedReportsList = sessionStorage.getItem("savedReports");
    let reports: Array<{ id: string; title: string; period: string; moduleCount: number; createdAt: string; updatedAt: string }> = [];
    
    if (savedReportsList) {
      try {
        reports = JSON.parse(savedReportsList);
      } catch {
        reports = [];
      }
    }

    // Check if report already exists
    const existingIndex = reports.findIndex((r) => r.id === report.id);
    const reportSummary = {
      id: report.id,
      title: report.title,
      period: report.period,
      moduleCount: report.modules.length,
      createdAt: report.createdAt,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      reports[existingIndex] = reportSummary;
    } else {
      reports.unshift(reportSummary);
    }

    sessionStorage.setItem("savedReports", JSON.stringify(reports));
    setHasUnsavedChanges(false);

    toast.success("Report saved!", {
      description: `"${report.title}" has been saved to your session.`,
    });
  }, [report]);

  const restoreFromVersion = useCallback((snapshot: ReportState) => {
    setReport({
      ...snapshot,
      updatedAt: new Date().toISOString(),
    });
    setHasUnsavedChanges(true);
  }, []);

  const clearReport = useCallback(() => {
    setReport({
      id: generateId(),
      title: "Untitled Report",
      period: "q3-2026",
      modules: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setHasUnsavedChanges(false);
  }, []);

  const openConfig = useCallback((canvasModule: CanvasModule) => {
    setSelectedModule(canvasModule);
    setIsConfigOpen(true);
  }, []);

  const closeConfig = useCallback(() => {
    setSelectedModule(null);
    setIsConfigOpen(false);
  }, []);

  return {
    report,
    selectedModule,
    isPreviewOpen,
    isConfigOpen,
    hasUnsavedChanges,
    addModule,
    duplicateModule,
    removeModule,
    reorderModules,
    updateModuleConfig,
    setTitle,
    setPeriod,
    setDateRange,
    loadTemplate,
    saveReport,
    clearReport,
    openConfig,
    closeConfig,
    setIsPreviewOpen,
    restoreFromVersion,
  };
}
