import { handleSecurity } from "./lib/security.js";
import { withN8nLogging } from "./lib/n8nLogger.js";
import { checkRateLimit } from "./lib/store.js";

const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const VALID_STYLES = ["fairy-tale", "adventure", "bedtime", "funny", "educational"];

const STYLE_INSTRUCTIONS = {
  "fairy-tale": "a classic fairy tale with magical elements, enchanted settings, and a satisfying resolution",
  "adventure": "an exciting adventure story with exploration, challenges, and bravery",
  "bedtime": "a gentle, soothing bedtime story with calming imagery and a peaceful ending",
  "funny": "a silly, humorous story with funny situations and playful language that makes kids giggle",
  "educational": "an engaging story that weaves in learning moments naturally without being preachy",
};

async function handler(req, res) {
  if (handleSecurity(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:kids-story:${ip}`, MAX_REQUESTS, WINDOW_MS);
  if (retryAfter !== null) {
    return res.status(429).json({
      error: `You've used all ${MAX_REQUESTS} story previews for this hour. Come back in ~${retryAfter} minutes.`,
      retryAfter,
    });
  }

  const { childName, age, interests, moral, style } = req.body;

  if (!childName || typeof childName !== "string" || childName.trim().length === 0) {
    return res.status(400).json({ error: "Child's name is required" });
  }
  if (!age || typeof age !== "number" || age < 2 || age > 12) {
    return res.status(400).json({ error: "Age must be between 2 and 12" });
  }
  if (!interests || typeof interests !== "string" || interests.trim().length === 0) {
    return res.status(400).json({ error: "Interests are required" });
  }
  if (childName.length > 50 || interests.length > 200 || (moral && moral.length > 150)) {
    return res.status(400).json({ error: "Input too long" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const storyStyle = VALID_STYLES.includes(style) ? style : "fairy-tale";
  const styleDesc = STYLE_INSTRUCTIONS[storyStyle];

  const moralLine = moral
    ? `The story should naturally incorporate this moral or lesson: "${moral}".`
    : "The story should have a positive, uplifting message.";

  try {
    const userMessage = `You are a beloved children's story author. Write a short story preview for a child.

Details:
- Child's name: ${childName.trim()}
- Age: ${age} years old
- Interests/favorite things: ${interests.trim()}
- Story style: ${storyStyle} — write ${styleDesc}

${moralLine}

IMPORTANT RULES:
- Write for a ${age}-year-old: use age-appropriate vocabulary and sentence complexity
- Feature "${childName.trim()}" as the main character by name
- Weave their interests (${interests.trim()}) naturally into the story
- Write exactly 2-3 paragraphs as a preview/teaser (not the full story)
- End the preview at an exciting moment that makes the reader want more
- Keep it magical, warm, and engaging

Return ONLY a JSON object (no markdown, no backticks, no preamble):
{
  "title": "<creative, catchy story title>",
  "preview": "<the 2-3 paragraph story preview, with paragraphs separated by \\n\\n>",
  "style": "${storyStyle}"
}`;

    const MAX_ATTEMPTS = 2;
    const RETRY_DELAY_MS = 5_000;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) {
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
          max_tokens: 2000,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      const data = await response.json();
      req._n8n.setUsage(data);

      if (data.error) {
        const msg = data.error.message || "";
        if (msg.toLowerCase().includes("rate limit") && attempt < MAX_ATTEMPTS) {
          continue;
        }
        if (msg.toLowerCase().includes("rate limit")) {
          return res.status(429).json({
            error: "Our AI is taking a breather. Please try again in about a minute.",
          });
        }
        return res.status(502).json({ error: "Story service temporarily unavailable. Please try again." });
      }

      if (!data.content || data.content.length === 0) {
        if (attempt < MAX_ATTEMPTS) continue;
        return res.status(502).json({ error: "Empty response from API" });
      }

      const textContent = data.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");

      const jsonMatch = textContent.match(/\{[\s\S]*"title"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const cleaned = jsonMatch[0].replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.title && parsed.preview) {
            return res.status(200).json({
              title: parsed.title,
              preview: parsed.preview,
              style: parsed.style || storyStyle,
            });
          }
        } catch (_) {}
      }

      console.error("[kids-story] JSON extraction failed", {
        textLength: textContent.length,
        preview: textContent.substring(0, 500),
      });
    }

    return res.status(502).json({ error: "Could not generate the story. Please try again." });
  } catch (err) {
    console.error("Kids story API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withN8nLogging({
  appName: "Kids Story Creator",
  endpointId: "kids_story_free",
  endpoint: "/api/kids-story",
  price: 0,
}, handler);
