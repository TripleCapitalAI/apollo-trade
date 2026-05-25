import { useState, useEffect } from 'react'
import { X, Mail, Chrome, Shield, ArrowRight, CheckCircle, Smartphone, HelpCircle } from 'lucide-react'
import { addTxVolume } from '../lib/stats.js'

/**
 * PrivyMockModal Component
 * Implements a high-fidelity interactive mock environment representing Privy's embedded wallet 
 * infrastructure. Supports email OTP code verification workflows, social single-sign-on (SSO),
 * and standard Web3 wallet connector callbacks to securely expose public key states.
 * 
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Dictates whether overlay modal should be rendered in viewport.
 * @param {Function} props.onClose - Triggered when close actions (escape/clicks) occur.
 * @param {Function} props.onSuccess - Callback returning the successfully bound public wallet address string.
 */
export function PrivyMockModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('input') // 'input' | 'otp' | 'success'
  const [otp, setOtp] = useState('')

  if (!isOpen) return null

  function handleContinue() {
    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('otp')
    }, 1200)
  }

  function handleVerifyOtp() {
    if (otp.length < 6) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('success')
      setTimeout(() => {
        onSuccess('0x7a8e...4eED')
        onClose()
        setStep('input')
        setEmail('')
        setOtp('')
      }, 1000)
    }, 1200)
  }

  function handleWalletConnect(walletName) {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('success')
      setTimeout(() => {
        onSuccess(`0x${walletName === 'MetaMask' ? '3d9f' : '6e1a'}...7c8b`)
        onClose()
        setStep('input')
      }, 1000)
    }, 1400)
  }

  return (
    <div style={modalOverlayStyle}>
      <div className="glass-strong animate-fadeUp" style={{ width: '100%', maxWidth: 400, padding: 24, position: 'relative', margin: 16 }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={closeButtonStyle}>
          <X size={18} />
        </button>

        {step === 'input' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', letterSpacing: -0.5 }}>
                Apollo<span style={{ color: '#b4fff3' }}>.Trade</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(226,232,240,0.4)', marginTop: 4 }}>
                Powered by <span style={{ color: '#b4fff3', fontWeight: 500 }}>Privy</span>
              </div>
            </div>

            {/* Email login */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#b4fff3', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={loading}
                  style={inputStyle}
                />
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(226,232,240,0.3)' }} />
              </div>
              <button
                onClick={handleContinue}
                disabled={loading || !email.trim()}
                className="btn-solid"
                style={{ width: '100%', justifyContent: 'center', marginTop: 12, fontSize: 14, height: 44, borderRadius: 10 }}
              >
                {loading ? 'Sending Code...' : 'Continue'}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.3)', textTransform: 'uppercase' }}>or connect</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Web3 Wallets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                { name: 'MetaMask', color: '#E17117', icon: '🦊' },
                { name: 'Coinbase Wallet', color: '#0052FF', icon: '🔵' },
                { name: 'Rainbow', color: '#E17117', icon: '🌈' },
              ].map(w => (
                <button
                  key={w.name}
                  onClick={() => handleWalletConnect(w.name)}
                  disabled={loading}
                  style={walletButtonStyle}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(180,255,243,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                >
                  <span style={{ fontSize: 16 }}>{w.icon}</span>
                  <span style={{ fontWeight: 500 }}>{w.name}</span>
                </button>
              ))}
            </div>

            {/* Social logins */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button style={socialButtonStyle} disabled={loading} onClick={() => handleWalletConnect('Google')}>
                <Chrome size={16} />
              </button>
              <button style={socialButtonStyle} disabled={loading} onClick={() => handleWalletConnect('Apple')}>
                <span style={{ fontSize: 15, fontWeight: 700 }}></span>
              </button>
              <button style={socialButtonStyle} disabled={loading} onClick={() => handleWalletConnect('Twitter')}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>𝕏</span>
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#e2e8f0' }}>Enter Verification Code</h3>
            <p style={{ fontSize: 13, color: 'rgba(226,232,240,0.5)', margin: '0 0 20px 0' }}>
              We sent a 6-digit code to <span style={{ color: '#b4fff3' }}>{email}</span>.
            </p>

            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="0 0 0 0 0 0"
              style={{
                background: 'rgba(136,153,255,0.08)',
                border: '1px solid rgba(180,255,243,0.18)',
                borderRadius: 10,
                padding: '12px',
                color: '#b4fff3',
                fontSize: 22,
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: 8,
                outline: 'none',
                width: '100%',
                marginBottom: 16,
                fontFamily: 'monospace'
              }}
            />

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="btn-solid"
              style={{ width: '100%', justifyContent: 'center', fontSize: 14, height: 44, borderRadius: 10, opacity: otp.length === 6 ? 1 : 0.5 }}
            >
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>

            <button
              onClick={() => setStep('input')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.4)', fontSize: 12, marginTop: 12 }}
            >
              ← Back to Email
            </button>
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'rgba(0,230,118,0.12)', border: '2px solid #00e676',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle size={32} color="#00e676" />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#e2e8f0' }}>Successfully Connected!</h3>
            <p style={{ fontSize: 13, color: 'rgba(226,232,240,0.5)', margin: 0 }}>
              Privy Smart Wallet initialized securely.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}


/**
 * CctpBridgeModal Component
 * Simulates high-fidelity cross-chain burn-and-mint flows leveraging Circle's Cross-Chain Transfer Protocol.
 * Decouples bridging timer mechanisms into atomic async React lifecycle hooks to bypass React 18 strict mode
 * closure capture warnings, simulating transaction approvals, burn validations, attestation requests,
 * and smart contract minting events sequentially.
 * 
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Renders overlay visibility.
 * @param {Function} props.onClose - Triggers state resets and modal teardowns.
 */
export function CctpBridgeModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('')
  const [sourceChain, setSourceChain] = useState('Ethereum')
  const [step, setStep] = useState('form') // 'form' | 'bridging' | 'success'
  const [bridgeStep, setBridgeStep] = useState(0) // 0 to 4 steps

  const stepsText = [
    'Approving USDC Deposit on Source Chain...',
    'Initiating Native USDC Burn via CCTP...',
    'Fetching Circle CCTP Attestation Signature...',
    'Minting Native USDC on Apollo Appchain Vault...',
  ]

  // Effect to simulate transaction process safely
  useEffect(() => {
    if (step !== 'bridging') return

    const timer = setInterval(() => {
      setBridgeStep(prev => {
        if (prev >= 3) {
          return 4
        }
        return prev + 1
      })
    }, 1500)

    return () => clearInterval(timer)
  }, [step])

  // Separate effect to handle successful completion transition safely
  useEffect(() => {
    if (step === 'bridging' && bridgeStep === 4) {
      const successTimer = setTimeout(() => {
        setStep('success')
        const val = parseFloat(amount)
        if (!isNaN(val)) {
          addTxVolume(val)
        }
      }, 1000)
      return () => clearTimeout(successTimer)
    }
  }, [step, bridgeStep, amount])

  if (!isOpen) return null

  function handleBridge() {
    const num = parseFloat(amount)
    if (!amount.trim() || isNaN(num) || num <= 0) {
      alert('Please enter a valid USDC amount to bridge.')
      return
    }

    setStep('bridging')
    setBridgeStep(0)
  }

  function handleReset() {
    setStep('form')
    setAmount('')
    setBridgeStep(0)
    onClose()
  }

  return (
    <div style={modalOverlayStyle}>
      <div className="glass-strong animate-fadeUp" style={{ width: '100%', maxWidth: 440, padding: 24, position: 'relative', margin: 16 }}>
        
        {/* Close Button */}
        <button onClick={handleReset} style={closeButtonStyle}>
          <X size={18} />
        </button>

        {step === 'form' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(39,117,202,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#2775ca', fontSize: 20, fontWeight: 'bold' }}>●</span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#e2e8f0', fontWeight: 600 }}>Circle CCTP Cross-Chain Bridge</h3>
                <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)' }}>1:1 Secure Native USDC Bridging</span>
              </div>
            </div>

            {/* Source Chain */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Source Network</label>
              <select
                value={sourceChain}
                onChange={e => setSourceChain(e.target.value)}
                style={selectStyle}
              >
                <option value="Ethereum" style={optionStyle}>Ethereum Mainnet</option>
                <option value="Arbitrum" style={optionStyle}>Arbitrum One</option>
                <option value="Solana" style={optionStyle}>Solana Network</option>
                <option value="Avalanche" style={optionStyle}>Avalanche C-Chain</option>
              </select>
            </div>

            {/* Target Chain */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Target Network</label>
              <div style={disabledInputStyle}>
                Hyperliquid Appchain (Apollo Vault)
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Bridge Amount (USDC)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="1,000.00"
                  style={inputStyle}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#b4fff3', fontSize: 12, fontWeight: 600 }}>
                  USDC
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'rgba(226,232,240,0.45)' }}>
                <span>CCTP Fee: <strong style={{ color: '#00e676' }}>$0.00 (Gas Free)</strong></span>
                <span>Time: ~2 minutes</span>
              </div>
            </div>

            {/* Info Box */}
            <div style={{ background: 'rgba(39,117,202,0.06)', border: '1px solid rgba(39,117,202,0.2)', padding: '12px 14px', borderRadius: 10, marginBottom: 24, display: 'flex', gap: 10 }}>
              <Shield size={16} color="#2775ca" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 11.5, color: 'rgba(226,232,240,0.5)', margin: 0, lineHeight: 1.4 }}>
                Circle's **Cross-Chain Transfer Protocol (CCTP)** burns native USDC on the source chain and mints it 1:1 on the target chain. Zero slippage, 100% native stability.
              </p>
            </div>

            <button
              onClick={handleBridge}
              className="btn-solid"
              style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14 }}
            >
              Bridge Native USDC via CCTP
            </button>
          </div>
        )}

        {step === 'bridging' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 17, color: '#e2e8f0', textAlign: 'center' }}>
              CCTP Cross-Chain Bridge Active
            </h3>

            {/* Animation / Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {stepsText.map((text, i) => {
                const isActive = bridgeStep === i
                const isCompleted = bridgeStep > i
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: isCompleted
                        ? 'rgba(0,230,118,0.04)'
                        : isActive
                          ? 'rgba(180,255,243,0.04)'
                          : 'transparent',
                      border: `1px solid ${isCompleted ? 'rgba(0,230,118,0.18)' : isActive ? 'rgba(180,255,243,0.18)' : 'rgba(255,255,255,0.03)'}`,
                      opacity: isCompleted || isActive ? 1 : 0.35,
                      transition: 'all 0.3s'
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle size={16} color="#00e676" style={{ flexShrink: 0 }} />
                    ) : isActive ? (
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(180,255,243,0.2)', borderTopColor: '#b4fff3', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(226,232,240,0.2)', borderRadius: '50%', flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 12.5, color: isCompleted ? '#00e676' : isActive ? '#b4fff3' : '#e2e8f0', fontWeight: isActive || isCompleted ? 500 : 400 }}>
                      {text}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Overall Progress Indicator */}
            <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(bridgeStep / 4) * 100}%`,
                background: 'linear-gradient(90deg, #b4fff3, #8899ff)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: 58, height: 58, borderRadius: '50%',
              background: 'rgba(0,230,118,0.12)', border: '2px solid #00e676',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 20px rgba(0,230,118,0.3)'
            }}>
              <CheckCircle size={36} color="#00e676" />
            </div>
            
            <h3 style={{ margin: '0 0 8px 0', fontSize: 19, color: '#e2e8f0', fontWeight: 600 }}>CCTP Bridge Confirmed!</h3>
            
            <p style={{ fontSize: 13.5, color: 'rgba(226,232,240,0.5)', maxWidth: 300, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Successfully bridged <span style={{ color: '#b4fff3', fontWeight: 600 }}>{parseFloat(amount).toLocaleString()} USDC</span> from {sourceChain} directly into the Apollo Vault.
            </p>

            <button
              onClick={handleReset}
              className="btn-solid"
              style={{ width: '100%', justifyContent: 'center', height: 42, fontSize: 13.5 }}
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  )
}


/* ─── Styles ──────────────────────────────────────────────────── */
const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  zIndex: 1000,
  background: 'rgba(3,3,10,0.8)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16
}

const closeButtonStyle = {
  position: 'absolute',
  right: 18, top: 18,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(226,232,240,0.35)',
  padding: 6,
  borderRadius: 6,
  transition: 'all 0.15s'
}

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: '#b4fff3',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  display: 'block',
  marginBottom: 8
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(136,153,255,0.06)',
  border: '1px solid rgba(180,255,243,0.14)',
  borderRadius: 10,
  padding: '12px 14px 12px 38px',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: 'inherit'
}

const selectStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(3,3,10,0.85)',
  border: '1px solid rgba(180,255,243,0.14)',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#e2e8f0',
  fontSize: 13.5,
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23b4fff3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  backgroundSize: '16px'
}

const optionStyle = {
  background: '#03030a',
  color: '#e2e8f0'
}

const disabledInputStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 10,
  padding: '12px 14px',
  color: 'rgba(226,232,240,0.4)',
  fontSize: 13.5
}

const walletButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(136,153,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 13.5,
  cursor: 'pointer',
  transition: 'all 0.18s',
  textAlign: 'left'
}

const socialButtonStyle = {
  flex: 1,
  height: 40,
  background: 'rgba(136,153,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  color: '#e2e8f0',
  cursor: 'pointer',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}
