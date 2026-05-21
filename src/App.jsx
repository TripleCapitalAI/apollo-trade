import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StarField from './components/StarField.jsx'
import Navbar    from './components/Navbar.jsx'
import Home      from './pages/Home.jsx'

const Dashboard  = lazy(() => import('./pages/Dashboard.jsx'))
const SmartMoney = lazy(() => import('./pages/SmartMoney.jsx'))
const Chat       = lazy(() => import('./pages/Chat.jsx'))

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03030a' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(180,255,243,0.15)', borderTopColor: '#b4fff3', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <StarField />
      <Navbar />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"            element={<Home />}       />
            <Route path="/chat"        element={<Chat />}       />
            <Route path="/dashboard"   element={<Dashboard />}  />
            <Route path="/smart-money" element={<SmartMoney />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}
