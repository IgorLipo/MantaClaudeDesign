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
import { useState } from "react";
import { toast } from "sonner";
import { ModulePreview } from "./ModulePreview";

interface SortableModuleCardProps {
  canvasModule: CanvasModule;
  onConfigure: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function SortableModuleCard({ canvasModule, onConfigure, onRemove, onDuplicate }: SortableModuleCardProps) {
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
      <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {IconComponent && <IconComponent className="h-4 w-4 text-accent flex-shrink-0" />}
          <h3 className="text-sm font-medium text-foreground truncate">{displayTitle}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
            {module.type}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDuplicate}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onConfigure}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
        <div className="p-4">
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

export function ReportCanvas({ modules, onConfigure, onRemove, onDuplicate }: ReportCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-droppable",
  });

  const handleDuplicate = (canvasModule: CanvasModule) => {
    if (onDuplicate) {
      onDuplicate(canvasModule);
    } else {
      toast.info("Module duplicated");
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 p-6 overflow-y-auto transition-colors",
        isOver && "bg-accent/5"
      )}
    >
      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-border rounded-2xl p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Start Building Your Report
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
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
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
