const axios = require('axios');

const PORT = 7799;
process.env.PORT = PORT;

// Start server
const app = require('../server.js');

async function runTests() {
  console.log('--- Starting Phase 2 Addon Test Suite ---');
  const base = `http://localhost:${PORT}`;
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // Wait 1.5 seconds for server setup
  await new Promise(r => setTimeout(r, 1500));

  // 1. Test Manifest
  await test('Manifest Endpoint (/manifest.json)', async () => {
    const res = await axios.get(`${base}/manifest.json`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.data.id !== 'community.animesalt.tamil') throw new Error('Invalid manifest id');
    if (!res.data.catalogs || res.data.catalogs.length !== 2) {
      throw new Error(`Expected 2 catalogs (series & movies), got ${res.data.catalogs?.length}`);
    }
  });

  // 2. Test Series Catalog
  await test('Series Catalog (/catalog/series/animesalt_tamil_series.json)', async () => {
    const res = await axios.get(`${base}/catalog/series/animesalt_tamil_series.json`);
    if (!res.data.metas || res.data.metas.length < 3) throw new Error(`Expected 3 series, got ${res.data.metas?.length}`);
  });

  // 3. Test Movies Catalog
  await test('Movies Catalog (/catalog/movie/animesalt_tamil_movies.json)', async () => {
    const res = await axios.get(`${base}/catalog/movie/animesalt_tamil_movies.json`);
    if (!res.data.metas || res.data.metas.length < 40) {
      throw new Error(`Expected at least 40 movies, got ${res.data.metas?.length}`);
    }
  });

  // 4. Test Movie Search
  await test('Movie Search (/catalog/movie/animesalt_tamil_movies/search=shinchan.json)', async () => {
    const res = await axios.get(`${base}/catalog/movie/animesalt_tamil_movies/search=shinchan.json`);
    if (!res.data.metas || res.data.metas.length === 0) throw new Error('No search results for shinchan movie');
    if (!res.data.metas[0].id.includes('shinchan-movie')) throw new Error('Result not a shinchan movie');
  });

  // 5. Test Movie Genre Filter
  await test('Movie Genre Filter (/catalog/movie/animesalt_tamil_movies/genre=Doraemon%20Movies.json)', async () => {
    const res = await axios.get(`${base}/catalog/movie/animesalt_tamil_movies/genre=Doraemon%20Movies.json`);
    if (!res.data.metas || res.data.metas.length === 0) throw new Error('No results for Doraemon Movies genre');
  });

  // 6. Test Series Metadata
  await test('Shinchan Series Meta (/meta/series/animesalt:shinchan.json)', async () => {
    const res = await axios.get(`${base}/meta/series/animesalt:shinchan.json`);
    if (!res.data.meta || res.data.meta.videos.length !== 612) {
      throw new Error(`Expected 612 Shinchan episodes, got ${res.data.meta?.videos?.length}`);
    }
  });

  // 7. Test Movie Metadata
  await test('Shinchan Movie Meta (/meta/movie/animesalt:movie:shinchan-movie-action-kamen-vs-higure-rakshas.json)', async () => {
    const res = await axios.get(`${base}/meta/movie/animesalt:movie:shinchan-movie-action-kamen-vs-higure-rakshas.json`);
    if (!res.data.meta || res.data.meta.type !== 'movie') throw new Error('Movie metadata invalid');
    if (!res.data.meta.name.includes('Action Kamen')) throw new Error('Movie title mismatch');
  });

  // 8. Test Series Stream
  await test('Series Episode Stream (/stream/series/animesalt:shinchan:1:1.json)', async () => {
    const res = await axios.get(`${base}/stream/series/animesalt:shinchan:1:1.json`);
    if (!res.data.streams || res.data.streams.length === 0) throw new Error('No stream returned');
    if (!res.data.streams[0].url.includes('/zhls?id=')) throw new Error('HLS URL invalid');
  });

  // 9. Test Movie Stream
  await test('Movie Stream (/stream/movie/animesalt:movie:shinchan-movie-action-kamen-vs-higure-rakshas.json)', async () => {
    const res = await axios.get(`${base}/stream/movie/animesalt:movie:shinchan-movie-action-kamen-vs-higure-rakshas.json`);
    if (!res.data.streams || res.data.streams.length === 0) throw new Error('No movie stream returned');
  });

  // 10. Test Health Check
  await test('Health Check Endpoint (/health)', async () => {
    const res = await axios.get(`${base}/health`);
    if (res.data.status !== 'ok') throw new Error('Health check status not ok');
    if (res.data.indexedMovies < 40) throw new Error('Indexed movies count mismatch');
  });

  console.log(`\n--- Test Summary: ${passed} passed, ${failed} failed ---`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
