import { ViewMode } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { LayoutList, Calendar, Columns3 } from "lucide-react";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const views: { mode: ViewMode; label: string; icon: typeof LayoutList }[] = [
  { mode: "timeline", label: "Timeline", icon: Calendar },
  { mode: "list", label: "List", icon: LayoutList },
  { mode: "board", label: "Board", icon: Columns3 },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center bg-muted rounded-lg p-1">
      {views.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            value === mode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
