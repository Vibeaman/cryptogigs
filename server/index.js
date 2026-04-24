const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

app.use(cors());
app.use(express.json());

// Serve static files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

// Chain mappings
const CHAINS = {
  solana: 'solana',
  base: 'base',
  ethereum: 'ethereum'
};

// Fetch new token pairs from DexScreener
async function fetchNewPairs(chain) {
  const cacheKey = `pairs_${chain}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    // Get boosted tokens (trending/new)
    const response = await axios.get(`${DEXSCREENER_API}/search?q=*`, {
      params: { chain }
    });
    
    const pairs = response.data?.pairs || [];
    cache.set(cacheKey, pairs);
    return pairs;
  } catch (error) {
    console.error(`Error fetching ${chain} pairs:`, error.message);
    return [];
  }
}

// Fetch latest token profiles
async function fetchLatestTokens() {
  const cacheKey = 'latest_tokens';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get('https://api.dexscreener.com/token-profiles/latest/v1');
    const tokens = response.data || [];
    cache.set(cacheKey, tokens);
    return tokens;
  } catch (error) {
    console.error('Error fetching latest tokens:', error.message);
    return [];
  }
}

// Fetch token boosters (promoted tokens)
async function fetchBoostedTokens() {
  const cacheKey = 'boosted_tokens';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get('https://api.dexscreener.com/token-boosts/latest/v1');
    const tokens = response.data || [];
    cache.set(cacheKey, tokens);
    return tokens;
  } catch (error) {
    console.error('Error fetching boosted tokens:', error.message);
    return [];
  }
}

// Analyze token for missing elements (gig opportunities)
function analyzeTokenGaps(token) {
  const gaps = [];
  
  // Check for missing website
  if (!token.info?.websites || token.info.websites.length === 0) {
    gaps.push({
      type: 'website',
      role: 'Web Developer',
      description: 'No website detected',
      priority: 'high'
    });
  }
  
  // Check for missing socials
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
  
  // Check for missing branding/image
  if (!token.info?.imageUrl) {
    gaps.push({
      type: 'branding',
      role: 'Designer',
      description: 'No logo/branding',
      priority: 'medium'
    });
  }
  
  // Check for low liquidity (needs marketing)
  if (token.liquidity?.usd < 10000) {
    gaps.push({
      type: 'marketing',
      role: 'Marketing / KOL',
      description: 'Low liquidity - needs promotion',
      priority: 'medium'
    });
  }
  
  // Check for low volume (needs raiders)
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
    
    // Market data
    priceUsd: pair?.priceUsd || null,
    marketCap: pair?.marketCap || pair?.fdv || null,
    liquidity: pair?.liquidity?.usd || null,
    volume24h: pair?.volume?.h24 || null,
    priceChange24h: pair?.priceChange?.h24 || null,
    
    // Age
    createdAt: pair?.pairCreatedAt || null,
    ageHours: pair?.pairCreatedAt 
      ? Math.floor((Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60))
      : null,
    
    // Socials
    socials: token.links || token.info?.socials || [],
    websites: token.info?.websites || [],
    
    // Gig opportunities
    gaps,
    gapCount: gaps.length,
    
    // DexScreener link
    dexScreenerUrl: pair?.url || `https://dexscreener.com/${token.chainId}/${token.tokenAddress}`
  };
}

// API Routes

// Get all gigs (tokens with gaps)
app.get('/api/gigs', async (req, res) => {
  try {
    const { chain, role, maxAge, minGaps } = req.query;
    
    // Fetch latest token profiles
    const latestTokens = await fetchLatestTokens();
    const boostedTokens = await fetchBoostedTokens();
    
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
    
    // Apply filters
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
    
    res.json({
      success: true,
      count: gigs.length,
      gigs
    });
  } catch (error) {
    console.error('Error fetching gigs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single token details
app.get('/api/gigs/:chain/:address', async (req, res) => {
  try {
    const { chain, address } = req.params;
    
    const response = await axios.get(`${DEXSCREENER_API}/tokens/${address}`);
    const pairs = response.data?.pairs || [];
    
    if (pairs.length === 0) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }
    
    const pair = pairs[0];
    const token = transformToken({
      tokenAddress: address,
      chainId: chain,
      name: pair.baseToken?.name,
      symbol: pair.baseToken?.symbol,
      info: pair.info
    }, pair);
    
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const latestTokens = await fetchLatestTokens();
    
    const stats = {
      totalTokens: latestTokens.length,
      chains: {
        solana: latestTokens.filter(t => t.chainId === 'solana').length,
        base: latestTokens.filter(t => t.chainId === 'base').length,
        ethereum: latestTokens.filter(t => t.chainId === 'ethereum').length
      },
      roles: {
        'Web Developer': 0,
        'Community Manager': 0,
        'Designer': 0,
        'Marketing / KOL': 0,
        'Raider / Engagement': 0
      }
    };
    
    // Count opportunities by role
    latestTokens.forEach(token => {
      const gaps = analyzeTokenGaps(token);
      gaps.forEach(gap => {
        if (stats.roles[gap.role] !== undefined) {
          stats.roles[gap.role]++;
        }
      });
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3456;
app.listen(PORT, () => {
  console.log(`CryptoGigs server running on port ${PORT}`);
});
