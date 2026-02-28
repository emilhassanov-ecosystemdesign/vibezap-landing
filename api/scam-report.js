import generateScamPdf from "./lib/generate-scam-pdf.js";
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
  "similar_scam_patterns": ["<known scam type 1 with brief description>", "<known scam type 2>"],
  "how_to_report": [
    { "authority": "FTC", "url": "reportfraud.ftc.gov", "description": "<when and how to report>" },
    { "authority": "IC3", "url": "ic3.gov", "description": "<when and how to report>" },
    { "authority": "Local Police", "url": "", "description": "<guidance on filing a report>" }
  ],
  "protection_tips": ["<tip 1>", "<tip 2>", "<tip 3>", "<tip 4>", "<tip 5>"]
}

Be thorough and accurate. Provide real, actionable analysis. Respond with ONLY the JSON.`;

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

  // Verify payment (now also returns customer email)
  const orderCheck = await verifyOrder(orderId, lsApiKey, 300);
  if (!orderCheck.valid) {
    return res
      .status(403)
      .json({ error: `Payment could not be verified: ${orderCheck.reason}` });
  }

  try {
    // Enhanced Claude analysis
    const prompt = ENHANCED_PROMPT.replace("MESSAGE_PLACEHOLDER", message);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Claude API error:", data.error);
      const msg = data.error.message || "";
      if (msg.toLowerCase().includes("rate limit")) {
        return res.status(429).json({
          error: "Our AI is taking a breather. Please try again in about a minute.",
        });
      }
      return res
        .status(502)
        .json({ error: "Analysis service temporarily unavailable. Please try again." });
    }

    if (!data.content?.length) {
      return res.status(502).json({ error: "Empty response from analysis" });
    }

    const textContent = data.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");

    const jsonMatch = textContent.match(/\{[\s\S]*"risk_score"[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "Could not parse analysis" });
    }

    const cleaned = jsonMatch[0].replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.risk_score || !parsed.categories) {
      return res.status(502).json({ error: "Incomplete analysis data" });
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
