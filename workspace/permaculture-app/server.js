/**
 * server.js — Permaculture Design Generator Server
 *
 * Free report-only app with 4 API endpoints:
 *   - Geocode address -> coordinates
 *   - Fetch site data (climate, soil, elevation)
 *   - Upload sketch image
 *   - Generate design report (SSE: sketch analysis -> streamed report)
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { geocodeAddress, fetchAllSiteData } = require('./lib/site-data-fetcher');
const { analyzeSketch, generateReport } = require('./lib/report-generator');

const PORT = parseInt(process.env.PORT) || 3002;
const HOST = '0.0.0.0';
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
const CACHE_FILE = path.join(__dirname, 'data', 'cache.json');

// Ensure data directories exist
for (const dir of [UPLOAD_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Result Cache ─────────────────────────────────────────────────────
// Cache key = hash of (sketch file content + rounded lat/lng)
// Avoids redundant API calls for the same location + sketch

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (e) { console.error('[Cache] Failed to load cache:', e.message); }
  return {};
}

function saveCache(cache) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2)); }
  catch (e) { console.error('[Cache] Failed to save cache:', e.message); }
}

function buildCacheKey(sketchBuffer, location) {
  const sketchHash = crypto.createHash('md5').update(sketchBuffer).digest('hex');
  const lat = parseFloat(location?.lat ?? 0).toFixed(4);
  const lng = parseFloat(location?.lng ?? 0).toFixed(4);
  return `${sketchHash}_${lat}_${lng}`;
}

const resultCache = loadCache();

// Validate API keys at startup
if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
  console.error('⚠️  ANTHROPIC_API_KEY not set in .env');
}

// ─── MIME Types ──────────────────────────────────────────────────────

const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
};

// ─── Helpers ─────────────────────────────────────────────────────────

function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function sendError(res, message, status = 500) {
  sendJSON(res, { error: message }, status);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function readRawBody(req, limit = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { reject(new Error('File too large (max 10 MB)')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipartFile(buffer, boundary) {
  const boundaryBuf = Buffer.from('--' + boundary);
  const parts = [];
  let start = 0;

  while (true) {
    const idx = buffer.indexOf(boundaryBuf, start);
    if (idx === -1) break;
    if (start > 0) parts.push(buffer.slice(start, idx - 2));
    start = idx + boundaryBuf.length + 2;
  }

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = part.slice(0, headerEnd).toString();
    if (!headers.includes('filename=')) continue;

    const nameMatch = headers.match(/filename="([^"]+)"/);
    const fileName = nameMatch ? nameMatch[1] : 'upload.jpg';
    const fileBuffer = part.slice(headerEnd + 4);
    return { fileBuffer, fileName };
  }

  return { fileBuffer: null, fileName: null };
}

// ─── API Routes ──────────────────────────────────────────────────────

async function handleAPI(req, res, parsed) {
  const pathname = parsed.pathname;
  const method = req.method;
  const query = Object.fromEntries(new URLSearchParams(parsed.search || ''));

  // --- Geocode address ---
  if (pathname === '/api/geocode' && method === 'GET') {
    try {
      const address = query.address;
      if (!address) return sendError(res, 'Missing address parameter', 400);
      const result = await geocodeAddress(address);
      return sendJSON(res, result);
    } catch (e) {
      return sendError(res, e.message, 400);
    }
  }

  // --- Auto-fetch site data ---
  if (pathname === '/api/site-data' && method === 'GET') {
    try {
      const lat = parseFloat(query.lat);
      const lng = parseFloat(query.lng);
      if (isNaN(lat) || isNaN(lng)) return sendError(res, 'Missing or invalid lat/lng', 400);
      console.log(`[API] Fetching site data for ${lat}, ${lng}...`);
      const data = await fetchAllSiteData(lat, lng);
      console.log(`[API] Site data fetch complete`);
      return sendJSON(res, data);
    } catch (e) {
      console.error('[API] Site data fetch error:', e);
      return sendError(res, e.message);
    }
  }

  // --- Upload sketch (multipart/form-data) ---
  if (pathname === '/api/upload-sketch' && method === 'POST') {
    try {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        return sendError(res, 'Expected multipart/form-data', 400);
      }

      const boundary = contentType.split('boundary=')[1];
      if (!boundary) return sendError(res, 'Missing boundary', 400);

      const raw = await readRawBody(req);
      const { fileBuffer, fileName } = parseMultipartFile(raw, boundary);
      if (!fileBuffer) return sendError(res, 'No file found in upload', 400);

      const ext = path.extname(fileName || '.jpg').toLowerCase();
      const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
      if (!allowed.includes(ext)) return sendError(res, 'Unsupported image type. Use JPG, PNG, or WEBP.', 400);

      const savedName = `${uuidv4()}${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, savedName), fileBuffer);

      console.log(`[API] Sketch uploaded: ${savedName} (${(fileBuffer.length / 1024).toFixed(0)} KB)`);
      return sendJSON(res, { filename: savedName, url: `data/uploads/${savedName}` });
    } catch (e) {
      console.error('[API] Upload error:', e.message);
      return sendError(res, e.message);
    }
  }

  // --- Generate design report (SSE streaming) ---
  if (pathname === '/api/generate' && method === 'POST') {
    try {
      const body = await readBody(req);
      return await handleGenerate(req, res, body);
    } catch (e) {
      console.error('[API] Generate error:', e);
      return sendError(res, e.message);
    }
  }

  return false;
}

// ─── Main Generation Pipeline ───────────────────────────────────────

async function handleGenerate(req, res, body) {
  const { location, siteData, sketchFilename, force } = body;

  if (!sketchFilename) {
    return sendError(res, 'Missing sketchFilename', 400);
  }

  // Read sketch from disk and convert to base64
  const sketchPath = path.join(UPLOAD_DIR, sketchFilename);
  if (!fs.existsSync(sketchPath)) {
    return sendError(res, 'Sketch file not found', 404);
  }

  const sketchBuffer = fs.readFileSync(sketchPath);
  const ext = path.extname(sketchFilename).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const sketchBase64 = `data:${mimeType};base64,${sketchBuffer.toString('base64')}`;

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  function sendSSE(event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  // ─── Check cache ──────────────────────────────────────────────────
  const cacheKey = buildCacheKey(sketchBuffer, location);

  if (force && resultCache[cacheKey]) {
    console.log(`[Cache] FORCE flag — evicting cached entry for key ${cacheKey.slice(0, 12)}...`);
    delete resultCache[cacheKey];
    saveCache(resultCache);
  }

  const cached = resultCache[cacheKey];

  if (cached && cached.report) {
    console.log(`[Cache] HIT for key ${cacheKey.slice(0, 12)}... — replaying cached results`);
    sendSSE('status', { step: 'analysis', message: 'Loading cached results...' });
    sendSSE('cache_hit', {});
    sendSSE('analysis_complete', { analysis: cached.analysis });
    sendSSE('status', { step: 'report' });
    sendSSE('report_chunk', { text: cached.report });
    sendSSE('report_complete', {});
    sendSSE('generation_complete', {});
    res.end();
    return;
  }

  // ─── Fresh generation ─────────────────────────────────────────────
  console.log(`[Cache] MISS for key ${cacheKey.slice(0, 12)}... — generating fresh`);

  let sketchAnalysis = '';
  let reportMarkdown = '';

  try {
    // Step 1: Analyze sketch with Claude Vision
    sendSSE('status', { step: 'analysis', message: 'Analyzing your sketch...' });
    try {
      sketchAnalysis = await analyzeSketch(sketchBase64);
    } catch (e) {
      console.error('[Generate] Sketch analysis error:', e.message);
      sendSSE('analysis_error', { message: 'Failed to analyze sketch: ' + e.message });
      sendSSE('generation_complete', {});
      res.end();
      return;
    }
    sendSSE('analysis_complete', { analysis: sketchAnalysis });

    // Step 2: Stream the design report
    sendSSE('status', { step: 'report', message: 'Writing your design report...' });
    try {
      for await (const chunk of generateReport(sketchAnalysis, siteData, location)) {
        reportMarkdown += chunk;
        sendSSE('report_chunk', { text: chunk });
      }
      sendSSE('report_complete', {});
    } catch (e) {
      console.error('[Generate] Report error:', e.message);
      sendSSE('report_error', { message: 'Failed to generate report: ' + e.message });
    }

    sendSSE('generation_complete', {});

    // Cache successful results
    if (reportMarkdown) {
      resultCache[cacheKey] = {
        analysis: sketchAnalysis,
        report: reportMarkdown,
        location: location?.displayName || '',
        createdAt: new Date().toISOString()
      };
      saveCache(resultCache);
      console.log(`[Cache] Stored results for key ${cacheKey.slice(0, 12)}...`);
    }

  } catch (e) {
    console.error('[Generate] Pipeline error:', e);
    sendSSE('error', { message: e.message });
  }

  res.end();
}

// ─── Static File Serving ─────────────────────────────────────────────

// Inline CSS and logo into index.html at serve time so it works behind reverse proxies
// (avoids relative path resolution issues with /proxy/PORT URLs)
function serveIndexHTML(res) {
  try {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const cssPath = path.join(__dirname, 'assets', 'styles.css');
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf8');
      html = html.replace(
        /<link rel="stylesheet" href="[^"]*styles\.css">/,
        '<style>\n' + css + '\n</style>'
      );
    }
    // Inline the logo as a data URL so it works behind reverse proxies
    const logoPath = path.join(__dirname, 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBase64 = fs.readFileSync(logoPath).toString('base64');
      html = html.replace(
        /src="assets\/logo\.png"/,
        `src="data:image/png;base64,${logoBase64}"`
      );
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (e) {
    res.writeHead(500);
    res.end('Server Error');
  }
}

function serveStatic(req, res, pathname) {
  // Serve index.html with inlined CSS
  if (pathname === '/' || pathname === '/index.html') {
    return serveIndexHTML(res);
  }

  let filePath = path.join(__dirname, pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        if (!ext) {
          return serveIndexHTML(res);
        }
        res.writeHead(404);
        return res.end('Not Found');
      }
      res.writeHead(500);
      return res.end('Server Error');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// ─── Server ──────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  const pathname = decodeURIComponent(parsed.pathname);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // API routes
  if (pathname.startsWith('/api/')) {
    const handled = await handleAPI(req, res, parsed);
    if (handled !== false) return;
    return sendError(res, 'API route not found', 404);
  }

  // Static files
  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`\n🌿 Permaculture Design Generator running at http://${HOST}:${PORT}`);
  console.log(`   Open http://localhost:${PORT} in your browser\n`);
});
