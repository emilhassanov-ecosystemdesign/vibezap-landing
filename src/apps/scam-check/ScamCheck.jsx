import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SCAM_CATEGORIES = [
  "Urgency Tactics",
  "Identity Spoofing",
  "Suspicious Links",
  "Grammar Red Flags",
  "Financial Bait",
  "Emotional Manipulation",
];

const categoryEmojis = {
  "Urgency Tactics": "\u23F0",
  "Identity Spoofing": "\uD83C\uDFAD",
  "Suspicious Links": "\uD83D\uDD17",
  "Grammar Red Flags": "\uD83D\uDCDD",
  "Financial Bait": "\uD83D\uDCB0",
  "Emotional Manipulation": "\uD83E\uDDE0",
};

const verdictConfig = {
  safe: { color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.25)", emoji: "\u2705", label: "Safe" },
  suspicious: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", emoji: "\u26A0\uFE0F", label: "Suspicious" },
  "likely scam": { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", emoji: "\uD83D\uDEA8", label: "Likely Scam" },
  "definite scam": { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", emoji: "\uD83D\uDED1", label: "Definite Scam" },
};

const EXAMPLE_MESSAGES = [
  {
    label: "Prize scam",
    text: "CONGRATULATIONS! You've been selected as a winner of our $1,000,000 international lottery! To claim your prize, please send us your full name, bank account details, and a processing fee of $99.99. Reply within 24 hours or your prize will be forfeited. Reference #WIN-38291-UK",
  },
  {
    label: "Phishing email",
    text: "Dear valued customer, We've detected unusual activity on your account. Your account will be suspended within 24 hours unless you verify your identity immediately. Click here to confirm your details: http://secure-bankk-verify.com/login\n\nSincerely,\nBank Security Team",
  },
  {
    label: "Job offer scam",
    text: "Hi! I found your resume on LinkedIn and I'm impressed. We have a remote position paying $5,000/week for just 2 hours of work daily. No experience needed! Just send me your personal details and a $50 training materials fee to get started. This opportunity won't last long!",
  },
];

function ScoreRing({ score, size = 120, label }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
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
    if (s <= 3) return "#4ade80";
    if (s <= 5) return "#fbbf24";
    if (s <= 7) return "#f97316";
    return "#ef4444";
  };

  const color = getColor(score);
  const offset = circumference - (animatedScore / 10) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <filter id="scoreGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s ease" }}
          filter="url(#scoreGlow)"
        />
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize={size * 0.32}
          fontFamily="'Space Mono', monospace" fontWeight="700"
          style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
        >
          {animatedScore}
        </text>
      </svg>
      {label && (
        <div style={{
          color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px",
          fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "2px",
        }}>
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
    if (s <= 3) return "linear-gradient(90deg, #4ade80, #22d3ee)";
    if (s <= 5) return "linear-gradient(90deg, #fbbf24, #fcd34d)";
    if (s <= 7) return "linear-gradient(90deg, #f97316, #fb923c)";
    return "linear-gradient(90deg, #ef4444, #f87171)";
  };

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-20px)",
      transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      marginBottom: "20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: "13px",
          color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "1.5px",
        }}>
          {categoryEmojis[name]} {name}
        </span>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: "14px", fontWeight: 700, color: "white",
        }}>
          {score}/10
        </span>
      </div>
      <div style={{
        height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${width}%`, background: getColor(score),
          borderRadius: "3px", transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
        }} />
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
        color: "rgba(255,255,255,0.55)", marginTop: "6px", lineHeight: 1.5, fontStyle: "italic",
      }}>
        &ldquo;{comment}&rdquo;
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

  return <>{displayed}<span style={{ opacity: 0.4, animation: "blink 1s step-end infinite" }}>|</span></>;
}

function LoadingState() {
  const [phase, setPhase] = useState(0);
  const phases = [
    "\uD83D\uDD0D Analyzing language patterns...",
    "\u23F0 Checking for urgency tactics...",
    "\uD83D\uDD17 Scanning for suspicious links...",
    "\uD83C\uDFAD Detecting identity spoofing...",
    "\uD83D\uDCB0 Evaluating financial hooks...",
    "\u2696\uFE0F Preparing the verdict...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % phases.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{
        fontSize: "48px", marginBottom: "24px",
        animation: "scamPulse 1.5s ease-in-out infinite",
      }}>
        {"\uD83D\uDEE1\uFE0F"}
      </div>
      <p style={{
        fontFamily: "'Space Mono', monospace", fontSize: "14px",
        color: "rgba(255,255,255,0.6)", letterSpacing: "1px",
        minHeight: "21px",
      }}>
        {phases[phase]}
      </p>
      <div style={{
        width: "200px", height: "2px", background: "rgba(255,255,255,0.1)",
        margin: "20px auto", borderRadius: "1px", overflow: "hidden",
      }}>
        <div style={{
          width: "40%", height: "100%",
          background: "linear-gradient(90deg, #00E5FF, #06b6d4)",
          borderRadius: "1px", animation: "scamLoading 1.5s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}

export default function ScamCheck() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const resultRef = useRef(null);
  const reportRef = useRef(null);
  const textareaRef = useRef(null);
  const scannedMessageRef = useRef("");
  const orderIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const checkoutOpenedAtRef = useRef(null);

  // Route-specific meta tags
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Am I Being Scammed? \u2014 AI Scam Detector | VibeZap";

    const desc = "Paste any suspicious email, text, or DM and get an instant AI-powered scam analysis with red flags and recommended actions.";
    const title = "Am I Being Scammed? \u2014 AI Scam Detector | VibeZap";
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
        const resp = await fetch(`/api/check-payment?product=scam&after=${encodeURIComponent(afterTs)}`);
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
      "https://vibezap.lemonsqueezy.com/checkout/buy/d96e2de1-52de-49aa-879b-693d33f1c60a";
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
    try {
      const response = await fetch("/api/scam-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: scannedMessageRef.current,
          orderId: oid,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate report");
      }
      const data = await response.json();
      setReportData(data);
      setEmailStatus(data.email || null);

      // Auto-download PDF
      if (data.pdfBase64) {
        downloadPdfFromBase64(data.pdfBase64, data.pdfFilename || "scam-forensic-report.pdf");
      }

      // Scroll to report
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 400);
    } catch (err) {
      console.error("Report generation error:", err);
      setPdfError(
        err.message || "Something went wrong generating your report."
      );
    } finally {
      setPdfGenerating(false);
    }
  };

  const checkMessage = async () => {
    if (!message.trim()) return;

    scannedMessageRef.current = message.trim();
    setLoading(true);
    setError(null);
    setResult(null);
    setShowDetails(false);
    setPaymentProcessing(false);
    setPdfGenerating(false);
    setPdfError(null);
    setReportData(null);
    setEmailStatus(null);
    setOrderCompleted(false);
    orderIdRef.current = null;

    try {
      const response = await fetch("/api/scam-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
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

  const handleScanAgain = () => {
    setResult(null);
    setShowDetails(false);
    setError(null);
    setMessage("");
    setPaymentProcessing(false);
    setPdfGenerating(false);
    setPdfError(null);
    setReportData(null);
    setEmailStatus(null);
    setOrderCompleted(false);
    orderIdRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => textareaRef.current?.focus(), 400);
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !loading && message.trim()) {
      e.preventDefault();
      checkMessage();
    }
  };

  const verdict = result ? verdictConfig[result.verdict?.toLowerCase()] || verdictConfig["suspicious"] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes scamPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        @keyframes scamLoading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(250%); }
          100% { transform: translateX(-100%); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shieldGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(0, 229, 255, 0.3), 0 0 40px rgba(6, 182, 212, 0.1); }
          50% { text-shadow: 0 0 30px rgba(0, 229, 255, 0.5), 0 0 60px rgba(6, 182, 212, 0.2); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes borderGlow {
          0%, 100% { border-color: rgba(0, 229, 255, 0.15); }
          50% { border-color: rgba(0, 229, 255, 0.35); }
        }

        @keyframes blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#0a0a0b", color: "white",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background texture */}
        <div style={{
          position: "fixed", inset: 0,
          background: "radial-gradient(ellipse at 20% 0%, rgba(0,229,255,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.03) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: "640px", margin: "0 auto", padding: "0 24px 60px",
          position: "relative", zIndex: 1,
        }}>
          {/* Back nav */}
          <div style={{ padding: "20px 0" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none", border: "none",
                color: "rgba(255,255,255,0.35)", cursor: "pointer",
                fontSize: "13px", fontFamily: "'Space Mono', monospace",
                letterSpacing: "0.5px", padding: 0,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => e.target.style.color = "#00E5FF"}
              onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.35)"}
            >
              &larr; Back to VibeZap
            </button>
          </div>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "48px", paddingTop: "40px" }}>
            <div style={{
              fontSize: "13px", fontFamily: "'Space Mono', monospace",
              color: "rgba(255,255,255,0.35)", letterSpacing: "4px",
              textTransform: "uppercase", marginBottom: "16px",
            }}>
              vibezap.dev presents
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(36px, 8vw, 56px)", fontWeight: 900,
              lineHeight: 1.1, animation: "shieldGlow 3s ease-in-out infinite",
            }}>
              Am I Being
              <br />
              <span style={{
                background: "linear-gradient(135deg, #00E5FF, #06b6d4, #0ea5e9)",
                backgroundSize: "200% 200%",
                animation: "gradientShift 4s ease infinite",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Scammed?
              </span>
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "16px",
              color: "rgba(255,255,255,0.45)", marginTop: "16px", lineHeight: 1.6,
            }}>
              Paste any suspicious message. Get an instant
              <br />
              AI-powered scam analysis. Stay safe out there.
            </p>
          </div>

          {/* Input Area */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px", padding: "6px", marginBottom: "16px",
            animation: loading ? "borderGlow 2s ease-in-out infinite" : "none",
            transition: "border-color 0.3s ease",
          }}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste the suspicious email, text message, or DM here..."
              disabled={loading}
              rows={6}
              style={{
                width: "100%", background: "transparent", border: "none",
                outline: "none", padding: "14px 18px", resize: "vertical",
                fontFamily: "'DM Sans', sans-serif", fontSize: "14px",
                color: "white", lineHeight: 1.6, minHeight: "140px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 12px 8px" }}>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: "11px",
                color: message.length > 4500 ? "#ef4444" : "rgba(255,255,255,0.25)",
              }}>
                {message.length.toLocaleString()} / 5,000
              </span>
              <button
                onClick={checkMessage}
                disabled={loading || !message.trim() || message.length > 5000}
                style={{
                  background: loading || !message.trim() || message.length > 5000
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #00E5FF, #06b6d4)",
                  border: "none", borderRadius: "12px", padding: "12px 28px",
                  fontFamily: "'Space Mono', monospace", fontSize: "13px", fontWeight: 700,
                  color: loading || !message.trim() || message.length > 5000
                    ? "rgba(255,255,255,0.3)" : "#000",
                  cursor: loading || !message.trim() || message.length > 5000
                    ? "not-allowed" : "pointer",
                  textTransform: "uppercase", letterSpacing: "2px",
                  transition: "all 0.3s ease", whiteSpace: "nowrap",
                }}
              >
                {loading ? "..." : "\uD83D\uDEE1\uFE0F Scan"}
              </button>
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          {!result && !loading && message.trim() && (
            <div style={{
              textAlign: "right", marginBottom: "32px", paddingRight: "4px",
            }}>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: "11px",
                color: "rgba(255,255,255,0.2)",
              }}>
                {navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl"}+Enter to scan
              </span>
            </div>
          )}

          {/* Spacer when hint not shown */}
          {!result && !loading && !message.trim() && <div style={{ marginBottom: "32px" }} />}

          {/* Loading */}
          {loading && <LoadingState />}

          {/* Error */}
          {error && (
            <div style={{
              textAlign: "center", padding: "32px",
              background: "rgba(239,68,68,0.08)", borderRadius: "16px",
              border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.7)",
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div ref={resultRef} style={{ animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              {/* Verdict Badge */}
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <span style={{
                  display: "inline-block", fontFamily: "'Space Mono', monospace",
                  fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "3px", color: verdict.color,
                  background: verdict.bg, padding: "8px 20px", borderRadius: "100px",
                  border: `1px solid ${verdict.border}`,
                }}>
                  {verdict.emoji} {result.verdict}
                </span>
              </div>

              {/* Risk Score */}
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <ScoreRing score={result.risk_score} size={140} label="Risk Level" />
              </div>

              {/* Headline */}
              <div style={{ textAlign: "center", marginBottom: "40px", padding: "0 12px" }}>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 700,
                  lineHeight: 1.3, color: "white", marginBottom: "16px",
                }}>
                  <TypewriterText
                    text={result.verdict_headline}
                    speed={30}
                    onComplete={() => setTimeout(() => setShowDetails(true), 300)}
                  />
                </h2>
                {showDetails && (
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: "15px",
                    color: "rgba(255,255,255,0.5)", lineHeight: 1.7,
                    animation: "slideUp 0.5s ease",
                  }}>
                    {result.summary}
                  </p>
                )}
              </div>

              {/* Category Breakdown */}
              {showDetails && (
                <div style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "20px", padding: "32px 28px", marginBottom: "32px",
                }}>
                  <h3 style={{
                    fontFamily: "'Space Mono', monospace", fontSize: "11px",
                    textTransform: "uppercase", letterSpacing: "3px",
                    color: "rgba(255,255,255,0.35)", marginBottom: "28px",
                  }}>
                    Red Flag Breakdown
                  </h3>
                  {SCAM_CATEGORIES.map((cat, i) => (
                    <CategoryBar
                      key={cat} name={cat}
                      score={result.categories?.[cat]?.score ?? 0}
                      comment={result.categories?.[cat]?.comment || "No issues detected"}
                      delay={i * 200}
                    />
                  ))}
                </div>
              )}

              {/* What To Do */}
              {showDetails && result.what_to_do && (
                <div style={{
                  background: "linear-gradient(135deg, rgba(0,229,255,0.06), rgba(6,182,212,0.04))",
                  border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px",
                  padding: "32px 28px", marginBottom: "32px", animation: "slideUp 0.6s ease",
                }}>
                  <h3 style={{
                    fontFamily: "'Space Mono', monospace", fontSize: "11px",
                    textTransform: "uppercase", letterSpacing: "3px",
                    color: "rgba(255,255,255,0.35)", marginBottom: "20px",
                  }}>
                    {"\uD83D\uDEE1\uFE0F"} What To Do Next
                  </h3>
                  {result.what_to_do.map((action, i) => (
                    <div key={i} style={{
                      display: "flex", gap: "14px",
                      marginBottom: i < result.what_to_do.length - 1 ? "16px" : 0,
                      alignItems: "flex-start",
                    }}>
                      <span style={{
                        fontFamily: "'Space Mono', monospace", fontSize: "13px",
                        fontWeight: 700, color: "#00E5FF", minWidth: "20px",
                      }}>
                        {i + 1}.
                      </span>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: "14px",
                        color: "rgba(255,255,255,0.7)", lineHeight: 1.6,
                      }}>
                        {action}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Premium CTA / Report Display */}
              {showDetails && !reportData && (
                <div style={{
                  textAlign: "center", padding: "36px 24px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "20px", marginBottom: "32px",
                  animation: "slideUp 0.6s ease",
                }}>
                  {/* Pre-purchase state */}
                  {!orderCompleted && !pdfGenerating && (
                    <>
                      <div style={{ fontSize: "28px", marginBottom: "12px" }}>{"\uD83D\uDCCB"}</div>
                      <h3 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "20px", fontWeight: 700, marginBottom: "8px",
                      }}>
                        Want the Full Forensic Report?
                      </h3>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                        color: "rgba(255,255,255,0.45)", marginBottom: "12px", lineHeight: 1.6,
                      }}>
                        Get a detailed report with deep forensic analysis
                        <br />
                        and a shareable safety report.
                      </p>
                      <div style={{
                        textAlign: "left", maxWidth: "320px", margin: "0 auto 20px",
                      }}>
                        {[
                          "Deep forensic analysis (3x more detail)",
                          "Technical indicator breakdown",
                          "Social engineering techniques identified",
                          "How to report to authorities",
                          "5 personalized protection tips",
                          "PDF download + emailed to you",
                        ].map((item, i) => (
                          <div key={i} style={{
                            display: "flex", gap: "8px", marginBottom: "6px",
                            fontFamily: "'DM Sans', sans-serif", fontSize: "12px",
                            color: "rgba(255,255,255,0.5)",
                          }}>
                            <span style={{ color: "#00E5FF", flexShrink: 0 }}>{"\u2713"}</span>
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
                            : "linear-gradient(135deg, #00E5FF, #06b6d4)",
                          border: "none", borderRadius: "12px", padding: "14px 32px",
                          fontFamily: "'Space Mono', monospace", fontSize: "13px",
                          fontWeight: 700,
                          color: paymentProcessing ? "rgba(255,255,255,0.3)" : "#000",
                          cursor: paymentProcessing ? "not-allowed" : "pointer",
                          textTransform: "uppercase", letterSpacing: "2px",
                        }}
                      >
                        {paymentProcessing ? "Processing..." : "Get Full Report \u2014 $3"}
                      </button>
                    </>
                  )}

                  {/* Generating report state */}
                  {pdfGenerating && (
                    <>
                      <div style={{
                        fontSize: "48px", marginBottom: "16px",
                        animation: "scamPulse 1.5s ease-in-out infinite",
                      }}>{"\uD83D\uDCDD"}</div>
                      <h3 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "18px", fontWeight: 700, marginBottom: "8px",
                      }}>
                        Generating Your Forensic Report...
                      </h3>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                        color: "rgba(255,255,255,0.45)", lineHeight: 1.6,
                      }}>
                        Running deep forensic analysis.
                        <br />This usually takes 10-15 seconds.
                      </p>
                      <div style={{
                        width: "200px", height: "2px", background: "rgba(255,255,255,0.1)",
                        margin: "20px auto", borderRadius: "1px", overflow: "hidden",
                      }}>
                        <div style={{
                          width: "40%", height: "100%",
                          background: "linear-gradient(90deg, #00E5FF, #06b6d4)",
                          borderRadius: "1px", animation: "scamLoading 1.5s ease-in-out infinite",
                        }} />
                      </div>
                    </>
                  )}

                  {/* Error state */}
                  {pdfError && !pdfGenerating && (
                    <div>
                      <div style={{ fontSize: "28px", marginBottom: "12px" }}>{"\u26A0\uFE0F"}</div>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                        color: "rgba(239,68,68,0.8)", marginBottom: "16px", lineHeight: 1.6,
                      }}>
                        {pdfError}
                      </p>
                      {orderIdRef.current && (
                        <button
                          onClick={() => handleReportGeneration(orderIdRef.current)}
                          style={{
                            background: "linear-gradient(135deg, #00E5FF, #06b6d4)",
                            border: "none", borderRadius: "12px", padding: "12px 24px",
                            fontFamily: "'Space Mono', monospace", fontSize: "12px",
                            fontWeight: 700, color: "#000", cursor: "pointer",
                            textTransform: "uppercase", letterSpacing: "1px",
                          }}
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* === FULL ON-SCREEN FORENSIC REPORT === */}
              {showDetails && reportData && (
                <div
                  ref={reportRef}
                  style={{ animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  {/* Action Bar */}
                  <div style={{
                    display: "flex", gap: "10px", justifyContent: "center",
                    flexWrap: "wrap", marginBottom: "32px",
                  }}>
                    {reportData.pdfBase64 && (
                      <button
                        onClick={() =>
                          downloadPdfFromBase64(
                            reportData.pdfBase64,
                            reportData.pdfFilename || "scam-forensic-report.pdf"
                          )
                        }
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "8px",
                          background: "linear-gradient(135deg, #00E5FF, #06b6d4)",
                          border: "none", borderRadius: "100px", padding: "10px 24px",
                          fontFamily: "'Space Mono', monospace", fontSize: "12px",
                          fontWeight: 700, color: "#000", cursor: "pointer",
                          textTransform: "uppercase", letterSpacing: "1px",
                        }}
                      >
                        {"\u2B07"} Download PDF
                      </button>
                    )}
                    {emailStatus?.sent && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        background: "rgba(74,222,128,0.08)",
                        border: "1px solid rgba(74,222,128,0.25)",
                        borderRadius: "100px", padding: "10px 20px",
                        fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "#4ade80",
                      }}>
                        {"\u2709\uFE0F"} Sent to {emailStatus.address}
                      </span>
                    )}
                    {emailStatus && !emailStatus.sent && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        background: "rgba(251,191,36,0.08)",
                        border: "1px solid rgba(251,191,36,0.25)",
                        borderRadius: "100px", padding: "10px 20px",
                        fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "#fbbf24",
                      }}>
                        Email unavailable — PDF downloaded
                      </span>
                    )}
                  </div>

                  {/* Executive Summary */}
                  {reportData.analysis?.executive_summary && (
                    <div style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "20px", padding: "32px 28px", marginBottom: "24px",
                    }}>
                      <h3 style={{
                        fontFamily: "'Space Mono', monospace", fontSize: "11px",
                        textTransform: "uppercase", letterSpacing: "3px",
                        color: "rgba(255,255,255,0.35)", marginBottom: "20px",
                      }}>
                        Executive Summary
                      </h3>
                      {reportData.analysis.executive_summary.split("\n").filter((p) => p.trim()).map((paragraph, i) => (
                        <p key={i} style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: "14px",
                          color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: "16px",
                        }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Detailed Red Flag Analysis */}
                  <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "20px", padding: "32px 28px", marginBottom: "24px",
                  }}>
                    <h3 style={{
                      fontFamily: "'Space Mono', monospace", fontSize: "11px",
                      textTransform: "uppercase", letterSpacing: "3px",
                      color: "rgba(255,255,255,0.35)", marginBottom: "28px",
                    }}>
                      Detailed Red Flag Analysis
                    </h3>
                    {SCAM_CATEGORIES.map((cat, i) => {
                      const catData = reportData.analysis?.categories?.[cat];
                      if (!catData) return null;
                      return (
                        <div key={cat} style={{ marginBottom: "28px" }}>
                          <CategoryBar
                            name={cat}
                            score={catData.score ?? 0}
                            comment={catData.comment || "No issues detected"}
                            delay={i * 150}
                          />
                          {catData.detailed_analysis && (
                            <p style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                              color: "rgba(255,255,255,0.55)", lineHeight: 1.7,
                              marginTop: "4px", paddingLeft: "4px",
                              borderLeft: "2px solid rgba(255,255,255,0.08)",
                              marginLeft: "2px", paddingTop: "4px", paddingBottom: "4px",
                            }}>
                              {catData.detailed_analysis}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Technical Indicators */}
                  {reportData.analysis?.technical_indicators && (
                    <div style={{
                      background: "linear-gradient(135deg, rgba(0,229,255,0.06), rgba(6,182,212,0.04))",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "20px", padding: "32px 28px", marginBottom: "24px",
                    }}>
                      <h3 style={{
                        fontFamily: "'Space Mono', monospace", fontSize: "11px",
                        textTransform: "uppercase", letterSpacing: "3px",
                        color: "rgba(255,255,255,0.35)", marginBottom: "24px",
                      }}>
                        {"\uD83D\uDD0D"} Technical Indicators
                      </h3>
                      {[
                        { label: "URL Analysis", text: reportData.analysis.technical_indicators.url_analysis },
                        { label: "Language Patterns", text: reportData.analysis.technical_indicators.language_patterns },
                      ].filter((n) => n.text).map((item, i) => (
                        <div key={i} style={{ marginBottom: "20px" }}>
                          <h4 style={{
                            fontFamily: "'Space Mono', monospace", fontSize: "12px",
                            fontWeight: 700, color: "rgba(255,255,255,0.6)",
                            textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px",
                          }}>
                            {item.label}
                          </h4>
                          <p style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                            color: "rgba(255,255,255,0.55)", lineHeight: 1.7,
                          }}>
                            {item.text}
                          </p>
                        </div>
                      ))}
                      {reportData.analysis.technical_indicators.social_engineering?.length > 0 && (
                        <div>
                          <h4 style={{
                            fontFamily: "'Space Mono', monospace", fontSize: "12px",
                            fontWeight: 700, color: "rgba(255,255,255,0.6)",
                            textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px",
                          }}>
                            Social Engineering Techniques
                          </h4>
                          {reportData.analysis.technical_indicators.social_engineering.map((technique, i) => (
                            <div key={i} style={{
                              display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start",
                            }}>
                              <span style={{
                                color: "#00E5FF", fontFamily: "'Space Mono', monospace",
                                fontSize: "12px", minWidth: "16px",
                              }}>
                                {"\u203A"}
                              </span>
                              <p style={{
                                fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                                color: "rgba(255,255,255,0.55)", lineHeight: 1.6,
                              }}>
                                {technique}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Similar Scam Patterns */}
                  {reportData.analysis?.similar_scam_patterns?.length > 0 && (
                    <div style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "20px", padding: "32px 28px", marginBottom: "24px",
                    }}>
                      <h3 style={{
                        fontFamily: "'Space Mono', monospace", fontSize: "11px",
                        textTransform: "uppercase", letterSpacing: "3px",
                        color: "rgba(255,255,255,0.35)", marginBottom: "20px",
                      }}>
                        {"\uD83C\uDFAD"} Similar Known Scam Patterns
                      </h3>
                      {reportData.analysis.similar_scam_patterns.map((pattern, i) => (
                        <div key={i} style={{
                          display: "flex", gap: "12px", marginBottom: "12px", alignItems: "flex-start",
                        }}>
                          <span style={{
                            fontFamily: "'Space Mono', monospace", fontSize: "12px",
                            fontWeight: 700, color: "#f97316", minWidth: "20px",
                          }}>
                            {i + 1}.
                          </span>
                          <p style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                            color: "rgba(255,255,255,0.65)", lineHeight: 1.6,
                          }}>
                            {pattern}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* How to Report */}
                  {reportData.analysis?.how_to_report?.length > 0 && (
                    <div style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "20px", padding: "32px 28px", marginBottom: "24px",
                    }}>
                      <h3 style={{
                        fontFamily: "'Space Mono', monospace", fontSize: "11px",
                        textTransform: "uppercase", letterSpacing: "3px",
                        color: "rgba(255,255,255,0.35)", marginBottom: "20px",
                      }}>
                        {"\uD83D\uDCE2"} How to Report
                      </h3>
                      {reportData.analysis.how_to_report.map((authority, i) => (
                        <div key={i} style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: "12px", padding: "20px",
                          marginBottom: i < reportData.analysis.how_to_report.length - 1 ? "12px" : 0,
                        }}>
                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: "8px",
                          }}>
                            <span style={{
                              fontFamily: "'Space Mono', monospace", fontSize: "13px",
                              fontWeight: 700, color: "rgba(255,255,255,0.85)",
                            }}>
                              {authority.authority}
                            </span>
                            {authority.url && (
                              <span style={{
                                fontFamily: "'Space Mono', monospace", fontSize: "11px",
                                color: "#00E5FF",
                              }}>
                                {authority.url}
                              </span>
                            )}
                          </div>
                          <p style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                            color: "rgba(255,255,255,0.55)", lineHeight: 1.6,
                          }}>
                            {authority.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Protection Tips */}
                  {reportData.analysis?.protection_tips?.length > 0 && (
                    <div style={{
                      background: "linear-gradient(135deg, rgba(74,222,128,0.06), rgba(34,211,238,0.04))",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "20px", padding: "32px 28px", marginBottom: "24px",
                    }}>
                      <h3 style={{
                        fontFamily: "'Space Mono', monospace", fontSize: "11px",
                        textTransform: "uppercase", letterSpacing: "3px",
                        color: "rgba(255,255,255,0.35)", marginBottom: "20px",
                      }}>
                        {"\uD83D\uDEE1\uFE0F"} Protection Tips
                      </h3>
                      {reportData.analysis.protection_tips.map((tip, i) => (
                        <div key={i} style={{
                          display: "flex", gap: "12px",
                          marginBottom: i < reportData.analysis.protection_tips.length - 1 ? "12px" : 0,
                          alignItems: "flex-start",
                        }}>
                          <span style={{
                            fontFamily: "'Space Mono', monospace", fontSize: "12px",
                            fontWeight: 700, color: "#4ade80", minWidth: "20px",
                          }}>
                            {i + 1}.
                          </span>
                          <p style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                            color: "rgba(255,255,255,0.65)", lineHeight: 1.6,
                          }}>
                            {tip}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div style={{
                    display: "flex", gap: "10px", justifyContent: "center",
                    flexWrap: "wrap", marginBottom: "32px",
                  }}>
                    {reportData.pdfBase64 && (
                      <button
                        onClick={() =>
                          downloadPdfFromBase64(
                            reportData.pdfBase64,
                            reportData.pdfFilename || "scam-forensic-report.pdf"
                          )
                        }
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "8px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "100px", padding: "10px 24px",
                          fontFamily: "'Space Mono', monospace", fontSize: "12px",
                          fontWeight: 700, color: "rgba(255,255,255,0.6)",
                          cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px",
                        }}
                      >
                        {"\u2B07"} Download PDF Again
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Scan Again */}
              {showDetails && (
                <div style={{
                  textAlign: "center", marginBottom: "32px",
                  animation: "slideUp 0.6s ease",
                }}>
                  <button
                    onClick={handleScanAgain}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px", padding: "14px 32px",
                      fontFamily: "'Space Mono', monospace", fontSize: "13px",
                      fontWeight: 700, color: "rgba(255,255,255,0.6)",
                      cursor: "pointer", textTransform: "uppercase",
                      letterSpacing: "2px", transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = "rgba(0,229,255,0.3)";
                      e.target.style.color = "#00E5FF";
                      e.target.style.background = "rgba(0,229,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                      e.target.style.color = "rgba(255,255,255,0.6)";
                      e.target.style.background = "rgba(255,255,255,0.04)";
                    }}
                  >
                    {"\uD83D\uDD0D"} Scan Another Message
                  </button>
                </div>
              )}

              {/* Footer Branding */}
              {showDetails && (
                <div style={{
                  textAlign: "center", padding: "24px 0",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <p style={{
                    fontFamily: "'Space Mono', monospace", fontSize: "11px",
                    color: "rgba(255,255,255,0.25)", letterSpacing: "2px",
                  }}>
                    scanned with {"\uD83D\uDEE1\uFE0F"} by{" "}
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>vibezap.dev</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Example messages */}
          {!result && !loading && (
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontFamily: "'Space Mono', monospace", fontSize: "11px",
                color: "rgba(255,255,255,0.25)", letterSpacing: "2px",
                textTransform: "uppercase", marginBottom: "16px",
              }}>
                Try these examples
              </p>
              <div style={{
                display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap",
              }}>
                {EXAMPLE_MESSAGES.map((example) => (
                  <button
                    key={example.label}
                    onClick={() => {
                      setMessage(example.text);
                      textareaRef.current?.focus();
                    }}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "100px", padding: "8px 16px",
                      fontFamily: "'Space Mono', monospace", fontSize: "12px",
                      color: "rgba(255,255,255,0.45)", cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(0,229,255,0.08)";
                      e.target.style.borderColor = "rgba(0,229,255,0.2)";
                      e.target.style.color = "#00E5FF";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(255,255,255,0.04)";
                      e.target.style.borderColor = "rgba(255,255,255,0.08)";
                      e.target.style.color = "rgba(255,255,255,0.45)";
                    }}
                  >
                    {example.label}
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
