const HL = 'https://api.hyperliquid.xyz/info'

/**
 * Standard HTTP POST requester to interact with the Hyperliquid L1/L3 RPC interface.
 * Implements a strict response check and parses JSON output.
 * 
 * @param {Object} body - RPC payload specifying transaction type and arguments.
 * @returns {Promise<any>} Raw JSON response returned by the RPC endpoint.
 * @throws {Error} If HTTP response status is non-200.
 * @private
 */
async function post(body) {
  const res = await fetch(HL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Hyperliquid API error: ${res.status}`)
  return res.json()
}

/**
 * Fetches global asset metadata and context blocks, mapping hourly funding rates
 * into standard 8-hour Epoch values and computing annualized APR yield targets.
 * 
 * @returns {Promise<Array<Object>>} List of normalized coin structures containing rate metrics.
 */
export async function getFundingRates() {
  const [meta, ctxs] = await post({ type: 'metaAndAssetCtxs' })
  const coins = meta.universe

  return coins
    .map((coin, i) => {
      const ctx        = ctxs[i] || {}
      // API returns hourly funding rate; multiply ×8 to get the standard 8h period rate
      const rate8h     = parseFloat(ctx.funding || 0) * 8
      const mark       = parseFloat(ctx.markPx  || 0)
      const oi         = parseFloat(ctx.openInterest || 0)
      const annualized = rate8h * 3 * 365 * 100  // % APR (3 periods/day × 365 days)

      return {
        coin:        coin.name,
        rate8h,
        annualized,
        mark,
        oi:          oi * mark,               // USD notional
        prevRate:    parseFloat(ctx.prevDayPx || mark),
        change24h:   mark && ctx.prevDayPx
          ? ((mark - parseFloat(ctx.prevDayPx)) / parseFloat(ctx.prevDayPx)) * 100
          : 0,
      }
    })
    .filter(d => d.mark > 0)
    .sort((a, b) => Math.abs(b.rate8h) - Math.abs(a.rate8h))
}

/**
 * Retrieves the top funding opportunities on the exchange.
 * 
 * @param {number} [n=15] - Maximum number of opportunities to return.
 * @returns {Promise<Array<Object>>} Array of premium carry-trade candidates.
 */
export async function getTopFundingOpportunities(n = 15) {
  const rates = await getFundingRates()
  return rates.slice(0, n)
}

/**
 * Fetches the global Hyperliquid leaderboard state and sorts traders by performance window.
 * 
 * @param {'allTime'|'month'|'week'|'accountValue'} [sortBy='allTime'] - Performance sorting window.
 * @returns {Promise<Array<Object>>} Normalized leaderboard array.
 */
export async function getLeaderboard(sortBy = 'allTime') {
  const res  = await fetch('https://stats-data.hyperliquid.xyz/Mainnet/leaderboard')
  if (!res.ok) throw new Error(`Leaderboard API error: ${res.status}`)
  const data = await res.json()
  const rows = data?.leaderboardRows || []

  const traders = rows.map(r => {
    const perf = Object.fromEntries(r.windowPerformances || [])
    return {
      address:      r.ethAddress,
      displayName:  r.displayName || null,
      accountValue: parseFloat(r.accountValue || 0),
      allTimePnl:   parseFloat(perf?.allTime?.pnl  || 0),
      allTimeRoi:   parseFloat(perf?.allTime?.roi  || 0),
      monthPnl:     parseFloat(perf?.month?.pnl    || 0),
      monthRoi:     parseFloat(perf?.month?.roi    || 0),
      weekPnl:      parseFloat(perf?.week?.pnl     || 0),
      weekRoi:      parseFloat(perf?.week?.roi     || 0),
      volume:       parseFloat(perf?.allTime?.vlm  || 0),
    }
  })

  const sortField = {
    allTime:      'allTimePnl',
    month:        'monthPnl',
    week:         'weekPnl',
    accountValue: 'accountValue',
  }[sortBy] || 'allTimePnl'

  return traders.sort((a, b) => b[sortField] - a[sortField])
}


/* ─── Aggregated top-trader positions ───────────────────────────────────── */

export async function getTopPositions() {
  /* Fetch leaderboard from the correct endpoint */
  const res  = await fetch('https://stats-data.hyperliquid.xyz/Mainnet/leaderboard')
  if (!res.ok) throw new Error(`Leaderboard error: ${res.status}`)
  const data = await res.json()
  const rows = (data?.leaderboardRows || []).slice(0, 15)   // top 15 for speed

  const longMap  = {}
  const shortMap = {}

  await Promise.allSettled(
    rows.map(async r => {
      try {
        const pos = await getTraderPosition(r.ethAddress)
        for (const p of (pos.perp || [])) {
          const size = parseFloat(p?.szi ?? 0)
          const coin = p?.coin
          if (!coin || size === 0) continue
          const notional = Math.abs(size) * parseFloat(p?.entryPx ?? p?.markPx ?? 1)
          if (size > 0) longMap[coin]  = (longMap[coin]  || 0) + notional
          if (size < 0) shortMap[coin] = (shortMap[coin] || 0) + notional
        }
      } catch { /* ignore individual failures */ }
    })
  )

  const toList = (map) => Object.entries(map)
    .map(([coin, usd]) => ({ coin, usd }))
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 10)

  return { longs: toList(longMap), shorts: toList(shortMap) }
}

/* ─── Individual trader ──────────────────────────────────────────────────── */

export async function getTraderPosition(address) {
  const data = await post({ type: 'clearinghouseState', user: address })
  return {
    netEquity: parseFloat(data?.marginSummary?.accountValue || 0),
    perp: (data?.assetPositions || [])
      .map(p => p?.position)
      .filter(Boolean),
  }
}

export async function getTraderHistory(address) {
  const data = await post({ type: 'userFills', user: address })
  return (data || []).map(f => ({
    coin:       f.coin,
    px:         parseFloat(f.px  || 0),
    sz:         parseFloat(f.sz  || 0),
    side:       f.side,
    dir:        f.dir,
    closedPnl:  parseFloat(f.closedPnl || 0),
    time:       f.time,
  }))
}

export async function getTraderPerformance(address) {
  /* Build cumulative PnL from fill history */
  const fills = await getTraderHistory(address)
  const sorted = [...fills].sort((a, b) => a.time - b.time)
  let cum = 0
  return sorted
    .filter(f => f.closedPnl !== 0)
    .map(f => {
      cum += f.closedPnl
      return { time: Math.floor(f.time / 1000), pnl: cum }
    })
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

export function fmtRate(r) {
  const pct = (r * 100).toFixed(4)
  return `${r >= 0 ? '+' : ''}${pct}%`
}

export function fmtApr(apr) {
  return `${apr >= 0 ? '+' : ''}${apr.toFixed(1)}%`
}

export function fmtUsd(n) {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export function shortAddr(addr) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
