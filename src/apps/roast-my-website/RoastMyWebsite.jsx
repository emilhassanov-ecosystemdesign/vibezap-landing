import { useState, useEffect, useRef } from "react";

const ROAST_CATEGORIES = ["Design", "Copy", "UX", "Performance", "Trust"];

const categoryEmojis = {
  Design: "\uD83C\uDFA8",
  Copy: "\u270F\uFE0F",
  UX: "\uD83E\uDDED",
  Performance: "\u26A1",
  Trust: "\uD83D\uDEE1\uFE0F",
};

const severityColors = {
  brutal: "#ff2d55",
  harsh: "#ff6b35",
  mild: "#ffc233",
  decent: "#7ed957",
  fire: "#4ade80",
};

function ScoreRing({ score, size = 120, label }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const getColor = (s) => {
    if (s <= 3) return severityColors.brutal;
    if (s <= 5) return severityColors.harsh;
    if (s <= 7) return severityColors.mild;
    if (s <= 8) return severityColors.decent;
    return severityColors.fire;
  };

  const color = getColor(score);
  const offset = circumference - (animatedScore / 10) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s ease" }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={size * 0.32}
          fontFamily="'Space Mono', monospace"
          fontWeight="700"
          style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
        >
          {animatedScore}
        </text>
      </svg>
      {label && (
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "11px",
            marginTop: "4px",
            fontFamily: "'Space Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function CategoryBar({ name, score, comment, delay }) {
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay);
    const t2 = setTimeout(() => setWidth(score * 10), delay + 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay, score]);

  const getColor = (s) => {
    if (s <= 3) return "linear-gradient(90deg, #ff2d55, #ff6b6b)";
    if (s <= 5) return "linear-gradient(90deg, #ff6b35, #ffa235)";
    if (s <= 7) return "linear-gradient(90deg, #ffc233, #ffe066)";
    if (s <= 8) return "linear-gradient(90deg, #7ed957, #a8e87c)";
    return "linear-gradient(90deg, #4ade80, #22d3ee)";
  };

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-20px)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(255,255,255,0.8)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
          }}
        >
          {categoryEmojis[name]} {name}
        </span>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "14px",
            fontWeight: 700,
            color: "white",
          }}
        >
          {score}/10
        </span>
      </div>
      <div
        style={{
          height: "6px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: getColor(score),
            borderRadius: "3px",
            transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          color: "rgba(255,255,255,0.55)",
          marginTop: "6px",
          lineHeight: 1.5,
          fontStyle: "italic",
        }}
      >
        "{comment}"
      </p>
    </div>
  );
}

function TypewriterText({ text, speed = 20, onComplete }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{displayed}<span style={{ opacity: 0.4 }}>|</span></>;
}

const priorityConfig = {
  high: { color: "#ff2d55", label: "HIGH", bg: "rgba(255,45,85,0.1)", border: "rgba(255,45,85,0.25)" },
  medium: { color: "#ff6b35", label: "MED", bg: "rgba(255,107,53,0.1)", border: "rgba(255,107,53,0.25)" },
  low: { color: "#ffc233", label: "LOW", bg: "rgba(255,194,51,0.1)", border: "rgba(255,194,51,0.25)" },
};

