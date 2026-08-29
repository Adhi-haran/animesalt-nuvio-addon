/**
 * Configuration & Domain Settings
 * Allows overriding domains via environment variables
 */
module.exports = {
  PORT: process.env.PORT || 7000,
  BASE_URL: process.env.BASE_URL || null,
  PRIMARY_DOMAIN: process.env.ANIMESALT_TV_DOMAIN || 'https://animesalttv.to',
  FALLBACK_DOMAIN: process.env.ANIMESALT_RO_DOMAIN || 'https://animesalt.ro',
  USER_AGENT: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};
