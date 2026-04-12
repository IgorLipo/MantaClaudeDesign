import { useState } from "react";
import { CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface QuoteEntry {
  id: string;
  amount: number;
  notes: string | null;
  submitted_at: string;
  review_decision: string | null;
  scaffolder_id: string;
  reviewed_at: string | null;
  counter_amount?: number | null;
  counter_notes?: string | null;
}

interface QuoteTimelineProps {
  quotes: QuoteEntry[];
  profiles: Record<string, { first_name: string; last_name: string }>;
  showScaffolderName?: boolean;
  isScaffolder?: boolean;
  onRespondToCounter?: (quoteId: string, response: "accepted" | "rejected", newAmount?: number, newNotes?: string) => void;
}

export function QuoteTimeline({
  quotes,
  profiles,
  showScaffolderName,
  isScaffolder,
  onRespondToCounter,
}: QuoteTimelineProps) {
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");

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
    if (d === "accepted") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (d === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
    if (d === "countered") return <RotateCcw className="h-4 w-4 text-warning" />;
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
        const isCountered = q.review_decision === "countered";
        const showRespond = isScaffolder && isCountered && onRespondToCounter;

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
                    q.review_decision === "accepted" && "bg-success/10 text-success",
                    q.review_decision === "rejected" && "bg-destructive/10 text-destructive",
                    q.review_decision === "countered" && "bg-warning/10 text-warning"
                  )}
                >
                  {getLabel(q.review_decision)}
                </span>
              </div>

              {/* Show counter amount if countered */}
              {isCountered && q.counter_amount && (
                <div className="mt-1.5 p-2 rounded-lg bg-warning/5 border border-warning/20">
                  <p className="text-xs text-warning font-medium">
                    Counter offer: £{Number(q.counter_amount).toLocaleString()}
                  </p>
                  {q.counter_notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{q.counter_notes}</p>
                  )}
                </div>
              )}

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

              {/* Scaffolder response to counter */}
              {showRespond && (
                <div className="mt-2 space-y-2">
                  {respondingTo === q.id ? (
                    <div className="p-3 rounded-lg bg-secondary/30 space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Your revised amount (£)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 2200"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Notes (optional)</Label>
                        <Textarea
                          placeholder="Why you're proposing this amount..."
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => setRespondingTo(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          disabled={!newAmount}
                          onClick={() => {
                            onRespondToCounter!(q.id, "rejected", parseFloat(newAmount), newNotes);
                            setRespondingTo(null);
                            setNewAmount("");
                            setNewNotes("");
                          }}
                        >
                          Submit Revised Quote
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 flex-1 text-success border-success/30"
                        onClick={() => onRespondToCounter!(q.id, "accepted")}
                      >
                        Accept Counter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 flex-1 text-warning border-warning/30"
                        onClick={() => setRespondingTo(q.id)}
                      >
                        Decline & Revise
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