function FixesSection({ fixes }) {
  const [expandedGroup, setExpandedGroup] = useState(null);
  const grouped = { high: [], medium: [], low: [] };
  fixes.forEach((fix) => {
    const p = (fix.priority || "medium").toLowerCase();
    if (grouped[p]) grouped[p].push(fix);
    else grouped.medium.push(fix);
  });

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(255,45,85,0.06), rgba(255,107,53,0.04))",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "20px",
        padding: "32px 28px",
        marginBottom: "24px",
      }}
    >
      <h3
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "3px",
          color: "rgba(255,255,255,0.35)",
          marginBottom: "24px",
        }}
      >
        {"\uD83E\uDE79"} Specific Fixes ({fixes.length})
      </h3>
      {["high", "medium", "low"].map((priority) => {
        const items = grouped[priority];
        if (!items.length) return null;
        const cfg = priorityConfig[priority];
        const isExpanded = expandedGroup === priority;
        const displayed = isExpanded ? items : items.slice(0, 3);
        return (
          <div key={priority} style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: cfg.color,
                marginBottom: "12px",
              }}
            >
              {cfg.label} Priority ({items.length})
            </div>
            {displayed.map((fix, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {fix.title}
                  </span>
                  {fix.category && (
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "9px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "rgba(255,255,255,0.35)",
                        background: "rgba(255,255,255,0.04)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {fix.category}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.6,
                  }}
                >
                  {fix.description}
                </p>
              </div>
            ))}
            {items.length > 3 && (
              <button
                onClick={() =>
                  setExpandedGroup(isExpanded ? null : priority)
                }
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {isExpanded
                  ? "Show less"
                  : `Show all ${items.length} ${cfg.label.toLowerCase()} priority fixes`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LoadingState() {
  const [phase, setPhase] = useState(0);
  const phases = [
    "\uD83D\uDD0D Stalking the website...",
    "\uD83E\uDDE0 Judging design choices...",
    "\uD83D\uDCDD Writing savage commentary...",
    "\uD83D\uDD25 Calibrating roast intensity...",
    "\uD83C\uDFC6 Preparing the verdict...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % phases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div
        style={{
          fontSize: "48px",
          marginBottom: "24px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        {"\uD83D\uDD25"}
      </div>
      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "14px",
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "1px",
        }}
      >
        {phases[phase]}
      </p>
      <div
        style={{
          width: "200px",
          height: "2px",
          background: "rgba(255,255,255,0.1)",
          margin: "20px auto",
          borderRadius: "1px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "40%",
            height: "100%",
            background: "linear-gradient(90deg, #ff2d55, #ff6b35)",
            borderRadius: "1px",
            animation: "loading 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

export default function RoastMyWebsite() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [reportProgress, setReportProgress] = useState(null);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const resultRef = useRef(null);
  const reportRef = useRef(null);
  const orderIdRef = useRef(null);
  const scannedUrlRef = useRef("");
  const pollIntervalRef = useRef(null);
  const checkoutOpenedAtRef = useRef(null);

  // LemonSqueezy event handler ref (stable across renders)
  const lsHandlerRef = useRef(null);
  lsHandlerRef.current = (event) => {
    console.log("[LS Event]", event.event, JSON.stringify(event).slice(0, 500));

    if (event.event === "Checkout.Success") {
      if (window.LemonSqueezy?.Url?.Close) {
        window.LemonSqueezy.Url.Close();
      }
      // LS nests order data: event.data.order.data.{id, attributes}
      const nested = event.data?.order?.data;
      const orderData = event.data;
      const oid =
        nested?.id ||
        nested?.attributes?.order_number ||
        nested?.attributes?.identifier ||
        orderData?.id ||
        orderData?.order_number ||
        orderData?.attributes?.identifier ||
        orderData?.attributes?.order_number;
      console.log("[LS] Checkout.Success — orderId:", oid);
      if (oid) {
        stopPolling();
        setOrderCompleted(true);
        setPaymentProcessing(false);
        orderIdRef.current = String(oid);
        handleReportGeneration(String(oid));
      } else {
        // Don't stop polling — let it find the order ID as fallback
        console.warn("[LS] Could not extract order ID, polling will continue. Event:", JSON.stringify(event).slice(0, 1000));
      }
    }
    if (event.event === "Checkout.Closed") {
      // Don't stop polling — user may have closed after paying
    }
  };

  // Load LemonSqueezy overlay script + register event handler
  useEffect(() => {
    function setupLS() {
      // createLemonSqueezy() is required in SPAs to reinitialize event listeners
      if (typeof window.createLemonSqueezy === "function") {
        window.createLemonSqueezy();
        console.log("[LS] createLemonSqueezy() called");
      }
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({
          eventHandler: (event) => lsHandlerRef.current?.(event),
        });
        console.log("[LS] Setup complete");
      }
    }

    if (!document.getElementById("lemonsqueezy-js")) {
      const script = document.createElement("script");
      script.id = "lemonsqueezy-js";
      script.src = "https://app.lemonsqueezy.com/js/lemon.js";
      script.defer = true;
      script.onload = () => setupLS();
      document.head.appendChild(script);
    } else {
      setupLS();
    }
  }, []);

  // Stop any active payment polling
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Poll backend for a recent paid order
  const startPaymentPolling = () => {
    stopPolling();
    const afterTs = new Date().toISOString();
    checkoutOpenedAtRef.current = afterTs;
    let attempts = 0;
    const maxAttempts = 60; // 3s * 60 = 3 minutes max

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        stopPolling();
        return;
      }
      try {
        const resp = await fetch(`/api/check-payment?product=roast&after=${encodeURIComponent(afterTs)}`);
        const data = await resp.json();
        if (data.found && data.orderId) {
          stopPolling();
          // Close the LemonSqueezy overlay so customer sees the report
          if (window.LemonSqueezy?.Url?.Close) {
            window.LemonSqueezy.Url.Close();
          }
          setOrderCompleted(true);
          setPaymentProcessing(false);
          orderIdRef.current = String(data.orderId);
          handleReportGeneration(String(data.orderId));
        }
      } catch (_) { /* silent retry */ }
    }, 3000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const handleGetReport = () => {
    setPaymentProcessing(true);
    setPdfError(null);
    // Don't include ?embed=1 — Url.Open() adds it automatically
    const checkoutUrl =
      "https://vibezap.lemonsqueezy.com/checkout/buy/0c4823fd-0f0d-42bc-8362-b272910b8a55";
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.open(checkoutUrl + "?embed=1", "_blank");
    }
    // Start polling for payment confirmation regardless of overlay method
    startPaymentPolling();
  };

  function downloadPdfFromBase64(base64, filename) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  const handleReportGeneration = async (oid) => {
    setPdfGenerating(true);
    setPdfError(null);
    setReportProgress(null);
    setReportData(null);
    setEmailStatus(null);

    try {
      const response = await fetch("/api/roast-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: scannedUrlRef.current,
          orderId: oid,
        }),
      });

      // Non-streaming error (400, 403, 429, 500)
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate report");
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let scrolledToReport = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse complete SSE messages (separated by double newline)
        const messages = buffer.split("\n\n");
        buffer = messages.pop(); // Keep incomplete message in buffer

        for (const msg of messages) {
          if (!msg.trim() || msg.startsWith(":")) continue; // Skip heartbeats

          const eventMatch = msg.match(/^event:\s*(.+)$/m);
          const dataMatch = msg.match(/^data:\s*(.+)$/m);
          if (!eventMatch || !dataMatch) continue;

          const eventType = eventMatch[1].trim();
          let eventData;
          try {
            eventData = JSON.parse(dataMatch[1]);
          } catch { continue; }

          switch (eventType) {
            case "progress":
              setReportProgress(eventData);
              break;
            case "analysis":
              setReportData({
                success: true,
                analysis: eventData.analysis,
                analyzedUrl: eventData.analyzedUrl,
                generatedAt: eventData.generatedAt,
                pdfBase64: null,
                pdfFilename: null,
              });
              setShowDetails(true);
              if (!scrolledToReport) {
                scrolledToReport = true;
                setTimeout(() => {
                  reportRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 400);
              }
              break;
            case "pdf":
              setReportData((prev) => ({
                ...prev,
                pdfBase64: eventData.pdfBase64,
                pdfFilename: eventData.pdfFilename || "website-roast-report.pdf",
              }));
              downloadPdfFromBase64(
                eventData.pdfBase64,
                eventData.pdfFilename || "website-roast-report.pdf"
              );
              break;
            case "email":
              setEmailStatus(eventData);
              break;
            case "error":
              throw new Error(eventData.error);
          }
        }
      }
    } catch (err) {
      console.error("Report generation error:", err);
      setPdfError(err.message || "Something went wrong generating your report.");
    } finally {
      setPdfGenerating(false);
      setReportProgress(null);
    }
  };

  const roastWebsite = async () => {
    if (!url.trim()) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;

    scannedUrlRef.current = cleanUrl;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowDetails(false);
    setPaymentProcessing(false);
    setPdfGenerating(false);
    setPdfError(null);
    setReportData(null);
    setEmailStatus(null);
    setReportProgress(null);
    setOrderCompleted(false);
    orderIdRef.current = null;

    try {
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setResult(data);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) roastWebsite();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(250%); }
          100% { transform: translateX(-100%); }
        }

        @keyframes fireGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(255, 45, 85, 0.3), 0 0 40px rgba(255, 107, 53, 0.1); }
          50% { text-shadow: 0 0 30px rgba(255, 45, 85, 0.5), 0 0 60px rgba(255, 107, 53, 0.2); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes borderGlow {
          0%, 100% { border-color: rgba(255, 45, 85, 0.3); }
          50% { border-color: rgba(255, 107, 53, 0.5); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0b",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle background texture */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 0%, rgba(255,45,85,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(255,107,53,0.04) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            padding: "60px 24px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div
              style={{
                fontSize: "13px",
                fontFamily: "'Space Mono', monospace",
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "4px",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              vibezap.dev presents
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(36px, 8vw, 56px)",
                fontWeight: 900,
                lineHeight: 1.1,
                animation: "fireGlow 3s ease-in-out infinite",
              }}
            >
              Roast My
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ff2d55, #ff6b35, #ffc233)",
                  backgroundSize: "200% 200%",
                  animation: "gradientShift 4s ease infinite",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Website
              </span>
            </h1>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "16px",
                color: "rgba(255,255,255,0.45)",
                marginTop: "16px",
                lineHeight: 1.6,
              }}
            >
              Drop your URL. Get a brutally honest, AI-powered
              <br />
              roast of your website. No feelings spared.
            </p>
          </div>

          {/* Input Area */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "6px",
              marginBottom: "48px",
              display: "flex",
              gap: "6px",
              animation: loading ? "borderGlow 2s ease-in-out infinite" : "none",
            }}
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter any website URL..."
              disabled={loading}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                padding: "14px 18px",
                fontFamily: "'Space Mono', monospace",
                fontSize: "14px",
                color: "white",
                letterSpacing: "0.5px",
              }}
            />
            <button
              onClick={roastWebsite}
              disabled={loading || !url.trim()}
              style={{
                background:
                  loading || !url.trim()
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #ff2d55, #ff6b35)",
                border: "none",
                borderRadius: "12px",
                padding: "14px 28px",
                fontFamily: "'Space Mono', monospace",
                fontSize: "13px",
                fontWeight: 700,
                color: loading || !url.trim() ? "rgba(255,255,255,0.3)" : "white",
                cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                textTransform: "uppercase",
                letterSpacing: "2px",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "..." : "\uD83D\uDD25 Roast"}
            </button>
          </div>

          {/* Loading State */}
          {loading && <LoadingState />}

          {/* Error */}
          {error && (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                background: "rgba(255,45,85,0.08)",
                borderRadius: "16px",
                border: "1px solid rgba(255,45,85,0.2)",
              }}
            >
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div
              ref={resultRef}
              style={{ animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              {/* Severity Badge */}
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <span
                  style={{
                    display: "inline-block",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "3px",
                    color: severityColors[result.severity] || "#ffc233",
                    background: `${severityColors[result.severity] || "#ffc233"}15`,
                    padding: "6px 16px",
                    borderRadius: "100px",
                    border: `1px solid ${severityColors[result.severity] || "#ffc233"}30`,
                  }}
                >
                  {result.severity === "brutal" && "\u26A0\uFE0F "}
                  {result.severity === "harsh" && "\uD83D\uDD25 "}
                  {result.severity === "mild" && "\uD83D\uDCAC "}
                  {result.severity === "decent" && "\uD83D\uDC4D "}
                  {result.severity === "fire" && "\uD83D\uDD25 "}
                  {result.severity} roast
                </span>
              </div>

              {/* Overall Score */}
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <ScoreRing score={result.overall_score} size={140} label="Overall" />
              </div>

              {/* Headline */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "40px",
                  padding: "0 12px",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "clamp(22px, 5vw, 28px)",
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: "white",
                    marginBottom: "16px",
                  }}
                >
                  <TypewriterText
                    text={result.roast_headline}
                    speed={30}
                    onComplete={() =>
                      setTimeout(() => setShowDetails(true), 300)
                    }
                  />
                </h2>
                {showDetails && (
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "15px",
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.7,
                      animation: "slideUp 0.5s ease",
                    }}
                  >
                    {result.roast_summary}
                  </p>
                )}
              </div>

              {/* Category Breakdown */}
              {showDetails && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "20px",
                    padding: "32px 28px",
                    marginBottom: "32px",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "3px",
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: "28px",
                    }}
                  >
                    The Breakdown
                  </h3>
                  {ROAST_CATEGORIES.map((cat, i) => (
                    <CategoryBar
                      key={cat}
                      name={cat}
                      score={result.categories[cat]?.score || 5}
                      comment={result.categories[cat]?.comment || ""}
                      delay={i * 200}
                    />
                  ))}
                </div>
              )}

              {/* Top Fixes */}
              {showDetails && result.top_fixes && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,45,85,0.06), rgba(255,107,53,0.04))",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "20px",
                    padding: "32px 28px",
                    marginBottom: "32px",
                    animation: "slideUp 0.6s ease",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "3px",
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: "20px",
                    }}
                  >
                    {"\uD83E\uDE79"} Top 3 Fixes
                  </h3>
                  {result.top_fixes.map((fix, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "14px",
                        marginBottom: i < 2 ? "16px" : 0,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#ff6b35",
                          minWidth: "20px",
                        }}
                      >
                        {i + 1}.
                      </span>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "14px",
                          color: "rgba(255,255,255,0.7)",
                          lineHeight: 1.6,
                        }}
                      >
                        {fix}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Upgrade CTA / Report Display */}
              {showDetails && !reportData && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "36px 24px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px",
                    marginBottom: "32px",
                    animation: "slideUp 0.6s ease",
                  }}
                >
                  {/* Pre-purchase state */}
                  {!orderCompleted && !pdfGenerating && (
                    <>
                      <div style={{ fontSize: "28px", marginBottom: "12px" }}>{"\uD83D\uDCCB"}</div>
                      <h3
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "20px",
                          fontWeight: 700,
                          marginBottom: "8px",
                        }}
                      >
                        Want the Full Report?
                      </h3>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "13px",
                          color: "rgba(255,255,255,0.45)",
                          marginBottom: "12px",
                          lineHeight: 1.6,
                        }}
                      >
                        Get a detailed report with 30+ specific fixes,
                        <br />
                        priority rankings, and competitor comparisons.
                      </p>
                      <div
                        style={{
                          textAlign: "left",
                          maxWidth: "320px",
                          margin: "0 auto 20px",
                        }}
                      >
                        {[
                          "30+ specific fixes with priority levels",
                          "Detailed analysis per category",
                          "Quick wins you can do today",
                          "Competitor insights & comparisons",
                          "SEO, accessibility & mobile notes",
                          "PDF download + emailed to you",
                        ].map((item, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginBottom: "6px",
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "12px",
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            <span style={{ color: "#ff6b35", flexShrink: 0 }}>{"\u2713"}</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleGetReport}
                        disabled={paymentProcessing}
                        style={{
                          display: "inline-block",
                          background: paymentProcessing
                            ? "rgba(255,255,255,0.05)"
                            : "linear-gradient(135deg, #ff2d55, #ff6b35)",
                          border: "none",
                          borderRadius: "12px",
                          padding: "14px 32px",
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: paymentProcessing ? "rgba(255,255,255,0.3)" : "white",
                          cursor: paymentProcessing ? "not-allowed" : "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "2px",
                        }}
                      >
                        {paymentProcessing ? "Processing..." : "Get Full Report \u2014 $5"}
                      </button>
                    </>
                  )}

                  {/* Generating report state (shown until analysis arrives) */}
                  {pdfGenerating && !reportData && (
                    <>
                      <div
                        style={{
                          fontSize: "48px",
                          marginBottom: "16px",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      >
                        {reportProgress?.stage === "payment" ? "\uD83D\uDCB3"
                          : reportProgress?.stage === "fetching" ? "\uD83C\uDF10"
                          : reportProgress?.stage === "analyzing" ? "\uD83D\uDD25"
                          : reportProgress?.stage === "retrying" ? "\uD83D\uDD04"
                          : reportProgress?.stage === "cached" ? "\u26A1"
                          : "\uD83D\uDCDD"}
                      </div>
                      <h3
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "18px",
                          fontWeight: 700,
                          marginBottom: "8px",
                        }}
                      >
                        {reportProgress?.message || "Generating Your Roast Report..."}
                      </h3>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "13px",
                          color: "rgba(255,255,255,0.45)",
                          lineHeight: 1.6,
                        }}
                      >
                        {!reportProgress && "Connecting to analysis engine..."}
                        {reportProgress?.stage === "analyzing" && "Running deep analysis with 30+ specific fixes."}
                        {reportProgress?.stage === "retrying" && "First attempt didn't work. Trying again..."}
                        {reportProgress?.stage === "fetching" && "Reading website content for analysis."}
                        {reportProgress?.stage === "payment" && "Confirming your purchase."}
                        {reportProgress?.stage === "cached" && "Found your previously generated report."}
                      </p>
                      <div
                        style={{
                          width: "200px",
                          height: "2px",
                          background: "rgba(255,255,255,0.1)",
                          margin: "20px auto",
                          borderRadius: "1px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: "40%",
                            height: "100%",
                            background: "linear-gradient(90deg, #ff2d55, #ff6b35)",
                            borderRadius: "1px",
                            animation: "loading 1.5s ease-in-out infinite",
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* Error state */}
                  {pdfError && !pdfGenerating && (
                    <div>
                      <div style={{ fontSize: "28px", marginBottom: "12px" }}>{"\u26A0\uFE0F"}</div>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "13px",
                          color: "rgba(239,68,68,0.8)",
                          marginBottom: "16px",
                          lineHeight: 1.6,
                        }}
                      >
                        {pdfError}
                      </p>
                      {orderIdRef.current && (
                        <button
                          onClick={() => handleReportGeneration(orderIdRef.current)}
                          style={{
                            background: "linear-gradient(135deg, #ff2d55, #ff6b35)",
                            border: "none",
                            borderRadius: "12px",
                            padding: "12px 24px",
                            fontFamily: "'Space Mono', monospace",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "white",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                          }}
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* === FULL ON-SCREEN REPORT === */}
              {showDetails && reportData && (
                <div
                  ref={reportRef}
                  style={{ animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  {/* Action Bar */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      marginBottom: "32px",
                    }}
                  >
                    {reportData.pdfBase64 ? (
                      <button
                        onClick={() =>
                          downloadPdfFromBase64(
                            reportData.pdfBase64,
                            reportData.pdfFilename || "website-roast-report.pdf"
                          )
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "linear-gradient(135deg, #ff2d55, #ff6b35)",
                          border: "none",
                          borderRadius: "100px",
                          padding: "10px 24px",
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "white",
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        {"\u2B07"} Download PDF
                      </button>
                    ) : pdfGenerating ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "100px",
                          padding: "10px 20px",
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.35)",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      >
                        Preparing PDF...
                      </span>
                    ) : null}
                    {emailStatus?.sent && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(74,222,128,0.08)",
                          border: "1px solid rgba(74,222,128,0.25)",
                          borderRadius: "100px",
                          padding: "10px 20px",
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "11px",
                          color: "#4ade80",
                        }}
                      >
                        {"\u2709\uFE0F"} Sent to {emailStatus.address}
                      </span>
                    )}
                    {emailStatus && !emailStatus.sent && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(251,191,36,0.08)",
                          border: "1px solid rgba(251,191,36,0.25)",
                          borderRadius: "100px",
                          padding: "10px 20px",
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "11px",
                          color: "#fbbf24",
                        }}
                      >
                        Email unavailable — PDF downloaded
                      </span>
                    )}
                  </div>

                  {/* Executive Summary */}
                  {reportData.analysis?.executive_summary && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "20px",
                        padding: "32px 28px",
                        marginBottom: "24px",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "3px",
                          color: "rgba(255,255,255,0.35)",
                          marginBottom: "20px",
                        }}
                      >
                        Executive Summary
                      </h3>
                      {reportData.analysis.executive_summary
                        .split("\n")
                        .filter((p) => p.trim())
                        .map((paragraph, i) => (
                          <p
                            key={i}
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "14px",
                              color: "rgba(255,255,255,0.7)",
                              lineHeight: 1.8,
                              marginBottom: "16px",
                            }}
                          >
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  )}

                  {/* Detailed Category Analysis */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "20px",
                      padding: "32px 28px",
                      marginBottom: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "3px",
                        color: "rgba(255,255,255,0.35)",
                        marginBottom: "28px",
                      }}
                    >
                      Detailed Analysis
                    </h3>
                    {ROAST_CATEGORIES.map((cat, i) => {
                      const catData = reportData.analysis?.categories?.[cat];
                      if (!catData) return null;
                      return (
                        <div key={cat} style={{ marginBottom: "28px" }}>
                          <CategoryBar
                            name={cat}
                            score={catData.score || 5}
                            comment={catData.comment || ""}
                            delay={i * 150}
                          />
                          {catData.detailed_analysis && (
                            <p
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "13px",
                                color: "rgba(255,255,255,0.55)",
                                lineHeight: 1.7,
                                marginTop: "4px",
                                paddingLeft: "4px",
                                borderLeft: "2px solid rgba(255,255,255,0.08)",
                                marginLeft: "2px",
                                paddingTop: "4px",
                                paddingBottom: "4px",
                              }}
                            >
                              {catData.detailed_analysis}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Priority Fixes */}
                  {reportData.analysis?.specific_fixes?.length > 0 && (
                    <FixesSection fixes={reportData.analysis.specific_fixes} />
                  )}

                  {/* Quick Wins */}
                  {reportData.analysis?.quick_wins?.length > 0 && (
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(74,222,128,0.06), rgba(34,211,238,0.04))",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "20px",
                        padding: "32px 28px",
                        marginBottom: "24px",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "3px",
                          color: "rgba(255,255,255,0.35)",
                          marginBottom: "20px",
                        }}
                      >
                        {"\u26A1"} Quick Wins
                      </h3>
                      {reportData.analysis.quick_wins.map((win, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: "12px",
                            marginBottom: i < reportData.analysis.quick_wins.length - 1 ? "12px" : 0,
                            alignItems: "flex-start",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#4ade80",
                              minWidth: "20px",
                            }}
                          >
                            {i + 1}.
                          </span>
                          <p
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "13px",
                              color: "rgba(255,255,255,0.65)",
                              lineHeight: 1.6,
                            }}
                          >
                            {win}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Competitor Insights */}
                  {reportData.analysis?.competitor_insights?.length > 0 && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "20px",
                        padding: "32px 28px",
                        marginBottom: "24px",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "3px",
                          color: "rgba(255,255,255,0.35)",
                          marginBottom: "20px",
                        }}
                      >
                        {"\uD83C\uDFC6"} Competitor Insights
                      </h3>
                      {reportData.analysis.competitor_insights.map((insight, i) => (
                        <div
                          key={i}
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom:
                              i < reportData.analysis.competitor_insights.length - 1 ? "12px" : 0,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "14px",
                              color: "rgba(255,255,255,0.75)",
                              lineHeight: 1.6,
                              marginBottom: "8px",
                            }}
                          >
                            {insight.suggestion}
                          </p>
                          <p
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              fontSize: "11px",
                              color: "rgba(255,107,53,0.7)",
                            }}
                          >
                            Example: {insight.example}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Technical Notes */}
                  {(reportData.analysis?.seo_notes ||
                    reportData.analysis?.accessibility_notes ||
                    reportData.analysis?.mobile_notes) && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "20px",
                        padding: "32px 28px",
                        marginBottom: "24px",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "3px",
                          color: "rgba(255,255,255,0.35)",
                          marginBottom: "24px",
                        }}
                      >
                        {"\uD83D\uDD27"} Technical Notes
                      </h3>
                      {[
                        { label: "SEO", text: reportData.analysis.seo_notes },
                        {
                          label: "Accessibility",
                          text: reportData.analysis.accessibility_notes,
                        },
                        { label: "Mobile", text: reportData.analysis.mobile_notes },
                      ]
                        .filter((n) => n.text)
                        .map((note, i) => (
                          <div key={i} style={{ marginBottom: "20px" }}>
                            <h4
                              style={{
                                fontFamily: "'Space Mono', monospace",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.6)",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: "8px",
                              }}
                            >
                              {note.label}
                            </h4>
                            <p
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "13px",
                                color: "rgba(255,255,255,0.55)",
                                lineHeight: 1.7,
                              }}
                            >
                              {note.text}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      marginBottom: "32px",
                    }}
                  >
                    {reportData.pdfBase64 && (
                      <button
                        onClick={() =>
                          downloadPdfFromBase64(
                            reportData.pdfBase64,
                            reportData.pdfFilename || "website-roast-report.pdf"
                          )
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "100px",
                          padding: "10px 24px",
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.6)",
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        {"\u2B07"} Download PDF Again
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Branding */}
              {showDetails && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 0",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.25)",
                      letterSpacing: "2px",
                    }}
                  >
                    roasted with {"\uD83D\uDD25"} by{" "}
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>
                      vibezap.dev
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Examples */}
          {!result && !loading && (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                Try these
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {["apple.com", "craigslist.org", "amazon.com"].map((site) => (
                  <button
                    key={site}
                    onClick={() => setUrl(site)}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "100px",
                      padding: "8px 16px",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.45)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(255,255,255,0.08)";
                      e.target.style.color = "rgba(255,255,255,0.7)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(255,255,255,0.04)";
                      e.target.style.color = "rgba(255,255,255,0.45)";
                    }}
                  >
                    {site}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
