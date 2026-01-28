import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SummarizeRequest {
  reportData: string;
  tone: "professional" | "concise" | "detailed";
}

const getToneInstruction = (tone: string): string => {
  switch (tone) {
    case "concise":
      return `Be extremely brief and to-the-point. Use bullet points for key metrics.
Format as:
**Key Metrics:** (list 4-5 key numbers)
**Action Items:** (2-3 bullet points)
Keep the entire response under 150 words.`;
    case "detailed":
      return `Provide a comprehensive analysis with sections:
## Q3 2026 Comprehensive Financial Analysis
### Liquidity & Cash Position
### Revenue Performance
### Profitability Metrics
### Departmental Budget Analysis (use a markdown table if data available)
### Recommendations (numbered list with Immediate, Short-term, Long-term)
Be thorough and include specific numbers and percentages.`;
    default: // professional
      return `Write in a formal, executive tone suitable for board presentations.
Structure as:
## Executive Summary
### Financial Highlights (3-4 bullet points)
### Areas Requiring Attention (2-3 bullet points)
### Recommendation (1 paragraph)
Keep it focused and actionable.`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportData, tone }: SummarizeRequest = await req.json();

    if (!reportData) {
      return new Response(
        JSON.stringify({ error: "Report data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a senior financial analyst AI assistant for Finance Pulse, a financial analytics platform.
Your task is to analyze financial report data and generate executive summaries.

${getToneInstruction(tone)}

Use markdown formatting including:
- **bold** for key numbers and metrics
- ## for main headings
- ### for subheadings
- Bullet points for lists
- Tables where appropriate

Focus on actionable insights and clear recommendations. Always include specific numbers from the data provided.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this financial report data and generate an executive summary:\n\n${reportData}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate summary" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("summarize-report error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
