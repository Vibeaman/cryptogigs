import { ExternalLink } from 'lucide-react'

function Footer() {
  return (
    <footer className="glass border-t border-white/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2026 CryptoGigs. All rights reserved.
          </p>
          
          <a 
            href="https://x.com/0xvibeaman" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
          >
            Built by <span className="gradient-text font-bold">VIBÆMAN</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
