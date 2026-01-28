import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Clock, FileText, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  initials: string;
  name: string;
  action: string;
  timeAgo: string;
  highlight?: boolean;
}

interface ActivityDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
}

const activityDetails: Record<string, { description: string; details: string[]; relatedItems: string[] }> = {
  '1': {
    description: 'Approved a budget increase request for Q4 engineering initiatives.',
    details: [
      'Increased Engineering budget by $15,000',
      'Approved for cloud infrastructure scaling',
      'Effective immediately',
    ],
    relatedItems: ['ENG-2026-Q4-001', 'Budget Request #1842'],
  },
  '2': {
    description: 'Generated and exported the Q3 Profit & Loss statement.',
    details: [
      'Report period: Jul 1 - Sep 30, 2026',
      'Format: PDF with detailed breakdown',
      'Shared with: Finance Team, Board',
    ],
    relatedItems: ['RPT-Q3-2026-PL', 'FIN-EXPORT-2026'],
  },
  '3': {
    description: 'Completed reconciliation of all Stripe payment transactions.',
    details: [
      'Reconciled 847 transactions',
      'Total volume: $1.2M',
      'Discrepancies resolved: 3',
    ],
    relatedItems: ['STRIPE-RECON-OCT', 'PAY-2026-10'],
  },
};

export function ActivityDetailModal({ 
  open, 
  onOpenChange, 
  activity 
}: ActivityDetailModalProps) {
  if (!activity) return null;

  const details = activityDetails[activity.id] || {
    description: 'Activity details are being processed.',
    details: [],
    relatedItems: [],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Activity Details
          </DialogTitle>
          <DialogDescription>Audit trail information</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* User Info */}
          <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full font-semibold",
              activity.highlight 
                ? "bg-accent/10 text-accent" 
                : "bg-primary/10 text-primary"
            )}>
              {activity.initials}
            </div>
            <div>
              <p className="font-medium text-foreground">{activity.name}</p>
              <p className="text-sm text-muted-foreground">{activity.action}</p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Timestamp</p>
              <p className="text-sm font-medium text-foreground">
                {activity.timeAgo} ago • {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Description</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{details.description}</p>
          </div>

          {/* Action Details */}
          {details.details.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Action Details</p>
              <div className="space-y-2">
                {details.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Items */}
          {details.relatedItems.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Related Items</p>
              <div className="flex flex-wrap gap-2">
                {details.relatedItems.map((item, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-mono text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">Audit Status</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Verified
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
