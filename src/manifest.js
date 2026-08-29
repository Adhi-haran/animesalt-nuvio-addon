/**
 * Stremio & Nuvio Manifest Generator
 */
function getManifest(baseUrl) {
  const base = baseUrl.replace(/\/+$/, '');
  return {
    id: "community.animesalt.tamil",
    version: "1.0.0",
    name: "AnimeSalt Tamil (Shinchan & Doraemon)",
    description: "Stream Crayon Shinchan & Doraemon in Tamil (Hungama Dub) directly with Multi-Audio & Full HD.",
    logo: `${base}/assets/logo.svg`,
    background: `${base}/assets/shinchan_backdrop.svg`,
    types: ["series", "anime"],
    resources: ["catalog", "meta", "stream"],
    catalogs: [
      {
        type: "series",
        id: "animesalt_tamil_series",
        name: "Tamil Dubbed Anime (AnimeSalt)",
        extra: [
          { name: "search", isRequired: false },
          { 
            name: "genre", 
            isRequired: false, 
            options: ["All", "Shinchan", "Doraemon 1979", "Doraemon 2005"] 
          }
        ]
      }
    ],
    idPrefixes: ["animesalt:"]
  };
}

module.exports = { getManifest };
