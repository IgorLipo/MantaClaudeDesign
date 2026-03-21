import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const statusMap: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", photo_review: "Photo Review",
  quote_pending: "Quote Pending", quote_submitted: "Quote Submitted",
  negotiating: "Negotiating", scheduled: "Scheduled",
  in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
};

const transitions: Record<string, string[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["photo_review", "cancelled"],
  photo_review: ["quote_pending", "cancelled"],
  quote_pending: ["quote_submitted"],
  quote_submitted: ["negotiating", "scheduled"],
  negotiating: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", id).single();
      setJob(data);
      setLoading(false);
    };
    if (id) fetch();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from("jobs").update({ status: newStatus as any, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setJob({ ...job, status: newStatus });
      toast({ title: `Status updated to ${statusMap[newStatus]}` });
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!job) return <div className="p-8 text-muted-foreground">Job not found</div>;

  const available = transitions[job.status] || [];

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Jobs
      </Button>

      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              job.status === "completed" ? "bg-success/10 text-success" :
              job.status === "in_progress" ? "bg-info/10 text-info" :
              job.status === "cancelled" ? "bg-destructive/10 text-destructive" :
              "bg-warning/10 text-warning"
            )}>
              {statusMap[job.status]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {job.description && <p className="text-sm text-foreground">{job.description}</p>}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {job.address || "No address"}
            </div>
            {job.scheduled_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> {new Date(job.scheduled_date).toLocaleDateString("en-GB")}
              </div>
            )}
          </div>

          {role === "admin" && available.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {available.map((s) => (
                  <Button key={s} variant="outline" size="sm" className="text-xs capitalize" onClick={() => updateStatus(s)}>
                    {statusMap[s] || s}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
