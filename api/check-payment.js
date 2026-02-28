/**
 * Polls LemonSqueezy API for a recent paid order matching the product.
 * Used as a fallback when checkout overlay events don't fire.
 *
 * Query params:
 *   product: "roast" (500 cents) or "scam" (300 cents)
 *   after:   ISO timestamp — only return orders created after this time
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { product, after } = req.query;

  if (!product || !["roast", "scam"].includes(product)) {
    return res.status(400).json({ error: "Invalid product parameter" });
  }

  const lsApiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!lsApiKey) {
    return res.status(500).json({ error: "Not configured" });
  }

  const expectedTotal = product === "roast" ? 500 : 300;
  const afterTime = after ? new Date(after).getTime() : Date.now() - 10 * 60 * 1000;

  try {
    // Fetch most recent orders from LemonSqueezy
    const response = await fetch(
      "https://api.lemonsqueezy.com/v1/orders?sort=-created_at&page[size]=10",
      {
        headers: {
          Authorization: `Bearer ${lsApiKey}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to query payment provider" });
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
