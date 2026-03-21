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

  const users = [
    { email: "admin@solarops.co.uk", password: "admin123", first_name: "Sarah", last_name: "Mitchell", role: "admin" },
    { email: "john.smith@email.co.uk", password: "owner123", first_name: "John", last_name: "Smith", role: "owner" },
    { email: "apex@scaffolding.co.uk", password: "scaffold123", first_name: "Apex", last_name: "Scaffolding", role: "scaffolder" },
    { email: "joe@solarops.co.uk", password: "engineer123", first_name: "Joe", last_name: "Barnes", role: "engineer" },
  ];

  const results = [];

  for (const u of users) {
    // Check if user exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const exists = existingUsers?.users?.find((eu: any) => eu.email === u.email);
    
    if (exists) {
      // Ensure role is set
      const { data: roleCheck } = await admin.from("user_roles").select("id").eq("user_id", exists.id).single();
      if (!roleCheck) {
        await admin.from("user_roles").insert({ user_id: exists.id, role: u.role });
      }
      // Update profile
      await admin.from("profiles").upsert({
        user_id: exists.id,
        first_name: u.first_name,
        last_name: u.last_name,
      }, { onConflict: "user_id" });
      results.push({ email: u.email, status: "exists", id: exists.id });
      continue;
    }

    const { data: newUser, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { first_name: u.first_name, last_name: u.last_name },
    });

    if (error) {
      results.push({ email: u.email, status: "error", message: error.message });
      continue;
    }

    // Override the default 'owner' role with the correct one
    if (u.role !== "owner") {
      await admin.from("user_roles").update({ role: u.role }).eq("user_id", newUser.user.id);
    }

    results.push({ email: u.email, status: "created", id: newUser.user.id });
  }

  // Seed regions
  const { data: existingRegions } = await admin.from("regions").select("code");
  const existingCodes = existingRegions?.map((r: any) => r.code) || [];

  const regions = [
    { name: "South West England", code: "SW", postcode_prefix: "BS, BA, EX" },
    { name: "Midlands", code: "MID", postcode_prefix: "B, CV, WS" },
    { name: "North West", code: "NW", postcode_prefix: "M, L, WA" },
  ];

  for (const r of regions) {
    if (!existingCodes.includes(r.code)) {
      await admin.from("regions").insert(r);
    }
  }

  // Seed some demo jobs
  const { data: ownerProfile } = await admin.from("profiles").select("user_id").eq("first_name", "John").single();
  if (ownerProfile) {
    const { data: existingJobs } = await admin.from("jobs").select("id").eq("owner_id", ownerProfile.user_id);
    if (!existingJobs || existingJobs.length === 0) {
      const demoJobs = [
        { title: "Solar Panel Installation — 42 Elm Street", description: "Residential 4kW system, two-storey semi-detached. South-facing roof.", address: "42 Elm Street, Bristol BS1 4DJ", status: "submitted", owner_id: ownerProfile.user_id },
        { title: "Scaffolding for Roof Survey — 18 Oak Lane", description: "Pre-installation survey. Access needed to front and rear elevations.", address: "18 Oak Lane, Bath BA1 2QR", status: "in_progress", owner_id: ownerProfile.user_id },
        { title: "Panel Removal & Reinstall — 7 Maple Drive", description: "Remove existing panels for re-roofing, then reinstall. 3kW system.", address: "7 Maple Drive, Exeter EX4 1AB", status: "completed", owner_id: ownerProfile.user_id },
      ];
      for (const j of demoJobs) {
        await admin.from("jobs").insert(j);
      }
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
