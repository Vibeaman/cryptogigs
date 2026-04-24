const axios = require('axios');

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

function transformToken(token, pair, chain, address) {
  const gaps = analyzeTokenGaps({ ...token, ...(pair || {}) });
  
  return {
    id: address,
    name: pair?.baseToken?.name || 'Unknown',
    symbol: pair?.baseToken?.symbol || '???',
    chain: chain,
    address: address,
    imageUrl: pair?.info?.imageUrl || null,
    description: null,
    priceUsd: pair?.priceUsd || null,
    marketCap: pair?.marketCap || pair?.fdv || null,
    liquidity: pair?.liquidity?.usd || null,
    volume24h: pair?.volume?.h24 || null,
    priceChange24h: pair?.priceChange?.h24 || null,
    createdAt: pair?.pairCreatedAt || null,
    ageHours: pair?.pairCreatedAt 
      ? Math.floor((Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60))
      : null,
    socials: pair?.info?.socials || [],
    websites: pair?.info?.websites || [],
    gaps,
    gapCount: gaps.length,
    dexScreenerUrl: pair?.url || `https://dexscreener.com/${chain}/${address}`
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { chain, address } = req.query;
    
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    const pairs = response.data?.pairs || [];
    
    if (pairs.length === 0) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }
    
    const pair = pairs[0];
    const token = transformToken({}, pair, chain, address);
    
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
