// ═══════════════════════════════════════════════════════════════
// File: api/dashboard-data.js
// ═══════════════════════════════════════════════════════════════
// Password-protected endpoint that reads your VibeZap analytics
// from Google Sheets using a simple API Key (no service account).
//
// Requires env vars:
//   DASHBOARD_PASSWORD   — your secret password
//   GOOGLE_API_KEY       — your Google API key (restricted to Sheets API)
//   GOOGLE_SHEET_ID      — the ID from your Google Sheet URL
// ═══════════════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  // ── CORS ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ══════════════════════════════════════════════════
  // 🔒 PASSWORD CHECK
  // ══════════════════════════════════════════════════
  const { password } = req.body || {};
  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    if (!API_KEY || !SHEET_ID) {
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY or GOOGLE_SHEET_ID env vars" });
    }

    // ── Read from Google Sheets using the REST API directly ──
    // No googleapis package needed — just a fetch call
    const range = encodeURIComponent("Raw Requests!A1:AB100000");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[dashboard-data] Sheets API error:", response.status, errBody);
      return res.status(500).json({ error: "Failed to fetch from Google Sheets" });
    }

    const json = await response.json();
    const rows = json.values;

    if (!rows || rows.length < 2) {
      return res.status(200).json({ data: [], headers: [], count: 0, lastUpdated: new Date().toISOString() });
    }

    // ── Convert to array of objects ──
    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        let val = row[i] || "";
        // Auto-convert numbers
        if (val !== "" && !isNaN(val) && val !== "true" && val !== "false") {
          val = parseFloat(val);
        }
        // Auto-convert booleans
        if (val === "true") val = true;
        if (val === "false") val = false;
        obj[header] = val;
      });
      return obj;
    });

    return res.status(200).json({
      data,
      headers,
      count: data.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[dashboard-data] Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch data" });
  }
};
