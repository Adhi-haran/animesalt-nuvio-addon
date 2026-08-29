const axios = require('axios');
const http = require('http');

const PORT = 7788;
process.env.PORT = PORT;

// Start server in-process for testing
const app = require('../server.js');

async function runTests() {
  console.log('--- Starting Addon Test Suite ---');
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

  // Wait 1 second for server to initialize
  await new Promise(r => setTimeout(r, 1000));

  // 1. Test Manifest
  await test('Manifest Endpoint (/manifest.json)', async () => {
    const res = await axios.get(`${base}/manifest.json`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.data.id !== 'community.animesalt.tamil') throw new Error('Invalid manifest id');
    if (!res.data.catalogs || res.data.catalogs.length === 0) throw new Error('Missing catalogs');
  });

  // 2. Test Catalog
  await test('Series Catalog (/catalog/series/animesalt_tamil_series.json)', async () => {
    const res = await axios.get(`${base}/catalog/series/animesalt_tamil_series.json`);
    if (!res.data.metas || res.data.metas.length < 3) throw new Error(`Expected at least 3 series, got ${res.data.metas?.length}`);
    const shinchan = res.data.metas.find(m => m.id === 'animesalt:shinchan');
    if (!shinchan) throw new Error('Shinchan missing from catalog');
  });

  // 3. Test Search
  await test('Search Catalog (/catalog/series/animesalt_tamil_series/search=shinchan.json)', async () => {
    const res = await axios.get(`${base}/catalog/series/animesalt_tamil_series/search=shinchan.json`);
    if (!res.data.metas || res.data.metas.length === 0) throw new Error('No results for shinchan search');
    if (res.data.metas[0].id !== 'animesalt:shinchan') throw new Error('Search result mismatch');
  });

  // 4. Test Meta - Shinchan
  await test('Shinchan Metadata (/meta/series/animesalt:shinchan.json)', async () => {
    const res = await axios.get(`${base}/meta/series/animesalt:shinchan.json`);
    if (!res.data.meta) throw new Error('Meta object missing');
    if (!res.data.meta.videos || res.data.meta.videos.length !== 612) {
      throw new Error(`Expected 612 Shinchan episodes, got ${res.data.meta.videos?.length}`);
    }
  });

  // 5. Test Meta - Doraemon 1979
  await test('Doraemon 1979 Metadata (/meta/series/animesalt:doraemon-1979.json)', async () => {
    const res = await axios.get(`${base}/meta/series/animesalt:doraemon-1979.json`);
    if (!res.data.meta.videos || res.data.meta.videos.length !== 311) {
      throw new Error(`Expected 311 Doraemon 1979 episodes, got ${res.data.meta.videos?.length}`);
    }
  });

  // 6. Test Meta - Doraemon 2005
  await test('Doraemon 2005 Metadata (/meta/series/animesalt:doraemon-2005.json)', async () => {
    const res = await axios.get(`${base}/meta/series/animesalt:doraemon-2005.json`);
    if (!res.data.meta.videos || res.data.meta.videos.length !== 207) {
      throw new Error(`Expected 207 Doraemon 2005 episodes, got ${res.data.meta.videos?.length}`);
    }
  });

  // 7. Test Stream - Shinchan S1E1
  await test('Shinchan S1E1 Stream (/stream/series/animesalt:shinchan:1:1.json)', async () => {
    const res = await axios.get(`${base}/stream/series/animesalt:shinchan:1:1.json`);
    if (!res.data.streams || res.data.streams.length === 0) throw new Error('No streams returned');
    if (!res.data.streams[0].url.includes('/zhls?id=')) throw new Error('Primary HLS URL invalid');
  });

  // 8. Test Stream - Doraemon 1979 S1E1
  await test('Doraemon 1979 S1E1 Stream (/stream/series/animesalt:doraemon-1979:1:1.json)', async () => {
    const res = await axios.get(`${base}/stream/series/animesalt:doraemon-1979:1:1.json`);
    if (!res.data.streams || res.data.streams.length === 0) throw new Error('No streams returned');
  });

  // 9. Test Stream - Doraemon 2005 S3E8
  await test('Doraemon 2005 S3E8 Stream (/stream/series/animesalt:doraemon-2005:3:8.json)', async () => {
    const res = await axios.get(`${base}/stream/series/animesalt:doraemon-2005:3:8.json`);
    if (!res.data.streams || res.data.streams.length === 0) throw new Error('No streams returned');
  });

  console.log(`\n--- Test Summary: ${passed} passed, ${failed} failed ---`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
