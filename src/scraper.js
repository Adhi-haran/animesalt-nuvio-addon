const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config');

const USER_AGENT = config.USER_AGENT;
const PRIMARY_DOMAIN = config.PRIMARY_DOMAIN.replace(/\/+$/, '');
const FALLBACK_DOMAIN = config.FALLBACK_DOMAIN.replace(/\/+$/, '');

// In-memory stream cache to avoid re-scraping the same episode / movie
const streamCache = new Map();
const STREAM_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Scrapes a single series page from primary domain
 */
async function scrapeSeries(seriesKey, title, relativePath, posterPath, backdropPath, description) {
  try {
    const url = `${PRIMARY_DOMAIN}${relativePath}`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 12000
    });
    const html = res.data;

    // Extract season tabs
    const seasonTabs = [];
    const seasonRegex = /data-season="(\d+)">([^<]+)/g;
    let sMatch;
    while ((sMatch = seasonRegex.exec(html)) !== null) {
      seasonTabs.push({ season: parseInt(sMatch[1], 10), label: sMatch[2].trim() });
    }

    // Extract episode cards
    const cardRegex = /<a[^>]+data-episode-season=["'](\d+)["'][^>]+href=["']([^'"]*\/episode\/([^'"\/]+)\/?)["'][^>]*>.*?<h3 class="episode-name">([^<]+)<\/h3>/gs;
    const episodes = [];
    const seen = new Set();
    let cMatch;

    while ((cMatch = cardRegex.exec(html)) !== null) {
      const sStr = cMatch[1];
      const epUrl = cMatch[2];
      const slug = cMatch[3];
      const rawName = cMatch[4];

      if (seen.has(slug)) continue;
      seen.add(slug);

      // Extract Season & Episode numbers from slug e.g. shinchan-1x1, doraemon-1979-1x1
      const numMatch = slug.match(/(\d+)x(\d+)/);
      let sNum = numMatch ? parseInt(numMatch[1], 10) : parseInt(sStr, 10);
      let epNum = numMatch ? parseInt(numMatch[2], 10) : episodes.length + 1;

      const epNameClean = rawName.replace(/&#215;/g, 'x').replace(/&amp;/g, '&').trim();

      episodes.push({
        id: `animesalt:${seriesKey}:${sNum}:${epNum}`,
        slug: slug,
        season: sNum,
        episode: epNum,
        title: `S${String(sNum).padStart(2, '0')}E${String(epNum).padStart(2, '0')} - ${epNameClean}`,
        name: `Episode ${epNum}`,
        url: epUrl,
        released: new Date().toISOString()
      });
    }

    return {
      id: `animesalt:${seriesKey}`,
      type: "series",
      name: title,
      description: description,
      genres: ["Animation", "Comedy", "Kids", "Tamil Dub"],
      poster: posterPath,
      background: backdropPath,
      logo: "/assets/logo.svg",
      videos: episodes
    };
  } catch (err) {
    console.error(`[Scraper] Failed to scrape series ${title}:`, err.message);
    return null;
  }
}

/**
 * Scrapes movies list from fallback domain search
 */
async function scrapeMovieList(searchTerm, categoryName, fallbackPoster) {
  try {
    const url = `${FALLBACK_DOMAIN}/?s=${encodeURIComponent(searchTerm)}`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 12000
    });
    const html = res.data;
    const articles = html.match(/<article[^>]*>[\s\S]*?<\/article>/g) || [];
    const movies = [];
    const seen = new Set();

    for (const a of articles) {
      const linkM = a.match(/href=["']([^'"]*\/anime\/([^'"\/]+)\/?)["']/);
      const titleM = a.match(/title=["']([^'"]+)["']/);
      const imgM = a.match(/<img[^>]+src=["']([^'"]+)["']/);

      if (linkM && titleM) {
        const animeUrl = linkM[1];
        const slug = linkM[2];
        if (seen.has(slug)) continue;

        // Filter out series entries
        if (slug.includes('season') && !slug.includes('movie')) continue;
        if (slug === 'shinchan-vitello-dub' || slug === 'doraemon-1979') continue;

        seen.add(slug);
        const rawTitle = titleM[1];
        const cleanTitle = rawTitle
          .replace(/Anime\s+Hindi\s+Dubbed.*/i, '')
          .replace(/– Watch Online/i, '')
          .replace(/&#8217;/g, "'")
          .replace(/&#8211;/g, "-")
          .replace(/\| Anime Salt/i, '')
          .trim();

        const poster = (imgM && imgM[1]) ? imgM[1] : fallbackPoster;

        movies.push({
          id: `animesalt:movie:${slug}`,
          slug: slug,
          title: cleanTitle,
          name: cleanTitle,
          type: "movie",
          category: categoryName,
          animeUrl: animeUrl,
          watchUrl: `${FALLBACK_DOMAIN}/${slug}/`,
          poster: poster,
          background: fallbackPoster,
          genres: ["Animation", "Kids", "Comedy", "Movie", "Tamil Dub"],
          description: `Watch ${cleanTitle} in Tamil / Multi-Audio Dubbed Full HD on AnimeSalt.`
        });
      }
    }
    return movies;
  } catch (err) {
    console.error(`[Scraper] Failed to scrape movies for ${categoryName}:`, err.message);
    return [];
  }
}

/**
 * Resolves stream sources for a given series episode slug
 */
async function resolveStreamBySlug(slug) {
  const cacheKey = `ep:${slug}`;
  const cached = streamCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < STREAM_CACHE_TTL) {
    return cached.data;
  }

  // 1. Try Primary: animesalttv.to
  try {
    const primaryUrl = `${PRIMARY_DOMAIN}/episode/${slug}/`;
    const res = await axios.get(primaryUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': `${PRIMARY_DOMAIN}/` },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const iframeSrc = $('iframe.watch-player').attr('src') || $('button[data-server-url]').attr('data-server-url') || '';
    
    const idMatch = iframeSrc.match(/id=([a-f0-9]+)/i);
    if (idMatch) {
      const videoId = idMatch[1];
      const streamData = buildStreamPayload(slug, videoId);
      streamCache.set(cacheKey, { data: streamData, timestamp: Date.now() });
      return streamData;
    }
  } catch (primaryErr) {
    console.warn(`[StreamResolver] Primary source failed for ${slug} (${primaryErr.message}), trying fallback...`);
  }

  // 2. Fallback: animesalt.ro
  try {
    const fallbackUrl = `${FALLBACK_DOMAIN}/${slug}/`;
    const res = await axios.get(fallbackUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': `${FALLBACK_DOMAIN}/` },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const iframeSrc = $('iframe').attr('src') || '';
    const idMatch = iframeSrc.match(/([a-f0-9]{32})/i);
    if (idMatch) {
      const videoId = idMatch[1];
      const streamData = buildStreamPayload(slug, videoId);
      streamCache.set(cacheKey, { data: streamData, timestamp: Date.now() });
      return streamData;
    }
  } catch (fallbackErr) {
    console.error(`[StreamResolver] Fallback source also failed for ${slug}:`, fallbackErr.message);
  }

  return null;
}

/**
 * Resolves stream sources for a movie slug
 */
async function resolveMovieStream(slug) {
  const cacheKey = `movie:${slug}`;
  const cached = streamCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < STREAM_CACHE_TTL) {
    return cached.data;
  }

  try {
    const watchUrl = `${FALLBACK_DOMAIN}/${slug}/`;
    const res = await axios.get(watchUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': `${FALLBACK_DOMAIN}/` },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const iframeSrc = $('iframe').attr('src') || '';

    if (iframeSrc) {
      const streams = [];

      // If Megaplay embed
      if (iframeSrc.includes('megaplay.su')) {
        try {
          const megaRes = await axios.get(iframeSrc, {
            headers: { 'User-Agent': USER_AGENT, 'Referer': `${FALLBACK_DOMAIN}/` },
            timeout: 5000
          });
          const hlsMatch = megaRes.data.match(/https?:\/\/[^\s"'\x27]+\.m3u8[^\s"'\x27]*/);
          if (hlsMatch) {
            streams.push({
              name: "AnimeSalt Movie [Fast HLS]",
              title: `${slug.toUpperCase()}\n🔊 Multi-Audio Stream\n⚡ Adaptive Full HD`,
              url: hlsMatch[0],
              behaviorHints: {
                notWebReady: false,
                headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://vid.megaplay.su/' }
              }
            });
          }
        } catch (e) {
          // fallback to embed
        }
      }

      // Add direct embed stream
      streams.push({
        name: "AnimeSalt Movie [Direct Server]",
        title: `${slug.toUpperCase()} (Direct Stream)`,
        url: iframeSrc,
        behaviorHints: {
          notWebReady: false,
          headers: { 'User-Agent': USER_AGENT, 'Referer': `${FALLBACK_DOMAIN}/` }
        }
      });

      streamCache.set(cacheKey, { data: streams, timestamp: Date.now() });
      return streams;
    }
  } catch (err) {
    console.error(`[MovieResolver] Failed to resolve movie ${slug}:`, err.message);
  }

  return null;
}

/**
 * Builds the Stremio / Nuvio stream object payload
 */
function buildStreamPayload(slug, videoId) {
  const hlsUrl = `${PRIMARY_DOMAIN}/wp-json/animesalt/v1/zhls?id=${videoId}`;
  const cdnMirrorUrl = `https://as-cdn26.top/video/${videoId}`;

  return [
    {
      name: "AnimeSalt [Tamil / Multi-Audio]",
      title: `${slug.toUpperCase()}\n🔊 Multi-Audio: Tamil | Telugu | Hindi\n⚡ Full HD (1080p/720p/480p Adaptive HLS)`,
      url: hlsUrl,
      behaviorHints: {
        notWebReady: false,
        headers: {
          "User-Agent": USER_AGENT,
          "Referer": `${PRIMARY_DOMAIN}/`
        }
      }
    },
    {
      name: "AnimeSalt [Mirror Server 2]",
      title: `${slug.toUpperCase()} (CDN Fast Stream)\n🔊 Multi-Audio Included`,
      url: cdnMirrorUrl,
      behaviorHints: {
        notWebReady: false,
        headers: {
          "User-Agent": USER_AGENT,
          "Referer": `${FALLBACK_DOMAIN}/`
        }
      }
    }
  ];
}

module.exports = {
  scrapeSeries,
  scrapeMovieList,
  resolveStreamBySlug,
  resolveMovieStream
};
