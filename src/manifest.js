/**
 * Stremio & Nuvio Manifest Generator
 */
function getManifest(baseUrl) {
  const base = baseUrl.replace(/\/+$/, '');
  return {
    id: "community.animesalt.tamil",
    version: "1.2.0",
    name: "Favorite Anime (Shinchan & Doraemon)",
    description: "Stream Favorite Shinchan & Doraemon episodes and theatrical movies in Tamil with Multi-Audio & Full HD.",
    logo: `${base}/assets/logo.svg`,
    background: `${base}/assets/shinchan_backdrop.svg`,
    types: ["series", "movie", "anime"],
    resources: ["catalog", "meta", "stream"],
    catalogs: [
      {
        type: "series",
        id: "animesalt_tamil_series",
        name: "Favorite series",
        extra: [
          { name: "search", isRequired: false },
          { 
            name: "genre", 
            isRequired: false, 
            options: ["All", "Shinchan", "Doraemon 1979", "Doraemon 2005"] 
          }
        ]
      },
      {
        type: "movie",
        id: "animesalt_tamil_movies",
        name: "Favorite movies",
        extra: [
          { name: "search", isRequired: false },
          { 
            name: "genre", 
            isRequired: false, 
            options: ["All", "Shinchan Movies", "Doraemon Movies"] 
          }
        ]
      }
    ],
    idPrefixes: ["animesalt:"]
  };
}

module.exports = { getManifest };
