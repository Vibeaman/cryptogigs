import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Globe, 
  MessageCircle, 
  Palette, 
  TrendingUp,
  ExternalLink,
  Clock,
  Coins,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react'
import axios from 'axios'

function Browse() {
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    chain: 'all',
    role: 'all',
    maxAge: '',
    minGaps: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchGigs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.chain !== 'all') params.set('chain', filters.chain)
      if (filters.role !== 'all') params.set('role', filters.role)
      if (filters.maxAge) params.set('maxAge', filters.maxAge)
      if (filters.minGaps) params.set('minGaps', filters.minGaps)
      
      const res = await axios.get(`/api/gigs?${params.toString()}`)
      setGigs(res.data.gigs || [])
    } catch (err) {
      setError('Failed to fetch opportunities. Please try again.')
      console.error('Error fetching gigs:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchGigs()
  }, [filters])

  const getChainBadge = (chain) => {
    const badges = {
      solana: { class: 'chain-solana', label: 'SOL' },
      base: { class: 'chain-base', label: 'BASE' },
      ethereum: { class: 'chain-ethereum', label: 'ETH' }
    }
    return badges[chain] || { class: 'bg-gray-400', label: chain?.toUpperCase() || '?' }
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
    if (hours < 1) return '< 1h'
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Opportunities</h1>
            <p className="text-gray-600 mt-1">
              {gigs.length} opportunities found
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button 
              onClick={fetchGigs}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Chain Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chain</label>
                <select 
                  value={filters.chain}
                  onChange={(e) => setFilters({ ...filters, chain: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Chains</option>
                  <option value="solana">Solana</option>
                  <option value="base">Base</option>
                  <option value="ethereum">Ethereum</option>
                </select>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Needed</label>
                <select 
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="Web Developer">Web Developer</option>
                  <option value="Community Manager">Community Manager</option>
                  <option value="Designer">Designer</option>
                  <option value="Marketing / KOL">Marketing / KOL</option>
                  <option value="Raider / Engagement">Raider / Engagement</option>
                </select>
              </div>

              {/* Age Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Age</label>
                <select 
                  value={filters.maxAge}
                  onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any Age</option>
                  <option value="24">Last 24 hours</option>
                  <option value="48">Last 48 hours</option>
                  <option value="168">Last 7 days</option>
                </select>
              </div>

              {/* Min Gaps Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Opportunities</label>
                <select 
                  value={filters.minGaps}
                  onChange={(e) => setFilters({ ...filters, minGaps: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any</option>
                  <option value="2">2+ gaps</option>
                  <option value="3">3+ gaps</option>
                  <option value="4">4+ gaps</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Scanning for opportunities...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={fetchGigs} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig, idx) => {
              const chainBadge = getChainBadge(gig.chain)
              
              return (
                <div key={idx} className="glass-card rounded-2xl p-6 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {gig.imageUrl ? (
                      <img 
                        src={gig.imageUrl} 
                        alt={gig.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <Coins className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{gig.name || 'Unknown'}</h3>
                        <span className={`${chainBadge.class} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                          {chainBadge.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">${gig.symbol}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-white/50 rounded-lg py-2">
                      <div className="text-xs text-gray-500">MC</div>
                      <div className="font-semibold text-sm">{formatNumber(gig.marketCap)}</div>
                    </div>
                    <div className="bg-white/50 rounded-lg py-2">
                      <div className="text-xs text-gray-500">Liq</div>
                      <div className="font-semibold text-sm">{formatNumber(gig.liquidity)}</div>
                    </div>
                    <div className="bg-white/50 rounded-lg py-2">
                      <div className="text-xs text-gray-500">Age</div>
                      <div className="font-semibold text-sm flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatAge(gig.ageHours)}
                      </div>
                    </div>
                  </div>

                  {/* Gaps */}
                  <div className="mb-4 flex-1">
                    <div className="text-xs font-medium text-gray-500 mb-2">Opportunities ({gig.gapCount})</div>
                    <div className="flex flex-wrap gap-2">
                      {gig.gaps.slice(0, 4).map((gap, gapIdx) => {
                        const Icon = getRoleIcon(gap.role)
                        return (
                          <div 
                            key={gapIdx}
                            className={`chip ${gap.priority === 'high' ? 'bg-red-100 text-red-600' : gap.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}
                          >
                            <Icon className="w-3 h-3" />
                            {gap.role}
                          </div>
                        )
                      })}
                      {gig.gaps.length > 4 && (
                        <div className="chip bg-gray-100 text-gray-600">
                          +{gig.gaps.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                    <Link 
                      to={`/token/${gig.chain}/${gig.address}`}
                      className="flex-1 btn-secondary text-center text-sm py-2"
                    >
                      View Details
                    </Link>
                    <a 
                      href={gig.dexScreenerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 btn-secondary text-sm py-2 px-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && gigs.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or check back later.</p>
            <button 
              onClick={() => setFilters({ chain: 'all', role: 'all', maxAge: '', minGaps: '' })}
              className="btn-primary"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Browse
