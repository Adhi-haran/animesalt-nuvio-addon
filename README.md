# AnimeSalt Tamil Dubs Addon (Shinchan & Doraemon)

A high-performance custom addon for **Nuvio** and **Stremio** (Android TV, Fire TV, Mobile, Desktop, Web) designed to stream **Crayon Shinchan** and **Doraemon** in Tamil (Hungama TV dub order) directly from AnimeSalt.

---

## 🌟 Features

- **Custom Hungama TV Dub Order:** Solves the metadata mismatch issue where Indian TV dub orders cannot be indexed via TMDB.
- **Complete Episode & Movie Catalogs:**
  - **Crayon Shinchan (Tamil Dub):** 612 episodes (Seasons 1–8, 12–15) — *100% continuous, 0 missing episodes*.
  - **Doraemon Classic 1979 (Tamil Dub):** 311 episodes (Seasons 1–6) — *100% continuous, 0 missing episodes*.
  - **Doraemon Modern 2005 (Tamil Dub):** 207 episodes (Seasons 3–9, 14).
  - **14 Shinchan Theatrical Movies in Tamil** (*Action Kamen vs Higure Rakshas*, *The Golden Sword*, *Masala Story*, etc.).
  - **30 Doraemon Theatrical Movies in Tamil** (*Stand By Me Doraemon 2*, *Nobita's Dinosaur*, *Little Star Wars*, etc.).
- **Multi-Audio Support:** Adaptive HLS streams with selectable audio tracks (**Tamil**, **Telugu**, **Hindi**).
- **Custom Poster & Fanart Engine:** Bundled local artwork to eliminate broken TMDB images.
- **Dual-Domain Fallback:** Fails over between `animesalttv.to` and `animesalt.ro`.
- **Background Auto-Sync:** Refreshes the catalog every 6 hours automatically.

---

## 📺 How to Install on TV (Nuvio & Stremio)

### Option A: Local Network (Addon running on your Arch Machine)
Your machine's current local IP is `10.71.39.109`.

1. **In Nuvio (Android TV / Fire TV):**
   - Open **Nuvio**.
   - Go to **Settings** &rarr; **Content & Discovery** &rarr; **Add-ons**.
   - Enter your Addon URL: `http://10.71.39.109:7000/manifest.json`
   - Click **Install / Add**.

2. **In Stremio (Android TV / Fire TV / Web / PC):**
   - Open **Stremio**.
   - Go to **Addons** &rarr; **Community Addons**.
   - Paste `http://10.71.39.109:7000/manifest.json` in the search/addon bar and click **Install**.

---

### Option B: Free 24/7 Cloud Hosting (No PC Required)

If you don't want to keep your PC on:

#### 1. Deploy to Vercel (Free 1-Click Serverless)
1. Push this repository to your GitHub account (`git push`).
2. Go to [vercel.com](https://vercel.com) &rarr; **Add New Project** &rarr; Import your repo.
3. Click **Deploy**.
4. Your addon will be live at `https://your-project.vercel.app/manifest.json`!
5. Add that URL into Nuvio or Stremio.

#### 2. Deploy to Render (Free Web Service)
1. Create a free account on [render.com](https://render.com).
2. Click **New +** &rarr; **Web Service** &rarr; Connect your GitHub repository.
3. Set **Build Command:** `npm install` and **Start Command:** `npm start`.
4. Click **Create Web Service**.
5. Your addon will be available at `https://your-app.onrender.com/manifest.json`.

---

## 🛠️ Management & CLI Commands

### Manage Local Background Daemon:
```bash
# Check service status
systemctl --user status animesalt-addon

# Restart service
systemctl --user restart animesalt-addon

# View live logs
journalctl --user -u animesalt-addon -f

# Stop service
systemctl --user stop animesalt-addon
```

### Docker Deployment:
```bash
# Start container
docker-compose up -d --build

# Stop container
docker-compose down
```

### Re-index Catalog Manually:
```bash
npm run index
```

---

## 🎧 TV Player Audio Setting Tip
The streams contain **Tamil**, **Telugu**, and **Hindi** audio tracks.
To have your TV player automatically play the **Tamil dub** every time:
- In **Nuvio** or **Stremio**: Go to **Settings &rarr; Player &rarr; Preferred Audio Track** and select **Tamil** (`tam` / `ta`).
