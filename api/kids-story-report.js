import { sendToN8n } from "./lib/n8nLogger.js";
import { verifyOrder } from "./lib/verify-order.js";
import { validateOrigin, getCorsHeaders } from "./lib/security.js";
import { checkRateLimit, consumeOrder, cacheReport, getCachedReport } from "./lib/store.js";

const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 10_000;
const HEARTBEAT_MS = 12_000;

const VALID_STYLES = ["fairy-tale", "adventure", "bedtime", "funny", "educational"];

const STYLE_INSTRUCTIONS = {
  "fairy-tale": "a classic fairy tale with magical elements, enchanted settings, and a satisfying resolution",
  "adventure": "an exciting adventure story with exploration, challenges, and bravery",
  "bedtime": "a gentle, soothing bedtime story with calming imagery and a peaceful ending",
  "funny": "a silly, humorous story with funny situations and playful language that makes kids giggle",
  "educational": "an engaging story that weaves in learning moments naturally without being preachy",
};

// ── SSE helpers ─────────────────────────────────────────────────────

const encoder = new TextEncoder();

function sseEvent(controller, event, data) {
  try {
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  } catch (_) { /* client disconnected */ }
}

function sseComment(controller, text) {
  try {
    controller.enqueue(encoder.encode(`: ${text}\n\n`));
  } catch (_) { /* client disconnected */ }
}

// ── JSON extraction (3-strategy parser) ─────────────────────────────

function extractJSON(rawText, requiredField) {
  const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed[requiredField] !== undefined) return parsed;
  } catch (_) {}

  const startIdx = cleaned.indexOf("{");
  if (startIdx !== -1) {
    let depth = 0, endIdx = -1, inString = false, escape = false;
    for (let i = startIdx; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { endIdx = i; break; } }
    }
    if (endIdx !== -1) {
      try {
        const parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
        if (parsed[requiredField] !== undefined) return parsed;
      } catch (_) {}
    }
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0].replace(/```json|```/g, "").trim());
      if (parsed[requiredField] !== undefined) return parsed;
    } catch (_) {}
  }

  return null;
}

// ── Replicate image generation ──────────────────────────────────────

async function generateIllustration(prompt, replicateToken) {
  try {
    // Use Flux Schnell for fast, affordable image generation
    const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: `Children's storybook illustration, soft watercolor style, warm colors, whimsical and magical: ${prompt}`,
          num_outputs: 1,
          aspect_ratio: "4:3",
          output_format: "png",
          output_quality: 90,
        },
      }),
    });

    const prediction = await response.json();

    if (prediction.error) {
      console.error("[kids-story-report] Replicate error:", prediction.error);
      return null;
    }

    // Flux Schnell returns output directly (no polling needed)
    if (prediction.output && prediction.output.length > 0) {
      const imageUrl = prediction.output[0];
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) return null;
      const buffer = Buffer.from(await imgResponse.arrayBuffer());
      return buffer;
    }

    // If status is "processing", poll for completion
    if (prediction.urls?.get) {
      const maxPolls = 30;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(prediction.urls.get, {
          headers: { "Authorization": `Bearer ${replicateToken}` },
        });
        const pollData = await pollRes.json();

        if (pollData.status === "succeeded" && pollData.output?.length > 0) {
          const imageUrl = pollData.output[0];
          const imgResponse = await fetch(imageUrl);
          if (!imgResponse.ok) return null;
          return Buffer.from(await imgResponse.arrayBuffer());
        }
        if (pollData.status === "failed" || pollData.status === "canceled") {
          console.error("[kids-story-report] Replicate prediction failed:", pollData.error);
          return null;
        }
      }
    }

    return null;
  } catch (err) {
    console.error("[kids-story-report] Image generation error:", err.message);
    return null;
  }
}

// ── Story prompt builder ────────────────────────────────────────────

