import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: corsHeaders });
    }

    // Verify caller is admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Check admin role
    const { data: roleData } = await callerClient.from("user_roles").select("role").eq("user_id", caller.id).single();
    if (!roleData || roleData.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const action = body.action || "create";

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- Get email for an existing user ---
    if (action === "get_email") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "Need user_id" }), { status: 400, headers: corsHeaders });
      }
      const { data, error } = await adminClient.auth.admin.getUserById(user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: true, email: data?.user?.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Reset password for an existing user ---
    if (action === "reset_password") {
      const { user_id, password } = body;
      if (!user_id || !password) {
        return new Response(JSON.stringify({ error: "Need user_id and password" }), { status: 400, headers: corsHeaders });
      }
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: true, password }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Update email for an existing user ---
    if (action === "update_email") {
      const { user_id, email } = body;
      if (!user_id || !email) {
        return new Response(JSON.stringify({ error: "Need user_id and email" }), { status: 400, headers: corsHeaders });
      }
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { email, email_confirm: true });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: true, email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Create a new team member (default action) ---
    const { email, password, first_name, last_name, role } = body;
    if (!email || !password || !role || !["scaffolder", "engineer"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid input. Need email, password, role (scaffolder|engineer)" }), { status: 400, headers: corsHeaders });
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: first_name || "", last_name: last_name || "" },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: corsHeaders });
    }

    // Update the role from default 'owner' to the specified role
    if (newUser?.user) {
      await adminClient.from("user_roles").update({ role }).eq("user_id", newUser.user.id);
    }

    return new Response(JSON.stringify({ success: true, user_id: newUser?.user?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
