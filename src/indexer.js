const fs = require('fs');
const path = require('path');
const { scrapeSeries } = require('./scraper');

const DATA_FILE = path.join(__dirname, 'data', 'catalog.json');

const SERIES_CONFIGS = [
  {
    key: 'shinchan',
    title: 'Crayon Shinchan (Tamil Dub)',
    url: 'https://animesalttv.to/anime/shinchan/',
    poster: '/assets/shinchan_poster.jpg',
    backdrop: '/assets/shinchan_backdrop.svg',
    description: 'Watch Crayon Shinchan in Tamil (Hungama TV dub order). Follow the hilarious and mischievous adventures of 5-year-old Shinnosuke Nohara, his parents Harry and Mitsy, sister Himawari, and dog Shiro.'
  },
  {
    key: 'doraemon-1979',
    title: 'Doraemon 1979 (Tamil Dub)',
    url: 'https://animesalttv.to/anime/doraemon/',
    poster: '/assets/doraemon_1979_poster.jpg',
    backdrop: '/assets/doraemon_1979_backdrop.svg',
    description: 'Watch Classic Doraemon (1979) in Tamil (Hungama TV Dub). The iconic robotic cat from the 22nd century travels back in time to guide and help Nobita Nobi with his magical 4D gadgets.'
  },
  {
    key: 'doraemon-2005',
    title: 'Doraemon 2005 (Tamil Dub)',
    url: 'https://animesalttv.to/anime/doraemon-2005/',
    poster: '/assets/doraemon_2005_poster.jpg',
    backdrop: '/assets/doraemon_2005_backdrop.svg',
    description: 'Watch Modern Doraemon (2005) in Tamil (Hungama TV Dub). Featuring remastered animation, new storylines, and futuristic gadget adventures with Doraemon, Nobita, Shizuka, Gian, and Suneo.'
  }
];

async function runIndexer() {
  console.log('[Indexer] Starting catalog index generation...');
  const seriesList = [];

  for (const config of SERIES_CONFIGS) {
    console.log(`[Indexer] Indexing: ${config.title}...`);
    const data = await scrapeSeries(
      config.key,
      config.title,
      config.url,
      config.poster,
      config.backdrop,
      config.description
    );
    if (data) {
      seriesList.push(data);
      console.log(`[Indexer] Successfully indexed ${data.videos.length} episodes for ${config.title}`);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    series: seriesList
  };

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[Indexer] Catalog successfully written to ${DATA_FILE}`);
  return payload;
}

if (require.main === module) {
  runIndexer().catch(err => {
    console.error('[Indexer] Error:', err);
    process.exit(1);
  });
}

module.exports = { runIndexer };
