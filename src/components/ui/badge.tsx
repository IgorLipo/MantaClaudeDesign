import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-quick ease-quick focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary-emphasis",
        secondary: "border-transparent bg-subtle text-subtle-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-border text-foreground",
        soft: "border-transparent bg-primary-soft text-primary",
        pending:   "border-transparent bg-status-pending-soft text-status-pending",
        scheduled: "border-transparent bg-status-scheduled-soft text-status-scheduled",
        active:    "border-transparent bg-status-active-soft text-status-active",
        complete:  "border-transparent bg-status-complete-soft text-status-complete",
        cancelled: "border-transparent bg-status-cancelled-soft text-status-cancelled",
        draft:     "border-transparent bg-status-cancelled-soft/50 text-status-cancelled",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
