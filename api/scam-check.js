// In-memory rate limiting (persists across warm invocations)
const rateLimit = new Map();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();

  // Clean up expired entries
  for (const [key, entry] of rateLimit) {
    if (now > entry.resetTime) rateLimit.delete(key);
  }

  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return null;
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 60000);
    return retryAfter;
  }

  entry.count++;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit by IP
  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const retryAfter = checkRateLimit(ip);
  if (retryAfter !== null) {
    return res.status(429).json({
      error: `Easy there! You've used all ${MAX_REQUESTS} scam checks for this hour. Come back in ~${retryAfter} minutes.`,
      retryAfter,
    });
  }

  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing or invalid message" });
  }

  if (message.length > 5000) {
    return res.status(400).json({ error: "Message too long. Please keep it under 5,000 characters." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: `You are an expert scam detection analyst. Analyze the following message that someone received and determine if it's a scam.

Here is the message to analyze:
---
${message}
---

Analyze this message carefully for scam indicators. Return ONLY a JSON object (no markdown, no backticks, no preamble) with this exact structure:
{
  "risk_score": <number 1-10, where 1 is perfectly safe and 10 is a definite scam>,
  "verdict": "<one of: Safe, Suspicious, Likely Scam, Definite Scam>",
  "verdict_headline": "<a short, clear one-liner summarizing the assessment>",
  "summary": "<2-3 sentences explaining why this is or isn't a scam, in plain English>",
  "categories": {
    "Urgency Tactics": { "score": <1-10>, "comment": "<one-line observation about urgency/pressure tactics used>" },
    "Identity Spoofing": { "score": <1-10>, "comment": "<one-line observation about impersonation or fake authority>" },
    "Suspicious Links": { "score": <1-10>, "comment": "<one-line observation about suspicious URLs, requests for clicks, or info requests>" },
    "Grammar Red Flags": { "score": <1-10>, "comment": "<one-line observation about grammar, formatting, or professionalism issues>" },
    "Financial Bait": { "score": <1-10>, "comment": "<one-line observation about money-related hooks or payment requests>" },
    "Emotional Manipulation": { "score": <1-10>, "comment": "<one-line observation about fear, greed, or emotional pressure>" }
  },
  "what_to_do": ["<action 1>", "<action 2>", "<action 3>"],
  "severity": "<one of: safe, caution, danger, critical>"
}

Be accurate and helpful. If the message is genuinely safe, say so clearly. If it's a scam, explain the specific tactics being used. The "what_to_do" should be practical, actionable advice. Respond with ONLY the JSON.`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      const msg = data.error.message || "";
      if (msg.toLowerCase().includes("rate limit")) {
        return res.status(429).json({
          error: "Our AI is taking a breather. Please try again in about a minute.",
        });
      }
      return res.status(502).json({ error: "Analysis service temporarily unavailable. Please try again." });
    }

    if (!data.content || data.content.length === 0) {
      return res.status(502).json({ error: "Empty response from API" });
    }

    // Extract text blocks and parse JSON
    const textContent = data.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");

    const jsonMatch = textContent.match(/\{[\s\S]*"risk_score"[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "No valid scam analysis in response" });
    }

    const cleaned = jsonMatch[0].replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.risk_score || !parsed.categories) {
      return res.status(502).json({ error: "Incomplete scam analysis data" });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Scam check API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
