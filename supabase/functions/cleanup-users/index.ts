import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: users } = await admin.auth.admin.listUsers();
  const deleted = [];
  for (const u of users?.users || []) {
    await admin.auth.admin.deleteUser(u.id);
    deleted.push(u.email);
  }

  return new Response(JSON.stringify({ deleted }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
