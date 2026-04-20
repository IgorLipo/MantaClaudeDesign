import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function OwnerJobHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("jobs")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        navigate(`/jobs/${data.id}`, { replace: true });
      } else {
        navigate("/new-job", { replace: true });
      }
      setChecked(true);
    };
    check();
  }, [user, navigate]);

  if (!checked)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-ember-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-wider">Finding your site</span>
        </div>
      </div>
    );
  return null;
}
