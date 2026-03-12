import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const THEME = {
  accent: '#FFD93D',
  accentHover: '#FFE566',
  accentGlow: 'rgba(255, 217, 61, 0.25)',
  accentSoft: 'rgba(255, 217, 61, 0.08)',
  background: '#0a0a0b',
  surface: '#111114',
  surfaceAlt: '#16161a',
  border: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.6)',
  textDim: 'rgba(255,255,255,0.35)',
  storyBg: '#0e0e11',
  storyText: '#e8e0d4',
  warm: '#FFB347',
  warmGlow: 'rgba(255, 179, 71, 0.15)',
}

const STORY_STYLES = [
  { value: 'fairy-tale', label: 'Fairy Tale', icon: '🏰' },
  { value: 'adventure', label: 'Adventure', icon: '🗺️' },
  { value: 'bedtime', label: 'Bedtime', icon: '🌙' },
  { value: 'funny', label: 'Funny', icon: '😄' },
  { value: 'educational', label: 'Educational', icon: '🔬' },
]

const AGES = Array.from({ length: 11 }, (_, i) => i + 2)

// Twinkling stars background
function StarField() {
  const stars = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.4 + 0.1,
    })), [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,217,61,0.15), 0 0 40px rgba(255,217,61,0.05); }
          50% { box-shadow: 0 0 30px rgba(255,217,61,0.25), 0 0 60px rgba(255,217,61,0.1); }
        }
        @keyframes storyReveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {stars.map(s => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.id % 5 === 0 ? THEME.accent : '#fff',
            animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        animation: 'fadeInUp 0.5s ease-out',
      }}>
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <div style={{
            position: 'absolute', inset: 0,
            border: `3px solid ${THEME.border}`,
            borderTopColor: THEME.accent,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{
            position: 'absolute', inset: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
            animation: 'gentleFloat 2s ease-in-out infinite',
          }}>
            ✨
          </div>
        </div>
        <div>
          <div style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: 18, color: THEME.storyText, marginBottom: 8,
          }}>
            Weaving a magical story...
          </div>
          <div style={{
            fontFamily: "'Outfit', sans-serif", fontSize: 13,
            color: THEME.textDim,
          }}>
            Your personalized tale is being crafted
          </div>
        </div>
      </div>
    </div>
  )
}

