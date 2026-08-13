/**
 * JudgeBench OpenRouter Free Demo Proxy — Hardened (Phase 26)
 * Cloudflare Worker Implementation
 *
 * Changes vs v1:
 *  - Per-IP rate limiting (best-effort, per-isolate; upgrade to KV/Durable
 *    Objects for global limits when traffic justifies it)
 *  - Daily request budget circuit-breaker
 *  - max_tokens cap raised 220 → 1400 (longer, real arguments)
 *  - temperature cap raised 0.5 → 0.9 (juror/deliberation calls use 0.8)
 *  - Upstream timeout raised 8s → 45s (free models are slow; 8s truncated)
 *  - Fixed: `body` was out of scope in the catch path (ReferenceError)
 *
 * DEPLOY: wrangler deploy (requires OPENROUTER_API_KEY secret).
 * The live instance keeps the old behavior until redeployed.
 */

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://razzrohith.com",
  "https://www.razzrohith.com",
  "https://courtroom.razzrohith.com",
  "https://razzrohith.github.io"
];

// ---- Abuse protection (per-isolate, best-effort) ----
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 40;                  // requests per IP per window
const DAILY_BUDGET_MAX = 5000;              // total requests per isolate per day

const ipHits = new Map(); // ip -> number[] (timestamps)
let dailyCount = 0;
let dailyResetAt = 0;

function isRateLimited(ip) {
  const now = Date.now();

  // Daily circuit breaker
  if (now > dailyResetAt) {
    dailyResetAt = now + 24 * 60 * 60 * 1000;
    dailyCount = 0;
  }
  dailyCount++;
  if (dailyCount > DAILY_BUDGET_MAX) return "daily_budget";

  // Per-IP sliding window
  const hits = (ipHits.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  // Opportunistic cleanup
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      if (v.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) ipHits.delete(k);
    }
  }
  if (hits.length > RATE_LIMIT_MAX) return "ip_rate";
  return null;
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");

    const corsHeaders = {
      "Access-Control-Allow-Origin": isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    const jsonError = (status, payload) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    // 1. CORS Origin and Preflight validation
    if (origin && !isOriginAllowed(origin)) {
      return jsonError(403, { error: "Origin not allowed" });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. HTTP Method Check
    if (request.method !== "POST") {
      return jsonError(405, { error: "Method Not Allowed" });
    }

    // 3. Rate limiting
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const limited = isRateLimited(clientIp);
    if (limited === "ip_rate") {
      return jsonError(429, {
        error: "Too many requests — the free demo allows " + RATE_LIMIT_MAX + " requests per 5 minutes.",
        category: "rate_limited",
        status: 429,
      });
    }
    if (limited === "daily_budget") {
      return jsonError(429, {
        error: "The free demo has reached its daily budget. Use a personal OpenRouter key, or try again tomorrow.",
        category: "rate_limited",
        status: 429,
      });
    }

    // 4. Content-Type Check
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) {
      return jsonError(415, { error: "Unsupported Media Type: Must be application/json" });
    }

    // 5. API Key Check on Worker Env
    const openrouterKey = env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return jsonError(500, { error: "Proxy Configuration Error: Shared key not set" });
    }

    let requestedModel = "unknown";
    try {
      // 6. Payload size enforcement (under 60KB — longer prompts allowed now)
      const bodyText = await request.text();
      if (bodyText.length > 61440) {
        return jsonError(400, { error: "Payload size limit exceeded (Max 60KB)" });
      }

      let body;
      try {
        body = JSON.parse(bodyText);
      } catch (e) {
        return jsonError(400, { error: "Invalid JSON format" });
      }

      const { model, messages, temperature, max_tokens, stream } = body;
      requestedModel = typeof model === "string" ? model : "unknown";

      // 7. Request Field Validation
      if (!model || typeof model !== "string") {
        return jsonError(400, { error: "Missing or invalid model parameter" });
      }
      if (!Array.isArray(messages) || messages.length === 0 || messages.length > 24) {
        return jsonError(400, { error: "Messages must be a non-empty array (max 24)" });
      }

      // 8. Free Model Enforcement
      if (!model.endsWith(":free")) {
        return jsonError(403, { error: "Paid models require your own OpenRouter API key." });
      }

      // 9. Cap Parameters (raised for Phase 26 longer arguments)
      const cappedTemperature = Math.min(Math.max(Number(temperature) || 0.5, 0), 0.9);
      const cappedMaxTokens = Math.min(Number(max_tokens) || 600, 1400);

      const cleanPayload = {
        model,
        messages,
        temperature: cappedTemperature,
        max_tokens: cappedMaxTokens,
      };

      // 10. Optional SSE streaming passthrough (client opt-in, ready for go-live)
      if (stream === true) {
        cleanPayload.stream = true;
      }

      // 11. Forward Request to OpenRouter (45s budget — free models are slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

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

      if (!response.ok) {
        clearTimeout(timeoutId);
        let errorMsg = `Proxy received error status: ${response.status}`;
        let category = "upstream_error";

        try {
          const upstreamType = response.headers.get("Content-Type") || "";
          if (upstreamType.includes("application/json")) {
            const errData = await response.json();
            const rawMsg = errData?.error?.message || errData?.error || "";
            if (rawMsg) {
              errorMsg = `OpenRouter: ${String(rawMsg)
                .replace(/(?:sk-|Bearer\s+)[a-zA-Z0-9_-]+/g, "***REDACTED***")
                .substring(0, 200)}`;
            }
          } else {
            const rawMsg = await response.text();
            if (rawMsg) {
              errorMsg = `OpenRouter response: ${rawMsg
                .replace(/(?:sk-|Bearer\s+)[a-zA-Z0-9_-]+/g, "***REDACTED***")
                .substring(0, 150)}`;
            }
          }
        } catch (_) {}

        if (response.status === 429) {
          category = "rate_limited";
        } else if (response.status === 404 || errorMsg.toLowerCase().includes("model")) {
          category = "model_unavailable";
        } else if (response.status === 401 || response.status === 403) {
          category = "invalid_key";
        }

        return jsonError(response.status, { error: errorMsg, category, status: response.status, model });
      }

      // Streaming: pipe the SSE body straight through
      if (cleanPayload.stream) {
        ctx.waitUntil(new Promise(resolve => setTimeout(resolve, 0)));
        clearTimeout(timeoutId);
        return new Response(response.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            ...corsHeaders,
          },
        });
      }

      const responseData = await response.json();
      clearTimeout(timeoutId);
      return new Response(JSON.stringify(responseData), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isAbort = err instanceof Error && err.name === "AbortError";
      const cleanMsg = errorMsg
        .replace(/(?:sk-|Bearer\s+)[a-zA-Z0-9_-]+/g, "***REDACTED***")
        .substring(0, 150);

      return jsonError(isAbort ? 504 : 500, {
        error: isAbort ? "Proxy connection timed out" : `Internal proxy gateway error: ${cleanMsg}`,
        category: isAbort ? "timeout" : "upstream_error",
        status: isAbort ? 504 : 500,
        model: requestedModel,
      });
    }
  }
};
