const axios = require('axios');

// Cache
const cache = new Map();
const CACHE_TTL = 300000;

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

function analyzeTokenGaps(token) {
  const gaps = [];
  
  if (!token.info?.websites || token.info.websites.length === 0) {
    gaps.push({ role: 'Web Developer' });
  }
  
  const socials = token.info?.socials || [];
  const hasTwitter = socials.some(s => s.type === 'twitter');
  const hasTelegram = socials.some(s => s.type === 'telegram');
  const hasDiscord = socials.some(s => s.type === 'discord');
  
  if (!hasTwitter) {
    gaps.push({ role: 'Social Media Manager' });
  }
  
  if (!hasTelegram && !hasDiscord) {
    gaps.push({ role: 'Community Manager' });
  }
  
  if (!token.info?.imageUrl) {
    gaps.push({ role: 'Designer' });
  }
  
  if (token.liquidity?.usd < 10000) {
    gaps.push({ role: 'Marketing / KOL' });
  }
  
  if (token.volume?.h24 < 5000) {
    gaps.push({ role: 'Raider / Engagement' });
  }
  
  return gaps;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    
    latestTokens.forEach(token => {
      const gaps = analyzeTokenGaps(token);
      gaps.forEach(gap => {
        if (stats.roles[gap.role] !== undefined) {
          stats.roles[gap.role]++;
        }
      });
    });
    
    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
