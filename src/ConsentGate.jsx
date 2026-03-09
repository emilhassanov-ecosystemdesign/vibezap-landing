import { useState } from 'react';

const STORAGE_KEY = 'vibezap_consent_accepted';

const keyPoints = [
  'All tools are for educational, research, and entertainment purposes only',
  'AI-generated outputs may be inaccurate, incomplete, or misleading',
  'You use all tools entirely at your own risk',
  'We provide no warranties, guarantees, or SLAs',
  'We are not liable for any damages arising from use of our tools',
  'Paid features are non-refundable',
];

export default function ConsentGate({ children }) {
  const [accepted, setAccepted] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
    setAccepted(true);
  };

  if (accepted) return children;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#00E5FF" />
          </svg>
          <span style={styles.logoText}>VibeZap</span>
        </div>

        {/* Heading */}
        <p style={styles.heading}>
          Before using VibeZap tools, please review and accept our terms.
        </p>

        {/* Key points */}
        <div style={styles.pointsBox}>
          {keyPoints.map((point, i) => (
            <div key={i} style={styles.point}>
              <span style={styles.bullet}>-</span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        {/* Links */}
        <div style={styles.links}>
          Read the full{' '}
          <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={styles.link}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={styles.link}>
            Privacy Policy
          </a>
        </div>

        {/* Checkbox */}
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={styles.checkbox}
          />
          <span>I have read and agree to the Terms of Service and Privacy Policy</span>
        </label>

        {/* Button */}
        <button
          disabled={!checked}
          onClick={handleAccept}
          style={{
            ...styles.button,
            ...(checked ? {} : styles.buttonDisabled),
          }}
        >
          Accept &amp; Continue
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    background: '#0a0a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    background: '#0f1020',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '36px 32px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 22,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  heading: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 1.6,
    margin: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  pointsBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '14px 18px',
    maxHeight: 220,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  point: {
    display: 'flex',
    gap: 10,
    fontSize: 13,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: "'Outfit', sans-serif",
  },
  bullet: {
    color: '#00E676',
    flexShrink: 0,
    fontWeight: 700,
  },
  links: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: "'Outfit', sans-serif",
  },
  link: {
    color: '#00BCD4',
    textDecoration: 'none',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    lineHeight: 1.5,
  },
  checkbox: {
    marginTop: 3,
    accentColor: '#00E676',
    flexShrink: 0,
  },
  button: {
    width: '100%',
    padding: '13px 0',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer',
    background: '#00E676',
    color: '#0a0a1a',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
};
