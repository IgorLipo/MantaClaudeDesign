import { useState, useCallback } from "react";
import { CanvasModule, getModuleById } from "@/data/mockReports";

export interface ReportState {
  title: string;
  period: string;
  modules: CanvasModule[];
}

export function useReportBuilder() {
  const [report, setReport] = useState<ReportState>({
    title: "Untitled Report",
    period: "q3-2024",
    modules: [],
  });

  const [selectedModule, setSelectedModule] = useState<CanvasModule | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

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
      return { ...prev, modules: newModules };
    });
  }, []);

  const removeModule = useCallback((canvasId: string) => {
    setReport((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== canvasId),
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

      return { ...prev, modules: newModules };
    });
  }, []);

  const updateModuleConfig = useCallback((canvasId: string, config: Record<string, unknown>) => {
    setReport((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === canvasId ? { ...m, config: { ...m.config, ...config } } : m
      ),
    }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setReport((prev) => ({ ...prev, title }));
  }, []);

  const setPeriod = useCallback((period: string) => {
    setReport((prev) => ({ ...prev, period }));
  }, []);

  const loadTemplate = useCallback((moduleIds: string[]) => {
    const modules: CanvasModule[] = moduleIds.map((moduleId) => ({
      id: `${moduleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      moduleId,
      config: {},
    }));

    setReport((prev) => ({
      ...prev,
      modules,
    }));
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
    addModule,
    duplicateModule,
    removeModule,
    reorderModules,
    updateModuleConfig,
    setTitle,
    setPeriod,
    loadTemplate,
    openConfig,
    closeConfig,
    setIsPreviewOpen,
  };
}
