import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, X, Check, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Annotation {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  resolved?: boolean;
}

interface ModuleAnnotationProps {
  annotations: Annotation[];
  onAddAnnotation: (text: string) => void;
  onRemoveAnnotation: (id: string) => void;
  onResolveAnnotation: (id: string) => void;
  compact?: boolean;
}

export function ModuleAnnotation({
  annotations,
  onAddAnnotation,
  onRemoveAnnotation,
  onResolveAnnotation,
  compact = false,
}: ModuleAnnotationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const activeAnnotations = annotations.filter((a) => !a.resolved);
  const hasAnnotations = activeAnnotations.length > 0;

  const handleSubmit = () => {
    if (newNote.trim()) {
      onAddAnnotation(newNote.trim());
      setNewNote("");
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setNewNote("");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 relative",
            hasAnnotations && "text-warning"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          {hasAnnotations && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-warning text-warning-foreground text-[10px] font-bold flex items-center justify-center">
              {activeAnnotations.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-warning" />
              Module Notes
            </h4>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Add Note
              </Button>
            )}
          </div>

          {/* Existing annotations */}
          {annotations.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className={cn(
                    "p-2 rounded-lg border text-xs",
                    annotation.resolved
                      ? "bg-muted/30 border-muted opacity-60"
                      : "bg-warning/10 border-warning/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-foreground", annotation.resolved && "line-through")}>
                      {annotation.text}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {!annotation.resolved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-success hover:text-success"
                          onClick={() => onResolveAnnotation(annotation.id)}
                          title="Mark as resolved"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveAnnotation(annotation.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-[10px] mt-1">
                    {annotation.author} • {new Date(annotation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : !isEditing ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No notes yet. Add one to provide context.
            </p>
          ) : null}

          {/* Add new annotation */}
          {isEditing && (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note about this module..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px] text-sm resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">⌘+Enter to save</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => {
                      setIsEditing(false);
                      setNewNote("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7"
                    onClick={handleSubmit}
                    disabled={!newNote.trim()}
                  >
                    Add Note
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
