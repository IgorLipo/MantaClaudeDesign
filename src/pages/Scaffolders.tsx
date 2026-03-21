import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HardHat, MapPin, Briefcase, UserPlus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Scaffolder {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

interface Region {
  id: string;
  name: string;
  code: string;
}

interface Assignment {
  scaffolder_id: string;
  region_id: string | null;
  job_id: string;
}

export default function Scaffolders() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [scaffolders, setScaffolders] = useState<Scaffolder[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("");

  const fetchAll = async () => {
    const [rolesRes, regionsRes, assignRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "scaffolder"),
      supabase.from("regions").select("id, name, code").order("name"),
      supabase.from("job_assignments").select("scaffolder_id, region_id, job_id"),
    ]);

    if (rolesRes.data && rolesRes.data.length > 0) {
      const ids = rolesRes.data.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", ids);
      if (profiles) setScaffolders(profiles);

      // Count jobs per scaffolder
      const counts: Record<string, number> = {};
      if (assignRes.data) {
        assignRes.data.forEach((a) => {
          counts[a.scaffolder_id] = (counts[a.scaffolder_id] || 0) + 1;
        });
      }
      setJobCounts(counts);
    }
    if (regionsRes.data) setRegions(regionsRes.data);
    if (assignRes.data) setAssignments(assignRes.data as Assignment[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getScaffolderRegions = (userId: string) => {
    const regionIds = [...new Set(assignments.filter((a) => a.scaffolder_id === userId && a.region_id).map((a) => a.region_id))];
    return regions.filter((r) => regionIds.includes(r.id));
  };

  const assignRegion = async (scaffolderId: string) => {
    if (!selectedRegion) return;
    // Check if already assigned to a job in this region
    const existing = assignments.find((a) => a.scaffolder_id === scaffolderId && a.region_id === selectedRegion);
    if (existing) {
      toast({ title: "Already assigned to this region", variant: "destructive" });
      return;
    }
    // Create a dummy assignment to link scaffolder ↔ region
    const { error } = await supabase.from("job_assignments").insert({
      scaffolder_id: scaffolderId,
      region_id: selectedRegion,
      job_id: "00000000-0000-0000-0000-000000000000", // placeholder
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Region assigned" });
      setAssignOpen(null);
      setSelectedRegion("");
      fetchAll();
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Scaffolders</h1>
        <p className="text-sm text-muted-foreground">{scaffolders.length} registered scaffolders</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : scaffolders.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <HardHat className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No scaffolders registered yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scaffolders.map((s) => {
            const sRegions = getScaffolderRegions(s.user_id);
            const jobs = jobCounts[s.user_id] || 0;

            return (
              <Card key={s.user_id} className="card-elevated hover-lift">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {s.first_name?.[0]}{s.last_name?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-muted-foreground">{s.phone || "No phone"}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {jobs} jobs
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {sRegions.length} regions
                    </span>
                  </div>

                  {/* Region badges */}
                  {sRegions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sRegions.map((r) => (
                        <Badge key={r.id} variant="secondary" className="text-[10px]">{r.name}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Admin: assign region */}
                  {role === "admin" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => setAssignOpen(s.user_id)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Assign Region
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Region Dialog */}
      <Dialog open={!!assignOpen} onOpenChange={() => { setAssignOpen(null); setSelectedRegion(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Region</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={!selectedRegion}
              onClick={() => assignOpen && assignRegion(assignOpen)}
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
