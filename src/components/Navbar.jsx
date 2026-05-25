import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart2, Brain, Home, ExternalLink, Sparkles, LogOut, Menu, X } from 'lucide-react'
import { PrivyMockModal, CctpBridgeModal } from './InteractiveModals.jsx'
import { incrementUserCount } from '../lib/stats.js'

const NAV = [
  { to: '/',            label: 'Home',        Icon: Home      },
  { to: '/chat',        label: 'Apollo AI',   Icon: Sparkles  },
  { to: '/dashboard',   label: 'Dashboard',   Icon: BarChart2 },
  { to: '/smart-money', label: 'Smart Money', Icon: Brain     },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [isPrivyOpen, setIsPrivyOpen] = useState(false)
  const [isCctpOpen, setIsCctpOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  function handleConnectWallet(address) {
    setWalletAddress(address)
    incrementUserCount()
  }

  function handleDisconnect() {
    setWalletAddress(null)
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 lg:px-[36px] h-[64px] bg-[rgba(3,3,10,0.75)] backdrop-blur-[18px] border-b border-[rgba(180,255,243,0.07)]"
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img
            src="/apollo-logo.png"
            alt="Apollo"
            style={{
              height: 44,
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              filter: 'brightness(2.5) contrast(1.2) drop-shadow(0 0 4px rgba(255,184,0,0.7))',
            }}
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-[6px]">
          {NAV.map(({ to, label }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                style={{
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: 99,
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? '#b4fff3' : 'rgba(226,232,240,0.55)',
                  background: active ? 'rgba(180,255,243,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(180,255,243,0.18)' : '1px solid transparent',
                  transition: 'all 0.18s',
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Desktop CTA Section */}
        <div className="hidden lg:flex gap-[10px] items-center">
          
          {/* Restored Trade on Hyperliquid Button */}
          <a
            href="https://app.hyperliquid.xyz/trade"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 500,
              padding: '7px 13px',
              borderRadius: 99,
              color: 'rgba(226,232,240,0.55)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#b4fff3'
              e.currentTarget.style.borderColor = 'rgba(180,255,243,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(226,232,240,0.55)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
            }}
          >
            Trade on HL <ExternalLink size={12} />
          </a>

          {/* Deposit via CCTP */}
          <button
            className="btn-mint"
            style={{ 
              fontSize: 13, 
              background: 'transparent', 
              color: '#e2e8f0', 
              border: '1px solid rgba(180,255,243,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px'
            }}
            onClick={() => setIsCctpOpen(true)}
          >
            Deposit via CCTP
          </button>

          {/* Connect Wallet with Privy Status */}
          {walletAddress ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <div
                style={{ 
                  fontSize: 13, 
                  background: 'rgba(180,255,243,0.08)', 
                  color: '#b4fff3', 
                  border: '1px solid rgba(180,255,243,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  borderRadius: 99
                }}
              >
                <span style={{ color: '#00e676', fontSize: 16 }}>●</span>
                {walletAddress}
              </div>
              <button
                onClick={handleDisconnect}
                style={{
                  background: 'rgba(255,77,77,0.1)',
                  border: '1px solid rgba(255,77,77,0.2)',
                  color: '#ff4d4d',
                  borderRadius: 99,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,77,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,77,77,0.1)'}
                title="Disconnect Wallet"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              className="btn-mint"
              style={{ 
                fontSize: 13, 
                background: '#ffffff', 
                color: '#000000', 
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                border: 'none'
              }}
              onClick={() => setIsPrivyOpen(true)}
            >
              <span style={{ color: '#2775ca', fontSize: 16 }}>●</span>
              Connect Wallet
            </button>
          )}

        </div>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-[#b4fff3] hover:text-white transition-colors cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed top-[64px] left-0 right-0 z-[99] glass-strong flex flex-col gap-6 p-6 border-b border-[rgba(180,255,243,0.1)] animate-fadeUp"
          style={{ animationDuration: '0.2s' }}
        >
          {/* Vertical Links */}
          <div className="flex flex-col gap-3 items-center">
            {NAV.map(({ to, label }) => {
              const active = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    textDecoration: 'none',
                    padding: '8px 24px',
                    borderRadius: 99,
                    fontSize: 15,
                    fontWeight: 500,
                    color: active ? '#b4fff3' : 'rgba(226,232,240,0.55)',
                    background: active ? 'rgba(180,255,243,0.08)' : 'transparent',
                    border: active ? '1px solid rgba(180,255,243,0.18)' : '1px solid transparent',
                    width: '100%',
                    textAlign: 'center',
                    transition: 'all 0.18s',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Vertical CTA Buttons */}
          <div className="flex flex-col gap-4 items-center w-full">
            {/* Restored Trade on Hyperliquid Button */}
            <a
              href="https://app.hyperliquid.xyz/trade"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full justify-center"
              style={{
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                padding: '10px 20px',
                borderRadius: 99,
                color: 'rgba(226,232,240,0.55)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#b4fff3'
                e.currentTarget.style.borderColor = 'rgba(180,255,243,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(226,232,240,0.55)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
              }}
            >
              Trade on HL <ExternalLink size={13} />
            </a>

            {/* Deposit via CCTP */}
            <button
              className="btn-mint w-full justify-center"
              style={{ 
                fontSize: 14, 
                background: 'transparent', 
                color: '#e2e8f0', 
                border: '1px solid rgba(180,255,243,0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px'
              }}
              onClick={() => {
                setIsCctpOpen(true)
                setIsMobileMenuOpen(false)
              }}
            >
              Deposit via CCTP
            </button>

            {/* Connect Wallet with Privy Status */}
            {walletAddress ? (
              <div className="flex flex-col gap-3 w-full">
                <div
                  style={{ 
                    fontSize: 14, 
                    background: 'rgba(180,255,243,0.08)', 
                    color: '#b4fff3', 
                    border: '1px solid rgba(180,255,243,0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 99
                  }}
                >
                  <span style={{ color: '#00e676', fontSize: 16 }}>●</span>
                  {walletAddress}
                </div>
                <button
                  onClick={() => {
                    handleDisconnect()
                    setIsMobileMenuOpen(false)
                  }}
                  style={{
                    background: 'rgba(255,77,77,0.1)',
                    border: '1px solid rgba(255,77,77,0.2)',
                    color: '#ff4d4d',
                    borderRadius: 99,
                    width: '100%',
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.15s'
                  }}
                >
                  <LogOut size={14} /> Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                className="btn-mint w-full justify-center"
                style={{ 
                  fontSize: 14, 
                  background: '#ffffff', 
                  color: '#000000', 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  border: 'none'
                }}
                onClick={() => {
                  setIsPrivyOpen(true)
                  setIsMobileMenuOpen(false)
                }}
              >
                <span style={{ color: '#2775ca', fontSize: 16 }}>●</span>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      <PrivyMockModal
        isOpen={isPrivyOpen}
        onClose={() => setIsPrivyOpen(false)}
        onSuccess={handleConnectWallet}
      />
      <CctpBridgeModal
        isOpen={isCctpOpen}
        onClose={() => setIsCctpOpen(false)}
      />
    </>
  )
}
