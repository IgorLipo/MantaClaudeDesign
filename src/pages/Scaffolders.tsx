import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat } from "lucide-react";

export default function Scaffolders() {
  const [scaffolders, setScaffolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Get users with scaffolder role
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "scaffolder");
      if (roles && roles.length > 0) {
        const ids = roles.map((r) => r.user_id);
        const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", ids);
        if (profiles) setScaffolders(profiles);
      }
      setLoading(false);
    };
    fetch();
  }, []);

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
            <p className="text-xs text-muted-foreground mt-1">Users who sign up with the scaffolder demo credentials will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scaffolders.map((s) => (
            <Card key={s.id} className="card-elevated hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {s.first_name?.[0]}{s.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-muted-foreground">{s.phone || "No phone"}</p>
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
