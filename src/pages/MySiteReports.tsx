import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColor = (s: string) => {
  if (s === "submitted") return "bg-success/10 text-success";
  return "bg-warning/10 text-warning";
};

export default function MySiteReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("site_reports")
        .select("*, jobs(id, title, address)")
        .eq("engineer_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setReports(data);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="p-4 lg:p-10 space-y-5 max-w-4xl mx-auto animate-em-enter">
      <div className="space-y-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Field notes</span>
        <h1 className="font-display text-4xl lg:text-5xl leading-[1.02] tracking-tight text-foreground">
          Site <span className="font-display-italic text-primary">reports.</span>
        </h1>
        <p className="text-sm text-muted-foreground"><span className="tabular-nums font-medium text-foreground">{reports.length}</span> reports</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : reports.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No site reports yet</p>
            <p className="text-xs text-muted-foreground mt-1">Open an assigned job to create a site report</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <Card
              key={r.id}
              className="card-elevated hover-lift cursor-pointer"
              onClick={() => r.jobs?.id && navigate(`/jobs/${r.jobs.id}/report`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{r.jobs?.title || "Unknown Job"}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.jobs?.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("text-xs ml-3 capitalize", statusColor(r.status))}>
                    {r.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
