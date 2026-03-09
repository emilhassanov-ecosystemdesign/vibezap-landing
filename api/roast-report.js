import generateRoastPdf from "./lib/generate-roast-pdf.js";
import { sendToN8n } from "./lib/n8nLogger.js";
import { verifyOrder } from "./lib/verify-order.js";
import { sendReportEmail, maskEmail } from "./lib/send-report-email.js";
import { validateOrigin, getCorsHeaders } from "./lib/security.js";
import { checkRateLimit, consumeOrder, cacheReport, getCachedReport } from "./lib/store.js";
import { fetchSite } from "./lib/fetch-site.js";

const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 10_000;
const HEARTBEAT_MS = 12_000;

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

// ── Business logic (unchanged) ──────────────────────────────────────

/**
 * Extract and parse JSON from Claude's text response.
 * Tries multiple strategies: direct parse, bracket-counting, greedy regex.
 */
function extractJSON(rawText, requiredField) {
  const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  // Strategy 1: Direct parse (response is pure JSON)
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed[requiredField] !== undefined) return parsed;
  } catch (_) {}

  // Strategy 2: Bracket-counted extraction (string-aware)
  const startIdx = cleaned.indexOf("{");
  if (startIdx !== -1) {
    let depth = 0;
    let endIdx = -1;
    let inString = false;
    let escape = false;
    for (let i = startIdx; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) { endIdx = i; break; }
      }
    }
    if (endIdx !== -1) {
      try {
        const parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
        if (parsed[requiredField] !== undefined) return parsed;
      } catch (_) {}
    }
  }

  // Strategy 3: Greedy regex fallback
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0].replace(/```json|```/g, "").trim());
      if (parsed[requiredField] !== undefined) return parsed;
    } catch (_) {}
  }

  return null;
}

/**
 * Build the enhanced prompt. If we have pre-fetched site content, include it
 * so Claude doesn't depend solely on web_search finding the site.
 */
function buildEnhancedPrompt(url, siteData) {
  let siteContext = "";
  if (siteData && siteData.ok) {
    siteContext = `\n\nHere is the actual content fetched from the website for your reference. Use this as your PRIMARY source for analysis:\n---\nPage Title: ${siteData.title || "(none)"}\nMeta Description: ${siteData.description || "(none)"}\nURL (after redirects): ${siteData.finalUrl || url}\n\nPage Content:\n${siteData.bodyText}\n---\nYou may also use web_search for supplementary research (competitors, industry context, etc.), but base your analysis on the content above.`;
  } else {
    siteContext = `\n\nNote: We attempted to pre-fetch this website but it ${siteData?.error ? `failed (${siteData.error})` : "was unavailable"}. Use web_search to find and analyze the website. If you truly cannot access or find ANY information about this site, you MUST still provide your best analysis based on whatever you can find.`;
  }

  return `You are a brutally honest website critic — think Gordon Ramsay reviewing websites. You have a sharp sense of humor but you're also deeply knowledgeable about web design, UX, copywriting, performance, and trust signals. This is a PAID premium report, so be thorough and provide extraordinary detail.

Analyze this website: ${url}${siteContext}

Return ONLY a JSON object (no markdown, no backticks, no preamble) with this exact structure:
{
  "overall_score": <number 1-10>,
  "roast_headline": "<a short, savage, funny one-liner roast>",
  "roast_summary": "<2-3 sentences of brutally honest but constructive summary>",
  "severity": "<one of: brutal, harsh, mild, decent, fire>",
  "executive_summary": "<2-3 detailed paragraphs analyzing the website thoroughly — cover first impressions, overall strategy, and the biggest opportunities. Maintain the Gordon Ramsay roasting tone but be genuinely insightful and actionable>",
  "categories": {
    "Design": { "score": <1-10>, "comment": "<one funny roast line>", "detailed_analysis": "<2-3 sentences with specific observations about layout, colors, typography, visual hierarchy, whitespace, and overall aesthetics>" },
    "Copy": { "score": <1-10>, "comment": "<one funny roast line>", "detailed_analysis": "<2-3 sentences about headline clarity, value proposition, CTAs, tone of voice, and persuasion techniques>" },
    "UX": { "score": <1-10>, "comment": "<one funny roast line>", "detailed_analysis": "<2-3 sentences about navigation, information architecture, mobile experience, forms, and user flow>" },
    "Performance": { "score": <1-10>, "comment": "<one funny roast line>", "detailed_analysis": "<2-3 sentences about load time perception, image optimization, render-blocking resources, and technical debt signals>" },
    "Trust": { "score": <1-10>, "comment": "<one funny roast line>", "detailed_analysis": "<2-3 sentences about social proof, testimonials, security indicators, branding consistency, and credibility signals>" }
  },
  "specific_fixes": [
    { "title": "<short fix name>", "description": "<1-2 sentences explaining what to do and why>", "priority": "<high|medium|low>", "category": "<Design|Copy|UX|Performance|Trust>" }
  ],
  "quick_wins": ["<easy fix 1>", "<easy fix 2>", "<easy fix 3>", "<easy fix 4>", "<easy fix 5>"],
  "competitor_insights": [
    { "suggestion": "<what competitors do better>", "example": "<specific example or reference>" }
  ],
  "seo_notes": "<paragraph about SEO observations — meta tags, heading structure, content quality, internal linking>",
  "accessibility_notes": "<paragraph about accessibility — contrast, alt text, keyboard nav, ARIA labels>",
  "mobile_notes": "<paragraph about mobile experience — responsive design, touch targets, mobile-specific issues>"
}

IMPORTANT:
- "specific_fixes" must contain AT LEAST 30 items, spread across all 5 categories and all 3 priority levels
- "competitor_insights" should have exactly 3 items
- Be savage but fair. Every observation must be specific to THIS website, not generic advice
- Make every roast line quotable and funny
- Write ALL text in English only. If the website contains non-English text (Cyrillic, CJK, Arabic, etc.), transliterate or describe it — NEVER include raw non-Latin characters in the JSON output
- Respond with ONLY the JSON`;
}

