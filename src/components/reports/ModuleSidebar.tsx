import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  availableModules, 
  getModulesByCategory,
  getAllCategories,
  iconMap, 
  ModuleCategory,
  ReportModule 
} from "@/data/mockReports";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

interface DraggableModuleProps {
  module: ReportModule;
}

function DraggableModule({ module }: DraggableModuleProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: module.id,
    data: { type: "module", moduleId: module.id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const IconComponent = iconMap[module.icon];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-grab transition-all",
        "hover:border-accent hover:shadow-sm",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      {IconComponent && <IconComponent className="h-4 w-4 text-accent flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{module.name}</p>
        <p className="text-xs text-muted-foreground truncate">{module.description}</p>
      </div>
    </div>
  );
}

export function ModuleSidebar() {
  const categories = getAllCategories();
  const [openCategories, setOpenCategories] = useState<ModuleCategory[]>(["executive", "financial"]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCategory = (category: ModuleCategory) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const filteredModules = searchQuery.trim()
    ? availableModules.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <aside className="w-80 flex-shrink-0 border-r border-border bg-muted/30 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-1">Module Library</h2>
        <p className="text-xs text-muted-foreground mb-3">Drag modules to build your report</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredModules ? (
          // Search results
          <div className="space-y-2 px-1">
            <p className="text-xs text-muted-foreground px-2 py-1">
              {filteredModules.length} result{filteredModules.length !== 1 ? "s" : ""}
            </p>
            {filteredModules.map((module) => (
              <DraggableModule key={module.id} module={module} />
            ))}
            {filteredModules.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No modules match your search.
              </p>
            )}
          </div>
        ) : (
          // Categorized view
          categories.map((category) => {
            const isOpen = openCategories.includes(category.id);
            const modules = getModulesByCategory(category.id);
            const CategoryIcon = iconMap[category.icon];

            return (
              <Collapsible
                key={category.id}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    {CategoryIcon && <CategoryIcon className="h-4 w-4 text-muted-foreground" />}
                    <span>{category.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {modules.length}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 px-1">
                  {modules.map((module) => (
                    <DraggableModule key={module.id} module={module} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-border bg-muted/50">
        <p className="text-xs text-muted-foreground text-center">
          {availableModules.length} modules available
        </p>
      </div>
    </aside>
  );
}
