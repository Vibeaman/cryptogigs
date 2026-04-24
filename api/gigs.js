const axios = require('axios');

// Cache for API responses (in-memory, resets on cold start)
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

// Fetch latest token profiles from DexScreener
async function fetchLatestTokens() {
  const cacheKey = 'latest_tokens';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await axios.get('https://api.dexscreener.com/token-profiles/latest/v1');
    const tokens = response.data || [];
    cache.set(cacheKey, { data: tokens, time: Date.now() });
    return tokens;
  } catch (error) {
    console.error('Error fetching latest tokens:', error.message);
    return [];
  }
}

// Fetch boosted tokens
async function fetchBoostedTokens() {
  const cacheKey = 'boosted_tokens';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await axios.get('https://api.dexscreener.com/token-boosts/latest/v1');
    const tokens = response.data || [];
    cache.set(cacheKey, { data: tokens, time: Date.now() });
    return tokens;
  } catch (error) {
    console.error('Error fetching boosted tokens:', error.message);
    return [];
  }
}

// Analyze token for missing elements (gig opportunities)
function analyzeTokenGaps(token) {
  const gaps = [];
  
  if (!token.info?.websites || token.info.websites.length === 0) {
    gaps.push({
      type: 'website',
      role: 'Web Developer',
      description: 'No website detected',
      priority: 'high'
    });
  }
  
  const socials = token.info?.socials || [];
  const hasTwitter = socials.some(s => s.type === 'twitter');
  const hasTelegram = socials.some(s => s.type === 'telegram');
  const hasDiscord = socials.some(s => s.type === 'discord');
  
  if (!hasTwitter) {
    gaps.push({
      type: 'twitter',
      role: 'Social Media Manager',
      description: 'No Twitter/X account',
      priority: 'high'
    });
  }
  
  if (!hasTelegram && !hasDiscord) {
    gaps.push({
      type: 'community',
      role: 'Community Manager',
      description: 'No Telegram or Discord',
      priority: 'high'
    });
  }
  
  if (!token.info?.imageUrl) {
    gaps.push({
      type: 'branding',
      role: 'Designer',
      description: 'No logo/branding',
      priority: 'medium'
    });
  }
  
  if (token.liquidity?.usd < 10000) {
    gaps.push({
      type: 'marketing',
      role: 'Marketing / KOL',
      description: 'Low liquidity - needs promotion',
      priority: 'medium'
    });
  }
  
  if (token.volume?.h24 < 5000) {
    gaps.push({
      type: 'engagement',
      role: 'Raider / Engagement',
      description: 'Low trading volume',
      priority: 'low'
    });
  }
  
  return gaps;
}

// Transform token data for frontend
function transformToken(token, pair = null) {
  const gaps = analyzeTokenGaps({ ...token, ...(pair || {}) });
  
  return {
    id: token.tokenAddress || pair?.baseToken?.address,
    name: token.name || pair?.baseToken?.name || 'Unknown',
    symbol: token.symbol || pair?.baseToken?.symbol || '???',
    chain: token.chainId || pair?.chainId || 'unknown',
    address: token.tokenAddress || pair?.baseToken?.address,
    imageUrl: token.icon || token.info?.imageUrl || null,
    description: token.description || null,
    priceUsd: pair?.priceUsd || null,
    marketCap: pair?.marketCap || pair?.fdv || null,
    liquidity: pair?.liquidity?.usd || null,
    volume24h: pair?.volume?.h24 || null,
    priceChange24h: pair?.priceChange?.h24 || null,
    createdAt: pair?.pairCreatedAt || null,
    ageHours: pair?.pairCreatedAt 
      ? Math.floor((Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60))
      : null,
    socials: token.links || token.info?.socials || [],
    websites: token.info?.websites || [],
    gaps,
    gapCount: gaps.length,
    dexScreenerUrl: pair?.url || `https://dexscreener.com/${token.chainId}/${token.tokenAddress}`
  };
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { chain, role, maxAge, minGaps } = req.query;
    
    // Fetch tokens
    const [latestTokens, boostedTokens] = await Promise.all([
      fetchLatestTokens(),
      fetchBoostedTokens()
    ]);
    
    // Combine and dedupe
    const allTokens = [...latestTokens, ...boostedTokens];
    const seen = new Set();
    const uniqueTokens = allTokens.filter(t => {
      const key = t.tokenAddress;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Transform and filter
    let gigs = uniqueTokens.map(t => transformToken(t));
    
    if (chain && chain !== 'all') {
      gigs = gigs.filter(g => g.chain === chain);
    }
    
    if (role && role !== 'all') {
      gigs = gigs.filter(g => g.gaps.some(gap => gap.role === role));
    }
    
    if (maxAge) {
      const maxAgeHours = parseInt(maxAge);
      gigs = gigs.filter(g => g.ageHours !== null && g.ageHours <= maxAgeHours);
    }
    
    if (minGaps) {
      const min = parseInt(minGaps);
      gigs = gigs.filter(g => g.gapCount >= min);
    }
    
    // Sort by gap count
    gigs.sort((a, b) => b.gapCount - a.gapCount);
    
    res.status(200).json({
      success: true,
      count: gigs.length,
      gigs
    });
  } catch (error) {
    console.error('Error fetching gigs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
