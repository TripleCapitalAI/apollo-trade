import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Sparkles, TrendingUp, Users, Zap, Settings, X, Eye, EyeOff, Gift, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react'
import { sendChat } from '../lib/openai.js'
import {
  getActiveKey, getUserKey, setUserKey, canChat,
  getRemainingFree, incrementUsage, FREE_LIMIT,
} from '../lib/apikey.js'

const QUICK_PROMPTS = [
  { icon: TrendingUp, text: 'Highest funding rate opportunities now?' },
  { icon: Zap,        text: 'Explain Delta-Neutral carry strategy' },
  { icon: Users,      text: 'What is Smart Money longing right now?' },
  { icon: Sparkles,   text: 'Best carry trade opportunity now?' },
]

/* ─── Message Bubble ──────────────────────────────────────── */
const mdComponents = {
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '12px 0', border: '1px solid rgba(180,255,243,0.1)', borderRadius: 8 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13, background: 'rgba(3,3,10,0.4)' }}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(180,255,243,0.2)', color: '#b4fff3', fontWeight: 600, textAlign: 'left', background: 'rgba(136,153,255,0.05)' }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0' }}>{children}</td>
  ),
  p: ({ children }) => <p style={{ margin: '8px 0', lineHeight: 1.7 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ color: '#b4fff3', fontWeight: 600 }}>{children}</strong>,
  code: ({ children }) => <code style={{ background: 'rgba(136,153,255,0.15)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12.5, color: '#b4fff3' }}>{children}</code>,
  ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: 20 }}>{children}</ul>,
  li: ({ children }) => <li style={{ margin: '4px 0', lineHeight: 1.65 }}>{children}</li>,
}

function Bubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className="animate-fadeUp" style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 20 }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: 99,
          background: 'linear-gradient(135deg,#b4fff3,#8899ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginRight: 12, marginTop: 2,
          fontSize: 13, fontWeight: 700, color: '#03030a',
          boxShadow: '0 0 10px rgba(180,255,243,0.2)'
        }}>A</div>
      )}
      <div
        className={isUser ? 'bubble-user' : 'bubble-ai'}
        style={{
          maxWidth: '82%',
          padding: '14px 18px',
          fontSize: 14.5,
          lineHeight: 1.7,
          color: '#e2e8f0',
          wordBreak: 'break-word',
          boxShadow: isUser ? '0 4px 12px rgba(180,255,243,0.03)' : '0 4px 12px rgba(136,153,255,0.03)'
        }}
      >
        {isUser ? content : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

function Thinking() {
  return (
    <div style={{ display: 'flex', marginBottom: 20, alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 99, background: 'linear-gradient(135deg,#b4fff3,#8899ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#03030a', boxShadow: '0 0 10px rgba(180,255,243,0.2)' }}>A</div>
      <div className="bubble-ai" style={{ padding: '16px 20px' }}>
        <div className="loading-dots" style={{ display: 'flex', gap: 6 }}><span /><span /><span /></div>
      </div>
    </div>
  )
}

function AddKeyCard({ onSave }) {
  const [key,  setKey]  = useState('')
  const [show, setShow] = useState(false)

  function handleSave() {
    const trimmed = key.trim()
    if (!trimmed) return
    setUserKey(trimmed)
    onSave(trimmed)
  }

  return (
    <div className="animate-fadeUp" style={{ display: 'flex', marginBottom: 20, alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 99, background: 'linear-gradient(135deg,#ff4d4d,#8899ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontSize: 13, fontWeight: 700, color: '#fff' }}>!</div>
      <div className="bubble-ai" style={{ padding: '18px 20px', maxWidth: '82%' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#b4fff3', marginBottom: 6 }}>
          Daily Free Quota Exhausted 🎁
        </div>
        <div style={{ fontSize: 13, color: 'rgba(226,232,240,0.6)', lineHeight: 1.6, marginBottom: 14 }}>
          You have used all {FREE_LIMIT} free requests for today.<br />
          Connect your API Key for unlimited usage (OpenAI, Anthropic, or compatible platforms).
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Paste your API Key..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(136,153,255,0.08)',
                border: '1px solid rgba(180,255,243,0.18)',
                borderRadius: 9, padding: '10px 38px 10px 12px',
                color: '#e2e8f0', fontSize: 13, outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <button onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.35)', padding: 2 }}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button onClick={handleSave} disabled={!key.trim()} className="btn-mint" style={{ padding: '8px 16px', fontSize: 13, opacity: key.trim() ? 1 : 0.45 }}>
            Bind Key
          </button>
        </div>
      </div>
    </div>
  )
}

function ApiKeyPrompt({ onSave }) {
  const [key,  setKey]  = useState('')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const trimmed = key.trim()
    if (!trimmed) return
    setUserKey(trimmed)
    setSaved(true)
    onSave(trimmed)
  }

  return (
    <div style={{
      background: 'rgba(255,184,0,0.06)',
      border: '1px solid rgba(255,184,0,0.2)',
      borderRadius: 14, padding: '18px 20px',
      marginBottom: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,184,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={14} color="#FFB800" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFB800' }}>Daily {FREE_LIMIT} free requests exhausted</div>
          <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)', marginTop: 1 }}>Bind your API Key for unlimited usage (OpenAI / Anthropic / Compatible)</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Paste your API Key..."
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,184,0,0.05)',
              border: '1px solid rgba(255,184,0,0.25)',
              borderRadius: 9, padding: '10px 38px 10px 12px',
              color: '#e2e8f0', fontSize: 13, outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.35)', padding: 2 }}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          style={{
            padding: '10px 20px', borderRadius: 9, border: 'none', cursor: key.trim() ? 'pointer' : 'not-allowed',
            background: key.trim() ? 'linear-gradient(135deg,#FFB800,#ff8c00)' : 'rgba(255,184,0,0.1)',
            color: key.trim() ? '#03030a' : 'rgba(226,232,240,0.25)',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
        >
          {saved ? '✓ Bound' : 'Bind Key'}
        </button>
      </div>
    </div>
  )
}

function FreeBanner({ remaining }) {
  if (remaining <= 0 || getUserKey()) return null
  const isLow = remaining <= 3
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 14px', borderRadius: 99, marginBottom: 12,
      background: isLow ? 'rgba(255,77,77,0.07)' : 'rgba(180,255,243,0.06)',
      border: `1px solid ${isLow ? 'rgba(255,77,77,0.2)' : 'rgba(180,255,243,0.14)'}`,
      alignSelf: 'center',
    }}>
      {isLow ? <AlertCircle size={13} color="#ff4d4d" /> : <Gift size={13} color="#b4fff3" />}
      <span style={{ fontSize: 12, color: isLow ? '#ff8888' : 'rgba(180,255,243,0.7)' }}>
        {isLow
          ? `${remaining} free requests remaining, running out soon`
          : `${remaining} free requests remaining today · Powered by Apollo.Trade`}
      </span>
    </div>
  )
}

