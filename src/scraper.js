const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// In-memory stream cache to avoid re-scraping the same episode
const streamCache = new Map();
const STREAM_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Scrapes a single series page from animesalttv.to
 */
async function scrapeSeries(seriesKey, title, url, posterPath, backdropPath, description) {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
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
    const cardRegex = /<a[^>]+data-episode-season=["'](\d+)["'][^>]+href=["'](https:\/\/animesalttv\.to\/episode\/([^'"\/]+)\/?)["'][^>]*>.*?<h3 class="episode-name">([^<]+)<\/h3>/gs;
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
 * Resolves stream sources for a given episode slug
 */
async function resolveStreamBySlug(slug) {
  const cached = streamCache.get(slug);
  if (cached && Date.now() - cached.timestamp < STREAM_CACHE_TTL) {
    return cached.data;
  }

  // 1. Try Primary: animesalttv.to
  try {
    const primaryUrl = `https://animesalttv.to/episode/${slug}/`;
    const res = await axios.get(primaryUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://animesalttv.to/' },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const iframeSrc = $('iframe.watch-player').attr('src') || $('button[data-server-url]').attr('data-server-url') || '';
    
    const idMatch = iframeSrc.match(/id=([a-f0-9]+)/i);
    if (idMatch) {
      const videoId = idMatch[1];
      const streamData = buildStreamPayload(slug, videoId);
      streamCache.set(slug, { data: streamData, timestamp: Date.now() });
      return streamData;
    }
  } catch (primaryErr) {
    console.warn(`[StreamResolver] Primary source failed for ${slug} (${primaryErr.message}), trying fallback...`);
  }

  // 2. Fallback: animesalt.ro
  try {
    const fallbackUrl = `https://animesalt.ro/${slug}/`;
    const res = await axios.get(fallbackUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://animesalt.ro/' },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const iframeSrc = $('iframe').attr('src') || '';
    const idMatch = iframeSrc.match(/([a-f0-9]{32})/i);
    if (idMatch) {
      const videoId = idMatch[1];
      const streamData = buildStreamPayload(slug, videoId);
      streamCache.set(slug, { data: streamData, timestamp: Date.now() });
      return streamData;
    }
  } catch (fallbackErr) {
    console.error(`[StreamResolver] Fallback source also failed for ${slug}:`, fallbackErr.message);
  }

  return null;
}

/**
 * Builds the Stremio / Nuvio stream object payload
 */
function buildStreamPayload(slug, videoId) {
  const hlsUrl = `https://animesalttv.to/wp-json/animesalt/v1/zhls?id=${videoId}`;
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
          "Referer": "https://animesalttv.to/"
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
          "Referer": "https://animesalt.ro/"
        }
      }
    }
  ];
}

module.exports = {
  scrapeSeries,
  resolveStreamBySlug
};
