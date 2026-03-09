// ═══════════════════════════════════════════════════════════════════
// VibeZap — DYNAMIC n8n Logger for Vercel Serverless Functions
// ═══════════════════════════════════════════════════════════════════
// Any new app you build automatically appears in your analytics.
// Each handler declares its own identity — n8n doesn't need updating.
// ═══════════════════════════════════════════════════════════════════

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

/**
 * POST to n8n webhook. Returns a promise so callers can await it.
 * Never throws — catches errors internally.
 */
async function sendToN8n(payload) {
  if (!N8N_WEBHOOK_URL) return;
  await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => console.error("[n8n-logger]", err.message));
}

/**
 * Wraps any Vercel handler with automatic n8n logging.
 *
 * @param {Object} config - Self-describing app config
 * @param {string} config.appName      - Display name, e.g. "Roast My Website"
 * @param {string} config.endpointId   - Unique ID, e.g. "roast_paid"
 * @param {string} config.endpoint     - Route path, e.g. "/api/roast-report"
 * @param {number} config.price        - What the user pays (0 for free)
 * @param {string} [config.model]      - AI model (default: claude-sonnet-4-20250514)
 * @param {number} [config.maxTokens]  - Max output tokens for this endpoint
 * @param {Function} handler           - Your actual (req, res) handler
 *
 * ADDING A NEW APP? Just create a new handler and wrap it:
 *
 *   module.exports = withN8nLogging({
 *     appName: "My Cool New App",
 *     endpointId: "cool_app_paid",
 *     endpoint: "/api/cool-app",
 *     price: 7.00,
 *   }, handler);
 *
 * That's it. It will automatically appear in your Sheets, dashboard,
 * and all analytics — no changes needed anywhere else.
 */
function withN8nLogging(config, handler) {
  return async function (req, res) {
    const startTime = Date.now();
    let status = "success";
    let errorType = "";
    let errorMessage = "";

    // Collectors — handler calls these to report data
    const _n8n = {
      tokensInput: 0,
      tokensOutput: 0,
      model: config.model || "claude-sonnet-4-20250514",
      webSearchUsed: false,
      webSearchCount: 0,
      imageGenUsed: false,
      imageGenCount: 0,
      actualCost: 0,

      // Called after your Anthropic API response
      setUsage(response) {
        this.tokensInput = response.usage?.input_tokens || 0;
        this.tokensOutput = response.usage?.output_tokens || 0;
        if (response.model) this.model = response.model;
      },

      // Quick setters
      setTokens(input, output) { this.tokensInput = input; this.tokensOutput = output; },
      setModel(m) { this.model = m; },
      setWebSearch(count = 1) { this.webSearchUsed = true; this.webSearchCount = count; },
      setImageGen(count = 1) { this.imageGenUsed = true; this.imageGenCount = count; },
      setCost(cost) { this.actualCost = cost; },
    };

    req._n8n = _n8n;

    try {
      await handler(req, res);
    } catch (err) {
      status = "failed";
      errorType = err.code || err.name || "unknown";
      errorMessage = (err.message || "").substring(0, 200);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    } finally {
      await sendToN8n({
        // ── Identity (from config — self-declaring) ──
        app_name: config.appName,
        endpoint_id: config.endpointId,
        endpoint: config.endpoint,
        price: config.price || 0,
        max_tokens: config.maxTokens || 0,

        // ── Request result ──
        status,
        tier: config.price > 0 ? "paid" : "free",

        // ── AI usage (from handler via collectors) ──
        model: _n8n.model,
        tokens_input: _n8n.tokensInput,
        tokens_output: _n8n.tokensOutput,
        latency_ms: Date.now() - startTime,
        actual_cost: _n8n.actualCost,
        used_web_search: _n8n.webSearchUsed,
        web_search_count: _n8n.webSearchCount,
        used_image_gen: _n8n.imageGenUsed,
        image_gen_count: _n8n.imageGenCount,

        // ── Context ──
        user_id: req.body?.userId || "anonymous",
        session_id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        country: req.headers["x-vercel-ip-country"] || "",
        referrer: req.headers.referer || "",

        // ── Errors ──
        error_type: errorType,
        error_message: errorMessage,
      });
    }
  };
}

export { sendToN8n, withN8nLogging };
