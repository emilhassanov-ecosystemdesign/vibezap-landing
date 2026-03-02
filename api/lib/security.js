/**
 * Shared security: CORS handling + origin validation.
 *
 * - Browser requests: validated against allowed origins
 * - Non-browser requests (curl, bots): pass through (handled by rate limiting)
 * - Vercel preview deployments: allowed automatically
 */

const ALLOWED_ORIGINS = [
  "https://vibezap.dev",
  "https://www.vibezap.dev",
  "http://localhost:5173", // Vite dev
  "http://localhost:3000",
];

const VERCEL_PREVIEW_RE =
  /^https:\/\/vibezap-landing[a-z0-9-]*\.vercel\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (VERCEL_PREVIEW_RE.test(origin)) return true;
  return false;
}

/**
 * Set CORS response headers (called on every request).
 */
function setCorsHeaders(req, res) {
  const origin = req.headers["origin"] || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

/**
 * Run security checks. Returns true if the request was fully handled
 * (OPTIONS preflight or blocked origin) — caller should return early.
 */
export function handleSecurity(req, res) {
  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  // Block cross-origin browser requests from untrusted origins
  const origin = req.headers["origin"];
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({ error: "Forbidden" });
    return true;
  }

  return false;
}
