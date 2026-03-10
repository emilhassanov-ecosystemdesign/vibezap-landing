import { useState } from 'react';

const STORAGE_KEY = 'vibezap_consent_accepted';

export default function ConsentGate({ children }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
    setDismissed(true);
  };

  return (
    <>
      {children}
      {!dismissed && (
        <div style={styles.banner}>
          <p style={styles.text}>
            By using this site, you agree to our{' '}
            <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={styles.link}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={styles.link}>
              Privacy Policy
            </a>.
          </p>
          <button onClick={handleDismiss} style={styles.button}>
            Got it
          </button>
        </div>
      )}
    </>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    background: '#0f1020',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  text: {
    margin: 0,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: "'Outfit', sans-serif",
  },
  link: {
    color: '#00BCD4',
    textDecoration: 'underline',
  },
  button: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer',
    background: '#00E676',
    color: '#0a0a1a',
    flexShrink: 0,
  },
};
