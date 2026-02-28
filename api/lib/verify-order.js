/**
 * Shared LemonSqueezy order verification.
 * Returns { valid, reason?, userEmail?, userName? }
 */
export async function verifyOrder(orderId, apiKey, expectedTotal) {
  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
    }
  );

  if (!response.ok) return { valid: false, reason: "Order not found" };

  const data = await response.json();
  const attrs = data?.data?.attributes;
  if (!attrs) return { valid: false, reason: "Invalid order data" };

  if (attrs.status !== "paid") {
    return { valid: false, reason: "Order not paid" };
  }

  if (attrs.total !== expectedTotal) {
    return { valid: false, reason: "Order amount mismatch" };
  }

  return {
    valid: true,
    userEmail: attrs.user_email || null,
    userName: attrs.user_name || null,
  };
}
