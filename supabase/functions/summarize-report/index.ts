import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// AI summarization is disabled pending choice of provider.
// Restore git history of this file (pre-decouple-from-lovable commit) to
// recover the previous Lovable AI Gateway implementation.
//
// To re-enable: pick Anthropic, OpenAI, or another provider; set the API key
// via `supabase secrets set`; replace this stub with a real implementation.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(
    JSON.stringify({
      error: "AI summarization is disabled in this deployment.",
      code: "ai_disabled",
    }),
    {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
