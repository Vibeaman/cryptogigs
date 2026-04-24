import { Link, useLocation } from 'react-router-dom'
import { Briefcase, Search, Sparkles } from 'lucide-react'

function Header() {
  const location = useLocation()
  
  return (
    <header className="glass sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CryptoGigs" className="h-10 object-contain" />
            <span className="text-xl font-bold gradient-text">CryptoGigs</span>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`font-medium transition-colors ${
                location.pathname === '/' 
                  ? 'text-indigo-600' 
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/browse" 
              className={`font-medium transition-colors ${
                location.pathname === '/browse' 
                  ? 'text-indigo-600' 
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Browse Gigs
            </Link>
          </nav>
          
          {/* CTA */}
          <Link 
            to="/browse" 
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Find Opportunities
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
