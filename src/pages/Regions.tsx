import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, HardHat, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Region {
  id: string;
  name: string;
  code: string;
  postcode_prefix: string | null;
  is_active: boolean;
}

interface Scaffolder {
  user_id: string;
  first_name: string;
  last_name: string;
}

export default function Regions() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [regions, setRegions] = useState<Region[]>([]);
  const [scaffolders, setScaffolders] = useState<Record<string, Scaffolder[]>>({});
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", postcode_prefix: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const [regionsRes, assignRes, rolesRes] = await Promise.all([
      supabase.from("regions").select("*").order("name"),
      supabase.from("job_assignments").select("scaffolder_id, region_id, job_id"),
      supabase.from("user_roles").select("user_id").eq("role", "scaffolder"),
    ]);

    if (regionsRes.data) setRegions(regionsRes.data);

    // Map scaffolders to regions
    if (assignRes.data && rolesRes.data) {
      const scaffolderIds = rolesRes.data.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", scaffolderIds);

      const regionScaffolders: Record<string, Scaffolder[]> = {};
      const regionJobs: Record<string, Set<string>> = {};

      assignRes.data.forEach((a) => {
        if (a.region_id) {
          if (!regionJobs[a.region_id]) regionJobs[a.region_id] = new Set();
          regionJobs[a.region_id].add(a.job_id);

          if (!regionScaffolders[a.region_id]) regionScaffolders[a.region_id] = [];
          const profile = profiles?.find((p) => p.user_id === a.scaffolder_id);
          if (profile && !regionScaffolders[a.region_id].find((s) => s.user_id === profile.user_id)) {
            regionScaffolders[a.region_id].push(profile);
          }
        }
      });

      setScaffolders(regionScaffolders);
      const counts: Record<string, number> = {};
      Object.entries(regionJobs).forEach(([id, set]) => { counts[id] = set.size; });
      setJobCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("regions").insert(form);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Region created" });
      setForm({ name: "", code: "", postcode_prefix: "" });
      setCreateOpen(false);
      fetchAll();
    }
    setSubmitting(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("regions").update({ is_active: !current }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRegions((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !current } : r));
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Regions</h1>
          <p className="text-sm text-muted-foreground">{regions.length} regions</p>
        </div>
        {role === "admin" && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Region</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Region</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input placeholder="Region name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input placeholder="Code (e.g. SW)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                <Input placeholder="Postcode prefix (e.g. BS, BA)" value={form.postcode_prefix} onChange={(e) => setForm({ ...form, postcode_prefix: e.target.value })} />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Region"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : regions.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No regions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((r) => {
            const rScaffolders = scaffolders[r.id] || [];
            const jobs = jobCounts[r.id] || 0;
            return (
              <Card key={r.id} className="card-elevated hover-lift">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.code} · {r.postcode_prefix || "—"}</p>
                      </div>
                    </div>
                    {role === "admin" && (
                      <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r.id, r.is_active)} />
                    )}
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HardHat className="h-3.5 w-3.5" /> {rScaffolders.length} scaffolders
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {jobs} jobs
                    </span>
                  </div>

                  {rScaffolders.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rScaffolders.map((s) => (
                        <Badge key={s.user_id} variant="secondary" className="text-[10px]">
                          {s.first_name} {s.last_name?.[0]}.
                        </Badge>
                      ))}
                    </div>
                  )}

                  {!r.is_active && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
