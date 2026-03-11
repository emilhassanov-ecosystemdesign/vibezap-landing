import { handleSecurity } from "./lib/security.js";
import { withN8nLogging } from "./lib/n8nLogger.js";
import { checkRateLimit, consumeOrder } from "./lib/store.js";
import { verifyOrder } from "./lib/verify-order.js";
import { takeScreenshot } from "./lib/take-screenshot.js";
import { DEVICES, compositeIntoFrame } from "./lib/device-frames.js";
import archiver from "archiver";

const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000;
const EXPECTED_TOTAL = 299; // $2.99

async function handler(req, res) {
  if (handleSecurity(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limiting
  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const retryAfter = await checkRateLimit(`rl:mockup-bulk:${ip}`, MAX_REQUESTS, WINDOW_MS);
  if (retryAfter !== null) {
    return res.status(429).json({
      error: `Rate limited. Try again in ~${retryAfter} minutes.`,
    });
  }

  // Validate input
  const { urls, devices, background, orderId } = req.body;

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ error: "Order ID is required" });
  }

  if (!urls || !Array.isArray(urls) || urls.length === 0 || urls.length > 5) {
    return res.status(400).json({ error: "Provide 1-5 URLs" });
  }

  const deviceIds = devices && Array.isArray(devices) ? devices : Object.keys(DEVICES);
  const validDeviceIds = deviceIds.filter((d) => DEVICES[d]);
  if (validDeviceIds.length === 0) {
    return res.status(400).json({ error: "No valid devices specified" });
  }

  // Verify payment
  const lsApiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!lsApiKey) {
    return res.status(500).json({ error: "Payment system not configured" });
  }

  const orderCheck = await verifyOrder(orderId, lsApiKey, EXPECTED_TOTAL);
  if (!orderCheck.valid) {
    return res.status(403).json({ error: `Payment verification failed: ${orderCheck.reason}` });
  }

  // Consume order (prevent reuse)
  const consumed = await consumeOrder(orderId);
  if (!consumed) {
    return res.status(403).json({ error: "This order has already been used" });
  }

  // Validate URLs
  const validUrls = urls
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http://") || u.startsWith("https://"));

  if (validUrls.length === 0) {
    return res.status(400).json({ error: "No valid URLs provided" });
  }

  try {
    const previews = [];
    const mockupBuffers = [];

    // Process each URL × device combination sequentially (memory safety)
    for (const url of validUrls) {
      // Take screenshots at each device viewport
      for (const deviceId of validDeviceIds) {
        const device = DEVICES[deviceId];

        try {
          const screenshot = await takeScreenshot(url, device.viewport);
          const { buffer } = await compositeIntoFrame(screenshot, deviceId, {
            background: background || "#ffffff",
            watermark: false, // No watermark for paid
          });

          const filename = `mockup-${deviceId}-${new URL(url).hostname}.png`;
          mockupBuffers.push({ buffer, filename });

          // Create smaller preview
          previews.push({
            url,
            device: deviceId,
            image: buffer.toString("base64"),
          });
        } catch (err) {
          console.error(`Failed to capture ${url} on ${deviceId}:`, err.message);
          // Continue with other combinations
        }
      }
    }

    if (mockupBuffers.length === 0) {
      return res.status(500).json({ error: "Failed to generate any mockups. Please check your URLs." });
    }

    // Create ZIP
    const zipBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      const archive = archiver("zip", { zlib: { level: 6 } });

      archive.on("data", (chunk) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);

      for (const { buffer, filename } of mockupBuffers) {
        archive.append(buffer, { name: filename });
      }

      archive.finalize();
    });

    return res.status(200).json({
      zipBase64: zipBuffer.toString("base64"),
      count: mockupBuffers.length,
      previews,
    });
  } catch (err) {
    console.error("MOCKUP-BULK error:", err.message, err.stack);
    return res.status(500).json({ error: "Failed to generate mockups. Please try again." });
  }
}

export default withN8nLogging(
  {
    appName: "Screenshot Mockup",
    endpointId: "mockup_bulk",
    endpoint: "/api/mockup-bulk",
    price: 2.99,
  },
  handler
);