function buildStoryPrompt(childName, age, interests, moral, style) {
  const styleDesc = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS["fairy-tale"];
  const moralLine = moral
    ? `The story should naturally incorporate this moral or lesson: "${moral}".`
    : "The story should have a positive, uplifting message.";

  return `You are a beloved, award-winning children's story author. Write a complete, enchanting personalized children's story.

Details:
- Child's name: ${childName}
- Age: ${age} years old
- Interests/favorite things: ${interests}
- Story style: ${style} — write ${styleDesc}

${moralLine}

IMPORTANT RULES:
- Write for a ${age}-year-old: use age-appropriate vocabulary and sentence complexity
- Feature "${childName}" as the main character by name
- Weave their interests (${interests}) naturally into the story
- Write exactly 8 story pages (each page = 2-3 paragraphs, 80-100 words max per page)
- Keep text concise — each page must fit on a small A5 PDF page
- Build a satisfying story arc: introduction → rising action → climax → resolution
- End with a warm, satisfying conclusion
- Make it magical, heartfelt, and engaging

ILLUSTRATION RULES — exactly 3 pages get character illustrations:
- The story must have 3 distinct characters (e.g. protagonist, companion/sidekick, and one other key character like a creature, mentor, or villain)
- Mark exactly 3 pages with "has_illustration": true — one for each character
- Each illustrated page features ONE character as the focus of the illustration
- Spread illustrations across the story: one in pages 1-3, one in pages 4-6, one in pages 7-8
- Only include "illustration_prompt" for pages with "has_illustration": true
- The illustration_prompt should describe the character in detail (appearance, clothing, expression, pose) plus the scene context

Return ONLY a JSON object (no markdown, no backticks):
{
  "title": "<creative, catchy story title>",
  "dedication": "<a short, sweet dedication line like 'For [name], who always believed in magic'>",
  "pages": [
    {
      "page_number": 1,
      "text": "<2-3 paragraphs of story for this page, 80-100 words max>",
      "has_illustration": false
    },
    {
      "page_number": 2,
      "text": "<2-3 paragraphs of story for this page, 80-100 words max>",
      "has_illustration": true,
      "illustration_prompt": "<detailed character portrait + scene description for image generation>",
      "illustration_character": "<name or role of the character featured>"
    }
  ]
}

Exactly 3 of the 8 pages must have "has_illustration": true. The other 5 must have "has_illustration": false with no illustration_prompt.`;
}

// ── Quality gate ────────────────────────────────────────────────────

function checkStoryQuality(parsed) {
  if (!parsed.pages || !Array.isArray(parsed.pages)) {
    return "Missing pages array";
  }
  if (parsed.pages.length < 6) {
    return `Only ${parsed.pages.length} pages — expected 8`;
  }
  if (!parsed.title) {
    return "Missing story title";
  }
  for (const page of parsed.pages) {
    if (!page.text || page.text.length < 50) {
      return `Page ${page.page_number} has insufficient text`;
    }
  }
  const illustratedCount = parsed.pages.filter(p => p.has_illustration).length;
  if (illustratedCount < 2 || illustratedCount > 4) {
    return `Expected 3 illustrated pages, got ${illustratedCount}`;
  }
  return null;
}

// ── CORS preflight ──────────────────────────────────────────────────

export function OPTIONS(request) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
}

