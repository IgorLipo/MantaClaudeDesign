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
import { HardHat, MapPin, Briefcase, Plus, UserPlus, Settings, Copy, KeyRound, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Generate a readable temp password e.g. "Kq7m-Pn3x"
function genPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${pick(4)}-${pick(4)}`;
}

// Open WhatsApp share sheet with the credentials text
function shareViaWhatsApp(email: string, password: string, loginUrl: string) {
  const text = `Your Manta Ray login\n\nLink: ${loginUrl}\nEmail: ${email}\nPassword: ${password}\n\nPlease sign in and keep these safe.`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

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
  // Credentials dialog (shown once after create or after a password reset)
  const [creds, setCreds] = useState<{ email: string; password: string; name: string } | null>(null);
  // Manage member dialog
  const [manageMember, setManageMember] = useState<Scaffolder | null>(null);
  const [manageEmail, setManageEmail] = useState("");
  const [manageBusy, setManageBusy] = useState(false);

  const loginUrl = `${window.location.origin}/login`;

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
      // Show credentials once so the admin can copy / share them.
      setCreds({
        email: inviteForm.email,
        password: inviteForm.password,
        name: `${inviteForm.first_name} ${inviteForm.last_name}`.trim() || inviteForm.email,
      });
      setInviteOpen(false);
      setInviteForm({ email: "", password: "", first_name: "", last_name: "", role: "scaffolder" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setInviting(false);
  };

  // Invoke the admin-invite-user edge function with an action payload.
  const adminAction = async (payload: Record<string, any>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("admin-invite-user", {
      body: payload,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error || res.data?.error) {
      throw new Error(res.data?.error || res.error?.message || "Request failed");
    }
    return res.data;
  };

  const openManage = async (m: Scaffolder) => {
    setManageMember(m);
    setManageEmail("");
    try {
      const data = await adminAction({ action: "get_email", user_id: m.user_id });
      setManageEmail(data.email || "");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!manageMember) return;
    setManageBusy(true);
    try {
      const newPwd = genPassword();
      await adminAction({ action: "reset_password", user_id: manageMember.user_id, password: newPwd });
      const name = `${manageMember.first_name} ${manageMember.last_name}`.trim() || manageEmail;
      setCreds({ email: manageEmail, password: newPwd, name });
      setManageMember(null);
      toast({ title: "Password reset", description: "Share the new password with the member." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setManageBusy(false);
  };

  const handleUpdateEmail = async () => {
    if (!manageMember || !manageEmail) return;
    setManageBusy(true);
    try {
      await adminAction({ action: "update_email", user_id: manageMember.user_id, email: manageEmail });
      toast({ title: "Email updated", description: manageEmail });
      setManageMember(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setManageBusy(false);
  };

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
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
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setAssignOpen(s.user_id)}>
                <Plus className="h-3 w-3 mr-1" /> Region
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openManage(s)}>
                <Settings className="h-3 w-3 mr-1" /> Manage
              </Button>
            </div>
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
              <div className="flex gap-2">
                <Input type="text" value={inviteForm.password} onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })} required />
                <Button type="button" size="icon" variant="outline" title="Generate" onClick={() => setInviteForm({ ...inviteForm, password: genPassword() })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
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

      {/* Credentials Dialog (shown once after create or password reset) */}
      <Dialog open={!!creds} onOpenChange={() => setCreds(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Login Credentials</DialogTitle></DialogHeader>
          {creds && (
            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">
                Share these with <span className="font-medium text-foreground">{creds.name}</span>. The password is shown only once — copy or share it now.
              </p>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <div className="flex gap-2">
                  <Input readOnly value={creds.email} className="font-mono text-xs" />
                  <Button type="button" size="icon" variant="outline" title="Copy" onClick={() => copyText("Email", creds.email)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Password</Label>
                <div className="flex gap-2">
                  <Input readOnly value={creds.password} className="font-mono text-xs" />
                  <Button type="button" size="icon" variant="outline" title="Copy" onClick={() => copyText("Password", creds.password)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white" onClick={() => shareViaWhatsApp(creds.email, creds.password, loginUrl)}>
                <MessageCircle className="h-4 w-4 mr-2" /> Share via WhatsApp
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Member Dialog */}
      <Dialog open={!!manageMember} onOpenChange={() => setManageMember(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Manage {manageMember?.first_name} {manageMember?.last_name}</DialogTitle>
          </DialogHeader>
          {manageMember && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                <div className="flex gap-2">
                  <Input type="email" value={manageEmail} onChange={(e) => setManageEmail(e.target.value)} className="text-xs" />
                  <Button type="button" size="icon" variant="outline" title="Copy" onClick={() => copyText("Email", manageEmail)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs" disabled={manageBusy || !manageEmail} onClick={handleUpdateEmail}>
                  Save Email
                </Button>
              </div>
              <div className="border-t pt-3">
                <Button variant="outline" className="w-full" disabled={manageBusy} onClick={handleResetPassword}>
                  <KeyRound className="h-4 w-4 mr-2" /> Reset Password
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
                  Generates a new password and shows it once to copy or share.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
