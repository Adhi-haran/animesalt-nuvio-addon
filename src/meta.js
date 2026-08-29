const { loadCatalog } = require('./catalog');

function getMeta(baseUrl, type, id) {
  const base = baseUrl.replace(/\/+$/, '');
  const catalogData = loadCatalog();
  const seriesList = catalogData.series || [];

  const found = seriesList.find(s => s.id === id);
  if (!found) {
    return { meta: null };
  }

  const videos = (found.videos || []).map(v => ({
    id: v.id,
    title: v.title,
    name: v.name || `Episode ${v.episode}`,
    season: v.season,
    episode: v.episode,
    released: v.released || new Date().toISOString(),
    thumbnail: found.poster.startsWith('http') ? found.poster : `${base}${found.poster}`
  }));

  return {
    meta: {
      id: found.id,
      type: found.type || 'series',
      name: found.name,
      description: found.description,
      genres: found.genres,
      poster: found.poster.startsWith('http') ? found.poster : `${base}${found.poster}`,
      background: found.background.startsWith('http') ? found.background : `${base}${found.background}`,
      logo: found.logo ? (found.logo.startsWith('http') ? found.logo : `${base}${found.logo}`) : undefined,
      releaseInfo: "Tamil Dub (Hungama Order)",
      videos: videos
    }
  };
}

module.exports = { getMeta };
