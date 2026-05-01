import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS, STATUS_TRANSITIONS } from "@/constants/status";

interface Props {
  currentStatus: string;
  role: string;
  onChange: (newStatus: string) => void;
  disabled?: boolean;
}

export function StatusDropdown({ currentStatus, role, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);

  const available = [...(STATUS_TRANSITIONS[currentStatus] || [])];

  // Scaffolders and owners cannot change status at all
  if (role === "scaffolder" || role === "owner") return null;

  // Engineers: only scheduled→in_progress, in_progress→completed (enforced server-side)
  if (role === "engineer") {
    if (currentStatus === "scheduled") {
      available.length = 0;
      available.push("in_progress");
    } else if (currentStatus === "in_progress") {
      available.length = 0;
      available.push("completed");
    } else {
      return null;
    }
  }

  // Admin: all transitions from STATUS_TRANSITIONS

  if (available.length === 0) return null;

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={currentStatus}
      onValueChange={(v) => {
        if (v !== currentStatus) {
          onChange(v);
        }
        setOpen(false);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px] h-9 text-xs">
        <SelectValue placeholder={STATUS_LABELS[currentStatus] || currentStatus} />
      </SelectTrigger>
      <SelectContent>
        {available.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
