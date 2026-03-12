# How to Add a New Micro-App

Step-by-step guide for adding a new tool to VibeZap.dev.

## 1. Create the App Folder

```bash
mkdir src/apps/<tool-name>
```

Use kebab-case for the folder name (e.g., `scam-check`, `kids-story`).

## 2. Create the Component

Copy the template from `src/apps/_template/TemplateApp.jsx` and customize:

```bash
cp src/apps/_template/TemplateApp.jsx src/apps/<tool-name>/<ToolName>.jsx
```

Key things to customize:
- Component name and export
- Page title, subtitle, theme colors
- Input form (URL, text, file upload, etc.)
- Loading states and messaging
- Results display
- API endpoint URL

> **Note:** The template includes all required standard UI elements (see below). Do not remove them.

### Required Standard UI Elements

Every micro-app **must** include these elements (all present in the template):

1. **"← Back to VibeZap" nav** — Top of page, uses `useNavigate()` from react-router-dom to go to `/`. Cyan hover (`#00E5FF`), Space Mono font.
2. **"vibezap.dev presents" header** — Subtle uppercase text above the app title. Space Mono, `rgba(255,255,255,0.35)`, `letterSpacing: '4px'`.
3. **Result watermark** — Inside the results area, a small branded link: `"powered by vibezap.dev/<route>"` or `"<verb> by vibezap.dev/<route>"`. Customize the verb/emoji per app.
4. **Legal disclaimer** — Bottom of component. Required on every tool page. See CLAUDE.md "Legal Compliance" section.

### Styling Convention
- All styles are inline via React `style` props
- Use the brand tokens from CLAUDE.md
- Each app can have its own accent color theme
- Dark background is standard (`#0a0a0b` or `#06070B`)

## 3. Add the Route

In `src/App.jsx`, add the import and route:

```jsx
import MyNewTool from './apps/my-new-tool/MyNewTool'

// Inside <Routes>:
<Route path="/my-tool" element={<MyNewTool />} />
```

## 4. Create the API Endpoint (if needed)

Create `api/<tool-name>.js`:

```javascript
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Validate input
  const { input } = req.body
  if (!input) return res.status(400).json({ error: 'Input is required' })

  // Rate limiting (basic in-memory)
  // ... (copy pattern from api/roast.js)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        // ... tool-specific system prompt and messages
      })
    })

    const data = await response.json()
    // Parse and return structured result
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

## 5. Add Tool Card to Landing Page

In `VibeZapLanding.jsx`, find the `tools` array and add your tool:

```javascript
{
  icon: '🔍',       // Emoji icon
  title: 'My New Tool',
  description: 'One sentence about what it does.',
  price: '$3',
  tag: 'Coming Soon',  // or 'Live' when ready
  link: '/my-tool',
  color: '#00E5FF'     // Accent color for the card
}
```

Change `tag` to `'Live'` when the tool is deployed and working.

## 6. Create App README

Create `src/apps/<tool-name>/README.md`:

```markdown
# <Tool Name>

## Route: /<tool-slug>
## API: /api/<tool-slug>
## Status: Development / Live
## Price: $X

## What It Does
Brief description.

## User Flow
1. User enters ...
2. Clicks ...
3. API processes ...
4. Results displayed ...

## API Details
- **Endpoint:** POST /api/<tool-slug>
- **Input:** { ... }
- **Output:** { ... }
- **Model:** claude-sonnet-4-20250514
- **Rate Limit:** X req/hour per IP

## Design
- **Theme color:** #XXXXXX
- **Accent:** ...
```

## 7. Test Locally

```bash
npm run build          # Verify build succeeds
npm run preview        # Test the built version
vercel dev             # Test with API functions (requires Vercel CLI)
```

## 8. Deploy

```bash
git add .
git commit -m "feat: add <tool-name> micro-app"
git push
```

Vercel auto-deploys. Check the deployment at https://vercel.com/dashboard.

## Checklist

- [ ] Component created in `src/apps/<tool-name>/`
- [ ] README.md created for the app
- [ ] Route added in `App.jsx`
- [ ] API endpoint created (if needed)
- [ ] Env vars added to Vercel (if new ones needed)
- [ ] Tool card added/updated in `VibeZapLanding.jsx`
- [ ] **All standard UI elements present** (back nav, header text, result watermark, legal disclaimer — all included in template)
- [ ] CLAUDE.md micro-apps registry updated
- [ ] `npm run build` passes
- [ ] Tested locally with `npm run preview` or `vercel dev`
