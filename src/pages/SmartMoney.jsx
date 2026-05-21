import { useState, useEffect, useCallback } from 'react'
import { Users, TrendingUp, TrendingDown, Search, RefreshCw, Award, ExternalLink } from 'lucide-react'
import { getLeaderboard, getTopPositions, fmtUsd, shortAddr } from '../lib/hyperliquid.js'

/* ─── Position bar ───────────────────────────────────────────── */
function ExposureBar({ coin, usd, maxUsd, side }) {
  const pct = (usd / maxUsd) * 100
  const color = side === 'long' ? '#00e676' : '#ff4d4d'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: `${color}18`, border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color, flexShrink: 0,
      }}>
        {coin.slice(0, 2)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{coin}</span>
          <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.5)', fontFamily: 'monospace' }}>{fmtUsd(usd)}</span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 99, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Trader row ─────────────────────────────────────────────── */
function TraderRow({ rank, trader, onClick, selected }) {
  const pnlColor = trader.allTimePnl >= 0 ? '#00e676' : '#ff4d4d'
  const roiStr   = `${(trader.allTimeRoi * 100).toFixed(1)}%`

  return (
    <tr
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <td>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {rank <= 3 ? (
            <div style={{
              width: 22, height: 22, borderRadius: 99,
              background: rank === 1 ? 'linear-gradient(135deg,#ffd700,#ffaa00)'
                        : rank === 2 ? 'linear-gradient(135deg,#c0c0c0,#a0a0a0)'
                        :               'linear-gradient(135deg,#cd7f32,#a0522d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#03030a',
            }}>{rank}</div>
          ) : (
            <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.3)' }}>{rank}</span>
          )}
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{
            fontWeight: 600, fontSize: 14,
            color: selected ? '#b4fff3' : '#e2e8f0',
          }}>
            {trader.displayName || shortAddr(trader.address)}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.3)', fontFamily: 'monospace' }}>
            {shortAddr(trader.address)}
          </span>
        </div>
      </td>
      <td>
        <span style={{ fontWeight: 700, fontSize: 14, color: pnlColor, fontFamily: 'monospace' }}>
          {fmtUsd(trader.allTimePnl)}
        </span>
      </td>
      <td>
        <span style={{
          fontSize: 13, fontFamily: 'monospace',
          color: trader.allTimeRoi >= 0 ? '#00e676' : '#ff4d4d',
        }}>
          {roiStr}
        </span>
      </td>
      <td>
        <span style={{ fontSize: 13, color: 'rgba(226,232,240,0.55)', fontFamily: 'monospace' }}>
          {fmtUsd(trader.accountValue)}
        </span>
      </td>
      <td>
        <span style={{ fontSize: 13, color: 'rgba(226,232,240,0.4)', fontFamily: 'monospace' }}>
          {fmtUsd(trader.monthPnl)}
        </span>
      </td>
      <td>
        <a
          href={`https://app.hyperliquid.xyz/stats/${trader.address}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: 'rgba(136,153,255,0.6)' }}
        >
          <ExternalLink size={13} />
        </a>
      </td>
    </tr>
  )
}

/* ─── Main SmartMoney Page ──────────────────────────────────── */
export default function SmartMoney() {
  const [leaders,   setLeaders]   = useState([])
  const [positions, setPositions] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [posLoading,setPosLoading]= useState(true)
  const [error,     setError]     = useState(null)
  const [sortBy,    setSortBy]    = useState('allTime')
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState(null)

  const loadLeaders = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await getLeaderboard(sortBy)
      setLeaders(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [sortBy])

  const loadPositions = useCallback(async () => {
    setPosLoading(true)
    try {
      const pos = await getTopPositions()
      setPositions(pos)
    } catch { /* silent */ }
    finally { setPosLoading(false) }
  }, [])

  useEffect(() => { loadLeaders() }, [loadLeaders])
  useEffect(() => { loadPositions() }, [loadPositions])

  const filtered = leaders.filter(t =>
    (t.displayName || t.address || '').toLowerCase().includes(search.toLowerCase())
  )

  const maxLong  = positions?.longs?.[0]?.usd  || 1
  const maxShort = positions?.shorts?.[0]?.usd || 1

  return (
    <div style={{ minHeight: '100vh', background: '#03030a', paddingTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Header ─────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div className="section-label">On-chain Intelligence · Hyperliquid</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{
              margin: 0,
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700, color: '#e2e8f0',
            }}>
              Smart <span style={{ color: '#b4fff3' }}>Money</span> Tracker
            </h1>
            <button
              className="btn-mint"
              onClick={() => { loadLeaders(); loadPositions() }}
              style={{ fontSize: 13 }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Top 3 podium ───────────────────────── */}
        {!loading && leaders.length >= 3 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {[1,0,2].map((rank) => {
              const t = leaders[rank]
              if (!t) return null
              const colors = ['#ffd700','#e2e8f0','#cd7f32']
              const sizes  = [28, 22, 22]
              const podium = rank === 0 ? 1 : rank === 1 ? 0 : 2
              return (
                <div
                  key={t.address}
                  className="glass"
                  style={{
                    flex: podium === 1 ? '1.3 1 200px' : '1 1 160px',
                    padding: '20px 22px',
                    border: podium === 1 ? '1px solid rgba(255,215,0,0.2)' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelected(selected?.address === t.address ? null : t)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Award size={sizes[podium]} color={colors[podium]} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors[podium] }}>
                      #{podium + 1} All Time
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0', marginBottom: 4 }}>
                    {t.displayName || shortAddr(t.address)}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#00e676' }}>
                    {fmtUsd(t.allTimePnl)}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.4)', marginTop: 4 }}>
                    {(t.allTimeRoi * 100).toFixed(1)}% ROI · {fmtUsd(t.accountValue)} AUM
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Two-column layout ──────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* Leaderboard */}
          <div>
            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { key: 'allTime', label: 'All Time' },
                { key: 'month',   label: '30 Days'  },
                { key: 'week',    label: '7 Days'   },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className="chip"
                  onClick={() => setSortBy(key)}
                  style={{
                    background: sortBy === key ? 'rgba(180,255,243,0.12)' : undefined,
                    borderColor: sortBy === key ? 'rgba(180,255,243,0.35)' : undefined,
                    color:       sortBy === key ? '#b4fff3' : undefined,
                  }}
                >
                  {label}
                </button>
              ))}
              <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
                <Search size={13} style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(226,232,240,0.3)',
                }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search trader…"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(136,153,255,0.06)',
                    border: '1px solid rgba(180,255,243,0.12)',
                    borderRadius: 8, padding: '7px 12px 7px 30px',
                    color: '#e2e8f0', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            </div>

            <div className="glass" style={{ overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'rgba(226,232,240,0.3)' }}>
                  <RefreshCw size={20} style={{ animation: 'spin-slow 1s linear infinite', marginBottom: 10 }} />
                  <div style={{ fontSize: 13 }}>Loading leaderboard…</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40, textAlign: 'center' }}>#</th>
                        <th>Trader</th>
                        <th>All-Time PnL</th>
                        <th>ROI</th>
                        <th>Account</th>
                        <th>30D PnL</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t, i) => (
                        <TraderRow
                          key={t.address}
                          rank={i + 1}
                          trader={t}
                          selected={selected?.address === t.address}
                          onClick={() => setSelected(sel => sel?.address === t.address ? null : t)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Selected trader detail */}
            {selected && (
              <div className="glass animate-fadeUp" style={{ padding: 24, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#b4fff3', fontFamily: 'Playfair Display, serif' }}>
                    {selected.displayName || shortAddr(selected.address)}
                  </h3>
                  <a
                    href={`https://app.hyperliquid.xyz/stats/${selected.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-mint"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                  >
                    View on HL <ExternalLink size={11} />
                  </a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'All-Time PnL',  value: fmtUsd(selected.allTimePnl),          color: selected.allTimePnl >= 0 ? '#00e676' : '#ff4d4d' },
                    { label: 'All-Time ROI',  value: `${(selected.allTimeRoi * 100).toFixed(1)}%`, color: selected.allTimeRoi >= 0 ? '#00e676' : '#ff4d4d' },
                    { label: 'Account Value', value: fmtUsd(selected.accountValue),         color: '#e2e8f0' },
                    { label: '30D PnL',       value: fmtUsd(selected.monthPnl),             color: selected.monthPnl >= 0 ? '#00e676' : '#ff4d4d' },
                    { label: '7D PnL',        value: fmtUsd(selected.weekPnl),              color: selected.weekPnl >= 0 ? '#00e676' : '#ff4d4d' },
                    { label: 'Volume',        value: fmtUsd(selected.volume),               color: '#8899ff' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: 'rgba(136,153,255,0.05)',
                      border: '1px solid rgba(180,255,243,0.08)',
                      borderRadius: 10, padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Positions sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Long exposure */}
            <div className="glass" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <TrendingUp size={15} color="#00e676" />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00e676' }}>
                  Smart Money Longs
                </span>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 11.5, color: 'rgba(226,232,240,0.35)', lineHeight: 1.5 }}>
                Aggregated long positions from the top 15 traders (USD exposure)
              </p>
              {posLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ height: 28, borderRadius: 6, background: 'rgba(0,230,118,0.05)', animation: 'pulse-glow 1.8s ease-in-out infinite', animationDelay: `${i*0.12}s` }} />
                  ))}
                  <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.25)', textAlign: 'center', marginTop: 4 }}>
                    Fetching on-chain positions... ~10-20s
                  </div>
                </div>
              ) : !positions?.longs?.length ? (
                <div style={{ color: 'rgba(226,232,240,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                  No data available
                </div>
              ) : (
                positions.longs.map(p => (
                  <ExposureBar key={p.coin} coin={p.coin} usd={p.usd} maxUsd={maxLong} side="long" />
                ))
              )}
            </div>

            {/* Short exposure */}
            <div className="glass" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <TrendingDown size={15} color="#ff4d4d" />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff4d4d' }}>
                  Smart Money Shorts
                </span>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 11.5, color: 'rgba(226,232,240,0.35)', lineHeight: 1.5 }}>
                Aggregated short positions from the top 15 traders (USD exposure)
              </p>
              {posLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ height: 28, borderRadius: 6, background: 'rgba(255,77,77,0.05)', animation: 'pulse-glow 1.8s ease-in-out infinite', animationDelay: `${i*0.12}s` }} />
                  ))}
                  <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.25)', textAlign: 'center', marginTop: 4 }}>
                    Fetching on-chain positions... ~10-20s
                  </div>
                </div>
              ) : !positions?.shorts?.length ? (
                <div style={{ color: 'rgba(226,232,240,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                  No data available
                </div>
              ) : (
                positions.shorts.map(p => (
                  <ExposureBar key={p.coin} coin={p.coin} usd={p.usd} maxUsd={maxShort} side="short" />
                ))
              )}
            </div>

            {/* Info card */}
            <div className="glass" style={{ padding: 18 }}>
              <div className="section-label" style={{ marginBottom: 8 }}>How to use</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#00e676', fontSize: 14, flexShrink: 0 }}>↑</span>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(226,232,240,0.5)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'rgba(226,232,240,0.75)' }}>Longs:</strong>
                    Coins the smart money is longing. Consider trend following or spot buys.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#ff4d4d', fontSize: 14, flexShrink: 0 }}>↓</span>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(226,232,240,0.5)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'rgba(226,232,240,0.75)' }}>Shorts:</strong>
                    Coins the smart money is shorting. Safer to pair with funding rate carry trades.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
