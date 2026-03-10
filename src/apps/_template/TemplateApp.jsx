import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * VibeZap Micro-App Template
 *
 * Copy this file to src/apps/<your-app-name>/<YourAppName>.jsx
 * Then customize everything below.
 *
 * Checklist after creating:
 * 1. Rename component and export
 * 2. Add route in src/App.jsx
 * 3. Create api/<your-app>.js if needed
 * 4. Add tool card in VibeZapLanding.jsx
 * 5. Create README.md in this folder
 */

// Customize your theme
const THEME = {
  accent: '#00E5FF',
  accentGlow: 'rgba(0, 229, 255, 0.3)',
  background: '#0a0a0b',
  surface: '#111114',
  border: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.6)',
}

export default function TemplateApp() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/your-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Something went wrong')
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.background, color: THEME.text, fontFamily: 'Outfit, sans-serif' }}>
      {/* Back Navigation */}
      <div style={{ padding: '20px 32px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', color: THEME.textMuted,
            cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          ← Back to VibeZap
        </button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: '16px' }}>
          Your Tool Name
        </h1>
        <p style={{ fontSize: '1.1rem', color: THEME.textMuted, maxWidth: '500px', margin: '0 auto' }}>
          One sentence describing what this tool does.
        </p>
      </div>

      {/* Input */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter something..."
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
            disabled={loading || !input.trim()}
            style={{
              padding: '16px 32px', fontSize: '16px', fontWeight: 600,
              background: THEME.accent, color: '#000', border: 'none',
              borderRadius: '12px', cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : 'Go'}
          </button>
        </div>

        {error && (
          <p style={{ color: '#ff4444', marginTop: '12px', fontSize: '14px' }}>{error}</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
          <div style={{
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            borderRadius: '16px', padding: '32px',
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', marginBottom: '16px' }}>Results</h2>
            <pre style={{ whiteSpace: 'pre-wrap', color: THEME.textMuted, fontSize: '14px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
            {/* Watermark — update emoji, tagline, and route for your app */}
            <div style={{
              textAlign: 'center', padding: '20px 0 8px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              marginTop: '24px',
            }}>
              <a
                href="https://vibezap.dev/your-route"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)', letterSpacing: '2px',
                  textDecoration: 'none',
                }}
              >
                powered by{' '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>vibezap.dev</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Legal disclaimer */}
      <div style={{ borderTop: '1px solid #1a1a3a', marginTop: 32, paddingTop: 16, textAlign: 'center', fontSize: 12, color: '#777', fontFamily: "'Outfit', sans-serif" }}>
        ⚠️ For educational &amp; entertainment purposes only. AI outputs may be inaccurate. Use at your own risk. See{' '}
        <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: '#777', textDecoration: 'underline' }}>Terms of Service</a>.
      </div>
    </div>
  )
}
