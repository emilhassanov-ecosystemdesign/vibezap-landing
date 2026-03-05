/**
 * POST /api/land-design — Free tier land design report (SSE streaming)
 *
 * Pipeline: validate → rate limit → geocode → fetch site data → stream report
 */

import { validateOrigin, getCorsHeaders } from "./lib/security.js";
import { checkRateLimit } from "./lib/store.js";
import { geocodeAddress, fetchAllSiteData } from "./lib/site-data-fetcher.js";
import { buildFreeReportPrompt } from "./lib/permaculture-prompts.js";

const MAX_REQUESTS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const HEARTBEAT_MS = 12_000;

const encoder = new TextEncoder();

function sseEvent(controller, event, data) {
  try {
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  } catch (_) {}
}

function sseComment(controller, text) {
  try {
    controller.enqueue(encoder.encode(`: ${text}\n\n`));
  } catch (_) {}
}

// CORS preflight
export function OPTIONS(request) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(request) {
  const origin = request.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);

  const { allowed, isBrowser } = validateOrigin(origin);
  if (isBrowser && !allowed) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { address, description } = body || {};

  if (!address || typeof address !== "string" || address.trim().length < 3) {
    return new Response(JSON.stringify({ error: "Please enter a valid location" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!description || typeof description !== "string" || description.trim().length < 20) {
    return new Response(JSON.stringify({ error: "Please describe your land in at least a few sentences" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (description.length > 3000) {
    return new Response(JSON.stringify({ error: "Description too long (max 3000 characters)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:land-design:${ip}`, MAX_REQUESTS, WINDOW_MS);
  if (retryAfter !== null) {
    return new Response(
      JSON.stringify({ error: `You've used all ${MAX_REQUESTS} free designs this hour. Try again in ~${retryAfter} minutes.` }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Start SSE stream ──────────────────────────────────────────────

  const stream = new ReadableStream({
    async start(controller) {
      let heartbeatInterval = null;

      try {
        // Step 1: Geocode
        sseEvent(controller, "progress", { stage: "geocoding", message: "Locating your property..." });
        let location;
        try {
          location = await geocodeAddress(address.trim());
        } catch (err) {
          sseEvent(controller, "error", { error: "Could not find that location. Please try a more specific address." });
          controller.close();
          return;
        }

        // Step 2: Fetch site data
        sseEvent(controller, "progress", { stage: "fetching", message: "Analyzing climate, soil & terrain..." });
        const siteData = await fetchAllSiteData(location.lat, location.lng);

        sseEvent(controller, "site_data", { location, siteData });

        // Step 3: Build prompt and stream report
        sseEvent(controller, "progress", { stage: "generating", message: "Generating your design..." });
        const { system, user } = buildFreeReportPrompt(siteData, location, description.trim());

        heartbeatInterval = setInterval(() => sseComment(controller, "heartbeat"), HEARTBEAT_MS);

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            stream: true,
            system,
            messages: [{ role: "user", content: user }],
          }),
        });

        if (!response.ok) {
          clearInterval(heartbeatInterval);
          const errBody = await response.text().catch(() => "");
          console.error("[land-design] Claude API error:", response.status, errBody);
          sseEvent(controller, "error", { error: "AI service temporarily unavailable. Please try again." });
          controller.close();
          return;
        }

        // Parse SSE stream from Claude
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") continue;

            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "content_block_delta" && event.delta?.text) {
                sseEvent(controller, "report_chunk", { text: event.delta.text });
              }
            } catch (_) {}
          }
        }

        clearInterval(heartbeatInterval);
        heartbeatInterval = null;

        sseEvent(controller, "report_complete", {});
        controller.close();
      } catch (err) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        console.error("[land-design] Stream error:", err);
        sseEvent(controller, "error", { error: "Failed to generate design. Please try again." });
        try { controller.close(); } catch (_) {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
