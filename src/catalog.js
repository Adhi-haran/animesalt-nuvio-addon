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
  return { series: [], movies: [] };
}

function getCatalog(baseUrl, type, id, extra = {}) {
  const base = baseUrl.replace(/\/+$/, '');
  const catalogData = loadCatalog();

  // 1. Movies Catalog
  if (type === 'movie' || id === 'animesalt_tamil_movies') {
    let moviesList = catalogData.movies || [];

    if (extra.search) {
      const q = extra.search.toLowerCase().trim();
      moviesList = moviesList.filter(m => 
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q)
      );
    }

    if (extra.genre && extra.genre !== 'All') {
      const g = extra.genre.toLowerCase();
      moviesList = moviesList.filter(m => 
        m.category.toLowerCase().includes(g) || 
        m.name.toLowerCase().includes(g)
      );
    }

    const metas = moviesList.map(m => {
      const posterUrl = m.poster && m.poster.startsWith('http') ? m.poster : `${base}${m.poster || '/assets/shinchan_poster.jpg'}`;
      const bgUrl = m.background && m.background.startsWith('http') ? m.background : `${base}${m.background || '/assets/shinchan_backdrop.svg'}`;
      
      return {
        id: m.id,
        type: 'movie',
        name: m.name,
        poster: posterUrl,
        background: bgUrl,
        description: m.description,
        genres: m.genres || ["Animation", "Movie", "Tamil Dub"],
        releaseInfo: "Tamil Dub",
        posterShape: "poster"
      };
    });

    return { metas };
  }

  // 2. Series Catalog (Default)
  let seriesList = catalogData.series || [];

  if (extra.search) {
    const q = extra.search.toLowerCase().trim();
    seriesList = seriesList.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  }

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
