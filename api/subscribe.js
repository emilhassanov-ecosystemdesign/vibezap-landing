import { handleSecurity } from "./lib/security.js";

const N8N_SUBSCRIBE_URL = process.env.N8N_SUBSCRIBE_WEBHOOK_URL;

export default async function handler(req, res) {
  if (handleSecurity(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Missing email" });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!N8N_SUBSCRIBE_URL) {
    console.error("SUBSCRIBE: N8N_SUBSCRIBE_WEBHOOK_URL not configured");
    return res.status(500).json({ error: "Newsletter service unavailable" });
  }

  try {
    const response = await fetch(N8N_SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        source: "vibezap-landing",
        timestamp: new Date().toISOString(),
        country: req.headers["x-vercel-ip-country"] || "",
        referrer: req.headers.referer || "",
      }),
    });

    if (!response.ok) {
      console.error("SUBSCRIBE: n8n webhook returned", response.status);
      return res.status(502).json({ error: "Newsletter service error" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("SUBSCRIBE error:", err.message);
    return res.status(502).json({ error: "Could not reach newsletter service" });
  }
}
