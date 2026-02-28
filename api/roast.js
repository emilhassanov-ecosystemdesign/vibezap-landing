// In-memory rate limiting (persists across warm invocations)
const rateLimit = new Map();
const MAX_REQUESTS = 3;
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
      error: `Whoa, slow down! You've used all ${MAX_REQUESTS} roasts for this hour. Come back in ~${retryAfter} minutes for more burns.`,
      retryAfter,
    });
  }

  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid URL" });
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
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          {
            role: "user",
            content: `You are a brutally honest website critic with a sharp sense of humor. Visit and analyze this website: ${url}

Analyze the website and return ONLY a JSON object (no markdown, no backticks, no preamble) with this exact structure:
{
  "overall_score": <number 1-10>,
  "roast_headline": "<a short, savage, funny one-liner roast of the site>",
  "roast_summary": "<2-3 sentences of brutally honest but constructive feedback, written in a funny roasting style>",
  "categories": {
    "Design": { "score": <1-10>, "comment": "<one funny roast line about the design>" },
    "Copy": { "score": <1-10>, "comment": "<one funny roast line about the writing/copy>" },
    "UX": { "score": <1-10>, "comment": "<one funny roast line about user experience>" },
    "Performance": { "score": <1-10>, "comment": "<one funny roast line about speed/performance>" },
    "Trust": { "score": <1-10>, "comment": "<one funny roast line about credibility/trust signals>" }
  },
  "top_fixes": ["<fix 1>", "<fix 2>", "<fix 3>"],
  "severity": "<one of: brutal, harsh, mild, decent, fire>"
}

Be savage but fair. Think Gordon Ramsay reviewing websites. Make every line quotable and funny. Respond with ONLY the JSON.`,
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

    const jsonMatch = textContent.match(/\{[\s\S]*"overall_score"[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "No valid roast data in response" });
    }

    const cleaned = jsonMatch[0].replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.overall_score || !parsed.categories) {
      return res.status(502).json({ error: "Incomplete roast data" });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Roast API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