/**
 * Quality gate: detect reports where Claude couldn't actually analyze the site.
 * Returns null if valid, or an error string if the report is garbage.
 */
function checkReportQuality(parsed) {
  const cats = parsed.categories || {};
  const allZero =
    parsed.overall_score === 0 &&
    Object.values(cats).every((c) => (c.score || 0) === 0);

  if (allZero) {
    return "All scores are 0 — analysis failed";
  }

  const textToCheck = [
    parsed.executive_summary || "",
    parsed.roast_summary || "",
  ]
    .join(" ")
    .toLowerCase();

  const failPhrases = [
    "unable to access",
    "unable to locate",
    "could not locate",
    "could not access",
    "could not be accessed",
    "could not find",
    "cannot be accessed",
    "doesn't exist",
    "does not exist",
    "vanished",
    "website is down",
    "website appears to be",
    "couldn't reach",
    "cannot reach",
  ];

  for (const phrase of failPhrases) {
    if (textToCheck.includes(phrase)) {
      return `Analysis contains failure language: "${phrase}"`;
    }
  }

  if ((parsed.specific_fixes || []).length < 3) {
    return `Only ${(parsed.specific_fixes || []).length} fixes — analysis likely failed`;
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

  // Block untrusted browser origins
  const { allowed, isBrowser } = validateOrigin(origin);
  if (isBrowser && !allowed) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { url, orderId } = body || {};

  if (!url || typeof url !== "string") {
    return new Response(JSON.stringify({ error: "Missing or invalid URL" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!orderId || typeof orderId !== "string") {
    return new Response(JSON.stringify({ error: "Missing or invalid order ID" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const lsApiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!lsApiKey) {
    return new Response(JSON.stringify({ error: "Payment verification not configured" }), {
      status: 500,
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

  // Rate limit by IP
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:roast-report:${ip}`, MAX_REQUESTS, WINDOW_MS);
  if (retryAfter !== null) {
    return new Response(
      JSON.stringify({ error: `Rate limit reached. Try again in ~${retryAfter} minutes.` }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Verify payment (before starting stream — returns normal HTTP errors)
  const orderCheck = await verifyOrder(orderId, lsApiKey, 500);
  if (!orderCheck.valid) {
    return new Response(
      JSON.stringify({ error: `Payment could not be verified: ${orderCheck.reason}` }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── All validation passed — start SSE stream ───────────────────

  const stream = new ReadableStream({
    async start(controller) {
      let heartbeatInterval = null;

      const startTime = Date.now();

      try {
        // Check for cached report (retry scenario)
        const cached = await getCachedReport(orderId);
        if (cached) {
          console.log("[roast-report] Serving cached report for order:", orderId);
          sseEvent(controller, "progress", { stage: "cached", message: "Loading your report..." });
          sseEvent(controller, "analysis", {
            analysis: cached.analysis,
            analyzedUrl: cached.analyzedUrl,
            generatedAt: cached.generatedAt,
          });
          if (cached.pdfBase64) {
            sseEvent(controller, "pdf", {
              pdfBase64: cached.pdfBase64,
              pdfFilename: cached.pdfFilename || "website-roast-report.pdf",
            });
          }
          sseEvent(controller, "email", {
            sent: cached.emailSent || false,
            address: cached.emailAddress || null,
            error: null,
          });
          controller.close();
          return;
        }

        // Pre-fetch website
        sseEvent(controller, "progress", { stage: "fetching", message: "Scanning website..." });
        console.log("[roast-report] Pre-fetching website:", url);
        const siteData = await fetchSite(url);
        console.log("[roast-report] Pre-fetch result:", {
          ok: siteData.ok,
          title: siteData.title?.substring(0, 60),
          bodyLength: siteData.bodyText?.length,
          error: siteData.error,
        });

        const prompt = buildEnhancedPrompt(url, siteData);
        let parsed = null;

        // Claude API call with retry loop
        sseEvent(controller, "progress", { stage: "analyzing", message: "Running deep analysis..." });

        // Start heartbeat to keep connection alive during Claude call
        heartbeatInterval = setInterval(() => sseComment(controller, "heartbeat"), HEARTBEAT_MS);

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          if (attempt > 1) {
            sseEvent(controller, "progress", {
              stage: "retrying",
              message: `Retrying analysis... (attempt ${attempt})`,
            });
            console.log(`[roast-report] Waiting ${RETRY_DELAY_MS / 1000}s before attempt ${attempt}`);
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          }

          console.log("[roast-report] Calling Claude API", { url, orderId, attempt });

          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 16000,
              tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
              messages: [{ role: "user", content: prompt }],
            }),
          });

          const data = await response.json();

          if (data.error) {
            console.error("[roast-report] Claude API error:", data.error);
            const msg = data.error.message || "";
            if (msg.toLowerCase().includes("rate limit") && attempt < MAX_ATTEMPTS) {
              continue; // Retry on rate limit
            }
            if (attempt < MAX_ATTEMPTS) continue;
            // Final attempt failed
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            const userMsg = msg.toLowerCase().includes("rate limit")
              ? "Our AI is taking a breather. Please try again in about a minute."
              : "Analysis service temporarily unavailable. Please try again.";
            sseEvent(controller, "error", { error: userMsg });
            controller.close();
            return;
          }

          console.log("[roast-report] Response", {
            stop_reason: data.stop_reason,
            input_tokens: data.usage?.input_tokens,
            output_tokens: data.usage?.output_tokens,
            content_blocks: data.content?.length,
          });

          if (!data.content?.length) {
            if (attempt < MAX_ATTEMPTS) continue;
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            sseEvent(controller, "error", { error: "Empty response from analysis. Please try again." });
            controller.close();
            return;
          }

          if (data.stop_reason === "max_tokens") {
            console.warn("[roast-report] Response truncated");
          }

          const textContent = data.content
            .filter((item) => item.type === "text")
            .map((item) => item.text)
            .join("\n");

          parsed = extractJSON(textContent, "overall_score");

          if (parsed && parsed.categories) {
            console.log("[roast-report] Parse success", {
              overall_score: parsed.overall_score,
              fixes_count: parsed.specific_fixes?.length,
            });
            // Log to n8n analytics
            sendToN8n({
              app_name: "Roast My Website",
              endpoint_id: "roast_paid",
              endpoint: "/api/roast-report",
              price: 5.00,
              max_tokens: 16000,
              status: "success",
              tier: "paid",
              model: data.model || "claude-sonnet-4-20250514",
              tokens_input: data.usage?.input_tokens || 0,
              tokens_output: data.usage?.output_tokens || 0,
              latency_ms: Date.now() - startTime,
              used_web_search: true,
              web_search_count: 3,
            });
            break; // Success — exit retry loop
          }

          console.error("[roast-report] JSON extraction failed", {
            attempt,
            stop_reason: data.stop_reason,
            output_tokens: data.usage?.output_tokens,
            textLength: textContent.length,
            preview: textContent.substring(0, 500),
            tail: textContent.substring(Math.max(0, textContent.length - 300)),
          });

          if (attempt >= MAX_ATTEMPTS) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            sseEvent(controller, "error", {
              error: "Analysis incomplete — please tap 'Try Again'. If the problem persists, contact support@vibezap.dev.",
            });
            controller.close();
            return;
          }
        }

        // Stop heartbeat
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;

        // Quality gate
        const qualityIssue = checkReportQuality(parsed);
        if (qualityIssue) {
          console.error("[roast-report] Quality gate FAILED:", qualityIssue, {
            overall_score: parsed.overall_score,
            fixes_count: parsed.specific_fixes?.length,
          });
          sseEvent(controller, "error", {
            error: "We couldn't fully analyze this website. Please verify the URL is correct and accessible, then tap 'Try Again'.",
          });
          controller.close();
          return;
        }

        // Consume order AFTER quality validation
        sseEvent(controller, "progress", { stage: "finalizing", message: "Preparing your report..." });
        const isFirstUse = await consumeOrder(orderId);
        if (!isFirstUse) {
          // Order already consumed — try cache (edge case: previous request completed but user didn't see it)
          const cachedRetry = await getCachedReport(orderId);
          if (cachedRetry) {
            sseEvent(controller, "analysis", {
              analysis: cachedRetry.analysis,
              analyzedUrl: cachedRetry.analyzedUrl,
              generatedAt: cachedRetry.generatedAt,
            });
            if (cachedRetry.pdfBase64) {
              sseEvent(controller, "pdf", {
                pdfBase64: cachedRetry.pdfBase64,
                pdfFilename: cachedRetry.pdfFilename || "website-roast-report.pdf",
              });
            }
            sseEvent(controller, "email", {
              sent: cachedRetry.emailSent || false,
              address: cachedRetry.emailAddress || null,
              error: null,
            });
            controller.close();
            return;
          }
          sseEvent(controller, "error", {
            error: "A report has already been generated for this order. Check your email or contact support@vibezap.dev.",
          });
          controller.close();
          return;
        }

        const generatedAt = new Date().toISOString();

        // ── Browser-first: send analysis immediately ──────────────
        sseEvent(controller, "analysis", {
          analysis: parsed,
          analyzedUrl: url,
          generatedAt,
        });

        // ── PDF generation ────────────────────────────────────────
        let pdfBase64 = null;
        const pdfFilename = "website-roast-report.pdf";
        try {
          sseEvent(controller, "progress", { stage: "pdf", message: "Creating your PDF report..." });
          const pdfBuffer = await generateRoastPdf({
            ...parsed,
            analyzedUrl: url,
            generatedAt,
          });
          pdfBase64 = pdfBuffer.toString("base64");
          sseEvent(controller, "pdf", { pdfBase64, pdfFilename });
        } catch (pdfErr) {
          console.error("PDF generation error (non-fatal):", pdfErr);
          // Analysis already delivered — PDF is optional
        }

        // ── Email delivery ────────────────────────────────────────
        let emailSent = false;
        let emailAddress = null;
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey && orderCheck.userEmail && pdfBase64) {
          try {
            sseEvent(controller, "progress", { stage: "email", message: "Sending to your inbox..." });
            const pdfBuffer = Buffer.from(pdfBase64, "base64");
            const emailResult = await sendReportEmail({
              to: orderCheck.userEmail,
              userName: orderCheck.userName,
              subject: `Your Website Roast Report — ${parsed.overall_score}/10`,
              reportType: "roast",
              reportData: { ...parsed, analyzedUrl: url },
              pdfBuffer,
              pdfFilename,
              resendApiKey,
            });
            emailSent = emailResult.sent;
            emailAddress = maskEmail(orderCheck.userEmail);
            sseEvent(controller, "email", {
              sent: emailSent,
              address: emailAddress,
              error: emailSent ? null : emailResult.error,
            });
          } catch (emailErr) {
            console.error("Email error (non-fatal):", emailErr);
            emailAddress = maskEmail(orderCheck.userEmail);
            sseEvent(controller, "email", {
              sent: false,
              address: emailAddress,
              error: "Email delivery failed",
            });
          }
        } else if (!pdfBase64) {
          // No PDF → no email attachment possible
          sseEvent(controller, "email", {
            sent: false,
            address: orderCheck.userEmail ? maskEmail(orderCheck.userEmail) : null,
            error: "PDF generation failed — email skipped",
          });
        }

        // ── Cache report for retry resilience ─────────────────────
        try {
          await cacheReport(orderId, {
            analysis: parsed,
            analyzedUrl: url,
            generatedAt,
            pdfBase64,
            pdfFilename,
            emailSent,
            emailAddress,
          });
        } catch (cacheErr) {
          console.warn("[roast-report] Cache write failed:", cacheErr.message);
        }

        controller.close();
      } catch (err) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        console.error("Roast report stream error:", err);
        sseEvent(controller, "error", {
          error: "Failed to generate report. Please try again.",
        });
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
