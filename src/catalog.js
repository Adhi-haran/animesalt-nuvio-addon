const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'catalog.json');

function loadCatalog() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Catalog] Error reading catalog.json:', err.message);
  }
  return { series: [] };
}

function getCatalog(baseUrl, type, id, extra = {}) {
  const base = baseUrl.replace(/\/+$/, '');
  const catalogData = loadCatalog();
  let seriesList = catalogData.series || [];

  // Filter by search query if present
  if (extra.search) {
    const q = extra.search.toLowerCase().trim();
    seriesList = seriesList.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  }

  // Filter by genre if selected
  if (extra.genre && extra.genre !== 'All') {
    const g = extra.genre.toLowerCase();
    seriesList = seriesList.filter(s => s.name.toLowerCase().includes(g));
  }

  const metas = seriesList.map(s => ({
    id: s.id,
    type: s.type || 'series',
    name: s.name,
    poster: s.poster.startsWith('http') ? s.poster : `${base}${s.poster}`,
    background: s.background.startsWith('http') ? s.background : `${base}${s.background}`,
    logo: s.logo ? (s.logo.startsWith('http') ? s.logo : `${base}${s.logo}`) : undefined,
    description: s.description,
    genres: s.genres,
    releaseInfo: "Tamil Dub (Hungama)",
    posterShape: "poster"
  }));

  return { metas };
}

module.exports = { getCatalog, loadCatalog };
