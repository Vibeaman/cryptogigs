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
  
  if (!token.info?.imageUrl && !token.imageUrl) {
    gaps.push({
      type: 'branding',
      role: 'Designer',
      description: 'No logo/branding',
      priority: 'medium'
    });
  }
  
  if ((token.liquidity?.usd || token.liquidity || 0) < 10000) {
    gaps.push({
      type: 'marketing',
      role: 'Marketing / KOL',
      description: 'Low liquidity - needs promotion',
      priority: 'medium'
    });
  }
  
  if ((token.volume?.h24 || token.volume24h || 0) < 5000) {
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
    name: pair?.baseToken?.name || token?.name || 'Unknown',
    symbol: pair?.baseToken?.symbol || token?.symbol || '???',
    chain: chain,
    address: address,
    imageUrl: pair?.info?.imageUrl || token?.imageUrl || null,
    description: token?.description || null,
    priceUsd: pair?.priceUsd || token?.priceUsd || null,
    marketCap: pair?.marketCap || pair?.fdv || token?.marketCap || null,
    liquidity: pair?.liquidity?.usd || token?.liquidity || null,
    volume24h: pair?.volume?.h24 || token?.volume24h || null,
    priceChange24h: pair?.priceChange?.h24 || null,
    createdAt: pair?.pairCreatedAt || token?.createdAt || null,
    ageHours: (pair?.pairCreatedAt || token?.createdAt)
      ? Math.floor((Date.now() - (pair?.pairCreatedAt || token?.createdAt)) / (1000 * 60 * 60))
      : null,
    socials: pair?.info?.socials || token?.socials || [],
    websites: pair?.info?.websites || token?.websites || [],
    gaps,
    gapCount: gaps.length,
    dexScreenerUrl: pair?.url || `https://dexscreener.com/${chain}/${address}`
  };
}

// Try to fetch from DeFiLlama if it's a protocol slug
async function fetchFromDeFiLlama(slug) {
  try {
    const response = await axios.get(`https://api.llama.fi/protocol/${slug}`);
    const data = response.data;
    if (data) {
      return {
        name: data.name,
        symbol: data.symbol,
        imageUrl: data.logo,
        description: data.description,
        websites: data.url ? [{ url: data.url }] : [],
        socials: [
          data.twitter ? { type: 'twitter', url: `https://twitter.com/${data.twitter}` } : null
        ].filter(Boolean),
        info: {
          websites: data.url ? [{ url: data.url }] : [],
          socials: [
            data.twitter ? { type: 'twitter', url: `https://twitter.com/${data.twitter}` } : null
          ].filter(Boolean)
        }
      };
    }
  } catch (e) {
    // Not found in DeFiLlama
  }
  return null;
}

// Try to fetch from CoinGecko if it's a coin id
async function fetchFromCoinGecko(id) {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`);
    const data = response.data;
    if (data) {
      return {
        name: data.name,
        symbol: data.symbol?.toUpperCase(),
        imageUrl: data.image?.large || data.image?.small,
        description: data.description?.en?.substring(0, 200),
        marketCap: data.market_data?.market_cap?.usd,
        priceUsd: data.market_data?.current_price?.usd,
        websites: data.links?.homepage?.filter(Boolean).map(url => ({ url })) || [],
        socials: [
          data.links?.twitter_screen_name ? { type: 'twitter', url: `https://twitter.com/${data.links.twitter_screen_name}` } : null,
          data.links?.telegram_channel_identifier ? { type: 'telegram', url: `https://t.me/${data.links.telegram_channel_identifier}` } : null
        ].filter(Boolean),
        info: {
          imageUrl: data.image?.large || data.image?.small,
          websites: data.links?.homepage?.filter(Boolean).map(url => ({ url })) || [],
          socials: [
            data.links?.twitter_screen_name ? { type: 'twitter', url: `https://twitter.com/${data.links.twitter_screen_name}` } : null,
            data.links?.telegram_channel_identifier ? { type: 'telegram', url: `https://t.me/${data.links.telegram_channel_identifier}` } : null
          ].filter(Boolean)
        }
      };
    }
  } catch (e) {
    // Not found in CoinGecko
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { chain, address } = req.query;
    
    // First try DexScreener (works for contract addresses)
    try {
      const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      const pairs = response.data?.pairs || [];
      
      if (pairs.length > 0) {
        const pair = pairs[0];
        const token = transformToken({}, pair, chain, address);
        return res.status(200).json({ success: true, token });
      }
    } catch (e) {
      // DexScreener failed, try other sources
    }
    
    // Try DeFiLlama (for protocol slugs)
    const deFiLlamaData = await fetchFromDeFiLlama(address);
    if (deFiLlamaData) {
      const token = transformToken(deFiLlamaData, null, chain, address);
      return res.status(200).json({ success: true, token, source: 'defillama' });
    }
    
    // Try CoinGecko (for coin ids)
    const coinGeckoData = await fetchFromCoinGecko(address);
    if (coinGeckoData) {
      const token = transformToken(coinGeckoData, null, chain, address);
      return res.status(200).json({ success: true, token, source: 'coingecko' });
    }
    
    // Nothing found
    return res.status(404).json({ success: false, error: 'Token not found' });
    
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
