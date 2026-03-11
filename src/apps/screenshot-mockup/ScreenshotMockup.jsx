import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const THEME = {
  accent: '#00E5FF',
  accentGlow: 'rgba(0, 229, 255, 0.3)',
  background: '#0a0a0b',
  surface: '#111114',
  surfaceHover: '#1a1a1f',
  border: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.6)',
  locked: 'rgba(255,255,255,0.2)',
}

const DEVICES = [
  { id: 'iphone-15', name: 'iPhone 15', icon: '📱', free: true },
  { id: 'macbook-pro', name: 'MacBook Pro', icon: '💻', free: false },
  { id: 'ipad', name: 'iPad', icon: '📋', free: false },
  { id: 'android', name: 'Android', icon: '📲', free: false },
  { id: 'desktop', name: 'Desktop', icon: '🖥️', free: false },
]

const BACKGROUNDS = [
  { id: 'white', color: '#ffffff', label: 'White', free: true },
  { id: 'black', color: '#000000', label: 'Black', free: false },
  { id: 'gradient-blue', type: 'gradient', from: '#667eea', to: '#764ba2', label: 'Blue-Purple', free: false },
  { id: 'gradient-peach', type: 'gradient', from: '#f093fb', to: '#f5576c', label: 'Peach-Pink', free: false },
  { id: 'gradient-ocean', type: 'gradient', from: '#43e97b', to: '#38f9d7', label: 'Ocean-Green', free: false },
  { id: 'gradient-sunset', type: 'gradient', from: '#fa709a', to: '#fee140', label: 'Sunset', free: false },
]

const LOADING_MESSAGES = [
  'Launching browser...',
  'Navigating to site...',
  'Taking screenshot...',
  'Building mockup...',
]

