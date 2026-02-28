# Shared Utilities

Place shared components, utilities, and constants here when **3+ micro-apps** need the same code.

## Planned extractions
- `components/BackNav.jsx` — "← Back to VibZap" navigation (extract when 3rd app ships)
- `constants/theme.js` — Brand colors, fonts (extract when consistency becomes an issue)
- `utils/api.js` — Common fetch wrapper with error handling

## Rule of thumb
Don't extract until you have 3 concrete consumers. Premature abstraction is worse than duplication.
