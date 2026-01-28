import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Settings, Trash2, FileText, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasModule, getModuleById, iconMap } from "@/data/mockReports";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ModulePreview } from "./ModulePreview";
import { ModuleAnnotation, Annotation } from "./ModuleAnnotation";

interface SortableModuleCardProps {
  canvasModule: CanvasModule;
  onConfigure: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  annotations: Annotation[];
  onAddAnnotation: (text: string) => void;
  onRemoveAnnotation: (id: string) => void;
  onResolveAnnotation: (id: string) => void;
}

function SortableModuleCard({ 
  canvasModule, 
  onConfigure, 
  onRemove, 
  onDuplicate,
  annotations,
  onAddAnnotation,
  onRemoveAnnotation,
  onResolveAnnotation,
}: SortableModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const module = getModuleById(canvasModule.moduleId);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: canvasModule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!module) return null;

  const IconComponent = iconMap[module.icon];
  const displayTitle = (canvasModule.config.customTitle as string) || module.name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border border-border bg-card transition-all overflow-hidden",
        isDragging && "opacity-50 shadow-xl z-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-border bg-muted/30">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {IconComponent && <IconComponent className="h-4 w-4 text-accent flex-shrink-0" />}
          <h3 className="text-sm font-medium text-foreground truncate">{displayTitle}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline">
            {module.type}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <ModuleAnnotation
            annotations={annotations}
            onAddAnnotation={onAddAnnotation}
            onRemoveAnnotation={onRemoveAnnotation}
            onResolveAnnotation={onResolveAnnotation}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDuplicate}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={onConfigure}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      {isExpanded && (
        <div className="p-3 sm:p-4 overflow-hidden">
          <ModulePreview module={module} config={canvasModule.config} />
        </div>
      )}
    </div>
  );
}

interface ReportCanvasProps {
  modules: CanvasModule[];
  onConfigure: (module: CanvasModule) => void;
  onRemove: (canvasId: string) => void;
  onDuplicate?: (canvasModule: CanvasModule) => void;
}

// Local state for annotations (in a real app, this would be in a hook or context)
const generateAnnotationId = () => `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function ReportCanvas({ modules, onConfigure, onRemove, onDuplicate }: ReportCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-droppable",
  });

  // Store annotations per module
  const [moduleAnnotations, setModuleAnnotations] = useState<Record<string, Annotation[]>>({});

  const handleDuplicate = (canvasModule: CanvasModule) => {
    if (onDuplicate) {
      onDuplicate(canvasModule);
    } else {
      toast.info("Module duplicated");
    }
  };

  const handleAddAnnotation = useCallback((moduleId: string, text: string) => {
    const newAnnotation: Annotation = {
      id: generateAnnotationId(),
      text,
      author: "You",
      createdAt: new Date().toISOString(),
    };
    setModuleAnnotations((prev) => ({
      ...prev,
      [moduleId]: [...(prev[moduleId] || []), newAnnotation],
    }));
    toast.success("Note added");
  }, []);

  const handleRemoveAnnotation = useCallback((moduleId: string, annotationId: string) => {
    setModuleAnnotations((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] || []).filter((a) => a.id !== annotationId),
    }));
  }, []);

  const handleResolveAnnotation = useCallback((moduleId: string, annotationId: string) => {
    setModuleAnnotations((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] || []).map((a) =>
        a.id === annotationId ? { ...a, resolved: true } : a
      ),
    }));
    toast.success("Note resolved");
  }, []);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 p-4 sm:p-6 overflow-y-auto transition-colors",
        isOver && "bg-accent/5"
      )}
    >
      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-2xl p-6 sm:p-12">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-muted mb-4">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
            Start Building Your Report
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs sm:max-w-sm mb-6">
            Drag modules from the sidebar to add them here. Each module can be configured
            and reordered to create your perfect report.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="bg-muted px-2 py-1 rounded">📊 Charts</span>
            <span className="bg-muted px-2 py-1 rounded">📋 Tables</span>
            <span className="bg-muted px-2 py-1 rounded">📈 KPIs</span>
            <span className="bg-muted px-2 py-1 rounded">📝 Text</span>
          </div>
        </div>
      ) : (
        <SortableContext
          items={modules.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 max-w-4xl mx-auto">
            {modules.map((canvasModule) => (
              <SortableModuleCard
                key={canvasModule.id}
                canvasModule={canvasModule}
                onConfigure={() => onConfigure(canvasModule)}
                onRemove={() => onRemove(canvasModule.id)}
                onDuplicate={() => handleDuplicate(canvasModule)}
                annotations={moduleAnnotations[canvasModule.id] || []}
                onAddAnnotation={(text) => handleAddAnnotation(canvasModule.id, text)}
                onRemoveAnnotation={(id) => handleRemoveAnnotation(canvasModule.id, id)}
                onResolveAnnotation={(id) => handleResolveAnnotation(canvasModule.id, id)}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