export default function ScreenshotMockup() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [selectedDevice, setSelectedDevice] = useState('iphone-15')
  const [selectedBg, setSelectedBg] = useState('white')
  const [isPaid, setIsPaid] = useState(false)

  // Paid tier state
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [paymentPending, setPaymentPending] = useState(false)
  const pollTimerRef = useRef(null)
  const paymentStartRef = useRef(null)

  const handleSubmit = async () => {
    let trimmed = url.trim()
    if (!trimmed) return

    // Auto-prepend https:// if no protocol
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed
      setUrl(trimmed)
    }

    setLoading(true)
    setError('')
    setResult(null)
    setBulkResult(null)

    // Cycle through loading messages
    let msgIndex = 0
    setLoadingMsg(LOADING_MESSAGES[0])
    const msgTimer = setInterval(() => {
      msgIndex = Math.min(msgIndex + 1, LOADING_MESSAGES.length - 1)
      setLoadingMsg(LOADING_MESSAGES[msgIndex])
    }, 3000)

    try {
      const res = await fetch('/api/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to generate mockup')
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      clearInterval(msgTimer)
      setLoading(false)
      setLoadingMsg('')
    }
  }

  const handleDownload = (base64Data, filename) => {
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${base64Data}`
    link.download = filename || 'mockup-iphone-15.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadZip = (base64Data) => {
    const link = document.createElement('a')
    link.href = `data:application/zip;base64,${base64Data}`
    link.download = 'mockups.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- Payment flow ---
  const startPayment = () => {
    const checkoutUrl = 'https://vibezap.lemonsqueezy.com/checkout/buy/1390562'
    window.open(checkoutUrl, '_blank')
    setPaymentPending(true)
    paymentStartRef.current = new Date().toISOString()
    startPolling()
  }

  const startPolling = () => {
    const after = paymentStartRef.current
    let elapsed = 0

    pollTimerRef.current = setInterval(async () => {
      elapsed += 3000
      if (elapsed > 180000) {
        // 3 min max
        clearInterval(pollTimerRef.current)
        setPaymentPending(false)
        setError('Payment check timed out. If you paid, please refresh and try again.')
        return
      }

      try {
        const res = await fetch(`/api/check-payment?product=mockup&after=${encodeURIComponent(after)}`)
        const data = await res.json()
        if (data.found) {
          clearInterval(pollTimerRef.current)
          setPaymentPending(false)
          setIsPaid(true)
          generateBulkMockups(data.orderId)
        }
      } catch {
        // Silently retry
      }
    }, 3000)
  }

  const generateBulkMockups = async (orderId) => {
    setBulkLoading(true)
    setError('')

    const selectedDevices = DEVICES.map((d) => d.id)
    const bgConfig = BACKGROUNDS.find((b) => b.id === selectedBg)
    const background = bgConfig?.type === 'gradient'
      ? { type: 'gradient', from: bgConfig.from, to: bgConfig.to }
      : bgConfig?.color || '#ffffff'

    try {
      const res = await fetch('/api/mockup-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: [url.trim()],
          devices: selectedDevices,
          background,
          orderId,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to generate mockups')
      }

      const data = await res.json()
      setBulkResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.background, color: THEME.text, fontFamily: 'Outfit, sans-serif' }}>
      {/* Back Navigation */}
      <div style={{ padding: '20px 32px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer', fontSize: '13px', fontFamily: "'Space Mono', monospace",
            letterSpacing: '0.5px', padding: 0, transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#00E5FF')}
          onMouseLeave={(e) => (e.target.style.color = 'rgba(255,255,255,0.35)')}
        >
          &larr; Back to VibeZap
        </button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '40px 20px 40px' }}>
        <div style={{
          fontSize: '13px', fontFamily: "'Space Mono', monospace",
          color: 'rgba(255,255,255,0.35)', letterSpacing: '4px',
          textTransform: 'uppercase', marginBottom: '16px',
        }}>
          vibezap.dev presents
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: '16px' }}>
          Screenshot Mockup
        </h1>
        <p style={{ fontSize: '1.1rem', color: THEME.textMuted, maxWidth: '540px', margin: '0 auto' }}>
          Paste any URL. Get a stunning device mockup in seconds. No Figma needed.
        </p>
      </div>

      {/* Input */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-website.com"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={{
              flex: 1, padding: '16px 20px', fontSize: '16px',
              background: THEME.surface, border: `1px solid ${THEME.border}`,
              borderRadius: '12px', color: THEME.text, fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
            style={{
              padding: '16px 28px', fontSize: '16px', fontWeight: 600,
              background: THEME.accent, color: '#000', border: 'none',
              borderRadius: '12px', cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit', opacity: loading || !url.trim() ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Generating...' : 'Mock it up'}
          </button>
        </div>

        {error && (
          <p style={{ color: '#ff4444', marginTop: '12px', fontSize: '14px' }}>{error}</p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ display: 'inline-block', position: 'relative', width: '120px', height: '240px' }}>
            {/* Pulsing iPhone outline */}
            <div style={{
              width: '100%', height: '100%',
              border: `2px solid ${THEME.accent}`,
              borderRadius: '24px',
              animation: 'pulse 1.5s ease-in-out infinite',
              opacity: 0.6,
            }} />
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.3; transform: scale(0.97); }
                50% { opacity: 0.8; transform: scale(1.03); }
              }
            `}</style>
          </div>
          <p style={{ color: THEME.accent, marginTop: '20px', fontSize: '14px', fontFamily: "'Space Mono', monospace" }}>
            {loadingMsg}
          </p>
        </div>
      )}

      {/* Free Result */}
      {result && !bulkResult && (
        <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
          <div style={{
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            borderRadius: '16px', padding: '32px', textAlign: 'center',
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', marginBottom: '20px', fontSize: '1.4rem' }}>
              Your Mockup
            </h2>

            {/* Mockup Preview */}
            <div style={{
              display: 'inline-block', maxWidth: '100%', borderRadius: '8px',
              overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <img
                src={`data:image/png;base64,${result.image}`}
                alt={`${result.deviceName} mockup`}
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Download Button */}
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => handleDownload(result.image, `mockup-${result.device}.png`)}
                style={{
                  padding: '14px 36px', fontSize: '16px', fontWeight: 600,
                  background: THEME.accent, color: '#000', border: 'none',
                  borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Download PNG
              </button>
            </div>

            {/* Watermark */}
            <div style={{
              textAlign: 'center', padding: '20px 0 8px',
              borderTop: `1px solid ${THEME.border}`, marginTop: '24px',
            }}>
              <a
                href="https://vibezap.dev/mockup"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)', letterSpacing: '2px',
                  textDecoration: 'none',
                }}
              >
                mocked up by{' '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>vibezap.dev</span>
              </a>
            </div>
          </div>

          {/* Upsell Card */}
          {!isPaid && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(255,138,0,0.08))',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: '16px', padding: '32px', marginTop: '24px',
              textAlign: 'center',
            }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', marginBottom: '12px' }}>
                Want all 5 devices?
              </h3>
              <p style={{ color: THEME.textMuted, fontSize: '0.95rem', marginBottom: '8px' }}>
                Get your site on iPhone, MacBook, iPad, Android &amp; Desktop.
              </p>
              <p style={{ color: THEME.textMuted, fontSize: '0.95rem', marginBottom: '20px' }}>
                Custom backgrounds. No watermark. Download as ZIP.
              </p>

              {/* Device icons row */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {DEVICES.map((d) => (
                  <div key={d.id} style={{
                    fontSize: '28px', padding: '12px',
                    background: THEME.surface, borderRadius: '12px',
                    border: `1px solid ${THEME.border}`,
                    opacity: d.free ? 1 : 0.7,
                  }} title={d.name}>
                    {d.icon}
                  </div>
                ))}
              </div>

              {/* Background swatches preview */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {BACKGROUNDS.map((bg) => (
                  <div
                    key={bg.id}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: bg.type === 'gradient'
                        ? `linear-gradient(135deg, ${bg.from}, ${bg.to})`
                        : bg.color,
                      border: '2px solid rgba(255,255,255,0.15)',
                    }}
                    title={bg.label}
                  />
                ))}
              </div>

              {paymentPending ? (
                <div>
                  <div style={{
                    display: 'inline-block', padding: '14px 36px',
                    fontSize: '16px', fontWeight: 600, color: THEME.accent,
                    fontFamily: "'Space Mono', monospace",
                  }}>
                    Waiting for payment...
                  </div>
                  <p style={{ color: THEME.textMuted, fontSize: '13px', marginTop: '8px' }}>
                    Complete checkout in the new tab. This will update automatically.
                  </p>
                </div>
              ) : (
                <button
                  onClick={startPayment}
                  style={{
                    padding: '14px 36px', fontSize: '16px', fontWeight: 700,
                    background: 'linear-gradient(135deg, #00E5FF, #FF8A00)',
                    color: '#000', border: 'none', borderRadius: '12px',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Unlock All Devices — $2.99
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Loading */}
      {bulkLoading && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: THEME.accent, fontSize: '14px', fontFamily: "'Space Mono', monospace" }}>
            Generating mockups for all devices...
          </p>
        </div>
      )}

      {/* Paid Bulk Result */}
      {bulkResult && (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
          <div style={{
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            borderRadius: '16px', padding: '32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', margin: 0 }}>
                Your Mockups ({bulkResult.count} images)
              </h2>
              <button
                onClick={() => handleDownloadZip(bulkResult.zipBase64)}
                style={{
                  padding: '12px 28px', fontSize: '14px', fontWeight: 600,
                  background: THEME.accent, color: '#000', border: 'none',
                  borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Download All (ZIP)
              </button>
            </div>

            {/* Preview Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
            }}>
              {bulkResult.previews?.map((preview, i) => (
                <div key={i} style={{
                  background: THEME.background, borderRadius: '12px',
                  padding: '16px', border: `1px solid ${THEME.border}`,
                  textAlign: 'center',
                }}>
                  <img
                    src={`data:image/png;base64,${preview.image}`}
                    alt={`${preview.device} mockup`}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                  />
                  <p style={{ fontSize: '13px', color: THEME.textMuted, marginTop: '8px', marginBottom: '8px' }}>
                    {DEVICES.find((d) => d.id === preview.device)?.name || preview.device}
                  </p>
                  <button
                    onClick={() => handleDownload(preview.image, `mockup-${preview.device}.png`)}
                    style={{
                      padding: '6px 16px', fontSize: '12px', fontWeight: 600,
                      background: 'transparent', color: THEME.accent,
                      border: `1px solid ${THEME.accent}`, borderRadius: '8px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>

            {/* Watermark */}
            <div style={{
              textAlign: 'center', padding: '20px 0 8px',
              borderTop: `1px solid ${THEME.border}`, marginTop: '24px',
            }}>
              <a
                href="https://vibezap.dev/mockup"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)', letterSpacing: '2px',
                  textDecoration: 'none',
                }}
              >
                mocked up by{' '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>vibezap.dev</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Legal disclaimer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 40, paddingTop: 16,
        paddingBottom: 24, textAlign: 'center', fontSize: 12, color: '#555',
        fontFamily: "'Outfit', sans-serif",
      }}>
        ⚠️ For educational &amp; entertainment purposes only. Screenshots are taken of publicly accessible websites. Use at your own risk. See{' '}
        <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>Terms of Service</a>.
      </div>
    </div>
  )
}