// ── Main endpoint (SSE streaming) ───────────────────────────────────

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

  const { childName, age, interests, moral, style, orderId } = body || {};

  // Validate inputs
  if (!childName || typeof childName !== "string" || childName.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Child's name is required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!age || typeof age !== "number" || age < 2 || age > 12) {
    return new Response(JSON.stringify({ error: "Age must be between 2 and 12" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!interests || typeof interests !== "string" || interests.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Interests are required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!orderId || typeof orderId !== "string") {
    return new Response(JSON.stringify({ error: "Missing or invalid order ID" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const lsApiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!lsApiKey) {
    return new Response(JSON.stringify({ error: "Payment verification not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:kids-story-report:${ip}`, MAX_REQUESTS, WINDOW_MS);
  if (retryAfter !== null) {
    return new Response(
      JSON.stringify({ error: `Rate limit reached. Try again in ~${retryAfter} minutes.` }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Verify payment ($3 = 300 cents)
  const orderCheck = await verifyOrder(orderId, lsApiKey, 300);
  if (!orderCheck.valid) {
    return new Response(
      JSON.stringify({ error: `Payment could not be verified: ${orderCheck.reason}` }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── All validation passed — start SSE stream ───────────────────

  const storyStyle = VALID_STYLES.includes(style) ? style : "fairy-tale";
  const replicateToken = process.env.REPLICATE_API_TOKEN;

  const stream = new ReadableStream({
    async start(controller) {
      let heartbeatInterval = null;
      const startTime = Date.now();

      try {
        // Check cache
        const cached = await getCachedReport(orderId);
        if (cached) {
          console.log("[kids-story-report] Serving cached report for order:", orderId);
          sseEvent(controller, "progress", { stage: "cached", message: "Loading your story..." });
          sseEvent(controller, "story", {
            story: cached.story,
            illustrations: cached.illustrations || {},
            generatedAt: cached.generatedAt,
          });
          controller.close();
          return;
        }

        // ── Generate story with Claude ──────────────────────────────
        sseEvent(controller, "progress", { stage: "writing", message: "Writing your story..." });

        heartbeatInterval = setInterval(() => sseComment(controller, "heartbeat"), HEARTBEAT_MS);

        const prompt = buildStoryPrompt(childName.trim(), age, interests.trim(), moral?.trim(), storyStyle);
        let parsed = null;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          if (attempt > 1) {
            sseEvent(controller, "progress", { stage: "retrying", message: `Retrying... (attempt ${attempt})` });
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          }

          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 8000,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          const data = await response.json();

          if (data.error) {
            console.error("[kids-story-report] Claude API error:", data.error);
            if (attempt < MAX_ATTEMPTS) continue;
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            sseEvent(controller, "error", { error: "Story service temporarily unavailable. Please try again." });
            controller.close();
            return;
          }

          if (!data.content?.length) {
            if (attempt < MAX_ATTEMPTS) continue;
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            sseEvent(controller, "error", { error: "Empty response. Please try again." });
            controller.close();
            return;
          }

          const textContent = data.content
            .filter(item => item.type === "text")
            .map(item => item.text)
            .join("\n");

          parsed = extractJSON(textContent, "title");

          if (parsed && parsed.pages) {
            console.log("[kids-story-report] Story generated", {
              title: parsed.title,
              pages: parsed.pages.length,
              tokens_in: data.usage?.input_tokens,
              tokens_out: data.usage?.output_tokens,
            });

            sendToN8n({
              app_name: "Kids Story Creator",
              endpoint_id: "kids_story_paid",
              endpoint: "/api/kids-story-report",
              price: 9.00,
              max_tokens: 8000,
              status: "success",
              tier: "paid",
              model: data.model || "claude-sonnet-4-20250514",
              tokens_input: data.usage?.input_tokens || 0,
              tokens_output: data.usage?.output_tokens || 0,
              latency_ms: Date.now() - startTime,
            });
            break;
          }

          console.error("[kids-story-report] JSON extraction failed", {
            attempt,
            textLength: textContent.length,
            preview: textContent.substring(0, 500),
          });

          if (attempt >= MAX_ATTEMPTS) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            sseEvent(controller, "error", {
              error: "Story generation incomplete — please tap 'Try Again'.",
            });
            controller.close();
            return;
          }
        }

        clearInterval(heartbeatInterval);
        heartbeatInterval = null;

        // Quality gate
        const qualityIssue = checkStoryQuality(parsed);
        if (qualityIssue) {
          console.error("[kids-story-report] Quality gate FAILED:", qualityIssue);
          sseEvent(controller, "error", {
            error: "Story didn't meet quality standards. Please try again.",
          });
          controller.close();
          return;
        }

        // Consume order (or allow retry if previous attempt failed)
        sseEvent(controller, "progress", { stage: "finalizing", message: "Preparing your storybook..." });
        const isFirstUse = await consumeOrder(orderId);
        if (!isFirstUse) {
          const cachedRetry = await getCachedReport(orderId);
          if (cachedRetry) {
            sseEvent(controller, "story", { story: cachedRetry.story, illustrations: cachedRetry.illustrations || {}, generatedAt: cachedRetry.generatedAt });
            controller.close();
            return;
          }
          // No cache means previous attempt failed — allow regeneration
          console.log("[kids-story-report] Order already consumed but no cache found — allowing retry for order:", orderId);
        }

        // ── Generate illustrations ──────────────────────────────────
        let illustrations = {};
        if (replicateToken) {
          sseEvent(controller, "progress", { stage: "illustrating", message: "Painting illustrations..." });

          // Generate illustrations only for the 3 character pages
          const illustratedPages = parsed.pages.filter(p => p.has_illustration && p.illustration_prompt);
          const results = await Promise.all(
            illustratedPages.map(page =>
              generateIllustration(page.illustration_prompt, replicateToken)
            )
          );
          results.forEach((imgBuffer, idx) => {
            const pageNum = illustratedPages[idx].page_number;
            if (imgBuffer) {
              illustrations[pageNum] = imgBuffer;
            }
          });
          sseEvent(controller, "progress", {
            stage: "illustrating",
            message: `Painted ${Object.keys(illustrations).length} of ${illustratedPages.length} character illustrations`,
          });

          console.log("[kids-story-report] Illustrations generated:", {
            total: illustratedPages.length,
            successful: Object.keys(illustrations).length,
          });
        } else {
          console.warn("[kids-story-report] REPLICATE_API_TOKEN not set — skipping illustrations");
        }

        const generatedAt = new Date().toISOString();

        // Convert illustration buffers to base64 for frontend display
        const illustrationBase64 = {};
        for (const [pageNum, buffer] of Object.entries(illustrations)) {
          illustrationBase64[pageNum] = `data:image/png;base64,${buffer.toString("base64")}`;
        }

        // Send story + illustrations to browser
        sseEvent(controller, "story", {
          story: parsed,
          illustrations: illustrationBase64,
          generatedAt,
        });

        // ── Cache ───────────────────────────────────────────────────
        try {
          await cacheReport(orderId, {
            story: parsed,
            illustrations: illustrationBase64,
            generatedAt,
          });
        } catch (cacheErr) {
          console.warn("[kids-story-report] Cache write failed:", cacheErr.message);
        }

        controller.close();
      } catch (err) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        console.error("[kids-story-report] Stream error:", err.message, err.stack);
        sseEvent(controller, "error", { error: "Failed to generate story. Please try again." });
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
