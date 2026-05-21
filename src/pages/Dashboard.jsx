import { useState, useEffect, useRef, useCallback } from 'react'
import { TrendingUp, TrendingDown, Search, RefreshCw, Info, ChevronUp, ChevronDown, Zap, Terminal, Play, Square } from 'lucide-react'
import { getFundingRates, fmtRate, fmtApr, fmtUsd } from '../lib/hyperliquid.js'
import { createChart, ColorType, LineStyle } from 'lightweight-charts'

/* ─── Sparkline chart ────────────────────────────────────────── */
function MiniChart({ data, color }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !data?.length) return
    const chart = createChart(ref.current, {
      width: 100, height: 36,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'transparent' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: { visible: false },
      rightPriceScale: { visible: false },
      leftPriceScale:  { visible: false },
      timeScale: { visible: false },
      handleScroll: false, handleScale: false,
    })
    const series = chart.addLineSeries({
      color, lineWidth: 1.5,
      priceLineVisible: false, lastValueVisible: false,
      crossHairMarkerVisible: false,
    })
    series.setData(data.map((v, i) => ({ time: i + 1, value: v })))
    chart.timeScale().fitContent()
    return () => chart.remove()
  }, [data, color])
  return <div ref={ref} style={{ width: 100, height: 36 }} />
}

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({ label, value, sub, Icon, color }) {
  return (
    <div className="stat-card" style={{ flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: color || '#e2e8f0', letterSpacing: '-0.02em' }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.4)', marginTop: 4 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `${color || '#8899ff'}18`,
            border: `1px solid ${color || '#8899ff'}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={color || '#8899ff'} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Strategy tooltip ──────────────────────────────────────── */
function StrategyBadge({ rate }) {
  if (rate > 0) return (
    <span className="badge-pos" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
      Long Spot + Short Perp
    </span>
  )
  return (
    <span className="badge-neg" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
      Long Perp + Short Spot
    </span>
  )
}

/* ─── Main Dashboard ────────────────────────────────────────── */
export default function Dashboard() {
  const [data,       setData]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [search,     setSearch]     = useState('')
  const [sortKey,    setSortKey]    = useState('annualized')
  const [sortDir,    setSortDir]    = useState('desc')
  const [filter,     setFilter]     = useState('all')   // all | positive | negative
  const [lastUpdate, setLastUpdate] = useState(null)
  
  // Agent Auto-Pilot State
  const [autoPilot, setAutoPilot] = useState(false)
  const [agentLogs, setAgentLogs] = useState(["> System initialized. Awaiting Auto-Pilot engagement..."])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const rates = await getFundingRates()
      setData(rates)
      setLastUpdate(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  /* Auto-refresh every 30s */
  useEffect(() => {
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  /* Agent Auto-Pilot Mock Logic */
  useEffect(() => {
    if (!autoPilot) return
    const interval = setInterval(() => {
      const msgs = [
        "> Analyzing Hyperliquid Leaderboard...",
        "> Detected PURR funding rate anomaly (+0.18% / 8h).",
        "> Verifying Circle CCTP liquidity... Available: $125,000 USDC.",
        "> Executing Delta-Neutral carry via USDC (Long Spot + Short Perp).",
        "> Order filled on PURR. Capturing 197% APR.",
        "> Monitoring margin health. Current Vault TVL: $2.4M."
      ]
      setAgentLogs(prev => [...prev, msgs[Math.floor(Math.random() * msgs.length)]].slice(-6))
    }, 3500)
    return () => clearInterval(interval)
  }, [autoPilot])

  /* Derived */
  const filtered = data
    .filter(r => {
      if (filter === 'positive') return r.rate8h > 0
      if (filter === 'negative') return r.rate8h < 0
      return true
    })
    .filter(r => r.coin.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const v = (x) => {
        if (sortKey === 'coin') return x.coin
        return x[sortKey] ?? 0
      }
      const av = v(a), bv = v(b)
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })

  // Best positive opportunity for "buy spot + short perp" carry trade
  const topOpp   = data.filter(r => r.rate8h > 0).sort((a,b) => b.annualized - a.annualized)[0] || null
  const avgRate  = data.length ? data.reduce((s, r) => s + Math.abs(r.rate8h), 0) / data.length : 0
  const posCount = data.filter(r => r.rate8h > 0).length
  const negCount = data.filter(r => r.rate8h < 0).length

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronUp size={12} style={{ opacity: 0.2 }} />
    return sortDir === 'desc'
      ? <ChevronDown size={12} style={{ color: '#b4fff3' }} />
      : <ChevronUp   size={12} style={{ color: '#b4fff3' }} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#03030a', paddingTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Header ──────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div className="section-label">Real-time · Hyperliquid Perpetuals</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{
              margin: 0,
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700, color: '#e2e8f0',
            }}>
              Funding Rate <span style={{ color: '#b4fff3' }}>Dashboard</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {lastUpdate && (
                <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.3)' }}>
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <button
                className="btn-mint"
                onClick={load}
                disabled={loading}
                style={{ padding: '7px 14px', fontSize: 13 }}
              >
                <RefreshCw size={13} style={{ animation: loading ? 'spin-slow 1s linear infinite' : 'none' }} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── Agent Auto-Pilot Terminal (NEW) ─────── */}
        <div className="glass" style={{ marginBottom: 28, border: autoPilot ? '1px solid rgba(0, 230, 118, 0.4)' : '1px solid rgba(180, 255, 243, 0.1)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: autoPilot ? 'rgba(0, 230, 118, 0.05)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Terminal size={18} color={autoPilot ? "#00e676" : "#8899ff"} />
              <strong style={{ color: autoPilot ? '#00e676' : '#e2e8f0', fontSize: 15 }}>Autonomous Agent Terminal</strong>
              {autoPilot && <span className="animate-pulse" style={{ width: 8, height: 8, background: '#00e676', borderRadius: '50%' }}></span>}
            </div>
            <button
              onClick={() => setAutoPilot(!autoPilot)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: autoPilot ? 'rgba(255, 77, 77, 0.15)' : 'rgba(0, 230, 118, 0.15)',
                color: autoPilot ? '#ff4d4d' : '#00e676',
                border: `1px solid ${autoPilot ? 'rgba(255, 77, 77, 0.3)' : 'rgba(0, 230, 118, 0.3)'}`
              }}
            >
              {autoPilot ? <><Square size={13} /> Stop Agent</> : <><Play size={13} /> Enable Auto-Pilot</>}
            </button>
          </div>
          <div style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: 'rgba(226, 232, 240, 0.7)', height: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, background: '#010103' }}>
            {agentLogs.map((log, i) => (
              <div key={i} className="animate-fadeUp" style={{ animationDuration: '0.3s' }}>
                <span style={{ color: '#8899ff', marginRight: 8 }}>[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))}
            {autoPilot && <div className="animate-pulse">_</div>}
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatCard
            label="Best Carry Trade"
            value={topOpp ? fmtApr(topOpp.annualized) : '—'}
            sub={topOpp ? `${topOpp.coin} · Long spot + Short perp` : '—'}
            Icon={Zap}
            color="#b4fff3"
          />
          <StatCard
            label="Avg |Rate| (8h)"
            value={loading ? '…' : fmtRate(avgRate)}
            sub={`${(avgRate * 3 * 365 * 100).toFixed(1)}% APR avg`}
            Icon={TrendingUp}
            color="#8899ff"
          />
          <StatCard
            label="Positive Rates"
            value={loading ? '…' : posCount}
            sub="Longs paying shorts"
            Icon={TrendingUp}
            color="#00e676"
          />
          <StatCard
            label="Negative Rates"
            value={loading ? '…' : negCount}
            sub="Shorts paying longs"
            Icon={TrendingDown}
            color="#ff4d4d"
          />
        </div>

        {/* ── Strategy Explainer ───────────────────── */}
        <div className="glass" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Info size={16} color="#8899ff" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'rgba(226,232,240,0.55)', lineHeight: 1.6 }}>
            <strong style={{ color: '#b4fff3' }}>Delta-Neutral Carry Trade:</strong>
            {' '}When funding rate is <span style={{ color: '#00e676' }}>positive</span> → Long spot + Short perp → earn from longs.
            {' '}When <span style={{ color: '#ff4d4d' }}>negative</span> → Long perp + short spot (or hold stables) → earn from shorts.
            {' '}APR = 8h rate × 3 × 365. Rebalance if rate flips.
          </div>
        </div>

        {/* ── Filters + Search ────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'positive', 'negative'].map(f => (
            <button
              key={f}
              className="chip"
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(180,255,243,0.12)' : undefined,
                borderColor: filter === f ? 'rgba(180,255,243,0.35)' : undefined,
                color: filter === f ? '#b4fff3' : undefined,
              }}
            >
              {f === 'all' ? 'All' : f === 'positive' ? '↑ Positive' : '↓ Negative'}
            </button>
          ))}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(226,232,240,0.3)',
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search coin…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(136,153,255,0.06)',
                border: '1px solid rgba(180,255,243,0.12)',
                borderRadius: 8, padding: '8px 14px 8px 34px',
                color: '#e2e8f0', fontSize: 13, outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.3)', marginLeft: 'auto' }}>
            {filtered.length} markets
          </span>
        </div>

        {/* ── Table ───────────────────────────────── */}
        <div className="glass" style={{ overflow: 'hidden' }}>
          {loading && !data.length ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'rgba(226,232,240,0.3)' }}>
              <RefreshCw size={22} style={{ animation: 'spin-slow 1s linear infinite', marginBottom: 12 }} />
              <div style={{ fontSize: 14 }}>Fetching live data from Hyperliquid…</div>
            </div>
          ) : error ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#ff4d4d', fontSize: 14 }}>
              Failed to load: {error}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('coin')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Coin <SortIcon col="coin" /></span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('rate8h')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Rate (8h) <SortIcon col="rate8h" /></span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('annualized')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>APR <SortIcon col="annualized" /></span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('mark')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Mark Price <SortIcon col="mark" /></span>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('oi')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Open Interest <SortIcon col="oi" /></span>
                    </th>
                    <th>Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.coin}>
                      <td style={{ color: 'rgba(226,232,240,0.25)', fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: r.rate8h >= 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,77,77,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                            color: r.rate8h >= 0 ? '#00e676' : '#ff4d4d',
                          }}>
                            {r.coin.slice(0, 2)}
                          </div>
                          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{r.coin}</span>
                        </div>
                      </td>
                      <td>
                        <span className={r.rate8h >= 0 ? 'rate-pos' : 'rate-neg'} style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>
                          {fmtRate(r.rate8h)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={r.annualized >= 0 ? 'rate-pos' : 'rate-neg'}
                          style={{ fontWeight: 700, fontSize: 14 }}
                        >
                          {fmtApr(r.annualized)}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(226,232,240,0.75)' }}>
                        ${r.mark < 1 ? r.mark.toFixed(6) : r.mark.toFixed(2)}
                      </td>
                      <td style={{ fontSize: 13, color: 'rgba(226,232,240,0.55)' }}>
                        {fmtUsd(r.oi)}
                      </td>
                      <td>
                        <StrategyBadge rate={r.rate8h} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Strategy Cards ──────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 28 }}>
          <StrategyCard
            title="Funding Rate Arbitrage"
            subtitle="Delta-Neutral Carry"
            color="#b4fff3"
            steps={[
              'Find coin with high positive funding rate',
              'Buy equivalent spot position',
              'Open equal short on perpetual',
              'Collect funding every 8 hours',
              'Close when rate drops below threshold',
            ]}
          />
          <StrategyCard
            title="Rate Reversal"
            subtitle="Funding Extremes Reversal"
            color="#8899ff"
            steps={[
              'Monitor for extreme rates (>0.1% / 8h)',
              'High positive rate = over-leveraged longs',
              'High negative rate = panic shorts',
              'Fade the extreme: take opposite direction',
              'Set stop-loss at 1.5× the entry rate',
            ]}
          />
          <StrategyCard
            title="Layered Approach"
            subtitle="Composite Multi-Strategy"
            color="#00e676"
            steps={[
              'Carry trade for base yield (low risk)',
              'Add reversal trades on extreme signals',
              'Size: 60% carry, 40% directional',
              'Rebalance funding positions weekly',
              'Target 30%+ APR net of fees',
            ]}
          />
        </div>

      </div>
    </div>
  )
}

function StrategyCard({ title, subtitle, color, steps }) {
  return (
    <div className="glass" style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color, marginBottom: 6 }}>
          {subtitle}
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0', fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h3>
      </div>
      <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => (
          <li key={i} style={{ fontSize: 13, color: 'rgba(226,232,240,0.6)', lineHeight: 1.5 }}>{s}</li>
        ))}
      </ol>
    </div>
  )
}
