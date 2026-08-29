const { loadCatalog } = require('./catalog');
const { resolveStreamBySlug, resolveMovieStream } = require('./scraper');

async function getStream(type, id) {
  // Check if ID matches our prefix
  if (!id.startsWith('animesalt:')) {
    return { streams: [] };
  }

  // 1. Movie Stream Resolution
  if (type === 'movie' || id.startsWith('animesalt:movie:')) {
    const slug = id.replace('animesalt:movie:', '');
    console.log(`[StreamHandler] Resolving Movie stream for Slug: ${slug}`);
    const streams = await resolveMovieStream(slug);
    if (streams && streams.length > 0) {
      return { streams };
    }
    return { streams: [] };
  }

  // 2. Series Episode Stream Resolution
  const parts = id.split(':');
  // Format: animesalt:<seriesKey>:<season>:<episode>
  let slug = null;

  if (parts.length >= 4) {
    const seriesKey = parts[1];
    const season = parts[2];
    const episode = parts[3];

    // Try finding exact slug from catalog.json
    const catalogData = loadCatalog();
    const series = (catalogData.series || []).find(s => s.id === `animesalt:${seriesKey}`);
    if (series && series.videos) {
      const vid = series.videos.find(v => v.id === id);
      if (vid && vid.slug) {
        slug = vid.slug;
      }
    }

    // Default slug fallback
    if (!slug) {
      if (seriesKey === 'shinchan') {
        slug = `shinchan-${season}x${episode}`;
      } else if (seriesKey === 'doraemon-1979') {
        slug = `doraemon-1979-${season}x${episode}`;
      } else if (seriesKey === 'doraemon-2005') {
        slug = `doraemon-2005-${season}x${episode}`;
      } else {
        slug = `${seriesKey}-${season}x${episode}`;
      }
    }
  } else {
    // Single slug fallback
    slug = parts.slice(1).join('-');
  }

  if (!slug) {
    return { streams: [] };
  }

  console.log(`[StreamHandler] Resolving Series stream for ID: ${id} (Slug: ${slug})`);
  const streams = await resolveStreamBySlug(slug);

  if (streams && streams.length > 0) {
    return { streams };
  }

  return { streams: [] };
}

module.exports = { getStream };
