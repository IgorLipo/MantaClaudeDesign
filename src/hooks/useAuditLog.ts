import { supabase } from "@/integrations/supabase/client";

export async function logAudit(
  userId: string | undefined,
  action: string,
  entity: string,
  entityId?: string,
  changes?: Record<string, any>
) {
  if (!userId) return;
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    entity,
    entity_id: entityId || "",
    changes: changes || {},
  });
}
