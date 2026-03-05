import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const THEME = {
  bg: "#06070B",
  surface: "#0C0D14",
  surfaceHover: "#12131C",
  border: "rgba(255,255,255,0.08)",
  accent: "#4ade80",
  accentDim: "rgba(74,222,128,0.15)",
  text: "rgba(255,255,255,0.92)",
  textMuted: "rgba(255,255,255,0.55)",
  textDim: "rgba(255,255,255,0.35)",
  fontHeading: "'Syne', sans-serif",
  fontBody: "'Outfit', sans-serif",
  fontMono: "'Space Mono', monospace",
};

// ─── Tiny Markdown → HTML (no external dependency) ──────────────────

function renderMarkdown(md) {
  if (!md) return "";
  let html = md
    .replace(/~~([^~]+)~~/g, "$1") // strip strikethrough
    .replace(/^### (.+)$/gm, '<h3 style="color:rgba(255,255,255,0.95);font-family:Syne,sans-serif;font-size:18px;margin:28px 0 12px;font-weight:700">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:rgba(255,255,255,0.95);font-family:Syne,sans-serif;font-size:22px;margin:32px 0 14px;font-weight:700">$1</h2>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;margin-left:20px;list-style:disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:4px 0;margin-left:20px;list-style:decimal">$2</li>');

  // Tables
  html = html.replace(/(\|.+\|[\r\n]+\|[-| :]+\|[\r\n]+((\|.+\|[\r\n]*)+))/g, (match) => {
    const rows = match.trim().split("\n").filter(r => r.trim() && !r.match(/^\|[\s-:|]+\|$/));
    if (rows.length < 1) return match;
    const parseRow = (row) => row.split("|").slice(1, -1).map(c => c.trim());
    const headers = parseRow(rows[0]);
    const body = rows.slice(1).map(parseRow);
    let t = '<div style="overflow-x:auto;margin:16px 0"><table style="width:100%;border-collapse:collapse;font-size:13px">';
    t += "<thead><tr>" + headers.map(h => `<th style="text-align:left;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);font-family:Space Mono,monospace;font-size:11px;text-transform:uppercase;letter-spacing:1px">${h}</th>`).join("") + "</tr></thead>";
    t += "<tbody>" + body.map(row => "<tr>" + row.map(c => `<td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.8)">${c}</td>`).join("") + "</tr>").join("") + "</tbody>";
    t += "</table></div>";
    return t;
  });

  // Paragraphs (lines that aren't already wrapped in tags)
  html = html.replace(/^(?!<[hltd]|<\/|<li|<div|<table|<thead|<tbody|<tr)(.+)$/gm, '<p style="margin:8px 0;line-height:1.7">$1</p>');

  return html;
}

// ─── Loading Animation ──────────────────────────────────────────────

function LoadingState({ stage }) {
  const messages = {
    geocoding: "Locating your property...",
    fetching: "Analyzing climate, soil & terrain...",
    generating: "Generating your permaculture design...",
  };

  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: "48px", marginBottom: "24px", animation: "landPulse 1.5s ease-in-out infinite" }}>
        {"\uD83C\uDF31"}
      </div>
      <p style={{
        fontFamily: THEME.fontMono, fontSize: "14px",
        color: THEME.textMuted, letterSpacing: "1px", minHeight: "21px",
      }}>
        {messages[stage] || "Working..."}
      </p>
      <div style={{
        width: "200px", height: "2px", background: "rgba(255,255,255,0.1)",
        margin: "20px auto", borderRadius: "1px", overflow: "hidden",
      }}>
        <div style={{
          width: "40%", height: "100%",
          background: `linear-gradient(90deg, ${THEME.accent}, #22d3ee)`,
          borderRadius: "1px", animation: "landLoading 1.5s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}

// ─── Site Data Badges ───────────────────────────────────────────────

function SiteDataBadges({ siteData }) {
  if (!siteData) return null;

  const badges = [];
  if (siteData.koppen?.code && siteData.koppen.code !== "Unknown") {
    badges.push({ label: siteData.koppen.code, sub: "Climate Zone" });
  }
  if (siteData.elevation?.elevation != null) {
    badges.push({ label: `${siteData.elevation.elevation}m`, sub: "Elevation" });
  }
  if (siteData.climate?.annual?.rainfall != null) {
    badges.push({ label: `${siteData.climate.annual.rainfall}mm/yr`, sub: "Rainfall" });
  }
  if (siteData.frost?.frostRisk) {
    badges.push({ label: siteData.frost.frostRisk, sub: "Frost Risk" });
  }
  if (siteData.soil?.textureClass && siteData.soil.textureClass !== "unknown") {
    badges.push({ label: siteData.soil.textureClass, sub: "Soil Type" });
  }

  if (badges.length === 0) return null;

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "10px", margin: "16px 0 24px",
    }}>
      {badges.map((b, i) => (
        <div key={i} style={{
          background: THEME.accentDim,
          border: `1px solid rgba(74,222,128,0.25)`,
          borderRadius: "8px", padding: "8px 14px", textAlign: "center",
        }}>
          <div style={{
            fontFamily: THEME.fontMono, fontSize: "13px", fontWeight: 700,
            color: THEME.accent, textTransform: "capitalize",
          }}>{b.label}</div>
          <div style={{
            fontFamily: THEME.fontMono, fontSize: "9px", color: THEME.textDim,
            textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "2px",
          }}>{b.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function LandDesign() {
  const navigate = useNavigate();

  // Input state
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  // Generation state
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState(null);

  // Result state
  const [location, setLocation] = useState(null);
  const [siteData, setSiteData] = useState(null);
  const [reportMarkdown, setReportMarkdown] = useState("");
  const [reportComplete, setReportComplete] = useState(false);

  // Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);

  // Paid report state
  const [sketchFile, setSketchFile] = useState(null);
  const [sketchPreview, setSketchPreview] = useState(null);
  const [paidLoading, setPaidLoading] = useState(false);
  const [paidStage, setPaidStage] = useState("");
  const [paidReport, setPaidReport] = useState(null);
  const [paidImage, setPaidImage] = useState(null);
  const [paidError, setPaidError] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);

  const resultRef = useRef(null);
  const paidResultRef = useRef(null);
  const orderIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const checkoutOpenedAtRef = useRef(null);
  const sketchInputRef = useRef(null);
  const checkoutUrlRef = useRef("https://vibezap.lemonsqueezy.com/checkout/buy/153489b8-8e44-4c27-8aed-574ef672b880");

  // Meta tags
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Land Design Generator \u2014 AI Permaculture Design | VibeZap";

    const desc = "Enter your location and describe your land. Get an AI-powered permaculture design with plant recommendations, water management, and implementation timeline.";
    const title = "Land Design Generator \u2014 AI Permaculture Design | VibeZap";
    const metaUpdates = [
      ["meta[name='description']", desc],
      ["meta[property='og:title']", title],
      ["meta[property='og:description']", desc],
      ["meta[name='twitter:title']", title],
      ["meta[name='twitter:description']", desc],
    ];

    const originals = metaUpdates.map(([sel, value]) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const prev = el.getAttribute("content");
      el.setAttribute("content", value);
      return { el, prev };
    }).filter(Boolean);

    return () => {
      document.title = prevTitle;
      originals.forEach(({ el, prev }) => el.setAttribute("content", prev));
    };
  }, []);

  // Payment polling
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const startPaymentPolling = () => {
    stopPolling();
    setPollingTimedOut(false);
    const afterTs = new Date().toISOString();
    checkoutOpenedAtRef.current = afterTs;
    let attempts = 0;
    const maxAttempts = 60;

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        stopPolling();
        setPollingTimedOut(true);
        return;
      }
      try {
        const resp = await fetch(`/api/check-payment?product=land&after=${encodeURIComponent(afterTs)}`);
        const data = await resp.json();
        if (data.found && data.orderId) {
          stopPolling();
          setOrderCompleted(true);
          setPaymentProcessing(false);
          setPopupBlocked(false);
          orderIdRef.current = String(data.orderId);
          handlePaidReport(String(data.orderId));
        }
      } catch (_) {}
    }, 3000);
  };

  const checkPaymentNow = async () => {
    const afterTs = checkoutOpenedAtRef.current || new Date(Date.now() - 5 * 60 * 1000).toISOString();
    try {
      const resp = await fetch(`/api/check-payment?product=land&after=${encodeURIComponent(afterTs)}`);
      const data = await resp.json();
      if (data.found && data.orderId) {
        stopPolling();
        setOrderCompleted(true);
        setPaymentProcessing(false);
        setPopupBlocked(false);
        orderIdRef.current = String(data.orderId);
        handlePaidReport(String(data.orderId));
      }
    } catch (_) {}
  };

  useEffect(() => () => stopPolling(), []);

  // Sketch file handling
  const handleSketchSelect = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Sketch image too large (max 10MB)");
      return;
    }
    setSketchFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setSketchPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) handleSketchSelect(file);
  };

  // ─── Free report generation (SSE) ────────────────────────────────

  const generateDesign = async () => {
    if (!address.trim() || !description.trim()) return;

    setLoading(true);
    setLoadingStage("geocoding");
    setError(null);
    setLocation(null);
    setSiteData(null);
    setReportMarkdown("");
    setReportComplete(false);
    setPaymentProcessing(false);
    setPaidReport(null);
    setPaidImage(null);
    setPaidError(null);
    setEmailStatus(null);
    setOrderCompleted(false);
    orderIdRef.current = null;

    try {
      const response = await fetch("/api/land-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), description: description.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Something went wrong");
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              switch (currentEvent) {
                case "progress":
                  setLoadingStage(data.stage);
                  break;
                case "site_data":
                  setLocation(data.location);
                  setSiteData(data.siteData);
                  setLoading(false);
                  break;
                case "report_chunk":
                  setReportMarkdown((prev) => prev + data.text);
                  break;
                case "report_complete":
                  setReportComplete(true);
                  break;
                case "error":
                  throw new Error(data.error);
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr;
            }
            currentEvent = null;
          }
        }
      }

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Paid report generation (SSE) ────────────────────────────────

  const handlePaidReport = async (oid) => {
    setPaidLoading(true);
    setPaidStage(sketchFile ? "analyzing_sketch" : "generating_report");
    setPaidError(null);
    setPaidReport(null);
    setPaidImage(null);
    setEmailStatus(null);

    try {
      // Convert sketch to base64
      let sketchBase64 = null;
      if (sketchFile) {
        sketchBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(sketchFile);
        });
      }

      const response = await fetch("/api/land-design-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          description: description.trim(),
          sketchBase64,
          siteData,
          location,
          orderId: oid,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate premium report");
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              switch (currentEvent) {
                case "progress":
                  setPaidStage(data.stage);
                  break;
                case "report":
                  setPaidReport(data.reportMarkdown);
                  break;
                case "image":
                  setPaidImage(data.imageBase64);
                  break;
                case "pdf": {
                  // Auto-download PDF
                  const binaryString = atob(data.pdfBase64);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const blob = new Blob([bytes], { type: "application/pdf" });
                  const blobUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = blobUrl;
                  a.download = data.pdfFilename || "land-design-report.pdf";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                  break;
                }
                case "email":
                  setEmailStatus(data);
                  break;
                case "error":
                  throw new Error(data.error);
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr;
            }
            currentEvent = null;
          }
        }
      }

      setTimeout(() => paidResultRef.current?.scrollIntoView({ behavior: "smooth" }), 400);
    } catch (err) {
      setPaidError(err.message || "Something went wrong generating your premium report.");
    } finally {
      setPaidLoading(false);
    }
  };

  const handleGetPremium = () => {
    setPaymentProcessing(true);
    setPaidError(null);
    setPopupBlocked(false);
    setPollingTimedOut(false);

    const win = window.open(checkoutUrlRef.current, "_blank");
    if (!win) setPopupBlocked(true);
    startPaymentPolling();
  };

  const handleCancelPayment = () => {
    stopPolling();
    setPaymentProcessing(false);
    setPopupBlocked(false);
    setPollingTimedOut(false);
  };

  const handleStartOver = () => {
    setAddress("");
    setDescription("");
    setLocation(null);
    setSiteData(null);
    setReportMarkdown("");
    setReportComplete(false);
    setError(null);
    setSketchFile(null);
    setSketchPreview(null);
    setPaidReport(null);
    setPaidImage(null);
    setPaidError(null);
    setEmailStatus(null);
    setPaymentProcessing(false);
    setOrderCompleted(false);
    orderIdRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const paidStageMessages = {
    analyzing_sketch: "Analyzing your sketch...",
    generating_report: "Generating enhanced design report...",
    generating_image: "Creating realistic rendering... (this may take up to 60 seconds)",
    generating_pdf: "Building your PDF report...",
    sending_email: "Sending to your inbox...",
    cached: "Loading your report...",
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: THEME.fontBody }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        @keyframes landPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes landLoading { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Back Nav ── */}
      <div style={{ padding: "20px 24px" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", color: THEME.textMuted,
            fontFamily: THEME.fontBody, fontSize: "14px", cursor: "pointer",
            padding: "8px 0", display: "flex", alignItems: "center", gap: "6px",
          }}
          onMouseEnter={(e) => (e.target.style.color = THEME.text)}
          onMouseLeave={(e) => (e.target.style.color = THEME.textMuted)}
        >
          {"\u2190"} Back to VibeZap
        </button>
      </div>

      {/* ── Hero ── */}
      <div style={{ textAlign: "center", padding: "20px 24px 40px", maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>{"\uD83C\uDF31"}</div>
        <h1 style={{
          fontFamily: THEME.fontHeading, fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 800, margin: "0 0 12px", lineHeight: 1.1,
          background: `linear-gradient(135deg, ${THEME.accent}, #22d3ee)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Land Design Generator
        </h1>
        <p style={{ color: THEME.textMuted, fontSize: "16px", lineHeight: 1.6, maxWidth: "500px", margin: "0 auto" }}>
          Describe your land and get an AI-powered permaculture design with plant lists, water management, and implementation timeline.
        </p>
      </div>

      {/* ── Input Form ── */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px 60px" }}>
        {!reportComplete && (
          <div style={{
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            borderRadius: "16px", padding: "32px", animation: "fadeIn 0.5s ease",
          }}>
            {/* Location */}
            <label style={{
              display: "block", fontFamily: THEME.fontMono, fontSize: "11px",
              color: THEME.textDim, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px",
            }}>Location</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Portland, Oregon or 123 Farm Road, Kent, UK"
              disabled={loading}
              style={{
                width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.04)",
                border: `1px solid ${THEME.border}`, borderRadius: "10px", color: THEME.text,
                fontFamily: THEME.fontBody, fontSize: "15px", outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = THEME.accent)}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />

            {/* Description */}
            <label style={{
              display: "block", fontFamily: THEME.fontMono, fontSize: "11px",
              color: THEME.textDim, textTransform: "uppercase", letterSpacing: "2px",
              marginTop: "20px", marginBottom: "8px",
            }}>Describe Your Land & Goals</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={"Describe your property: size, what's already there, what you'd like to grow or achieve...\n\nExample: I have a 1-acre south-facing slope with established apple trees and a small pond. The soil is heavy clay. I'd like to create a food forest with chickens, rainwater harvesting, and year-round food production."}
              disabled={loading}
              rows={6}
              style={{
                width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.04)",
                border: `1px solid ${THEME.border}`, borderRadius: "10px", color: THEME.text,
                fontFamily: THEME.fontBody, fontSize: "15px", outline: "none", resize: "vertical",
                lineHeight: 1.6, boxSizing: "border-box", transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = THEME.accent)}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <div style={{
              fontFamily: THEME.fontMono, fontSize: "11px", color: THEME.textDim,
              textAlign: "right", marginTop: "4px",
            }}>
              {description.length}/3000
            </div>

            {/* Generate Button */}
            <button
              onClick={generateDesign}
              disabled={loading || !address.trim() || description.trim().length < 20}
              style={{
                width: "100%", marginTop: "24px", padding: "16px",
                background: loading || !address.trim() || description.trim().length < 20
                  ? "rgba(255,255,255,0.05)"
                  : `linear-gradient(135deg, ${THEME.accent}, #22d3ee)`,
                border: "none", borderRadius: "10px", color: loading ? THEME.textDim : "#000",
                fontFamily: THEME.fontBody, fontSize: "16px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Generating..." : "Generate Design"}
            </button>

            {error && (
              <div style={{
                marginTop: "16px", padding: "14px 16px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "10px", color: "#ef4444", fontSize: "14px",
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && <LoadingState stage={loadingStage} />}

        {/* ── Site Data Badges ── */}
        {siteData && <SiteDataBadges siteData={siteData} />}

        {/* ── Location Badge ── */}
        {location && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 14px", background: THEME.accentDim,
            border: `1px solid rgba(74,222,128,0.25)`,
            borderRadius: "8px", marginBottom: "16px",
          }}>
            <span style={{ fontSize: "16px" }}>{"\uD83D\uDCCD"}</span>
            <span style={{ fontFamily: THEME.fontBody, fontSize: "13px", color: THEME.text }}>
              {location.displayName}
            </span>
          </div>
        )}

        {/* ── Streamed Report ── */}
        {reportMarkdown && (
          <div ref={resultRef} style={{
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            borderRadius: "16px", padding: "32px", animation: "fadeIn 0.5s ease",
          }}>
            <div
              style={{
                fontFamily: THEME.fontBody, fontSize: "15px", lineHeight: 1.7,
                color: "rgba(255,255,255,0.85)",
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(reportMarkdown) }}
            />
            {!reportComplete && (
              <div style={{
                fontFamily: THEME.fontMono, fontSize: "12px", color: THEME.accent,
                marginTop: "16px", animation: "landPulse 1.5s ease-in-out infinite",
              }}>
                Generating...
              </div>
            )}
          </div>
        )}

        {/* ── Premium Upgrade CTA ── */}
        {reportComplete && !orderCompleted && !paymentProcessing && (
          <div style={{
            marginTop: "32px", background: THEME.surface,
            border: `1px solid rgba(251,191,36,0.25)`,
            borderRadius: "16px", padding: "32px", textAlign: "center",
            animation: "fadeIn 0.5s ease",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{"\u2728"}</div>
            <h3 style={{
              fontFamily: THEME.fontHeading, fontSize: "22px", fontWeight: 700,
              margin: "0 0 12px", color: THEME.text,
            }}>Get the Full Design Package</h3>
            <p style={{ color: THEME.textMuted, fontSize: "14px", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto 20px" }}>
              Get a hi-res realistic rendering of your land design, an enhanced permaculture report, and a PDF delivered to your email. Optionally upload a sketch or photo for spatial analysis.
            </p>
            <ul style={{
              listStyle: "none", padding: 0, margin: "0 auto 24px", maxWidth: "320px", textAlign: "left",
            }}>
              {[
                "Hi-res realistic rendering of your design",
                "Extended report with structures & considerations",
                "Sketch analysis with spatial recommendations (if uploaded)",
                "PDF report + email delivery",
              ].map((item, i) => (
                <li key={i} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "6px 0", fontSize: "13px", color: THEME.textMuted,
                }}>
                  <span style={{ color: THEME.accent }}>{"\u2713"}</span> {item}
                </li>
              ))}
            </ul>

            {/* Sketch Upload */}
            <div style={{ margin: "0 auto 20px", maxWidth: "400px" }}>
              <label style={{
                display: "block", fontFamily: THEME.fontMono, fontSize: "11px",
                color: THEME.textDim, textTransform: "uppercase", letterSpacing: "2px",
                marginBottom: "8px", textAlign: "left",
              }}>Upload Your Sketch (Optional)</label>
              {sketchPreview ? (
                <div style={{
                  position: "relative", borderRadius: "10px", overflow: "hidden",
                  border: `1px solid rgba(74,222,128,0.25)`,
                }}>
                  <img src={sketchPreview} alt="Sketch preview" style={{
                    width: "100%", maxHeight: "200px", objectFit: "contain",
                    background: "rgba(255,255,255,0.02)",
                  }} />
                  <button
                    onClick={() => { setSketchFile(null); setSketchPreview(null); }}
                    style={{
                      position: "absolute", top: "8px", right: "8px",
                      background: "rgba(0,0,0,0.7)", border: "none", color: "white",
                      width: "28px", height: "28px", borderRadius: "50%",
                      cursor: "pointer", fontSize: "14px", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >{"\u2715"}</button>
                </div>
              ) : (
                <div
                  onClick={() => sketchInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    border: `1px dashed rgba(255,255,255,0.15)`, borderRadius: "10px",
                    padding: "20px", textAlign: "center", cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#fbbf24")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
                >
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{"\uD83D\uDCC4"}</div>
                  <p style={{ color: THEME.textMuted, fontSize: "13px", margin: 0 }}>
                    Drop your hand-drawn sketch here, or click to browse
                  </p>
                </div>
              )}
              <input
                ref={sketchInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleSketchSelect(e.target.files?.[0])}
              />
            </div>

            <button
              onClick={handleGetPremium}
              style={{
                padding: "14px 32px", border: "none", borderRadius: "10px",
                fontFamily: THEME.fontBody, fontSize: "16px", fontWeight: 600,
                cursor: "pointer",
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                color: "#000",
                transition: "all 0.2s",
              }}
            >
              $7 — Get Full Package
            </button>
          </div>
        )}

        {/* ── Payment Processing ── */}
        {paymentProcessing && !orderCompleted && (
          <div style={{
            marginTop: "24px", background: THEME.surface,
            border: `1px solid ${THEME.border}`, borderRadius: "16px",
            padding: "32px", textAlign: "center",
          }}>
            <p style={{ color: THEME.textMuted, fontSize: "14px", marginBottom: "16px" }}>
              {popupBlocked
                ? "Popup was blocked. Please complete payment using the link below."
                : pollingTimedOut
                  ? "Payment check timed out."
                  : "Waiting for payment confirmation..."}
            </p>

            {popupBlocked && (
              <a
                href={checkoutUrlRef.current}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block", padding: "10px 20px", marginBottom: "16px",
                  background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                  color: "#000", borderRadius: "8px", fontWeight: 600,
                  textDecoration: "none", fontSize: "14px",
                }}
              >
                Open Checkout
              </a>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={checkPaymentNow}
                style={{
                  padding: "10px 20px", background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${THEME.border}`, borderRadius: "8px",
                  color: THEME.text, fontFamily: THEME.fontBody, fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                I've already paid
              </button>
              <button
                onClick={handleCancelPayment}
                style={{
                  padding: "10px 20px", background: "none",
                  border: "none", color: THEME.textDim,
                  fontFamily: THEME.fontBody, fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Paid Report Loading ── */}
        {paidLoading && (
          <div style={{
            marginTop: "24px", background: THEME.surface,
            border: `1px solid ${THEME.border}`, borderRadius: "16px",
            padding: "32px", textAlign: "center",
          }}>
            <div style={{ fontSize: "36px", marginBottom: "16px", animation: "landPulse 1.5s ease-in-out infinite" }}>
              {"\uD83C\uDFA8"}
            </div>
            <p style={{
              fontFamily: THEME.fontMono, fontSize: "13px", color: THEME.textMuted,
              letterSpacing: "0.5px",
            }}>
              {paidStageMessages[paidStage] || "Processing..."}
            </p>
          </div>
        )}

        {/* ── Paid Report Error ── */}
        {paidError && (
          <div style={{
            marginTop: "24px", padding: "16px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "10px", color: "#ef4444", fontSize: "14px",
          }}>
            {paidError}
          </div>
        )}

        {/* ── Paid Report Results ── */}
        {(paidReport || paidImage) && (
          <div ref={paidResultRef} style={{ marginTop: "32px", animation: "fadeIn 0.5s ease" }}>
            {/* Realistic rendering */}
            {paidImage && (
              <div style={{
                background: THEME.surface, border: `1px solid ${THEME.border}`,
                borderRadius: "16px", overflow: "hidden", marginBottom: "24px",
              }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${THEME.border}` }}>
                  <h3 style={{
                    fontFamily: THEME.fontHeading, fontSize: "16px", fontWeight: 700,
                    margin: 0, color: THEME.text,
                  }}>Realistic Rendering</h3>
                </div>
                <img
                  src={paidImage}
                  alt="Realistic permaculture design rendering"
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            )}

            {/* Enhanced report */}
            {paidReport && (
              <div style={{
                background: THEME.surface, border: `1px solid ${THEME.border}`,
                borderRadius: "16px", padding: "32px", marginBottom: "24px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "20px" }}>{"\uD83D\uDC51"}</span>
                  <h3 style={{
                    fontFamily: THEME.fontHeading, fontSize: "18px", fontWeight: 700,
                    margin: 0, color: THEME.text,
                  }}>Premium Design Report</h3>
                </div>
                <div
                  style={{
                    fontFamily: THEME.fontBody, fontSize: "15px", lineHeight: 1.7,
                    color: "rgba(255,255,255,0.85)",
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(paidReport) }}
                />
              </div>
            )}

            {/* Email status */}
            {emailStatus && (
              <div style={{
                padding: "12px 16px", borderRadius: "8px", fontSize: "13px",
                background: emailStatus.sent ? "rgba(74,222,128,0.08)" : "rgba(251,191,36,0.08)",
                border: `1px solid ${emailStatus.sent ? "rgba(74,222,128,0.25)" : "rgba(251,191,36,0.25)"}`,
                color: emailStatus.sent ? THEME.accent : "#fbbf24",
                marginBottom: "24px",
              }}>
                {emailStatus.sent
                  ? `Report sent to ${emailStatus.address}`
                  : emailStatus.error || "Email delivery not available"}
              </div>
            )}
          </div>
        )}

        {/* ── Start Over Button ── */}
        {reportComplete && (
          <div style={{ textAlign: "center", marginTop: "32px", paddingBottom: "40px" }}>
            <button
              onClick={handleStartOver}
              style={{
                padding: "12px 28px", background: "rgba(255,255,255,0.06)",
                border: `1px solid ${THEME.border}`, borderRadius: "10px",
                color: THEME.textMuted, fontFamily: THEME.fontBody, fontSize: "14px",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.1)"; e.target.style.color = THEME.text; }}
              onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.06)"; e.target.style.color = THEME.textMuted; }}
            >
              Design Another Property
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
