import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  Globe, 
  MessageCircle, 
  Palette, 
  TrendingUp,
  ExternalLink,
  Clock,
  Coins,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Twitter,
  Send
} from 'lucide-react'
import axios from 'axios'

function TokenDetail() {
  const { chain, address } = useParams()
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchToken = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`/api/token/${chain}/${address}`)
        setToken(res.data.token)
      } catch (err) {
        setError('Failed to fetch token details')
        console.error('Error:', err)
      }
      setLoading(false)
    }
    fetchToken()
  }, [chain, address])

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getChainBadge = (chain) => {
    const badges = {
      solana: { class: 'chain-solana', label: 'Solana' },
      base: { class: 'chain-base', label: 'Base' },
      ethereum: { class: 'chain-ethereum', label: 'Ethereum' }
    }
    return badges[chain] || { class: 'bg-gray-400', label: chain }
  }

  const getRoleIcon = (role) => {
    const icons = {
      'Web Developer': Globe,
      'Community Manager': MessageCircle,
      'Social Media Manager': MessageCircle,
      'Designer': Palette,
      'Marketing / KOL': TrendingUp,
      'Raider / Engagement': TrendingUp
    }
    return icons[role] || AlertCircle
  }

  const formatNumber = (num) => {
    if (!num) return '-'
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
    return `$${num.toFixed(2)}`
  }

  const formatAge = (hours) => {
    if (!hours && hours !== 0) return 'Unknown'
    if (hours < 1) return 'Less than 1 hour'
    if (hours < 24) return `${hours} hours`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading token details...</p>
        </div>
      </div>
    )
  }

  if (error || !token) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error || 'Token not found'}</p>
            <Link to="/browse" className="btn-primary">
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const chainBadge = getChainBadge(token.chain)

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link 
          to="/browse" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>

        {/* Token Header */}
        <div className="glass-card rounded-3xl p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {token.imageUrl ? (
              <img 
                src={token.imageUrl} 
                alt={token.name}
                className="w-20 h-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <Coins className="w-10 h-10 text-gray-500" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{token.name}</h1>
                <span className={`${chainBadge.class} text-white text-sm font-bold px-3 py-1 rounded-lg`}>
                  {chainBadge.label}
                </span>
              </div>
              <p className="text-lg text-gray-500 mb-3">${token.symbol}</p>
              
              <div className="flex items-center gap-2">
                <code className="bg-white/60 px-3 py-1.5 rounded-lg text-sm text-gray-600 font-mono">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </code>
                <button 
                  onClick={copyAddress}
                  className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <a 
              href={token.dexScreenerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2"
            >
              View on DexScreener
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-5 text-center">
            <div className="text-sm text-gray-500 mb-1">Market Cap</div>
            <div className="text-xl font-bold gradient-text">{formatNumber(token.marketCap)}</div>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center">
            <div className="text-sm text-gray-500 mb-1">Liquidity</div>
            <div className="text-xl font-bold gradient-text">{formatNumber(token.liquidity)}</div>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center">
            <div className="text-sm text-gray-500 mb-1">24h Volume</div>
            <div className="text-xl font-bold gradient-text">{formatNumber(token.volume24h)}</div>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center">
            <div className="text-sm text-gray-500 mb-1">Age</div>
            <div className="text-xl font-bold gradient-text flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              {formatAge(token.ageHours)}
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div className="glass-card rounded-3xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Opportunities ({token.gapCount})
          </h2>
          
          <div className="space-y-4">
            {token.gaps.map((gap, idx) => {
              const Icon = getRoleIcon(gap.role)
              const priorityClass = gap.priority === 'high' 
                ? 'border-l-red-500 bg-red-50/50' 
                : gap.priority === 'medium' 
                  ? 'border-l-amber-500 bg-amber-50/50'
                  : 'border-l-green-500 bg-green-50/50'
              
              return (
                <div 
                  key={idx}
                  className={`border-l-4 ${priorityClass} rounded-r-xl p-4 flex items-center gap-4`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    gap.priority === 'high' ? 'bg-red-100' : gap.priority === 'medium' ? 'bg-amber-100' : 'bg-green-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      gap.priority === 'high' ? 'text-red-600' : gap.priority === 'medium' ? 'text-amber-600' : 'text-green-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{gap.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        gap.priority === 'high' 
                          ? 'bg-red-100 text-red-600' 
                          : gap.priority === 'medium'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-green-100 text-green-600'
                      }`}>
                        {gap.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{gap.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Socials */}
        {token.socials && token.socials.length > 0 && (
          <div className="glass-card rounded-3xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Existing Socials</h2>
            <div className="flex flex-wrap gap-3">
              {token.socials.map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-xl hover:bg-white transition-colors"
                >
                  {social.type === 'twitter' && <Twitter className="w-4 h-4" />}
                  {social.type === 'telegram' && <Send className="w-4 h-4" />}
                  {!['twitter', 'telegram'].includes(social.type) && <Globe className="w-4 h-4" />}
                  <span className="capitalize">{social.type}</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TokenDetail
