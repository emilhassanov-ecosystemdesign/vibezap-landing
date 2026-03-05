/**
 * POST /api/land-design-report — Paid tier ($7) land design report (SSE streaming)
 *
 * Pipeline: verify payment → analyze sketch → enhanced report → generate image → PDF → email
 */

import { validateOrigin, getCorsHeaders } from "./lib/security.js";
import { checkRateLimit, consumeOrder, cacheReport, getCachedReport } from "./lib/store.js";
import { verifyOrder } from "./lib/verify-order.js";
import { sendReportEmail, maskEmail } from "./lib/send-report-email.js";
import { fetchAllSiteData, geocodeAddress } from "./lib/site-data-fetcher.js";
import { SKETCH_ANALYSIS_PROMPT, buildPaidReportPrompt, buildImageGenerationPrompt, formatSiteDataForPrompt } from "./lib/permaculture-prompts.js";
import generateGardenPdf from "./lib/generate-garden-pdf.js";

const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000;
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

  const { address, description, sketchBase64, siteData: clientSiteData, location: clientLocation, orderId } = body || {};

  if (!orderId || typeof orderId !== "string") {
    return new Response(JSON.stringify({ error: "Missing order ID" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!address || !description) {
    return new Response(JSON.stringify({ error: "Missing address or description" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const lsApiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!anthropicKey || !lsApiKey) {
    return new Response(JSON.stringify({ error: "API not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:land-report:${ip}`, MAX_REQUESTS, WINDOW_MS);
  if (retryAfter !== null) {
    return new Response(
      JSON.stringify({ error: `Rate limit reached. Try again in ~${retryAfter} minutes.` }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Verify payment
  const orderCheck = await verifyOrder(orderId, lsApiKey, 700);
  if (!orderCheck.valid) {
    return new Response(
      JSON.stringify({ error: `Payment could not be verified: ${orderCheck.reason}` }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Start SSE stream ──────────────────────────────────────────────

  const stream = new ReadableStream({
    async start(controller) {
      let heartbeatInterval = null;

      try {
        // Check cache
        const cached = await getCachedReport(orderId);
        if (cached) {
          sseEvent(controller, "progress", { stage: "cached", message: "Loading your report..." });
          if (cached.reportMarkdown) sseEvent(controller, "report", { reportMarkdown: cached.reportMarkdown });
          if (cached.imageBase64) sseEvent(controller, "image", { imageBase64: cached.imageBase64 });
          if (cached.pdfBase64) sseEvent(controller, "pdf", { pdfBase64: cached.pdfBase64, pdfFilename: "land-design-report.pdf" });
          sseEvent(controller, "email", { sent: cached.emailSent || false, address: cached.emailAddress || null, error: null });
          controller.close();
          return;
        }

        heartbeatInterval = setInterval(() => sseComment(controller, "heartbeat"), HEARTBEAT_MS);

        // Resolve location + site data (use client data if available, else re-fetch)
        let location = clientLocation;
        let siteData = clientSiteData;

        if (!location) {
          sseEvent(controller, "progress", { stage: "geocoding", message: "Locating property..." });
          location = await geocodeAddress(address.trim());
        }
        if (!siteData) {
          sseEvent(controller, "progress", { stage: "fetching", message: "Fetching site data..." });
          siteData = await fetchAllSiteData(location.lat, location.lng);
        }

        // Step 1: Analyze sketch with Claude Vision
        let sketchAnalysis = "No sketch provided.";
        if (sketchBase64) {
          sseEvent(controller, "progress", { stage: "analyzing_sketch", message: "Analyzing your sketch..." });

          const mediaTypeMatch = sketchBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
          const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : "image/jpeg";
          const base64Data = sketchBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

          const analysisResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 2000,
              messages: [{
                role: "user",
                content: [
                  { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
                  { type: "text", text: SKETCH_ANALYSIS_PROMPT },
                ],
              }],
            }),
          });

          const analysisData = await analysisResponse.json();
          if (analysisData.content?.[0]?.text) {
            sketchAnalysis = analysisData.content[0].text;
          }
        }

        // Step 2: Generate enhanced report
        sseEvent(controller, "progress", { stage: "generating_report", message: "Generating enhanced design report..." });
        const { system, user } = buildPaidReportPrompt(sketchAnalysis, siteData, location, description.trim());

        const reportResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8000,
            system,
            messages: [{ role: "user", content: user }],
          }),
        });

        const reportData = await reportResponse.json();
        const reportMarkdown = reportData.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";

        if (!reportMarkdown || reportMarkdown.length < 100) {
          clearInterval(heartbeatInterval);
          sseEvent(controller, "error", { error: "Report generation failed. Please try again." });
          controller.close();
          return;
        }

        // Consume order after successful report generation
        const isFirstUse = await consumeOrder(orderId);
        if (!isFirstUse) {
          const cachedRetry = await getCachedReport(orderId);
          if (cachedRetry) {
            if (cachedRetry.reportMarkdown) sseEvent(controller, "report", { reportMarkdown: cachedRetry.reportMarkdown });
            if (cachedRetry.imageBase64) sseEvent(controller, "image", { imageBase64: cachedRetry.imageBase64 });
            if (cachedRetry.pdfBase64) sseEvent(controller, "pdf", { pdfBase64: cachedRetry.pdfBase64, pdfFilename: "land-design-report.pdf" });
            sseEvent(controller, "email", { sent: cachedRetry.emailSent || false, address: cachedRetry.emailAddress || null });
            clearInterval(heartbeatInterval);
            controller.close();
            return;
          }
        }

        sseEvent(controller, "report", { reportMarkdown });

        // Step 3: Generate realistic image (OpenAI gpt-image-1)
        let imageBase64 = null;
        if (openaiKey) {
          sseEvent(controller, "progress", { stage: "generating_image", message: "Creating realistic rendering..." });

          try {
            if (sketchBase64) {
              // With sketch: use images/edits to transform sketch into realistic rendering
              const imagePrompt = `Transform this hand-drawn permaculture site sketch into a photorealistic aerial photograph of a thriving permaculture property. Show mature plantings, garden beds, water features, and structures as they would look after 3-5 years of growth. Maintain the spatial layout from the sketch. Include lush vegetation, diverse plantings, natural materials, and a well-integrated landscape. The style should be a realistic drone photograph on a sunny day.`;

              const mediaTypeMatch = sketchBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
              const base64Data = sketchBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

              const imgResponse = await fetch("https://api.openai.com/v1/images/edits", {
                method: "POST",
                headers: { "Authorization": `Bearer ${openaiKey}` },
                body: await buildImageFormData(base64Data, mediaTypeMatch?.[1] || "image/png", imagePrompt),
              });

              if (imgResponse.ok) {
                const imgData = await imgResponse.json();
                if (imgData.data?.[0]?.b64_json) {
                  imageBase64 = `data:image/png;base64,${imgData.data[0].b64_json}`;
                }
              } else {
                console.error("[land-design-report] Image edit failed:", imgResponse.status);
              }
            } else {
              // Without sketch: use images/generations with descriptive prompt
              const imagePrompt = buildImageGenerationPrompt(location, siteData, description.trim());

              const imgResponse = await fetch("https://api.openai.com/v1/images/generations", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${openaiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "gpt-image-1",
                  prompt: imagePrompt,
                  size: "1536x1024",
                  quality: "high",
                  response_format: "b64_json",
                  n: 1,
                }),
              });

              if (imgResponse.ok) {
                const imgData = await imgResponse.json();
                if (imgData.data?.[0]?.b64_json) {
                  imageBase64 = `data:image/png;base64,${imgData.data[0].b64_json}`;
                }
              } else {
                console.error("[land-design-report] Image generation failed:", imgResponse.status);
              }
            }
          } catch (imgErr) {
            console.error("[land-design-report] Image generation error:", imgErr.message);
          }
        }

        if (imageBase64) {
          sseEvent(controller, "image", { imageBase64 });
        }

        // Step 4: Generate PDF
        let pdfBase64 = null;
        const pdfFilename = "land-design-report.pdf";
        try {
          sseEvent(controller, "progress", { stage: "generating_pdf", message: "Building your PDF report..." });
          const pdfBuffer = await generateGardenPdf({
            reportMarkdown,
            location,
            siteData,
            sketchAnalysis: sketchBase64 ? sketchAnalysis : null,
            imageBase64,
          });
          pdfBase64 = pdfBuffer.toString("base64");
          sseEvent(controller, "pdf", { pdfBase64, pdfFilename });
        } catch (pdfErr) {
          console.error("[land-design-report] PDF error:", pdfErr.message);
        }

        // Step 5: Email delivery
        let emailSent = false;
        let emailAddress = null;
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey && orderCheck.userEmail && pdfBase64) {
          try {
            sseEvent(controller, "progress", { stage: "sending_email", message: "Sending to your inbox..." });
            const pdfBuffer = Buffer.from(pdfBase64, "base64");
            const emailResult = await sendReportEmail({
              to: orderCheck.userEmail,
              userName: orderCheck.userName,
              subject: `Your Land Design Report — ${location.displayName?.split(",")[0] || "Property"}`,
              reportType: "land",
              reportData: { reportMarkdown, location },
              pdfBuffer,
              pdfFilename,
              resendApiKey,
            });
            emailSent = emailResult.sent;
            emailAddress = maskEmail(orderCheck.userEmail);
          } catch (emailErr) {
            console.error("[land-design-report] Email error:", emailErr.message);
            emailAddress = maskEmail(orderCheck.userEmail);
          }
        }

        sseEvent(controller, "email", {
          sent: emailSent,
          address: emailAddress,
          error: emailSent ? null : (!resendApiKey ? "Email not configured" : null),
        });

        // Cache report
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;

        try {
          await cacheReport(orderId, {
            reportMarkdown,
            imageBase64,
            pdfBase64,
            pdfFilename,
            emailSent,
            emailAddress,
          });
        } catch (cacheErr) {
          console.warn("[land-design-report] Cache write failed:", cacheErr.message);
        }

        controller.close();
      } catch (err) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        console.error("[land-design-report] Stream error:", err);
        sseEvent(controller, "error", { error: "Failed to generate premium report. Please try again." });
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

/**
 * Build multipart/form-data for OpenAI images/edits endpoint.
 * Node 18+ has native FormData + Blob support.
 */
async function buildImageFormData(base64Data, mimeType, prompt) {
  const imageBuffer = Buffer.from(base64Data, "base64");
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const blob = new Blob([imageBuffer], { type: mimeType });

  const formData = new FormData();
  formData.append("model", "gpt-image-1");
  formData.append("image", blob, `sketch.${ext}`);
  formData.append("prompt", prompt);
  formData.append("size", "1536x1024");
  formData.append("quality", "high");
  formData.append("response_format", "b64_json");

  return formData;
}
