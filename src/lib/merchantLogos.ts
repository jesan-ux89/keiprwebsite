/**
 * Merchant Logo Lookup
 * Website mirror of mobile _KeiprApp/src/utils/merchantLogos.ts
 *
 * Maps common bill/subscription merchant names to their domains.
 * Logos are served from our own backend cache at /api/logos/:domain
 * (backed by Google's Favicon API, stored in Supabase).
 */

const MERCHANT_DOMAINS: Record<string, string> = {
  // ── Streaming / Entertainment ──
  'netflix': 'netflix.com',
  'spotify': 'spotify.com',
  'hulu': 'hulu.com',
  'disney': 'disneyplus.com',
  'disney+': 'disneyplus.com',
  'apple tv': 'apple.com',
  'apple music': 'apple.com',
  'apple': 'apple.com',
  'amazon prime': 'amazon.com',
  'amazon': 'amazon.com',
  'hbo': 'hbomax.com',
  'max': 'max.com',
  'peacock': 'peacocktv.com',
  'paramount': 'paramountplus.com',
  'youtube': 'youtube.com',
  'crunchyroll': 'crunchyroll.com',
  'audible': 'audible.com',
  'tidal': 'tidal.com',
  'pandora': 'pandora.com',
  'siriusxm': 'siriusxm.com',
  'sirius': 'siriusxm.com',

  // ── Telecom / Internet ──
  'at&t': 'att.com',
  'att': 'att.com',
  'verizon': 'verizon.com',
  't-mobile': 'tmobile.com',
  'tmobile': 'tmobile.com',
  'sprint': 'sprint.com',
  'xfinity': 'xfinity.com',
  'comcast': 'xfinity.com',
  'spectrum': 'spectrum.com',
  'cox': 'cox.com',
  'centurylink': 'centurylink.com',
  'frontier': 'frontier.com',
  'optimum': 'optimum.com',
  'cricket': 'cricketwireless.com',
  'boost': 'boostmobile.com',
  'mint mobile': 'mintmobile.com',
  'google fi': 'fi.google.com',
  'visible': 'visible.com',
  'metro by t-mobile': 'metrobyt-mobile.com',
  'metrobyt': 'metrobyt-mobile.com',
  'starlink': 'starlink.com',

  // ── Utilities / Energy ──
  'duke energy': 'duke-energy.com',
  'dominion': 'dominionenergy.com',
  'firstenergy': 'firstenergycorp.com',
  'pge': 'pge.com',
  'pg&e': 'pge.com',
  'con edison': 'coned.com',
  'coned': 'coned.com',
  'dte energy': 'dteenergy.com',
  'national grid': 'nationalgridus.com',
  'aep': 'aep.com',
  'entergy': 'entergy.com',
  'eversource': 'eversource.com',
  'southern company': 'southerncompany.com',
  'xcel energy': 'xcelenergy.com',
  'consumers energy': 'consumersenergy.com',
  'ameren': 'ameren.com',
  'pepco': 'pepco.com',

  // ── Insurance ──
  'state farm': 'statefarm.com',
  'geico': 'geico.com',
  'progressive': 'progressive.com',
  'allstate': 'allstate.com',
  'liberty mutual': 'libertymutual.com',
  'usaa': 'usaa.com',
  'farmers': 'farmers.com',
  'nationwide': 'nationwide.com',
  'metlife': 'metlife.com',
  'aetna': 'aetna.com',
  'cigna': 'cigna.com',
  'humana': 'humana.com',
  'blue cross': 'bcbs.com',
  'bluecross': 'bcbs.com',
  'kaiser': 'kaiserpermanente.org',
  'united health': 'uhc.com',
  'unitedhealthcare': 'uhc.com',

  // ── Loans / Finance ──
  'navient': 'navient.com',
  'nelnet': 'nelnet.com',
  'sallie mae': 'salliemae.com',
  'great lakes': 'mygreatlakes.org',
  'mohela': 'mohela.com',
  'sofi': 'sofi.com',
  'loancare': 'myloancare.com',
  'quicken': 'quickenloans.com',
  'rocket mortgage': 'rocketmortgage.com',
  'wells fargo': 'wellsfargo.com',
  'chase': 'chase.com',
  'bank of america': 'bankofamerica.com',
  'citi': 'citi.com',
  'citibank': 'citi.com',
  'capital one': 'capitalone.com',
  'discover': 'discover.com',
  'american express': 'americanexpress.com',
  'amex': 'americanexpress.com',
  'synchrony': 'synchrony.com',
  'barclays': 'barclays.com',
  'sheffield financial': 'sheffieldfinancial.com',
  'ally': 'ally.com',

  // ── Software / Cloud ──
  'microsoft': 'microsoft.com',
  'office 365': 'microsoft.com',
  'adobe': 'adobe.com',
  'google': 'google.com',
  'dropbox': 'dropbox.com',
  'icloud': 'apple.com',
  'zoom': 'zoom.us',
  'slack': 'slack.com',
  'github': 'github.com',
  'notion': 'notion.so',
  'canva': 'canva.com',
  'openai': 'openai.com',
  'chatgpt': 'openai.com',
  'nordvpn': 'nordvpn.com',
  'expressvpn': 'expressvpn.com',

  // ── Fitness / Health ──
  'planet fitness': 'planetfitness.com',
  'la fitness': 'lafitness.com',
  'anytime fitness': 'anytimefitness.com',
  'orangetheory': 'orangetheory.com',
  'peloton': 'onepeloton.com',
  'ymca': 'ymca.org',
  'crossfit': 'crossfit.com',
  'equinox': 'equinox.com',
  'gold gym': 'goldsgym.com',
  'golds gym': 'goldsgym.com',

  // ── Home / Security ──
  'adt': 'adt.com',
  'ring': 'ring.com',
  'simplisafe': 'simplisafe.com',
  'vivint': 'vivint.com',
  'nest': 'nest.com',
  'waste management': 'wm.com',
  'republic services': 'republicservices.com',

  // ── Gaming ──
  'xbox': 'xbox.com',
  'playstation': 'playstation.com',
  'nintendo': 'nintendo.com',
  'steam': 'store.steampowered.com',
  'epic games': 'epicgames.com',
  'ea': 'ea.com',
};

export function getMerchantLogoUrl(billName: string): string | null {
  if (!billName) return null;

  const normalized = billName.toLowerCase().trim();

  if (MERCHANT_DOMAINS[normalized]) {
    return `https://keipr-backend-production.up.railway.app/api/logos/${MERCHANT_DOMAINS[normalized]}`;
  }

  for (const [keyword, domain] of Object.entries(MERCHANT_DOMAINS)) {
    if (normalized.includes(keyword)) {
      return `https://keipr-backend-production.up.railway.app/api/logos/${domain}`;
    }
  }

  return null;
}

export function hasMerchantLogo(billName: string): boolean {
  return getMerchantLogoUrl(billName) !== null;
}
