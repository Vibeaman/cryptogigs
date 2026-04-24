const axios = require('axios');

// Cache for API responses (in-memory, resets on cold start)
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

// Fetch latest token profiles from DexScreener
async function fetchDexScreenerTokens() {
  const cacheKey = 'dexscreener_tokens';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  try {
    const [profilesRes, boostsRes] = await Promise.all([
      axios.get('https://api.dexscreener.com/token-profiles/latest/v1'),
      axios.get('https://api.dexscreener.com/token-boosts/latest/v1')
    ]);
    
    const tokens = [...(profilesRes.data || []), ...(boostsRes.data || [])];
    cache.set(cacheKey, { data: tokens, time: Date.now() });
    return tokens;
  } catch (error) {
    console.error('Error fetching DexScreener tokens:', error.message);
    return [];
  }
}

// Fetch from DeFiLlama - protocols with low TVL (new projects)
async function fetchDeFiLlamaTokens() {
  const cacheKey = 'defillama_tokens';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await axios.get('https://api.llama.fi/protocols');
    const protocols = response.data || [];
    
    // Filter for newer/smaller protocols (TVL < $1M, likely need help)
    const newProtocols = protocols
      .filter(p => p.tvl < 1000000 && p.tvl > 0)
      .slice(0, 50)
      .map(p => ({
        tokenAddress: p.slug,
        chainId: p.chain?.toLowerCase() || 'ethereum',
        name: p.name,
        symbol: p.symbol || p.name?.substring(0, 4)?.toUpperCase(),
        icon: p.logo,
        info: {
          imageUrl: p.logo,
          websites: p.url ? [{ url: p.url }] : [],
          socials: [
            p.twitter ? { type: 'twitter', url: `https://twitter.com/${p.twitter}` } : null
          ].filter(Boolean)
        },
        source: 'defillama'
      }));
    
    cache.set(cacheKey, { data: newProtocols, time: Date.now() });
    return newProtocols;
  } catch (error) {
    console.error('Error fetching DeFiLlama:', error.message);
    return [];
  }
}

// Fetch from CoinGecko - new coins
async function fetchCoinGeckoTokens() {
  const cacheKey = 'coingecko_tokens';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Get recently added coins
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'id_asc',
        per_page: 50,
        page: 1,
        sparkline: false
      }
    });
    
    const coins = response.data || [];
    const tokens = coins
      .filter(c => c.market_cap < 1000000) // Small market cap
      .map(c => ({
        tokenAddress: c.id,
        chainId: 'ethereum', // CoinGecko doesn't always specify
        name: c.name,
        symbol: c.symbol?.toUpperCase(),
        icon: c.image,
        info: {
          imageUrl: c.image,
          websites: [],
          socials: []
        },
        marketCap: c.market_cap,
        source: 'coingecko'
      }));
    
    cache.set(cacheKey, { data: tokens, time: Date.now() });
    return tokens;
  } catch (error) {
    console.error('Error fetching CoinGecko:', error.message);
    return [];
  }
}

// Fetch from GeckoTerminal - new pools
async function fetchGeckoTerminalTokens() {
  const cacheKey = 'geckoterminal_tokens';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch new pools from multiple chains
    const chains = ['solana', 'base', 'eth'];
    const allTokens = [];
    
    for (const chain of chains) {
      try {
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${chain}/new_pools`, {
          params: { page: 1, include: 'base_token' }
        });
        
        const pools = response.data?.data || [];
        const tokens = pools.map(pool => {
          const attrs = pool.attributes;
          const baseToken = pool.relationships?.base_token?.data;
          const tokenAddr = baseToken?.id?.split('_')[1] || attrs.address;
          
          // Try to get image from GeckoTerminal's included data
          const included = response.data?.included || [];
          const tokenInfo = included.find(i => i.id === baseToken?.id);
          const imageUrl = tokenInfo?.attributes?.image_url || null;
          
          return {
            tokenAddress: tokenAddr,
            chainId: chain === 'eth' ? 'ethereum' : chain,
            name: tokenInfo?.attributes?.name || attrs.name?.split(' / ')[0] || 'Unknown',
            symbol: tokenInfo?.attributes?.symbol || attrs.name?.split(' / ')[0]?.substring(0, 6) || '???',
            icon: imageUrl,
            info: {
              imageUrl: imageUrl,
              websites: [],
              socials: []
            },
            liquidity: parseFloat(attrs.reserve_in_usd) || 0,
            volume24h: parseFloat(attrs.volume_usd?.h24) || 0,
            createdAt: new Date(attrs.pool_created_at).getTime(),
            source: 'geckoterminal'
          };
        });
        
        allTokens.push(...tokens);
      } catch (e) {
        console.error(`Error fetching GeckoTerminal ${chain}:`, e.message);
      }
    }
    
    cache.set(cacheKey, { data: allTokens, time: Date.now() });
    return allTokens;
  } catch (error) {
    console.error('Error fetching GeckoTerminal:', error.message);
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
  
  if (!token.info?.imageUrl && !token.icon) {
    gaps.push({
      type: 'branding',
      role: 'Designer',
      description: 'No logo/branding',
      priority: 'medium'
    });
  }
  
  if (token.liquidity?.usd < 10000 || token.liquidity < 10000) {
    gaps.push({
      type: 'marketing',
      role: 'Marketing / KOL',
      description: 'Low liquidity - needs promotion',
      priority: 'medium'
    });
  }
  
  if (token.volume?.h24 < 5000 || token.volume24h < 5000) {
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
    marketCap: token.marketCap || pair?.marketCap || pair?.fdv || null,
    liquidity: token.liquidity || pair?.liquidity?.usd || null,
    volume24h: token.volume24h || pair?.volume?.h24 || null,
    priceChange24h: pair?.priceChange?.h24 || null,
    createdAt: token.createdAt || pair?.pairCreatedAt || null,
    ageHours: (token.createdAt || pair?.pairCreatedAt)
      ? Math.floor((Date.now() - (token.createdAt || pair.pairCreatedAt)) / (1000 * 60 * 60))
      : null,
    socials: token.links || token.info?.socials || [],
    websites: token.info?.websites || [],
    gaps,
    gapCount: gaps.length,
    source: token.source || 'dexscreener',
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
    
    // Fetch from all sources in parallel
    const [dexScreenerTokens, deFiLlamaTokens, coinGeckoTokens, geckoTerminalTokens] = await Promise.all([
      fetchDexScreenerTokens(),
      fetchDeFiLlamaTokens(),
      fetchCoinGeckoTokens(),
      fetchGeckoTerminalTokens()
    ]);
    
    // Combine all tokens
    const allTokens = [
      ...dexScreenerTokens,
      ...deFiLlamaTokens,
      ...coinGeckoTokens,
      ...geckoTerminalTokens
    ];
    
    // Dedupe by address/id
    const seen = new Set();
    const uniqueTokens = allTokens.filter(t => {
      const key = t.tokenAddress || t.id;
      if (!key || seen.has(key)) return false;
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
    
    // Sort by gap count (most opportunities first)
    gigs.sort((a, b) => b.gapCount - a.gapCount);
    
    res.status(200).json({
      success: true,
      count: gigs.length,
      sources: {
        dexscreener: dexScreenerTokens.length,
        defillama: deFiLlamaTokens.length,
        coingecko: coinGeckoTokens.length,
        geckoterminal: geckoTerminalTokens.length
      },
      gigs
    });
  } catch (error) {
    console.error('Error fetching gigs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
