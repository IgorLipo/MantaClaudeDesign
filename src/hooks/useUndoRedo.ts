import { useCallback, useEffect, useRef } from "react";
import { ReportState } from "@/hooks/useReportBuilder";

interface UseUndoRedoOptions {
  maxHistory?: number;
}

export function useUndoRedo(
  state: ReportState,
  setState: (state: ReportState) => void,
  options: UseUndoRedoOptions = {}
) {
  const { maxHistory = 50 } = options;
  const historyRef = useRef<ReportState[]>([state]);
  const indexRef = useRef(0);
  const isUndoRedoRef = useRef(false);

  // Track state changes
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const history = historyRef.current;
    const currentIndex = indexRef.current;

    // Remove any future states if we're not at the end
    if (currentIndex < history.length - 1) {
      historyRef.current = history.slice(0, currentIndex + 1);
    }

    // Add new state
    historyRef.current.push(state);

    // Limit history size
    if (historyRef.current.length > maxHistory) {
      historyRef.current = historyRef.current.slice(-maxHistory);
    }

    indexRef.current = historyRef.current.length - 1;
  }, [state, maxHistory]);

  const undo = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = indexRef.current;

    if (currentIndex > 0) {
      isUndoRedoRef.current = true;
      indexRef.current = currentIndex - 1;
      setState(history[currentIndex - 1]);
      return true;
    }
    return false;
  }, [setState]);

  const redo = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = indexRef.current;

    if (currentIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      indexRef.current = currentIndex + 1;
      setState(history[currentIndex + 1]);
      return true;
    }
    return false;
  }, [setState]);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  return { undo, redo, canUndo, canRedo };
}
