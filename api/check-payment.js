import { handleSecurity } from "./lib/security.js";

/**
 * Polls LemonSqueezy API for a recent paid order matching the product.
 * Used as a fallback when checkout overlay events don't fire.
 *
 * Query params:
 *   product: "roast" (500 cents), "scam" (300 cents), or "land" (700 cents)
 *   after:   ISO timestamp — only return orders created after this time
 */
export default async function handler(req, res) {
  // CORS + origin validation
  if (handleSecurity(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { product, after } = req.query;

  if (!product || !["roast", "scam", "land", "kids-story"].includes(product)) {
    return res.status(400).json({ error: "Invalid product parameter" });
  }

  const lsApiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!lsApiKey) {
    return res.status(500).json({ error: "Not configured" });
  }

  const expectedTotal = product === "roast" ? 500 : product === "land" ? 700 : product === "kids-story" ? 300 : 300;
  // Add 30-second buffer to handle clock skew
  const afterTime = after
    ? new Date(after).getTime() - 30000
    : Date.now() - 10 * 60 * 1000;

  try {
    // Fetch most recent orders from LemonSqueezy
    // Default sort is created_at descending (newest first)
    // Filter by store to avoid permission issues; no Content-Type on GET
    const lsUrl = new URL("https://api.lemonsqueezy.com/v1/orders");
    lsUrl.searchParams.set("filter[store_id]", "302234");
    lsUrl.searchParams.set("page[size]", "10");

    const response = await fetch(lsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${lsApiKey}`,
        Accept: "application/vnd.api+json",
      },
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error("LS API error:", response.status, errBody);
      return res
        .status(502)
        .json({ error: "Failed to query payment provider", status: response.status });
    }

    const data = await response.json();
    const orders = data?.data || [];

    // Find a recent paid order matching the product
    for (const order of orders) {
      const attrs = order.attributes;
      if (!attrs) continue;

      const createdAt = new Date(attrs.created_at).getTime();

      // Only consider orders created after the specified time
      if (createdAt < afterTime) continue;

      // Must be paid and match the expected total
      if (attrs.status === "paid" && attrs.total === expectedTotal) {
        return res.status(200).json({
          found: true,
          orderId: String(order.id),
        });
      }
    }

    return res.status(200).json({ found: false });
  } catch (err) {
    console.error("check-payment error:", err);
    return res.status(500).json({ error: "Payment check failed" });
  }
}