function StoryDisplay({ result, childName, paymentProcessing, pdfGenerating, pdfError, reportProgress, emailStatus, pollingTimedOut, popupBlocked, handleGetReport, handleCancelPayment, checkPaymentNow, handleReportGeneration, orderIdRef, CHECKOUT_URL }) {
  const storyRef = useRef(null)

  const highlightName = (text) => {
    if (!childName || !text) return text
    const regex = new RegExp(`(${childName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} style={{
          color: THEME.accent,
          fontWeight: 600,
          textShadow: `0 0 12px ${THEME.accentGlow}`,
        }}>{part}</span>
      ) : part
    )
  }

  return (
    <div
      ref={storyRef}
      style={{
        maxWidth: 720,
        margin: '40px auto',
        padding: '0 20px',
        animation: 'storyReveal 0.8s ease-out',
      }}
    >
      {/* Story card */}
      <div style={{
        background: `linear-gradient(180deg, ${THEME.surfaceAlt} 0%, ${THEME.storyBg} 100%)`,
        border: `1px solid rgba(255, 217, 61, 0.12)`,
        borderRadius: 20,
        padding: '48px 40px 36px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'pulseGlow 4s ease-in-out infinite',
      }}>
        {/* Decorative corner flourishes */}
        <div style={{
          position: 'absolute', top: 12, left: 16,
          fontSize: 20, opacity: 0.15, color: THEME.accent,
          fontFamily: 'serif',
        }}>❦</div>
        <div style={{
          position: 'absolute', top: 12, right: 16,
          fontSize: 20, opacity: 0.15, color: THEME.accent,
          fontFamily: 'serif', transform: 'scaleX(-1)',
        }}>❦</div>

        {/* Story style badge */}
        {result.style && (
          <div style={{
            textAlign: 'center', marginBottom: 20,
          }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 20,
              background: THEME.accentSoft,
              border: `1px solid rgba(255, 217, 61, 0.15)`,
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: THEME.accent,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}>
              {STORY_STYLES.find(s => s.value === result.style)?.icon || '📖'}{' '}
              {STORY_STYLES.find(s => s.value === result.style)?.label || result.style}
            </span>
          </div>
        )}

        {/* Story title */}
        <h2 style={{
          fontFamily: "'Playfair Display', 'Georgia', serif",
          fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
          fontWeight: 700,
          textAlign: 'center',
          color: THEME.text,
          marginBottom: 8,
          lineHeight: 1.3,
        }}>
          {result.title || 'Your Story'}
        </h2>

        {/* Divider */}
        <div style={{
          width: 60, height: 2, margin: '20px auto 32px',
          background: `linear-gradient(90deg, transparent, ${THEME.accent}, transparent)`,
          borderRadius: 1,
        }} />

        {/* Story text */}
        <div style={{
          fontFamily: "'DM Sans', 'Georgia', serif",
          fontSize: 17,
          lineHeight: 1.85,
          color: THEME.storyText,
          textAlign: 'left',
        }}>
          {(result.preview || result.story || '').split('\n\n').map((paragraph, i) => (
            <p key={i} style={{
              marginBottom: 20,
              animation: `storyReveal 0.6s ease-out ${i * 0.15}s both`,
            }}>
              {highlightName(paragraph)}
            </p>
          ))}
        </div>

        {/* Preview fade-out overlay */}
        {result.isPreview && (
          <div style={{
            position: 'relative',
            marginTop: -40,
            paddingTop: 60,
            background: `linear-gradient(to bottom, transparent, ${THEME.storyBg})`,
          }}>
            <div style={{
              textAlign: 'center',
              padding: '16px 0 0',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              color: THEME.textMuted,
              fontStyle: 'italic',
            }}>
              Story preview ends here...
            </div>
          </div>
        )}

        {/* Watermark */}
        <div style={{
          textAlign: 'center', padding: '24px 0 0',
          borderTop: `1px solid ${THEME.border}`,
          marginTop: 28,
        }}>
          <a
            href="https://vibezap.dev/kids-story"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              color: 'rgba(255,255,255,0.4)', letterSpacing: '2px',
              textDecoration: 'none',
            }}
          >
            {'📖 crafted by '}
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>vibezap.dev</span>
          </a>
        </div>
      </div>

      {/* Upsell card */}
      {result.isPreview && (
        <div style={{
          marginTop: 28,
          background: `linear-gradient(135deg, rgba(255,217,61,0.06) 0%, rgba(255,179,71,0.04) 100%)`,
          border: `1px solid rgba(255,217,61,0.15)`,
          borderRadius: 16,
          padding: '32px 28px',
          textAlign: 'center',
          animation: 'fadeInUp 0.6s ease-out 0.4s both',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📕✨</div>
          <h3 style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: 22, fontWeight: 700, color: THEME.text,
            marginBottom: 10,
          }}>
            Get the Full Illustrated Story
          </h3>
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14, color: THEME.textMuted, lineHeight: 1.6,
            maxWidth: 420, margin: '0 auto 24px',
          }}>
            The complete story includes 8–10 illustrated pages, a personalized cover
            with {childName || 'your child'}'s name, and a beautifully formatted downloadable PDF.
          </p>

          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16,
            marginBottom: 28,
          }}>
            {[
              { icon: '📖', text: '8–10 pages' },
              { icon: '🎨', text: 'Illustrated' },
              { icon: '📄', text: 'PDF download' },
              { icon: '💌', text: 'Email delivery' },
            ].map((feature, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: THEME.textMuted,
                fontFamily: "'Outfit', sans-serif",
              }}>
                <span>{feature.icon}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {!paymentProcessing && !pdfGenerating && (
            <button
              onClick={handleGetReport}
              style={{
                padding: '16px 40px',
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.warm})`,
                color: '#0a0a0b',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                letterSpacing: '0.5px',
                boxShadow: `0 4px 24px ${THEME.accentGlow}`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = `0 8px 32px ${THEME.accentGlow}`
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = `0 4px 24px ${THEME.accentGlow}`
              }}
            >
              Get Full Story — $3
            </button>
          )}

          {/* Payment processing state */}
          {paymentProcessing && !pdfGenerating && (
            <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              <div style={{
                padding: '16px 24px',
                background: 'rgba(255,217,61,0.06)',
                border: `1px solid rgba(255,217,61,0.15)`,
                borderRadius: 12,
                marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 14, color: THEME.textMuted,
                  fontFamily: "'Outfit', sans-serif", marginBottom: 8,
                }}>
                  {popupBlocked
                    ? "Your browser blocked the checkout window. Use the link below to complete payment."
                    : "Complete payment in the checkout window..."}
                </div>
                {popupBlocked && (
                  <a
                    href={CHECKOUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: THEME.accent, fontSize: 13,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    Open checkout manually &rarr;
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={checkPaymentNow}
                  style={{
                    padding: '10px 20px', fontSize: 13,
                    fontFamily: "'Outfit', sans-serif",
                    background: 'rgba(255,217,61,0.1)',
                    border: `1px solid rgba(255,217,61,0.2)`,
                    color: THEME.accent, borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  I've already paid
                </button>
                <button
                  onClick={handleCancelPayment}
                  style={{
                    padding: '10px 20px', fontSize: 13,
                    fontFamily: "'Outfit', sans-serif",
                    background: 'none',
                    border: `1px solid ${THEME.border}`,
                    color: THEME.textMuted, borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
              {pollingTimedOut && (
                <div style={{
                  marginTop: 12, fontSize: 12, color: '#ff6b6b',
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  Payment check timed out. If you've paid, click "I've already paid" above or contact hello@vibezap.dev.
                </div>
              )}
            </div>
          )}

          {/* Report generation progress */}
          {pdfGenerating && (
            <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 12, marginBottom: 8,
              }}>
                <div style={{
                  width: 20, height: 20,
                  border: `2px solid ${THEME.border}`,
                  borderTopColor: THEME.accent,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <span style={{
                  fontSize: 14, color: THEME.textMuted,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {reportProgress?.message || 'Preparing your storybook...'}
                </span>
              </div>
            </div>
          )}

          {/* PDF error */}
          {pdfError && (
            <div style={{ marginTop: 12 }}>
              <div style={{
                fontSize: 13, color: '#ff6b6b', marginBottom: 12,
                fontFamily: "'Outfit', sans-serif",
              }}>
                {pdfError}
              </div>
              {orderIdRef.current && (
                <button
                  onClick={() => handleReportGeneration(orderIdRef.current)}
                  style={{
                    padding: '10px 20px', fontSize: 13,
                    fontFamily: "'Outfit', sans-serif",
                    background: 'rgba(255,217,61,0.1)',
                    border: `1px solid rgba(255,217,61,0.2)`,
                    color: THEME.accent, borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* Email status */}
          {emailStatus && (
            <div style={{
              marginTop: 12, fontSize: 12,
              fontFamily: "'Outfit', sans-serif",
              color: emailStatus.sent ? '#4ade80' : THEME.textDim,
            }}>
              {emailStatus.sent
                ? `PDF sent to ${emailStatus.address}`
                : emailStatus.address
                  ? `Email to ${emailStatus.address} failed — your PDF was downloaded above`
                  : null}
            </div>
          )}

          {!paymentProcessing && !pdfGenerating && !pdfError && (
            <div style={{
              marginTop: 14, fontSize: 12, color: THEME.textDim,
              fontFamily: "'Space Mono', monospace",
            }}>
              One-time purchase  ·  Instant delivery
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function KidsStoryCreator() {
  const navigate = useNavigate()
  const [childName, setChildName] = useState('')
  const [age, setAge] = useState('')
  const [interests, setInterests] = useState('')
  const [moral, setMoral] = useState('')
  const [storyStyle, setStoryStyle] = useState('fairy-tale')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Paid flow state
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [pollingTimedOut, setPollingTimedOut] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [reportProgress, setReportProgress] = useState(null)
  const [emailStatus, setEmailStatus] = useState(null)

  const orderIdRef = useRef(null)
  const pollIntervalRef = useRef(null)
  const checkoutOpenedAtRef = useRef(null)
  const reportRef = useRef(null)

  const CHECKOUT_URL = "https://vibezap.lemonsqueezy.com/checkout/buy/90aa36c0-9db9-4e6c-b678-a1531a527743"

  const canSubmit = childName.trim() && age && interests.trim() && !loading

  // ── Payment polling ───────────────────────────────────────────────

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  const startPaymentPolling = () => {
    stopPolling()
    setPollingTimedOut(false)
    const afterTs = new Date().toISOString()
    checkoutOpenedAtRef.current = afterTs
    let attempts = 0
    const maxAttempts = 60

    pollIntervalRef.current = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        stopPolling()
        setPollingTimedOut(true)
        return
      }
      try {
        const resp = await fetch(`/api/check-payment?product=kids-story&after=${encodeURIComponent(afterTs)}`)
        const data = await resp.json()
        if (data.found && data.orderId) {
          stopPolling()
          setPaymentProcessing(false)
          setPopupBlocked(false)
          orderIdRef.current = String(data.orderId)
          handleReportGeneration(String(data.orderId))
        }
      } catch (_) { /* silent retry */ }
    }, 3000)
  }

  const checkPaymentNow = async () => {
    const afterTs = checkoutOpenedAtRef.current || new Date(Date.now() - 5 * 60 * 1000).toISOString()
    try {
      const resp = await fetch(`/api/check-payment?product=kids-story&after=${encodeURIComponent(afterTs)}`)
      const data = await resp.json()
      if (data.found && data.orderId) {
        stopPolling()
        setPaymentProcessing(false)
        setPopupBlocked(false)
        orderIdRef.current = String(data.orderId)
        handleReportGeneration(String(data.orderId))
      }
    } catch (_) { /* silent */ }
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  // ── Checkout + SSE report generation ──────────────────────────────

  const handleGetReport = () => {
    setPaymentProcessing(true)
    setPdfError(null)
    setPopupBlocked(false)
    setPollingTimedOut(false)

    const win = window.open(CHECKOUT_URL, "_blank")
    if (!win) {
      setPopupBlocked(true)
    }
    startPaymentPolling()
  }

  const handleCancelPayment = () => {
    stopPolling()
    setPaymentProcessing(false)
    setPopupBlocked(false)
    setPollingTimedOut(false)
  }

  function downloadPdfFromBase64(base64, filename) {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: "application/pdf" })
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  const handleReportGeneration = async (oid) => {
    setPdfGenerating(true)
    setPdfError(null)
    setReportProgress(null)
    setEmailStatus(null)

    try {
      const response = await fetch("/api/kids-story-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: childName.trim(),
          age: parseInt(age, 10),
          interests: interests.trim(),
          moral: moral.trim() || undefined,
          style: storyStyle,
          orderId: oid,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to generate story")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const messages = buffer.split("\n\n")
        buffer = messages.pop()

        for (const msg of messages) {
          if (!msg.trim() || msg.startsWith(":")) continue

          const eventMatch = msg.match(/^event:\s*(.+)$/m)
          const dataMatch = msg.match(/^data:\s*(.+)$/m)
          if (!eventMatch || !dataMatch) continue

          const eventType = eventMatch[1].trim()
          let eventData
          try { eventData = JSON.parse(dataMatch[1]) } catch { continue }

          switch (eventType) {
            case "progress":
              setReportProgress(eventData)
              break
            case "story":
              setResult(prev => ({
                ...prev,
                isPreview: false,
                title: eventData.story.title,
                fullStory: eventData.story,
                hasIllustrations: eventData.hasIllustrations,
              }))
              setTimeout(() => {
                reportRef.current?.scrollIntoView({ behavior: "smooth" })
              }, 400)
              break
            case "pdf":
              downloadPdfFromBase64(
                eventData.pdfBase64,
                eventData.pdfFilename || "kids-story.pdf"
              )
              break
            case "email":
              setEmailStatus(eventData)
              break
            case "error":
              throw new Error(eventData.error)
          }
        }
      }
    } catch (err) {
      console.error("Story report error:", err)
      setPdfError(err.message || "Something went wrong generating your storybook.")
    } finally {
      setPdfGenerating(false)
      setReportProgress(null)
    }
  }

  // ── Free preview ──────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    setResult(null)
    setPaymentProcessing(false)
    setPdfGenerating(false)
    setPdfError(null)
    setEmailStatus(null)
    orderIdRef.current = null

    try {
      const res = await fetch('/api/kids-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: childName.trim(),
          age: parseInt(age, 10),
          interests: interests.trim(),
          moral: moral.trim() || undefined,
          style: storyStyle,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Something went wrong. Please try again.')
      }

      const data = await res.json()
      setResult({ ...data, isPreview: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError('')
    setPaymentProcessing(false)
    setPdfGenerating(false)
    setPdfError(null)
    setEmailStatus(null)
    orderIdRef.current = null
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    fontSize: 15,
    background: THEME.surface,
    border: `1px solid ${THEME.border}`,
    borderRadius: 12,
    color: THEME.text,
    fontFamily: "'Outfit', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: THEME.textMuted,
    marginBottom: 8,
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '0.3px',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: THEME.background,
      color: THEME.text,
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
    }}>
      <StarField />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Back Navigation */}
        <div style={{ padding: '20px 32px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', color: THEME.textDim,
              cursor: 'pointer', fontSize: 13, fontFamily: "'Space Mono', monospace",
              letterSpacing: '0.5px', padding: 0, transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => e.target.style.color = '#00E5FF'}
            onMouseLeave={e => e.target.style.color = THEME.textDim}
          >
            &larr; Back to VibeZap
          </button>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '32px 20px 40px' }}>
          <div style={{
            fontSize: 13, fontFamily: "'Space Mono', monospace",
            color: THEME.textDim, letterSpacing: '4px',
            textTransform: 'uppercase', marginBottom: 16,
          }}>
            vibezap.dev presents
          </div>

          <div style={{
            fontSize: 48, marginBottom: 12,
            animation: 'gentleFloat 3s ease-in-out infinite',
            display: 'inline-block',
          }}>
            📖
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontWeight: 800,
            marginBottom: 14,
            lineHeight: 1.2,
            background: `linear-gradient(135deg, ${THEME.text} 30%, ${THEME.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Kids Story Creator
          </h1>
          <p style={{
            fontSize: '1.05rem', color: THEME.textMuted,
            maxWidth: 480, margin: '0 auto', lineHeight: 1.6,
          }}>
            Create a magical, personalized story starring your child.
            Enter their details and watch the magic unfold.
          </p>
        </div>

        {/* Form */}
        {!result && !loading && (
          <div style={{
            maxWidth: 540,
            margin: '0 auto',
            padding: '0 20px 40px',
            animation: 'fadeInUp 0.6s ease-out',
          }}>
            <div style={{
              background: THEME.surface,
              border: `1px solid ${THEME.border}`,
              borderRadius: 20,
              padding: '32px 28px',
            }}>
              {/* Child's Name */}
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>Child's Name *</label>
                <input
                  type="text"
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                  placeholder="e.g. Luna, Max, Aria..."
                  maxLength={50}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,217,61,0.3)'}
                  onBlur={e => e.target.style.borderColor = THEME.border}
                />
              </div>

              {/* Age + Story Style row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
                <div style={{ flex: '0 0 100px' }}>
                  <label style={labelStyle}>Age *</label>
                  <select
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='%23999'%3E%3Cpath d='M0 0l6 8 6-8z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 36,
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,217,61,0.3)'}
                    onBlur={e => e.target.style.borderColor = THEME.border}
                  >
                    <option value="" disabled>Age</option>
                    {AGES.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Story Style</label>
                  <select
                    value={storyStyle}
                    onChange={e => setStoryStyle(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='%23999'%3E%3Cpath d='M0 0l6 8 6-8z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 36,
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,217,61,0.3)'}
                    onBlur={e => e.target.style.borderColor = THEME.border}
                  >
                    {STORY_STYLES.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interests */}
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>Interests & Favorite Things *</label>
                <input
                  type="text"
                  value={interests}
                  onChange={e => setInterests(e.target.value)}
                  placeholder="e.g. dinosaurs, space, painting, cats..."
                  maxLength={200}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,217,61,0.3)'}
                  onBlur={e => e.target.style.borderColor = THEME.border}
                />
                <div style={{
                  fontSize: 11, color: THEME.textDim, marginTop: 4,
                  fontFamily: "'Space Mono', monospace",
                }}>
                  Separate with commas
                </div>
              </div>

              {/* Moral */}
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>
                  Moral or Lesson <span style={{ fontWeight: 400, color: THEME.textDim }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={moral}
                  onChange={e => setMoral(e.target.value)}
                  placeholder="e.g. kindness matters, be brave, share with others..."
                  maxLength={150}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,217,61,0.3)'}
                  onBlur={e => e.target.style.borderColor = THEME.border}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  padding: '16px 32px',
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "'Syne', sans-serif",
                  background: canSubmit
                    ? `linear-gradient(135deg, ${THEME.accent}, ${THEME.warm})`
                    : 'rgba(255,255,255,0.08)',
                  color: canSubmit ? '#0a0a0b' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  borderRadius: 12,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s ease',
                  boxShadow: canSubmit ? `0 4px 20px ${THEME.accentGlow}` : 'none',
                }}
                onMouseEnter={e => {
                  if (canSubmit) {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = `0 8px 30px ${THEME.accentGlow}`
                  }
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = canSubmit ? `0 4px 20px ${THEME.accentGlow}` : 'none'
                }}
              >
                ✨ Create Story
              </button>
            </div>

            {error && (
              <p style={{
                color: '#ff6b6b', marginTop: 16, fontSize: 14,
                textAlign: 'center',
                fontFamily: "'Outfit', sans-serif",
              }}>
                {error}
              </p>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSpinner />}

        {/* Results */}
        {result && (
          <div ref={reportRef}>
            <StoryDisplay
              result={result}
              childName={childName}
              paymentProcessing={paymentProcessing}
              pdfGenerating={pdfGenerating}
              pdfError={pdfError}
              reportProgress={reportProgress}
              emailStatus={emailStatus}
              pollingTimedOut={pollingTimedOut}
              popupBlocked={popupBlocked}
              handleGetReport={handleGetReport}
              handleCancelPayment={handleCancelPayment}
              checkPaymentNow={checkPaymentNow}
              handleReportGeneration={handleReportGeneration}
              orderIdRef={orderIdRef}
              CHECKOUT_URL={CHECKOUT_URL}
            />
            <div style={{ textAlign: 'center', padding: '0 20px 40px' }}>
              <button
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: `1px solid ${THEME.border}`,
                  color: THEME.textMuted,
                  padding: '12px 28px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = 'rgba(255,217,61,0.3)'
                  e.target.style.color = THEME.text
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = THEME.border
                  e.target.style.color = THEME.textMuted
                }}
              >
                Create Another Story
              </button>
            </div>
          </div>
        )}

        {/* Legal disclaimer */}
        <div style={{
          borderTop: `1px solid rgba(255,255,255,0.06)`,
          marginTop: 16, paddingTop: 10, paddingBottom: 24,
          textAlign: 'center', fontSize: 12, color: '#555',
          fontFamily: "'Outfit', sans-serif",
        }}>
          {'⚠️ For educational & entertainment purposes only. AI outputs may be inaccurate. Use at your own risk. See '}
          <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>
            Terms of Service
          </a>.
        </div>
      </div>
    </div>
  )
}
