const express = require('express');
const cors = require('cors');
const path = require('path');
const { getManifest } = require('./src/manifest');
const { getCatalog, loadCatalog } = require('./src/catalog');
const { getMeta } = require('./src/meta');
const { getStream } = require('./src/stream');
const { runIndexer } = require('./src/indexer');

const app = express();
const PORT = process.env.PORT || 7000;

// Enable CORS for all origins so Nuvio / Stremio clients on TV & Web can access endpoints
app.use(cors());

// Serve static assets (posters, backdrops, logos)
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Helper to determine base URL
function getBaseUrl(req) {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

// 1. Manifest Endpoint
app.get('/manifest.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const manifest = getManifest(baseUrl);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(manifest);
});

// 2. Catalog Endpoint (with and without extra params)
app.get('/catalog/:type/:id.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const { type, id } = req.params;
  const result = getCatalog(baseUrl, type, id, {});
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(result);
});

app.get('/catalog/:type/:id/:extra.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const { type, id, extra } = req.params;
  
  // Parse extra parameters (e.g. search=shinchan, genre=Shinchan)
  const extraParams = {};
  if (extra) {
    extra.split('&').forEach(part => {
      const [k, v] = part.split('=');
      if (k && v) extraParams[k] = decodeURIComponent(v);
    });
  }

  const result = getCatalog(baseUrl, type, id, extraParams);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(result);
});

// 3. Metadata Endpoint
app.get('/meta/:type/:id.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const { type, id } = req.params;
  const result = getMeta(baseUrl, type, id);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(result);
});

// 4. Stream Endpoint
app.get('/stream/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  try {
    const result = await getStream(type, id);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(result);
  } catch (err) {
    console.error(`[Server] Stream error for ${id}:`, err);
    res.status(500).json({ streams: [] });
  }
});

// 5. Health Check & Diagnostics
app.get('/health', (req, res) => {
  const catalogData = loadCatalog();
  const counts = (catalogData.series || []).map(s => ({
    name: s.name,
    episodes: (s.videos || []).length
  }));
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    indexedSeries: counts
  });
});

// 6. Manual Index Trigger Endpoint
app.get('/api/refresh-catalog', async (req, res) => {
  try {
    const data = await runIndexer();
    res.json({ status: 'success', seriesCount: (data.series || []).length });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 7. Web & TV Configuration Landing Page
app.get('/', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const catalogData = loadCatalog();
  const seriesList = catalogData.series || [];

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AnimeSalt Tamil (Shinchan & Doraemon) Addon</title>
  <style>
    :root { --bg: #0b0f19; --card: #151d30; --accent: #9333ea; --cyan: #06b6d4; --text: #f3f4f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 2rem; }
    .container { max-width: 960px; margin: 0 auto; }
    .hero { text-align: center; margin-bottom: 2.5rem; padding: 2rem; background: linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(6, 182, 212, 0.15)); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); }
    h1 { font-size: 2.4rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff; }
    .tag { display: inline-block; background: var(--accent); color: #fff; font-size: 0.8rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 1rem; }
    p.lead { font-size: 1.15rem; color: #9ca3af; margin-bottom: 1.5rem; }
    .btn { display: inline-block; background: linear-gradient(135deg, #9333ea, #7c3aed); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 1.1rem; box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4); transition: transform 0.2s; }
    .btn:hover { transform: translateY(-2px); }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
    .card { background: var(--card); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.5rem; }
    .card h3 { color: var(--cyan); margin-bottom: 0.5rem; font-size: 1.2rem; }
    .stat { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0.5rem 0; }
    .install-box { background: #05070e; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 1rem 1.5rem; margin-top: 1rem; }
    code { font-family: monospace; color: #38bdf8; word-break: break-all; }
    ol { padding-left: 1.5rem; color: #d1d5db; margin: 1rem 0; }
    li { margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <span class="tag">Nuvio & Stremio Compatible</span>
      <h1>AnimeSalt Tamil Dubs</h1>
      <p class="lead">Crayon Shinchan & Doraemon with Hungama TV order, Multi-Audio (Tamil / Telugu / Hindi) & Full HD streaming.</p>
      <a class="btn" href="stremio://${baseUrl.replace(/^https?:\/\//, '')}/manifest.json">Install to Stremio / Nuvio</a>
    </div>

    <div class="card-grid">
      ${seriesList.map(s => `
        <div class="card">
          <h3>${s.name}</h3>
          <div class="stat">${(s.videos || []).length} Episodes</div>
          <p style="color: #9ca3af; font-size: 0.9rem;">${s.description.slice(0, 120)}...</p>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <h3>Installation on Android TV (Nuvio / Stremio)</h3>
      <ol>
        <li>Open <strong>Nuvio</strong> or <strong>Stremio</strong> on your Android TV / Fire TV or PC.</li>
        <li>Go to <strong>Settings &rarr; Content & Discovery &rarr; Add-ons</strong> (or <strong>Addons &rarr; Community</strong> in Stremio).</li>
        <li>Paste your Addon Manifest URL:
          <div class="install-box">
            <code>${baseUrl}/manifest.json</code>
          </div>
        </li>
        <li>Click <strong>Install / Add</strong>. Enjoy all episodes in Tamil on your TV!</li>
      </ol>
    </div>
  </div>
</body>
</html>`);
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 AnimeSalt Tamil Addon Server running on port ${PORT}`);
  console.log(`📡 Manifest URL: http://localhost:${PORT}/manifest.json`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`======================================================\n`);
});
