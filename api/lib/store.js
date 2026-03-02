/**
 * Persistent key-value store for rate limiting and order tracking.
 *
 * Uses Upstash Redis REST API when configured (true persistence across
 * cold starts). Falls back to in-memory Map (resets on cold start).
 *
 * To enable persistence:
 *   1. Create a free Redis database at https://console.upstash.com
 *   2. Add env vars in Vercel dashboard:
 *        UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *        UPSTASH_REDIS_REST_TOKEN=AXxx...
 */

const memoryStore = new Map();

function getUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(config, args) {
  const resp = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// ── Rate Limiting ──────────────────────────────────────────────────

/**
 * Check rate limit for a key. Returns null if allowed, or the number of
 * minutes until the window resets if the limit is exceeded.
 *
 * @param {string} key    Unique key (e.g. "rl:roast:<ip>")
 * @param {number} max    Max requests per window
 * @param {number} windowMs  Window duration in milliseconds
 */
export async function checkRateLimit(key, max, windowMs) {
  const up = getUpstash();

  if (up) {
    try {
      const windowSec = Math.ceil(windowMs / 1000);
      const count = await redis(up, ["INCR", key]);
      if (count === 1) {
        await redis(up, ["EXPIRE", key, windowSec]);
      }
      if (count > max) {
        const ttl = await redis(up, ["TTL", key]);
        return Math.max(1, Math.ceil(ttl / 60));
      }
      return null;
    } catch (err) {
      console.warn("[store] Upstash error, falling back to memory:", err.message);
    }
  }

  // In-memory fallback
  const now = Date.now();
  for (const [k, v] of memoryStore) {
    if (v.resetTime && now > v.resetTime) memoryStore.delete(k);
  }
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }
  if (entry.count >= max) {
    return Math.ceil((entry.resetTime - now) / 60000);
  }
  entry.count++;
  return null;
}

// ── Order ID Deduplication ─────────────────────────────────────────

/**
 * Attempt to consume an order ID. Returns true if this is the first use,
 * false if the order was already consumed (report already generated).
 *
 * Persists for 30 days in Upstash, 24 hours in-memory.
 */
export async function consumeOrder(orderId) {
  const key = `order:used:${orderId}`;
  const up = getUpstash();

  if (up) {
    try {
      // SET NX = set only if key doesn't exist; EX = expire in seconds
      const result = await redis(up, ["SET", key, "1", "NX", "EX", String(30 * 24 * 3600)]);
      return result === "OK";
    } catch (err) {
      console.warn("[store] Upstash error, falling back to memory:", err.message);
    }
  }

  // In-memory fallback (survives within a warm function instance)
  if (memoryStore.has(key)) return false;
  memoryStore.set(key, { used: true, resetTime: Date.now() + 24 * 3600 * 1000 });
  return true;
}
