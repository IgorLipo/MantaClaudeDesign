import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, GripVertical } from "lucide-react";
import { availableModules, getAllCategories, getModulesByCategory, iconMap, ModuleCategory } from "@/data/mockReports";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MobileModuleDrawerProps {
  onAddModule: (moduleId: string) => void;
}

export function MobileModuleDrawer({ onAddModule }: MobileModuleDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<ModuleCategory[]>(["executive", "financial"]);

  const categories = getAllCategories();

  const toggleCategory = (category: ModuleCategory) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleAddModule = (moduleId: string) => {
    onAddModule(moduleId);
    setIsOpen(false);
  };

  const filteredModules = searchQuery.trim()
    ? availableModules.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Module
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Add Module</SheetTitle>
        </SheetHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[calc(80vh-140px)]">
          {filteredModules ? (
            <div className="space-y-2 pr-4">
              <p className="text-xs text-muted-foreground px-2 py-1">
                {filteredModules.length} result{filteredModules.length !== 1 ? "s" : ""}
              </p>
              {filteredModules.map((module) => {
                const IconComponent = iconMap[module.icon];
                return (
                  <button
                    key={module.id}
                    onClick={() => handleAddModule(module.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-accent hover:bg-accent/5 transition-all text-left"
                  >
                    {IconComponent && <IconComponent className="h-5 w-5 text-accent flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{module.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {categories.map((category) => {
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
                    <CollapsibleContent className="space-y-1 mt-1 ml-2">
                      {modules.map((module) => {
                        const IconComponent = iconMap[module.icon];
                        return (
                          <button
                            key={module.id}
                            onClick={() => handleAddModule(module.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:border-accent hover:bg-accent/5 transition-all text-left"
                          >
                            {IconComponent && <IconComponent className="h-4 w-4 text-accent flex-shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{module.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{module.description}</p>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
