import { handleSecurity } from "./lib/security.js";
import { withN8nLogging } from "./lib/n8nLogger.js";
import { checkRateLimit } from "./lib/store.js";
import { takeScreenshot } from "./lib/take-screenshot.js";
import { DEVICES, compositeIntoFrame } from "./lib/device-frames.js";

const MAX_REQUESTS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function handler(req, res) {
  if (handleSecurity(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limiting
  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:mockup:${ip}`, MAX_REQUESTS, WINDOW_MS);
  if (retryAfter !== null) {
    return res.status(429).json({
      error: `Rate limited. Try again in ~${retryAfter} minutes.`,
    });
  }

  // Validate input
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    return res.status(400).json({ error: "URL must start with http:// or https://" });
  }

  if (trimmedUrl.length > 2000) {
    return res.status(400).json({ error: "URL is too long" });
  }

  try {
    // Take screenshot at iPhone 15 viewport
    const device = DEVICES["iphone-15"];
    const screenshot = await takeScreenshot(trimmedUrl, device.viewport);

    // Composite into device frame with white background + watermark
    const { buffer, width, height } = await compositeIntoFrame(screenshot, "iphone-15", {
      background: "#ffffff",
      watermark: true,
    });

    const image = buffer.toString("base64");

    return res.status(200).json({
      image,
      device: "iphone-15",
      deviceName: device.name,
      width,
      height,
    });
  } catch (err) {
    console.error("MOCKUP error:", err.message, err.stack);

    if (err.message.includes("net::ERR_NAME_NOT_RESOLVED") || err.message.includes("net::ERR_CONNECTION_REFUSED")) {
      return res.status(400).json({ error: "Could not reach that website. Please check the URL and try again." });
    }

    if (err.message.includes("Navigation timeout") || err.message.includes("timeout")) {
      return res.status(400).json({ error: "Website took too long to load. Try a faster page." });
    }

    return res.status(500).json({ error: "Failed to generate mockup. Please try again." });
  }
}

export default withN8nLogging(
  {
    appName: "Screenshot Mockup",
    endpointId: "mockup_free",
    endpoint: "/api/mockup",
    price: 0,
  },
  handler
);