function SettingsPanel({ onClose, onKeyChange }) {
  const [key,     setKey]     = useState(getUserKey())
  const [show,    setShow]    = useState(false)
  const [saved,   setSaved]   = useState(false)

  function handleSave() {
    setUserKey(key)
    onKeyChange(key)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', bottom: 130, right: 24, zIndex: 200, width: 320 }}>
      <div className="glass-strong" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#b4fff3' }}>API Key Settings</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.4)' }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.4)', marginBottom: 12, lineHeight: 1.5 }}>
          Empty = Use Free Quota ({FREE_LIMIT}x/day)<br />
          Custom Key = Unlimited Usage
        </div>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Paste your API Key (any platform)"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(136,153,255,0.07)',
              border: '1px solid rgba(180,255,243,0.18)',
              borderRadius: 8, padding: '10px 38px 10px 12px',
              color: '#e2e8f0', fontSize: 12, outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.35)', padding: 2 }}>
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <button onClick={handleSave} className="btn-mint" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
        {key && (
          <button
            onClick={() => { setUserKey(''); setKey(''); onKeyChange('') }}
            style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,77,77,0.6)', fontSize: 12, padding: 4 }}
          >
            Remove Custom Key, Use Free Quota
          </button>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [streaming,    setStreaming]     = useState('')
  const [remaining,    setRemaining]    = useState(getRemainingFree())
  const [showSettings, setShowSettings] = useState(false)
  const [showAddKey,   setShowAddKey]   = useState(false)
  const [, forceUpdate] = useState(0)
  const bottomRef    = useRef(null)
  const textareaRef  = useRef(null)

  const location = useLocation()
  const navigate = useNavigate()
  const initialPromptProcessed = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming, loading])

  const submit = useCallback(async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    const { key, source } = getActiveKey()
    if (!key) { setShowAddKey(true); return }

    // Clear loading state if user binds key mid-chat
    const newMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setLoading(true)
    setStreaming('')

    if (source === 'default') {
      incrementUsage()
      setRemaining(getRemainingFree())
    }

    try {
      let full = ''
      await sendChat(
        newMessages,
        key,
        (delta, accumulated) => {
          full = accumulated
          setStreaming(accumulated)
          setLoading(false)
        }
      )
      setMessages(prev => [...prev, { role: 'assistant', content: full }])
      setStreaming('')
    } catch (err) {
      const errMsg = err.message?.includes('quota') || err.message?.includes('429')
        ? '⚠️ API quota exhausted. Please add your own API Key in settings.'
        : `⚠️ Error: ${err.message}`
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }])
      setStreaming('')
      if (err.message?.includes('quota') || err.message?.includes('429')) setShowAddKey(true)
    } finally {
      setLoading(false)
    }
  }, [input, messages, loading])

  // Handle auto-submitting location state prompts
  useEffect(() => {
    if (location.state?.initialPrompt && !initialPromptProcessed.current) {
      initialPromptProcessed.current = true
      const p = location.state.initialPrompt
      // Clear route state immediately to prevent re-submission
      navigate(location.pathname, { replace: true, state: {} })
      submit(p)
    }
  }, [location, submit, navigate])

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const hasMessages = messages.length > 0 || loading || streaming

  return (
    <div style={{ minHeight: '100vh', background: '#03030a', display: 'flex', flexDirection: 'column', paddingTop: 64 }}>
      <div style={{ flex: 1, display: 'flex', width: '100%' }}>
        
        {/* Left Sidebar Info Card (Collapses/Hidden on small screens) */}
        <div style={{
          width: 280,
          borderRight: '1px solid rgba(180,255,243,0.06)',
          background: 'rgba(3,3,10,0.4)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0
        }} className="hidden md:flex">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(180,255,243,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={18} color="#b4fff3" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Apollo AI Assistant</div>
                <span style={{ fontSize: 11, color: '#00e676', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', display: 'inline-block' }}></span>
                  Leaderboard Intelligence
                </span>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'rgba(226,232,240,0.5)', lineHeight: 1.6, marginBottom: 24 }}>
              Ask Apollo AI about historical yields, top leaderboard traders on Hyperliquid, delta-neutral carry trade yields, and the Circle CCTP ecosystem integration.
            </p>

            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#b4fff3', marginBottom: 12 }}>
              Quick Suggestions
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => submit(text)}
                  style={{
                    background: 'rgba(136,153,255,0.05)',
                    border: '1px solid rgba(136,153,255,0.12)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    color: 'rgba(226,232,240,0.7)',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(180,255,243,0.3)'
                    e.currentTarget.style.color = '#b4fff3'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(136,153,255,0.12)'
                    e.currentTarget.style.color = 'rgba(226,232,240,0.7)'
                  }}
                >
                  <Icon size={12} style={{ flexShrink: 0, color: '#b4fff3' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(38,112,232,0.05)', border: '1px solid rgba(38,112,232,0.15)' }}>
              <div style={{ fontSize: 11, color: '#2775ca', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span>●</span> Native USDC Enabled
              </div>
              <p style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)', margin: 0, lineHeight: 1.4 }}>
                Apollo operates exclusively with Circle USDC for robust yield settlement.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Thread Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: 'calc(100vh - 64px)' }}>
          
          {/* Main Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 16px 200px 16px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
              
              {!hasMessages ? (
                <div style={{ textAlign: 'center', padding: '80px 20px 40px' }} className="animate-fadeUp">
                  <div style={{
                    width: 60, height: 60, borderRadius: 18,
                    background: 'linear-gradient(135deg,#b4fff3,#8899ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 20px rgba(180,255,243,0.3)'
                  }}>
                    <Sparkles size={28} color="#03030a" />
                  </div>
                  <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, color: '#e2e8f0', margin: '0 0 10px' }}>
                    Ask Apollo DeFi Intelligence
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(226,232,240,0.5)', maxWidth: 440, margin: '0 auto 30px', lineHeight: 1.6 }}>
                    Query our delta-neutral funding rate agent for top arbitrage yield strategies on Hyperliquid.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 600, margin: '0 auto' }} className="md:hidden">
                    {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
                      <button key={text} className="chip" onClick={() => submit(text)}>
                        <Icon size={12} />{text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
                  {showAddKey && !getUserKey() && canChat() && <AddKeyCard onSave={(k) => { forceUpdate(n => n + 1); setShowAddKey(false) }} />}
                  {loading && !streaming && <Thinking />}
                  {streaming && (
                    <div style={{ display: 'flex', marginBottom: 20, alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 99, background: 'linear-gradient(135deg,#b4fff3,#8899ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#03030a', boxShadow: '0 0 10px rgba(180,255,243,0.2)' }}>A</div>
                      <div className="bubble-ai" style={{ maxWidth: '82%', padding: '14px 18px', fontSize: 14.5, lineHeight: 1.7, color: '#e2e8f0', wordBreak: 'break-word' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{streaming}</ReactMarkdown>
                        <span className="animate-blink" style={{ color: 'rgba(180,255,243,0.7)', marginLeft: 1 }}>|</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Dock Input Bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '24px 16px 32px',
            background: 'linear-gradient(to top, #03030a 70%, transparent)',
            zIndex: 50,
          }}>
            <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
              
              <FreeBanner remaining={remaining} />

              {!canChat() && !getUserKey() ? (
                <ApiKeyPrompt onSave={(k) => { forceUpdate(n => n + 1); setRemaining(getRemainingFree()) }} />
              ) : (
                <div style={{ position: 'relative' }}>
                  <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={input}
                    onChange={e => {
                      setInput(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                    }}
                    onKeyDown={handleKey}
                    placeholder="Ask Apollo AI about funding rates, strategies, or smart money..."
                    rows={1}
                    style={{ paddingRight: 52, minHeight: 52, background: 'rgba(3,3,10,0.85)' }}
                  />
                  <button
                    onClick={() => submit()}
                    disabled={!input.trim() || loading}
                    style={{
                      position: 'absolute', right: 10, bottom: 9,
                      width: 34, height: 34, borderRadius: 8,
                      background: (input.trim() && !loading)
                        ? 'linear-gradient(135deg,#b4fff3,#8899ff)'
                        : 'rgba(136,153,255,0.1)',
                      border: 'none',
                      cursor: (input.trim() && !loading) ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                      color: (input.trim() && !loading) ? '#03030a' : 'rgba(226,232,240,0.25)',
                    }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              )}

              {/* Input Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.2)' }}>Apollo.Trade AI Console · Powered by Apollo</span>
                {getUserKey() && (
                  <button
                    onClick={() => setShowSettings(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.3)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Settings size={11} />Custom Key Active
                  </button>
                )}
                {!getUserKey() && canChat() && (
                  <button
                    onClick={() => setShowSettings(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.3)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Settings size={11} />Free {remaining}/{FREE_LIMIT} remaining
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onKeyChange={(k) => { forceUpdate(n => n + 1); setRemaining(getRemainingFree()) }}
        />
      )}
    </div>
  )
}
