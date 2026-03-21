import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Regions() {
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", postcode_prefix: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchRegions = async () => {
    const { data } = await supabase.from("regions").select("*").order("name");
    if (data) setRegions(data);
    setLoading(false);
  };

  useEffect(() => { fetchRegions(); }, []);

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
      fetchRegions();
    }
    setSubmitting(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Regions</h1>
          <p className="text-sm text-muted-foreground">{regions.length} regions</p>
        </div>
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
          {regions.map((r) => (
            <Card key={r.id} className="card-elevated hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.code} · {r.postcode_prefix || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
