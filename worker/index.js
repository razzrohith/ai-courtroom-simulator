/**
 * JudgeBench OpenRouter Free Demo Proxy
 * Cloudflare Worker Implementation
 */

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://razzrohith.github.io"
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    
    // CORS headers construction
    const corsHeaders = {
      "Access-Control-Allow-Origin": isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // 1. CORS Origin and Preflight validation
    if (origin && !isOriginAllowed(origin)) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. HTTP Method Check
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 3. Content-Type Check
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Unsupported Media Type: Must be application/json" }), {
        status: 415,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 4. API Key Check on Worker Env
    const openrouterKey = env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return new Response(JSON.stringify({ error: "Proxy Configuration Error: Shared key not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    try {
      // 5. Payload size enforcement (under 50KB)
      const bodyText = await request.text();
      if (bodyText.length > 51200) {
        return new Response(JSON.stringify({ error: "Payload size limit exceeded (Max 50KB)" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Parse and validate JSON
      let body;
      try {
        body = JSON.parse(bodyText);
      } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON format" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const { model, messages, temperature, max_tokens } = body;

      // 6. Request Field Validation
      if (!model || typeof model !== "string") {
        return new Response(JSON.stringify({ error: "Missing or invalid model parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (!Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: "Messages must be an array" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // 7. Free Model Enforcement
      if (!model.endsWith(":free")) {
        return new Response(JSON.stringify({ error: "Paid models require your own OpenRouter API key." }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // 8. Cap Parameters
      const cappedTemperature = Math.min(Math.max(Number(temperature) || 0.5, 0), 0.5);
      const cappedMaxTokens = Math.min(Number(max_tokens) || 220, 220);

      // Strip unsupported fields
      const cleanPayload = {
        model,
        messages,
        temperature: cappedTemperature,
        max_tokens: cappedMaxTokens,
      };

      // 9. Forward Request to OpenRouter with a short timeout (8s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openrouterKey}`,
          "HTTP-Referer": origin || "https://github.com/razzrohith/ai-courtroom-simulator",
          "X-Title": "JudgeBench Free Proxy",
        },
        body: JSON.stringify(cleanPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return new Response(JSON.stringify({ error: `Proxy received error status: ${response.status}` }), {
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const responseData = await response.json();
      return new Response(JSON.stringify(responseData), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isAbort = err instanceof Error && err.name === "AbortError";
      return new Response(
        JSON.stringify({ 
          error: isAbort ? "Proxy connection timed out" : "Internal proxy gateway error"
        }), {
          status: isAbort ? 504 : 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
  }
};
