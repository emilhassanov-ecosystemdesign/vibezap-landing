export default function LegalFooter() {
  return (
    <div style={styles.footer}>
      <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={styles.link}>
        Terms of Service
      </a>
      <span style={styles.sep}>·</span>
      <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={styles.link}>
        Privacy Policy
      </a>
    </div>
  );
}

const styles = {
  footer: {
    textAlign: 'center',
    padding: '18px 0 22px',
    fontSize: 12,
    fontFamily: "'Outfit', sans-serif",
  },
  link: {
    color: '#555',
    textDecoration: 'none',
  },
  sep: {
    color: '#555',
    margin: '0 8px',
  },
};
