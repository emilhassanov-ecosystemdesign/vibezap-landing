import generateScamPdf from "./lib/generate-scam-pdf.js";
import { verifyOrder } from "./lib/verify-order.js";
import { sendReportEmail, maskEmail } from "./lib/send-report-email.js";
import { handleSecurity } from "./lib/security.js";
import { checkRateLimit, consumeOrder } from "./lib/store.js";

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

const ENHANCED_PROMPT = `You are an expert scam forensic analyst preparing a professional paid report. Analyze the following message in deep detail.

Here is the message to analyze:
---
MESSAGE_PLACEHOLDER
---

Return ONLY a JSON object (no markdown, no backticks) with this exact structure:
{
  "risk_score": <1-10>,
  "verdict": "<Safe|Suspicious|Likely Scam|Definite Scam>",
  "verdict_headline": "<clear one-liner assessment>",
  "summary": "<2-3 sentence brief summary>",
  "executive_summary": "<2-3 detailed paragraphs analyzing the message thoroughly, explaining what makes it dangerous or safe, and providing context about this type of communication>",
  "categories": {
    "Urgency Tactics": { "score": <1-10>, "comment": "<one-line>", "detailed_analysis": "<2-3 sentences with specific examples from the message>" },
    "Identity Spoofing": { "score": <1-10>, "comment": "<one-line>", "detailed_analysis": "<2-3 sentences>" },
    "Suspicious Links": { "score": <1-10>, "comment": "<one-line>", "detailed_analysis": "<2-3 sentences>" },
    "Grammar Red Flags": { "score": <1-10>, "comment": "<one-line>", "detailed_analysis": "<2-3 sentences>" },
    "Financial Bait": { "score": <1-10>, "comment": "<one-line>", "detailed_analysis": "<2-3 sentences>" },
    "Emotional Manipulation": { "score": <1-10>, "comment": "<one-line>", "detailed_analysis": "<2-3 sentences>" }
  },
  "what_to_do": ["<action 1>", "<action 2>", "<action 3>"],
  "technical_indicators": {
    "url_analysis": "<paragraph analyzing URLs, domains, or link patterns — or note if none present>",
    "language_patterns": "<paragraph about language tone, formality, inconsistencies>",
    "social_engineering": ["<technique 1>", "<technique 2>"]
  },
  "immediate_actions": [
    { "priority": "HIGH|MEDIUM|LOW", "action": "<specific step to take NOW, directly tied to a risk found in this message>", "reason": "<one sentence explaining why this matters for THIS specific message>" },
    { "priority": "...", "action": "...", "reason": "..." }
  ],
  "similar_scam_patterns": ["<known scam type 1 with brief description>", "<known scam type 2>"],
  "how_to_report": [
    { "authority": "FTC", "url": "reportfraud.ftc.gov", "description": "<when and how to report>" },
    { "authority": "IC3", "url": "ic3.gov", "description": "<when and how to report>" },
    { "authority": "Local Police", "url": "", "description": "<guidance on filing a report>" }
  ],
  "protection_tips": ["<tip 1>", "<tip 2>", "<tip 3>", "<tip 4>", "<tip 5>"]
}

IMPORTANT RULES:
- "immediate_actions": Provide 3-5 prioritized actions. Each MUST be specific to the risks found in THIS message. Do NOT give generic advice like "enable 2FA" or "don't click links" unless the message actually contains links or credential risks. Tie each action to a concrete finding.
- "protection_tips": Each tip MUST relate to the specific scam type or risk patterns identified in this message. No generic security advice. If the message appears safe, provide tips for recognizing when similar-looking messages ARE scams.

Be thorough and accurate. Provide real, actionable analysis. Respond with ONLY the JSON.`;

