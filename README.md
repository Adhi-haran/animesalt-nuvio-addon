# AnimeSalt Tamil Dubs Addon (Shinchan & Doraemon)

A high-performance custom addon for **Nuvio** and **Stremio** (Android TV, Fire TV, Mobile, Desktop, Web) designed to stream **Crayon Shinchan** and **Doraemon** in Tamil (Hungama TV dub order) directly from AnimeSalt (`animesalttv.to` and `animesalt.ro`).

---

## Features

- **Custom Hungama TV Dub Order:** Resolves the issue where Tamil dubs cannot be indexed via standard TMDB or Japanese broadcast orders.
- **Complete Episode Catalogs:**
  - **Crayon Shinchan (Tamil Dub):** 612 episodes across 12 seasons (Seasons 1–8, 12–15).
  - **Doraemon Classic 1979 (Tamil Dub):** 311 episodes across 6 seasons (Seasons 1–6).
  - **Doraemon Modern 2005 (Tamil Dub):** 207 episodes across 8 seasons (Seasons 3–9, 14).
- **Multi-Audio Support:** Adaptive HLS streams with selectable audio tracks (**Tamil**, **Telugu**, **Hindi**).
- **Custom Poster & Fanart Engine:** High-resolution posters, backdrops, and logos bundled locally to prevent broken images.
- **Dual-Domain Fallback:** Seamlessly fails over from `animesalttv.to` to `animesalt.ro` if any server is unreachable.
- **Instant Response Caching:** In-memory caching for lightning-fast TV browsing.

---

## Quick Start (Local)

### 1. Install & Start

```bash
cd /home/adhi/Projects/animesalt-tamil-addon
npm install
npm start
```

The addon will be available at: `http://localhost:7000`

### 2. Available Endpoints

- **Web Dashboard & Installer:** `http://localhost:7000/`
- **Manifest:** `http://localhost:7000/manifest.json`
- **Catalog:** `http://localhost:7000/catalog/series/animesalt_tamil_series.json`
- **Meta (Shinchan):** `http://localhost:7000/meta/series/animesalt:shinchan.json`
- **Stream (Shinchan S1E1):** `http://localhost:7000/stream/series/animesalt:shinchan:1:1.json`
- **Health Check:** `http://localhost:7000/health`
- **Refresh Catalog:** `http://localhost:7000/api/refresh-catalog`

---

## TV Setup Guide (Android TV / Fire TV)

### In Nuvio:
1. Open **Nuvio** on your TV.
2. Go to **Settings** &rarr; **Content & Discovery** &rarr; **Add-ons**.
3. Enter your addon manifest URL: `http://<YOUR-IP>:7000/manifest.json` (or your hosted domain).
4. Save and return to Home. You will see the **Tamil Dubbed Anime** catalog with Shinchan and Doraemon!

### In Stremio:
1. Open **Stremio** on your TV or phone.
2. Go to **Addons** &rarr; **Community Addons** &rarr; search or paste `http://<YOUR-IP>:7000/manifest.json`.
3. Click **Install**.
