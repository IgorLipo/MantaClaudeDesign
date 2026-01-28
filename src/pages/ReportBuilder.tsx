import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin } from "@dnd-kit/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LayoutTemplate, Keyboard, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleSidebar } from "@/components/reports/ModuleSidebar";
import { ReportCanvas } from "@/components/reports/ReportCanvas";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { ModuleConfigModal } from "@/components/reports/ModuleConfigModal";
import { ReportPreviewModal } from "@/components/reports/ReportPreviewModal";
import { MobileModuleDrawer } from "@/components/reports/MobileModuleDrawer";
import { ReportComparisonView } from "@/components/reports/ReportComparisonView";
import { useReportBuilder } from "@/hooks/useReportBuilder";
import { useKeyboardShortcuts, getShortcutLabel } from "@/hooks/useKeyboardShortcuts";
import { getModuleById, iconMap } from "@/data/mockReports";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ReportBuilder() {
  const {
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
    saveReport,
    clearReport,
    openConfig,
    closeConfig,
    setIsPreviewOpen,
  } = useReportBuilder();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: saveReport,
    onPreview: () => setIsPreviewOpen(true),
    onEscape: () => {
      if (isConfigOpen) closeConfig();
      else if (isPreviewOpen) setIsPreviewOpen(false);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dragging from sidebar (new module)
    const isFromSidebar = active.data.current?.type === "module";

    if (isFromSidebar && over.id === "canvas-droppable") {
      // Add new module
      addModule(active.id as string);
    } else if (!isFromSidebar && over.id !== active.id) {
      // Reorder within canvas
      reorderModules(active.id as string, over.id as string);
    }
  };

  const activeModule = activeId ? getModuleById(activeId) : null;
  const ActiveIcon = activeModule ? iconMap[activeModule.icon] : null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-card">
          <Link to="/reports">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Report Builder</h1>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="text-xs space-y-1">
                <p><kbd className="bg-muted px-1 rounded">{getShortcutLabel("save")}</kbd> Save</p>
                <p><kbd className="bg-muted px-1 rounded">{getShortcutLabel("preview")}</kbd> Preview</p>
                <p><kbd className="bg-muted px-1 rounded">Esc</kbd> Close modal</p>
              </div>
            </TooltipContent>
          </Tooltip>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsComparisonOpen(true)}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Compare
          </Button>
          <Link to="/reports/templates">
            <Button variant="outline" size="sm">
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Templates
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <DndContext
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
              <ModuleSidebar />
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ReportToolbar
                title={report.title}
                period={report.period}
                dateRange={report.dateRange}
                onTitleChange={setTitle}
                onPeriodChange={setPeriod}
                onDateRangeChange={setDateRange}
                onPreview={() => setIsPreviewOpen(true)}
                onSave={saveReport}
                onClear={clearReport}
                moduleCount={report.modules.length}
                hasUnsavedChanges={hasUnsavedChanges}
              />
              <ReportCanvas
                modules={report.modules}
                onConfigure={openConfig}
                onRemove={removeModule}
                onDuplicate={duplicateModule}
              />
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeModule && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-accent bg-card shadow-xl">
                {ActiveIcon && <ActiveIcon className="h-4 w-4 text-accent" />}
                <span className="text-sm font-medium">{activeModule.name}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Mobile Module Drawer */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <MobileModuleDrawer onAddModule={addModule} />
        </div>

        {/* Modals */}
        <ModuleConfigModal
          open={isConfigOpen}
          onOpenChange={closeConfig}
          canvasModule={selectedModule}
          onSave={updateModuleConfig}
        />

        <ReportPreviewModal
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          title={report.title}
          period={report.period}
          modules={report.modules}
        />

        <ReportComparisonView
          open={isComparisonOpen}
          onOpenChange={setIsComparisonOpen}
        />
      </div>
    </TooltipProvider>
  );
}
