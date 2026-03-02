import generateRoastPdf from "./lib/generate-roast-pdf.js";
import { verifyOrder } from "./lib/verify-order.js";
import { sendReportEmail, maskEmail } from "./lib/send-report-email.js";
import { handleSecurity } from "./lib/security.js";
import { checkRateLimit, consumeOrder } from "./lib/store.js";
import { fetchSite } from "./lib/fetch-site.js";

const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

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
- Respond with ONLY the JSON`;
}

/**
 * Quality gate: detect reports where Claude couldn't actually analyze the site.
 * Returns null if valid, or an error string if the report is garbage.
 */
function checkReportQuality(parsed) {
  // All category scores are 0 → Claude couldn't see the site
  const cats = parsed.categories || {};
  const allZero =
    parsed.overall_score === 0 &&
    Object.values(cats).every((c) => (c.score || 0) === 0);

  if (allZero) {
    return "All scores are 0 — analysis failed";
  }

  // Check for "can't find it" language in the summary/executive fields
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

  // Suspiciously few fixes for a paid report (expect 30+)
  if ((parsed.specific_fixes || []).length < 3) {
    return `Only ${(parsed.specific_fixes || []).length} fixes — analysis likely failed`;
  }

  return null; // Quality OK
}

export default async function handler(req, res) {
  // CORS + origin validation
  if (handleSecurity(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit by IP
  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:roast-report:${ip}`, MAX_REQUESTS, WINDOW_MS);
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

  // Verify payment
  const orderCheck = await verifyOrder(orderId, lsApiKey, 500);
  if (!orderCheck.valid) {
    return res
      .status(403)
      .json({ error: `Payment could not be verified: ${orderCheck.reason}` });
  }

  try {
    // Pre-fetch website content for reliable analysis
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

    console.log("[roast-report] Calling Claude API", { url, orderId });

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
      if (msg.toLowerCase().includes("rate limit")) {
        return res.status(429).json({
          error: "Our AI is taking a breather. Please try again in about a minute.",
        });
      }
      return res.status(502).json({
        error: "Analysis service temporarily unavailable. Please try again.",
      });
    }

    console.log("[roast-report] Response", {
      stop_reason: data.stop_reason,
      input_tokens: data.usage?.input_tokens,
      output_tokens: data.usage?.output_tokens,
      content_blocks: data.content?.length,
    });

    if (!data.content?.length) {
      return res.status(502).json({ error: "Empty response from analysis" });
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
    } else {
      console.error("[roast-report] JSON extraction failed", {
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

    // Quality gate: reject garbage reports (e.g. "can't find the site")
    const qualityIssue = checkReportQuality(parsed);
    if (qualityIssue) {
      console.error("[roast-report] Quality gate FAILED:", qualityIssue, {
        overall_score: parsed.overall_score,
        fixes_count: parsed.specific_fixes?.length,
      });
      return res.status(502).json({
        error: "We couldn't fully analyze this website. Please verify the URL is correct and accessible, then tap 'Try Again'.",
      });
    }

    // Consume order AFTER quality validation — so failed reports allow retry
    const isFirstUse = await consumeOrder(orderId);
    if (!isFirstUse) {
      return res.status(409).json({
        error: "A report has already been generated for this order. Check your email or contact support@vibezap.dev.",
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
