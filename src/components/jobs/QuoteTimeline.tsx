import { CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteEntry {
  id: string;
  amount: number;
  notes: string | null;
  submitted_at: string;
  review_decision: string | null;
  scaffolder_id: string;
  reviewed_at: string | null;
}

interface QuoteTimelineProps {
  quotes: QuoteEntry[];
  profiles: Record<string, { first_name: string; last_name: string }>;
  showScaffolderName?: boolean;
}

export function QuoteTimeline({
  quotes,
  profiles,
  showScaffolderName,
}: QuoteTimelineProps) {
  if (quotes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No quotes submitted yet
      </p>
    );
  }

  const sorted = [...quotes].sort(
    (a, b) =>
      new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );

  const getIcon = (d: string | null) => {
    if (!d) return <Clock className="h-4 w-4 text-muted-foreground" />;
    if (d === "accepted")
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (d === "rejected")
      return <XCircle className="h-4 w-4 text-destructive" />;
    if (d === "countered")
      return <RotateCcw className="h-4 w-4 text-warning" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getColor = (d: string | null) => {
    if (!d) return "border-muted-foreground/30";
    if (d === "accepted") return "border-success";
    if (d === "rejected") return "border-destructive";
    if (d === "countered") return "border-warning";
    return "border-muted-foreground/30";
  };

  const getLabel = (d: string | null) => {
    if (!d) return "Pending Review";
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const fmt = (s: string) =>
    new Date(s).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="relative space-y-0">
      {sorted.map((q, i) => {
        const scaffolder = profiles[q.scaffolder_id];
        const isLast = i === sorted.length - 1;
        return (
          <div key={q.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center bg-background z-10",
                  getColor(q.review_decision)
                )}
              >
                {getIcon(q.review_decision)}
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-border" />}
            </div>
            <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    £{Number(q.amount).toLocaleString()}
                  </span>
                  {showScaffolderName && scaffolder && (
                    <span className="text-[10px] text-muted-foreground">
                      by {scaffolder.first_name} {scaffolder.last_name}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                    !q.review_decision && "bg-muted text-muted-foreground",
                    q.review_decision === "accepted" &&
                      "bg-success/10 text-success",
                    q.review_decision === "rejected" &&
                      "bg-destructive/10 text-destructive",
                    q.review_decision === "countered" &&
                      "bg-warning/10 text-warning"
                  )}
                >
                  {getLabel(q.review_decision)}
                </span>
              </div>
              {q.notes && (
                <p className="text-xs text-muted-foreground mt-1">{q.notes}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {fmt(q.submitted_at)}
              </p>
              {q.reviewed_at && (
                <p className="text-[10px] text-muted-foreground">
                  Reviewed: {fmt(q.reviewed_at)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
