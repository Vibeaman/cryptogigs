import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  Globe, 
  MessageCircle, 
  Palette, 
  TrendingUp, 
  Zap,
  Search,
  ArrowRight,
  Sparkles,
  Users,
  Target
} from 'lucide-react'
import axios from 'axios'

function Home() {
  const [stats, setStats] = useState(null)
  
  useEffect(() => {
    axios.get('/api/stats')
      .then(res => setStats(res.data.stats))
      .catch(err => console.error('Error fetching stats:', err))
  }, [])

  const features = [
    {
      icon: Globe,
      title: 'Web Developers',
      description: 'Find new tokens that launched without a website. Build their web presence from scratch.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: MessageCircle,
      title: 'Community Managers',
      description: 'Discover projects missing Discord or Telegram. Help them build engaged communities.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Palette,
      title: 'Designers',
      description: 'Spot tokens with no branding or poor visuals. Create logos, graphics, and identity.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: TrendingUp,
      title: 'Marketing / KOLs',
      description: 'Find low-liquidity gems that need promotion. Help them reach their audience.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      title: 'Raiders',
      description: 'Identify tokens with low engagement. Boost their visibility across social media.',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      icon: Users,
      title: 'Moderators',
      description: 'Join early-stage communities. Help maintain order and foster growth.',
      color: 'from-indigo-500 to-violet-500'
    }
  ]

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/30 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Real-time opportunities from new token launches</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Find <span className="gradient-text">Crypto Freelance</span>
            <br />
            Opportunities First
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            We scan new token launches across Solana, Base, and Ethereum to detect what they're missing. 
            Find projects that need your skills before they even post job listings.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/browse" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              <Search className="w-5 h-5" />
              Browse Opportunities
            </Link>
            <a 
              href="#how-it-works" 
              className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
            >
              How It Works
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text">{stats.totalTokens}</div>
              <div className="text-sm text-gray-500 mt-1">Active Tokens</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text">{stats.roles['Web Developer']}</div>
              <div className="text-sm text-gray-500 mt-1">Need Websites</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text">{stats.roles['Community Manager']}</div>
              <div className="text-sm text-gray-500 mt-1">Need Communities</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text">{stats.roles['Designer']}</div>
              <div className="text-sm text-gray-500 mt-1">Need Branding</div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div id="how-it-works" className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            Opportunities by Role
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
            Whether you're a developer, designer, or community builder, there's a project that needs you.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-6 hover:scale-[1.02]">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chains */}
        <div className="glass-card rounded-3xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Supported Chains
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50">
              <img src="/chains/solana.jpg" alt="Solana" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <div className="font-semibold">Solana</div>
                <div className="text-sm text-gray-500">{stats?.chains?.solana || 0} tokens</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50">
              <img src="/chains/base.jpg" alt="Base" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <div className="font-semibold">Base</div>
                <div className="text-sm text-gray-500">{stats?.chains?.base || 0} tokens</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50">
              <img src="/chains/ethereum.jpg" alt="Ethereum" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <div className="font-semibold">Ethereum</div>
                <div className="text-sm text-gray-500">{stats?.chains?.ethereum || 0} tokens</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="glass-card rounded-3xl p-10 inline-block">
            <Target className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Ready to Find Your Next Gig?
            </h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Start browsing opportunities now. New tokens launch every minute.
            </p>
            <Link to="/browse" className="btn-primary inline-flex items-center gap-2">
              <Search className="w-5 h-5" />
              Browse All Opportunities
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
