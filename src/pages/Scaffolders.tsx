import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HardHat, MapPin, Briefcase, Plus, UserPlus } from "lucide-react";
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

export default function Scaffolders() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [scaffolders, setScaffolders] = useState<Scaffolder[]>([]);
  const [engineers, setEngineers] = useState<Scaffolder[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [scaffolderRegionMap, setScaffolderRegionMap] = useState<Record<string, string[]>>({});
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", password: "", first_name: "", last_name: "", role: "scaffolder" });
  const [inviting, setInviting] = useState(false);

  const fetchAll = async () => {
    const [scaffRolesRes, engRolesRes, regionsRes, srRes, assignRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "scaffolder"),
      supabase.from("user_roles").select("user_id").eq("role", "engineer"),
      supabase.from("regions").select("id, name, code").order("name"),
      supabase.from("scaffolder_regions").select("scaffolder_id, region_id"),
      supabase.from("job_assignments").select("scaffolder_id, job_id"),
    ]);

    const allIds = [
      ...(scaffRolesRes.data || []).map((r) => r.user_id),
      ...(engRolesRes.data || []).map((r) => r.user_id),
    ];

    if (allIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", allIds);
      if (profiles) {
        const scaffIds = new Set((scaffRolesRes.data || []).map((r) => r.user_id));
        const engIds = new Set((engRolesRes.data || []).map((r) => r.user_id));
        setScaffolders(profiles.filter((p) => scaffIds.has(p.user_id)));
        setEngineers(profiles.filter((p) => engIds.has(p.user_id)));
      }
    }

    const counts: Record<string, number> = {};
    if (assignRes.data) {
      assignRes.data.forEach((a) => {
        counts[a.scaffolder_id] = (counts[a.scaffolder_id] || 0) + 1;
      });
    }
    setJobCounts(counts);

    if (regionsRes.data) setRegions(regionsRes.data);

    const map: Record<string, string[]> = {};
    if (srRes.data) {
      srRes.data.forEach((sr: any) => {
        if (!map[sr.scaffolder_id]) map[sr.scaffolder_id] = [];
        map[sr.scaffolder_id].push(sr.region_id);
      });
    }
    setScaffolderRegionMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getScaffolderRegions = (userId: string) => {
    const regionIds = scaffolderRegionMap[userId] || [];
    return regions.filter((r) => regionIds.includes(r.id));
  };

  const assignRegion = async (scaffolderId: string) => {
    if (!selectedRegion) return;
    const existing = (scaffolderRegionMap[scaffolderId] || []).includes(selectedRegion);
    if (existing) {
      toast({ title: "Already assigned to this region", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("scaffolder_regions").insert({
      scaffolder_id: scaffolderId,
      region_id: selectedRegion,
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

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.password) return;
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-invite-user", {
        body: inviteForm,
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to invite");
      }
      toast({ title: "User created", description: `${inviteForm.email} added as ${inviteForm.role}` });
      setInviteOpen(false);
      setInviteForm({ email: "", password: "", first_name: "", last_name: "", role: "scaffolder" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setInviting(false);
  };

  const renderPersonCard = (s: Scaffolder, roleLabel: string) => {
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
              <p className="text-xs text-muted-foreground">{s.phone || "No phone"} · {roleLabel}</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {jobs} jobs</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {sRegions.length} regions</span>
          </div>
          {sRegions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sRegions.map((r) => (
                <Badge key={r.id} variant="secondary" className="text-[10px]">{r.name}</Badge>
              ))}
            </div>
          )}
          {role === "admin" && (
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setAssignOpen(s.user_id)}>
              <Plus className="h-3 w-3 mr-1" /> Assign Region
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Crew</span>
          <h1 className="font-display text-4xl lg:text-5xl leading-[1.02] tracking-tight text-foreground">
            The <span className="font-display-italic text-primary">team.</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="tabular-nums font-medium text-foreground">{scaffolders.length}</span> scaffolders ·{" "}
            <span className="tabular-nums font-medium text-foreground">{engineers.length}</span> engineers
          </p>
        </div>
        {role === "admin" && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Invite User
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (scaffolders.length === 0 && engineers.length === 0) ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <HardHat className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No team members yet. Invite scaffolders or engineers to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {scaffolders.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Scaffolders</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scaffolders.map((s) => renderPersonCard(s, "Scaffolder"))}
              </div>
            </>
          )}
          {engineers.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-4">Engineers</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {engineers.map((s) => renderPersonCard(s, "Engineer"))}
              </div>
            </>
          )}
        </>
      )}

      {/* Assign Region Dialog */}
      <Dialog open={!!assignOpen} onOpenChange={() => { setAssignOpen(null); setSelectedRegion(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign Region</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" disabled={!selectedRegion} onClick={() => assignOpen && assignRegion(assignOpen)}>
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">First Name</Label>
                <Input value={inviteForm.first_name} onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name</Label>
                <Input value={inviteForm.last_name} onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Temporary Password</Label>
              <Input type="text" value={inviteForm.password} onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scaffolder">Scaffolder</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={inviting || !inviteForm.email || !inviteForm.password} onClick={handleInvite}>
              {inviting ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
