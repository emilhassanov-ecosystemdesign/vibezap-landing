import generateRoastPdf from "./lib/generate-roast-pdf.js";
import { verifyOrder } from "./lib/verify-order.js";
import { sendReportEmail, maskEmail } from "./lib/send-report-email.js";

// In-memory rate limiting
const rateLimit = new Map();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  for (const [key, entry] of rateLimit) {
    if (now > entry.resetTime) rateLimit.delete(key);
  }
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return null;
  }
  if (entry.count >= MAX_REQUESTS) {
    return Math.ceil((entry.resetTime - now) / 60000);
  }
  entry.count++;
  return null;
}

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

const ENHANCED_PROMPT = `You are a brutally honest website critic — think Gordon Ramsay reviewing websites. You have a sharp sense of humor but you're also deeply knowledgeable about web design, UX, copywriting, performance, and trust signals. This is a PAID premium report, so be thorough and provide extraordinary detail.

Visit and analyze this website: URL_PLACEHOLDER

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
- Respond with ONLY the JSON`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit
  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const retryAfter = checkRateLimit(ip);
  if (retryAfter !== null) {
    return res.status(429).json({
      error: `Rate limit reached. Try again in ~${retryAfter} minutes.`,
    });
  }

  const { url, orderId } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid URL" });
  }
  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ error: "Missing or invalid order ID" });
  }

  const lsApiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!lsApiKey) {
    return res
      .status(500)
      .json({ error: "Payment verification not configured" });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  // Verify payment (now also returns customer email)
  const orderCheck = await verifyOrder(orderId, lsApiKey, 500);
  if (!orderCheck.valid) {
    return res
      .status(403)
      .json({ error: `Payment could not be verified: ${orderCheck.reason}` });
  }

  try {
    const prompt = ENHANCED_PROMPT.replace("URL_PLACEHOLDER", url);
    let parsed = null;
    const MAX_ATTEMPTS = 2;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`[roast-report] Attempt ${attempt}`, { url, orderId });

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
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();

      // API-level errors: return immediately, no retry
      if (data.error) {
        console.error("[roast-report] Claude API error:", data.error);
        const msg = data.error.message || "";
        if (msg.toLowerCase().includes("rate limit")) {
          return res.status(429).json({
            error: "Our AI is taking a breather. Please try again in about a minute.",
          });
        }
        return res.status(502).json({
          error: "Analysis service temporarily unavailable. Please try again.",
        });
      }

      console.log(`[roast-report] Response (attempt ${attempt})`, {
        stop_reason: data.stop_reason,
        input_tokens: data.usage?.input_tokens,
        output_tokens: data.usage?.output_tokens,
        content_blocks: data.content?.length,
      });

      if (!data.content?.length) {
        console.error(`[roast-report] Empty response (attempt ${attempt})`);
        if (attempt < MAX_ATTEMPTS) continue;
        return res.status(502).json({ error: "Empty response from analysis" });
      }

      if (data.stop_reason === "max_tokens") {
        console.warn(`[roast-report] Response truncated (attempt ${attempt})`);
      }

      const textContent = data.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");

      parsed = extractJSON(textContent, "overall_score");

      if (parsed && parsed.categories) {
        console.log(`[roast-report] Parse success (attempt ${attempt})`, {
          overall_score: parsed.overall_score,
          fixes_count: parsed.specific_fixes?.length,
        });
        break;
      }

      console.error(`[roast-report] JSON extraction failed (attempt ${attempt})`, {
        stop_reason: data.stop_reason,
        output_tokens: data.usage?.output_tokens,
        textLength: textContent.length,
        preview: textContent.substring(0, 500),
        tail: textContent.substring(Math.max(0, textContent.length - 300)),
      });
    }

    if (!parsed || !parsed.categories) {
      return res.status(502).json({
        error: "Analysis incomplete — please tap 'Try Again'. If the problem persists, contact support@vibezap.dev.",
      });
    }

    const generatedAt = new Date().toISOString();

    // Generate PDF
    let pdfBase64 = null;
    const pdfFilename = "website-roast-report.pdf";
    try {
      const pdfBuffer = await generateRoastPdf({
        ...parsed,
        analyzedUrl: url,
        generatedAt,
      });
      pdfBase64 = pdfBuffer.toString("base64");

      // Send email with PDF (non-blocking for errors)
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && orderCheck.userEmail) {
        try {
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
          return res.status(200).json({
            success: true,
            analysis: parsed,
            pdfBase64,
            pdfFilename,
            email: {
              sent: emailResult.sent,
              address: maskEmail(orderCheck.userEmail),
              error: emailResult.sent ? null : emailResult.error,
            },
            generatedAt,
            analyzedUrl: url,
          });
        } catch (emailErr) {
          console.error("Email error (non-fatal):", emailErr);
          // Fall through to return without email
        }
      }
    } catch (pdfErr) {
      console.error("PDF generation error (non-fatal):", pdfErr);
      // Fall through to return without PDF
    }

    // Return JSON (with or without PDF/email)
    return res.status(200).json({
      success: true,
      analysis: parsed,
      pdfBase64,
      pdfFilename,
      email: {
        sent: false,
        address: maskEmail(orderCheck.userEmail),
        error: pdfBase64 ? null : "PDF generation failed",
      },
      generatedAt,
      analyzedUrl: url,
    });
  } catch (err) {
    console.error("Roast report error:", err);
    return res
      .status(500)
      .json({ error: "Failed to generate report. Please try again." });
  }
}
