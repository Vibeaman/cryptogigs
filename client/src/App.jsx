import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './components/Home'
import Browse from './components/Browse'
import TokenDetail from './components/TokenDetail'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/token/:chain/:address" element={<TokenDetail />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
