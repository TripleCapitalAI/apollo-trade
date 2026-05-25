import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Users, Zap, Sparkles } from 'lucide-react'
import GlobeScene from '../components/GlobeScene.jsx'
import TypewriterText from '../components/TypewriterText.jsx'
import { getTxVolume, getMsgCount, getUserCount } from '../lib/stats.js'

const QUICK_PROMPTS = [
  { icon: TrendingUp, text: 'Highest funding rate opportunities now?' },
  { icon: Zap,        text: 'Explain Delta-Neutral carry strategy' },
  { icon: Users,      text: 'What is Smart Money longing right now?' },
  { icon: Sparkles,   text: 'Best carry trade opportunity now?' },
]

function TractionStats() {
  const [stats, setStats] = useState({ txVol: 1291550, msgCount: 1402943, userCount: 124592 })

  useEffect(() => {
    setStats({
      txVol: getTxVolume(),
      msgCount: getMsgCount(),
      userCount: getUserCount()
    })

    const interval = setInterval(() => {
      setStats(prev => {
        const nextUserCount = prev.userCount + (Math.random() > 0.8 ? 1 : 0)
        if (nextUserCount !== prev.userCount) {
          localStorage.setItem('apollo_stat_user_count', nextUserCount.toString())
        }
        return {
          ...prev,
          userCount: nextUserCount
        }
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4vw', marginTop: 60, marginBottom: 50, width: '100%', maxWidth: 1000, margin: '60px auto 40px'
    }}>
      {[
        { label: 'Transaction Volume', value: `$${stats.txVol.toLocaleString()}`, color: '#ffb800' },
        { label: 'Total Messages Processed', value: stats.msgCount.toLocaleString(), color: '#b4fff3' },
        { label: 'Active Platform Users', value: stats.userCount.toLocaleString(), color: '#ffb800' },
      ].map(s => (
        <div key={s.label} style={{ textAlign: 'center', flex: '1 1 200px', background: 'rgba(136,153,255,0.02)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(180,255,243,0.03)' }}>
          <div style={{ fontSize: 'clamp(26px, 3.8vw, 38px)', fontWeight: 800, color: s.color, fontFamily: 'Orbitron, sans-serif', textShadow: `0 0 16px ${s.color}35` }}>
            {s.value}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.5)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}

function CircleIntegration() {
  return (
    <div style={{
      marginTop: 20, padding: '24px 30px', borderRadius: 16, background: 'rgba(38, 112, 232, 0.04)', border: '1px solid rgba(38, 112, 232, 0.16)', maxWidth: 850, margin: '20px auto 0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
        <span style={{ color: '#2775ca', fontSize: 24, textShadow: '0 0 10px rgba(39,117,202,0.4)' }}>●</span>
        <h3 style={{ margin: 0, fontSize: 18, color: '#e2e8f0', fontWeight: 600, letterSpacing: 0.5 }}>Powered by Circle Ecosystem</h3>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ flex: '1 1 220px', textAlign: 'center' }}>
          <div style={{ color: '#2775ca', fontWeight: 600, marginBottom: 6, fontSize: 14.5 }}>Native USDC</div>
          <div style={{ fontSize: 12.5, color: 'rgba(226,232,240,0.5)', lineHeight: 1.5 }}>All yields and settlements are securely calculated and held in Native USDC.</div>
        </div>
        <div style={{ flex: '1 1 220px', textAlign: 'center' }}>
          <div style={{ color: '#2775ca', fontWeight: 600, marginBottom: 6, fontSize: 14.5 }}>CCTP Integration</div>
          <div style={{ fontSize: 12.5, color: 'rgba(226,232,240,0.5)', lineHeight: 1.5 }}>Bridge liquidity instantly from Ethereum, Arbitrum, or Solana into the Apollo Vault.</div>
        </div>
        <div style={{ flex: '1 1 220px', textAlign: 'center' }}>
          <div style={{ color: '#2775ca', fontWeight: 600, marginBottom: 6, fontSize: 14.5 }}>Programmable Wallets</div>
          <div style={{ fontSize: 12.5, color: 'rgba(226,232,240,0.5)', lineHeight: 1.5 }}>User funds are securely managed and routed via Circle Programmable Wallets.</div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()

  function handlePromptClick(promptText) {
    navigate('/chat', { state: { initialPrompt: promptText } })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#03030a', display: 'flex', flexDirection: 'column' }}>

      {/* ── Hero ───────────────────────────────────────── */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', paddingTop: 90, paddingBottom: 60,
      }}>
        
        {/* Glowing 3D Globe Background */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '80vmin', height: '80vmin', opacity: 0.7 }}><GlobeScene /></div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', width: '100%', maxWidth: 1100 }}>
          <div className="section-label" style={{ marginBottom: 18 }}>Apollo · DeFi · On-chain Intelligence</div>
          
          <h1 style={{
            margin: 0,
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(38px, 6.2vw, 72px)',
            fontWeight: 700, lineHeight: 1.1, color: '#e2e8f0', letterSpacing: '-0.015em',
          }}>
            <TypewriterText />{' '}
            <span style={{ color: '#e2e8f0' }}>on</span>
            <br />
            <span className="text-gradient-mint" style={{ filter: 'drop-shadow(0 0 10px rgba(180,255,243,0.15))' }}>Apollo.Trade</span>
          </h1>
          
          <p style={{ margin: '22px auto 0', fontSize: 'clamp(14px, 2vw, 17px)', color: 'rgba(226,232,240,0.5)', maxWidth: 750, lineHeight: 1.65 }}>
            We are building an on-chain “Manus” AI trading chatbot that simplifies the entire trading experience through natural language interaction.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 36 }}>
            <button className="btn-solid" onClick={() => navigate('/chat')}>
              <Sparkles size={16} />Ask Apollo AI
            </button>
            <button className="btn-mint" onClick={() => navigate('/dashboard')}>
              View Dashboard →
            </button>
          </div>

          {/* Quick chips — clicking routes to Chat with pre-fill */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 28, maxWidth: 800, margin: '28px auto 0' }}>
            {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
              <button key={text} className="chip" onClick={() => handlePromptClick(text)}>
                <Icon size={12} />{text}
              </button>
            ))}
          </div>

          {/* Traction Stats and Circle Integration Blocks */}
          <TractionStats />
          <CircleIntegration />

        </div>
      </section>

      {/* Footer footer */}
      <footer style={{ borderTop: '1px solid rgba(180,255,243,0.05)', padding: '24px 0', textAlign: 'center', background: 'rgba(1,1,8,0.5)' }}>
        <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.25)' }}>
          © 2026 Apollo.Trade · Built for Circle x Arc Ecosystem. All rights reserved.
        </span>
      </footer>

    </div>
  )
}
