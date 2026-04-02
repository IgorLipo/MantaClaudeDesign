import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const decisionColor = (d: string | null) => {
  if (d === "accepted") return "bg-success/10 text-success";
  if (d === "rejected") return "bg-destructive/10 text-destructive";
  if (d === "countered") return "bg-warning/10 text-warning";
  return "bg-muted text-muted-foreground";
};

export default function MyQuotes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("quotes")
        .select("*, jobs(id, title, address, status)")
        .eq("scaffolder_id", user.id)
        .order("submitted_at", { ascending: false });
      if (data) setQuotes(data);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Quotes</h1>
        <p className="text-sm text-muted-foreground">{quotes.length} quotes submitted</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : quotes.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <DollarSign className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No quotes yet</p>
            <p className="text-xs text-muted-foreground mt-1">Quotes you submit for assigned jobs will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => (
            <Card
              key={q.id}
              className="card-elevated hover-lift cursor-pointer"
              onClick={() => q.jobs?.id && navigate(`/jobs/${q.jobs.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{q.jobs?.title || "Unknown Job"}</p>
                    <p className="text-xs text-muted-foreground truncate">{q.jobs?.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      £{Number(q.amount).toLocaleString()} · {new Date(q.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("text-xs ml-3", decisionColor(q.review_decision))}>
                    {q.review_decision || "Pending"}
                  </Badge>
                </div>
                {q.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{q.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