export default async function handler(req, res) {
  // CORS + origin validation
  if (handleSecurity(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit by IP
  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:scam-report:${ip}`, MAX_REQUESTS, WINDOW_MS);
  if (retryAfter !== null) {
    return res.status(429).json({
      error: `Rate limit reached. Try again in ~${retryAfter} minutes.`,
    });
  }

  const { message, orderId } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing or invalid message" });
  }
  if (message.length > 5000) {
    return res
      .status(400)
      .json({ error: "Message too long. Keep it under 5,000 characters." });
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
  const orderCheck = await verifyOrder(orderId, lsApiKey, 300);
  if (!orderCheck.valid) {
    return res
      .status(403)
      .json({ error: `Payment could not be verified: ${orderCheck.reason}` });
  }

  // Prevent order ID reuse — each order can only generate one report
  const isFirstUse = await consumeOrder(orderId);
  if (!isFirstUse) {
    return res.status(409).json({
      error: "A report has already been generated for this order. Check your email or contact support@vibezap.dev.",
    });
  }

  try {
    const prompt = ENHANCED_PROMPT.replace("MESSAGE_PLACEHOLDER", message);
    let parsed = null;
    const MAX_ATTEMPTS = 2;
    const RETRY_DELAY_MS = 10_000; // 10s between retries (fits within 30s maxDuration)
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // Wait before retrying (skip delay on first attempt)
      if (attempt > 1) {
        console.log(`[scam-report] Waiting ${RETRY_DELAY_MS / 1000}s before attempt ${attempt}`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }

      console.log(`[scam-report] Attempt ${attempt}`, { orderId });

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
        console.error("[scam-report] Claude API error:", data.error);
        const msg = data.error.message || "";
        if (msg.toLowerCase().includes("rate limit")) {
          lastError = "rate_limit";
          if (attempt < MAX_ATTEMPTS) {
            console.log(`[scam-report] Rate limited, will retry after ${RETRY_DELAY_MS / 1000}s (attempt ${attempt}/${MAX_ATTEMPTS})`);
            continue;
          }
          return res.status(429).json({
            error: "Our AI is taking a breather. Please try again in about a minute.",
          });
        }
        return res.status(502).json({
          error: "Analysis service temporarily unavailable. Please try again.",
        });
      }

      lastError = null;

      console.log(`[scam-report] Response (attempt ${attempt})`, {
        stop_reason: data.stop_reason,
        input_tokens: data.usage?.input_tokens,
        output_tokens: data.usage?.output_tokens,
        content_blocks: data.content?.length,
      });

      if (!data.content?.length) {
        console.error(`[scam-report] Empty response (attempt ${attempt})`);
        if (attempt < MAX_ATTEMPTS) continue;
        return res.status(502).json({ error: "Empty response from analysis" });
      }

      if (data.stop_reason === "max_tokens") {
        console.warn(`[scam-report] Response truncated (attempt ${attempt})`);
      }

      const textContent = data.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");

      parsed = extractJSON(textContent, "risk_score");

      if (parsed && parsed.categories) {
        console.log(`[scam-report] Parse success (attempt ${attempt})`, {
          risk_score: parsed.risk_score,
          verdict: parsed.verdict,
        });
        break;
      }

      console.error(`[scam-report] JSON extraction failed (attempt ${attempt})`, {
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
    const pdfFilename = "scam-forensic-report.pdf";
    try {
      const pdfBuffer = await generateScamPdf({
        ...parsed,
        originalMessage: message,
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
            subject: `Your Scam Forensic Report — ${parsed.verdict}`,
            reportType: "scam",
            reportData: parsed,
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
            originalMessage:
              message.substring(0, 200) +
              (message.length > 200 ? "..." : ""),
          });
        } catch (emailErr) {
          console.error("Email error (non-fatal):", emailErr);
        }
      }
    } catch (pdfErr) {
      console.error("PDF generation error (non-fatal):", pdfErr);
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
      originalMessage:
        message.substring(0, 200) + (message.length > 200 ? "..." : ""),
    });
  } catch (err) {
    console.error("Scam report error:", err);
    return res
      .status(500)
      .json({ error: "Failed to generate report. Please try again." });
  }
}
