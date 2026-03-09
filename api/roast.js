import { handleSecurity } from "./lib/security.js";
import { withN8nLogging } from "./lib/n8nLogger.js";
import { checkRateLimit } from "./lib/store.js";
import { fetchSite } from "./lib/fetch-site.js";

const MAX_REQUESTS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Extract and parse JSON from Claude's text response.
 * Tries multiple strategies: direct parse, bracket-counting, greedy regex.
 */
function extractJSON(rawText, requiredField) {
  const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  // Strategy 1: Direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed[requiredField] !== undefined) return parsed;
  } catch (_) {}

  // Strategy 2: Bracket-counted extraction (string-aware)
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

async function handler(req, res) {
  // CORS + origin validation
  if (handleSecurity(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit by IP
  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:roast:${ip}`, MAX_REQUESTS, WINDOW_MS);
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
    // Pre-fetch website content so Claude has actual page data
    const siteData = await fetchSite(url);
    let siteContext = "";
    if (siteData.ok) {
      siteContext = `\n\nHere is the actual content from the website:\n---\nTitle: ${siteData.title || "(none)"}\nDescription: ${siteData.description || "(none)"}\nURL (after redirects): ${siteData.finalUrl || url}\n\nContent:\n${siteData.bodyText}\n---\nBase your analysis on this content. You may also use web_search for additional context.`;
    } else {
      siteContext = `\n\nNote: Pre-fetch failed (${siteData.error || "unavailable"}). Use web_search to find and analyze the website.`;
    }

    const userMessage = `You are a brutally honest website critic with a sharp sense of humor. Analyze this website: ${url}${siteContext}

Return ONLY a JSON object (no markdown, no backticks, no preamble) with this exact structure:
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

Be savage but fair. Think Gordon Ramsay reviewing websites. Make every line quotable and funny. Respond with ONLY the JSON.`;

    const MAX_ATTEMPTS = 2;
    const RETRY_DELAY_MS = 5_000;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) {
        console.log(`[roast] Waiting ${RETRY_DELAY_MS / 1000}s before attempt ${attempt}`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      const data = await response.json();

      req._n8n.setUsage(data);

      if (data.error) {
        const msg = data.error.message || "";
        if (msg.toLowerCase().includes("rate limit")) {
          if (attempt < MAX_ATTEMPTS) {
            console.log(`[roast] Rate limited, will retry (attempt ${attempt}/${MAX_ATTEMPTS})`);
            continue;
          }
          return res.status(429).json({
            error: "Our AI is taking a breather. Please try again in about a minute.",
          });
        }
        return res.status(502).json({ error: "Analysis service temporarily unavailable. Please try again." });
      }

      if (!data.content || data.content.length === 0) {
        if (attempt < MAX_ATTEMPTS) continue;
        return res.status(502).json({ error: "Empty response from API" });
      }

      // Extract text blocks and parse JSON
      const textContent = data.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");

      const parsed = extractJSON(textContent, "overall_score");

      if (parsed && parsed.categories) {
        return res.status(200).json(parsed);
      }

      console.error("[roast] JSON extraction failed", {
        textLength: textContent.length,
        preview: textContent.substring(0, 500),
      });
    }

    return res.status(502).json({ error: "Could not parse the roast. Please try again." });
  } catch (err) {
    console.error("Roast API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withN8nLogging({
  appName: "Roast My Website",
  endpointId: "roast_free",
  endpoint: "/api/roast",
  price: 0,
  maxTokens: 1000,
}, handler);
