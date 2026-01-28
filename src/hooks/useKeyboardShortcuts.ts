import { useEffect, useCallback } from "react";
import { toast } from "sonner";

interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onPreview?: () => void;
  onUndo?: () => boolean;
  onRedo?: () => boolean;
  onDelete?: () => void;
  onEscape?: () => void;
  onDuplicate?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey } = event;
    const isMod = ctrlKey || metaKey;

    // Don't trigger if typing in an input
    if (
      document.activeElement?.tagName === "INPUT" ||
      document.activeElement?.tagName === "TEXTAREA" ||
      (document.activeElement as HTMLElement)?.isContentEditable
    ) {
      // Allow Escape in inputs
      if (key === "Escape" && handlers.onEscape) {
        handlers.onEscape();
        return;
      }
      return;
    }

    // Ctrl/Cmd + S - Save
    if (isMod && key === "s") {
      event.preventDefault();
      if (handlers.onSave) {
        handlers.onSave();
        toast.success("Saved!", { duration: 1500 });
      }
      return;
    }

    // Ctrl/Cmd + P - Preview
    if (isMod && key === "p") {
      event.preventDefault();
      handlers.onPreview?.();
      return;
    }

    // Ctrl/Cmd + Z - Undo
    if (isMod && key === "z" && !shiftKey) {
      event.preventDefault();
      const result = handlers.onUndo?.();
      if (result) {
        toast.info("Undo", { duration: 1000 });
      }
      return;
    }

    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
    if ((isMod && shiftKey && key === "z") || (isMod && key === "y")) {
      event.preventDefault();
      const result = handlers.onRedo?.();
      if (result) {
        toast.info("Redo", { duration: 1000 });
      }
      return;
    }

    // Ctrl/Cmd + D - Duplicate
    if (isMod && key === "d") {
      event.preventDefault();
      handlers.onDuplicate?.();
      return;
    }

    // Delete or Backspace - Delete selected
    if (key === "Delete" || key === "Backspace") {
      handlers.onDelete?.();
      return;
    }

    // Escape - Close modals
    if (key === "Escape") {
      handlers.onEscape?.();
      return;
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Display keyboard shortcut hints
export function getShortcutLabel(action: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const mod = isMac ? "⌘" : "Ctrl";

  const shortcuts: Record<string, string> = {
    save: `${mod}+S`,
    preview: `${mod}+P`,
    undo: `${mod}+Z`,
    redo: `${mod}+Shift+Z`,
    duplicate: `${mod}+D`,
    delete: "Del",
  };

  return shortcuts[action] || "";
}
