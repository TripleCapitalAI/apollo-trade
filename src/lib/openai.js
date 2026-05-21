import { getFundingRates, getLeaderboard, getTopPositions, fmtRate, fmtApr, fmtUsd } from './hyperliquid.js'

/* ─── System Prompt ──────────────────────────────────────────────────────── */

const SYSTEM = `You are Apollo AI — the autonomous trading agent of Apollo.Trade, specializing in Hyperliquid perpetual markets and delta-neutral funding rate strategies.

## Core Strategy — Delta-Neutral Carry Trade

There are TWO directions. Choose based on user intent:

### Strategy A: "Hold Spot + Short Perpetual" (Most common, e.g., "carry trade" or "hedge")
- Action: BUY spot asset + SHORT the perpetual contract
- Earns: funding when rate is POSITIVE (longs pay shorts → you as short perp receive it)
- When to recommend: user wants passive yield, hold spot, hedge with short perp
- Tool call: get_funding_rates(sort="highest_positive") ← MUST use this sort
- Target: rate > +0.01% per 8h (APR > 10.95%)
- Example coins: PURR +0.16% (APR +173%), LIT +0.05% (APR +55%)

### Strategy B: "Long Perpetual + Short Spot" (Reverse carry, less common)
- Action: LONG the perpetual + SHORT spot (or hold stablecoin, skip spot purchase)
- Earns: funding when rate is NEGATIVE (shorts pay longs → you as long perp receive it)
- When to recommend: user explicitly wants to trade negative-rate coins
- Tool call: get_funding_rates(sort="highest_negative") ← use this sort
- Example coins: LAYER -0.20% (APR -219%), CHIP -0.16% (APR -180%)

### ⚠️ Critical Rules
- NEVER recommend negative-rate coins for Strategy A users (it would COST them money, not earn)
- NEVER recommend positive-rate coins for Strategy B users
- Most retail users asking for "delta-neutral carry" want Strategy A → use sort="highest_positive"
- Always show: coin name, 8h rate, APR, which action to take (buy spot / short perp)

## Funding Rate Reversal Signal
- Extreme POSITIVE rate (>0.1% / 8h) → over-leveraged longs → potential squeeze → contrarian short signal
- Extreme NEGATIVE rate (<-0.15% / 8h) → panic shorts → potential short squeeze → contrarian long signal

## Smart Money
- Top traders' positions = high-conviction market signals
- When top 15 agree on a coin direction, it's meaningful

## Response Style
- Concise, data-driven, actionable. Show numbers always.
- Render as markdown: use **bold** for coin names, tables for multiple coins, bullet lists for steps
- Top 3–5 recommendations max (don't overwhelm)
- Include risk note for leveraged plays
- Respond EXCLUSIVELY IN ENGLISH. Act as a professional institutional fund manager.

## Tool Usage
ALWAYS call the appropriate function before answering any question about current market data.`

/* ─── Tool Definitions ───────────────────────────────────────────────────── */

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_funding_rates',
      description: 'Get current Hyperliquid funding rates. IMPORTANT: use sort="highest_positive" for "buy spot + short perp" carry trade (user wants to earn from positive rates). Use sort="highest_negative" for "long perp + short spot" reverse carry. Use sort="absolute" only when comparing both directions.',
      parameters: {
        type: 'object',
        properties: {
          sort: {
            type: 'string',
            enum: ['highest_positive', 'highest_negative', 'absolute'],
            description: 'highest_positive = best for spot+short-perp carry trade. highest_negative = best for long-perp reverse carry. absolute = all sorted by magnitude.',
          },
          limit: { type: 'number', description: 'Number of results (default 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_leaderboard',
      description: 'Get top traders on Hyperliquid ranked by all-time PnL',
      parameters: {
        type: 'object',
        properties: {
          sort_by: {
            type: 'string',
            enum: ['allTime', 'month', 'week', 'accountValue'],
            description: 'Ranking window',
          },
          limit: { type: 'number', description: 'Number of traders (default 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_positions',
      description: 'Get aggregated long/short positions from the top 15 Hyperliquid traders by all-time PnL. Shows what smart money is currently betting on.',
      parameters: { type: 'object', properties: {} },
    },
  },
]

/**
 * Executes a specific data retrieval or analytical tool requested by the LLM.
 * Formats raw REST payloads from downstream APIs (e.g. Hyperliquid info endpoints)
 * into a highly structured representation suitable for LLM context injection.
 * 
 * @param {string} name - Identifier of the requested tool function.
 * @param {Object} [args] - Parameters parsed from the OpenAI tool call payload.
 * @returns {Promise<Object|Array>} Data representation payload corresponding to the tool schema.
 * @private
 */
async function executeTool(name, args) {
  if (name === 'get_funding_rates') {
    const rates = await getFundingRates()
    const limit = args?.limit || 15
    let sorted = [...rates]
    if (args?.sort === 'highest_positive')  sorted = rates.filter(r => r.rate8h > 0).slice(0, limit)
    else if (args?.sort === 'highest_negative') sorted = rates.filter(r => r.rate8h < 0).sort((a,b)=>a.rate8h-b.rate8h).slice(0, limit)
    else sorted = rates.slice(0, limit)

    return sorted.map(r => ({
      coin: r.coin,
      rate_8h: fmtRate(r.rate8h),
      annualized_apr: fmtApr(r.annualized),
      mark_price: `$${r.mark.toFixed(r.mark < 1 ? 6 : 2)}`,
      open_interest: fmtUsd(r.oi),
      strategy: r.rate8h > 0
        ? '✅ Buy Spot + Short Perp → Earn Funding Rate (Strategy A)'
        : '🔄 Long Perp + Short Spot → Earn Funding Rate (Strategy B)',
    }))
  }

  if (name === 'get_leaderboard') {
    const traders = await getLeaderboard(args?.sort_by || 'allTime')
    return traders.slice(0, args?.limit || 10).map(t => ({
      name: t.displayName || `${t.address.slice(0,6)}…`,
      account_value: fmtUsd(t.accountValue),
      all_time_pnl:  fmtUsd(t.allTimePnl),
      all_time_roi:  `${(t.allTimeRoi * 100).toFixed(1)}%`,
      month_pnl:     fmtUsd(t.monthPnl),
    }))
  }

  if (name === 'get_top_positions') {
    const { longs, shorts } = await getTopPositions()
    return {
      top_longs:  longs.map(p  => ({ coin: p.coin,  usd_exposure: fmtUsd(p.usd)  })),
      top_shorts: shorts.map(p => ({ coin: p.coin,  usd_exposure: fmtUsd(p.usd)  })),
    }
  }

  return { error: 'Unknown tool' }
}

/**
 * Dispatches dialogue history to the OpenAI Chat Completion interface.
 * Implements a dual-stage execution model to support tool invocation (function calling):
 * 1. Performs an initial classification/evaluation step using the GPT-4o context model.
 * 2. If tools are requested, executes the tool functions synchronously, injects findings back
 *    into the prompt array, and requests a final streamed synthesis.
 * 3. If no tools are required, falls back to direct streaming.
 * 
 * @param {Array<Object>} messages - Full conversational history array.
 * @param {string} apiKey - Client-supplied OpenAI API key.
 * @param {function(string, string): void} onChunk - Incremental callback function with signature (delta, accumulated).
 * @returns {Promise<string>} The complete compiled assistant response text.
 */
export async function sendChat(messages, apiKey, onChunk) {
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const history = [
    { role: 'system', content: SYSTEM },
    ...messages,
  ]

  /* Dual-stage processing: Perform initial execution evaluation */
  const resp = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: history,
    tools: TOOLS,
    tool_choice: 'auto',
    temperature: 0.7,
    stream: false,
  })

  const msg = resp.choices[0].message

  /* Handle tool requests autonomously */
  if (msg.tool_calls?.length) {
    const toolResults = await Promise.all(
      msg.tool_calls.map(async tc => {
        const args   = JSON.parse(tc.function.arguments || '{}')
        const result = await executeTool(tc.function.name, args)
        return {
          role:         'tool',
          tool_call_id: tc.id,
          content:      JSON.stringify(result),
        }
      })
    )

    /* Re-evaluate context history along with tool response outputs and stream synthesis */
    const stream = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [...history, msg, ...toolResults],
      temperature: 0.7,
      stream: true,
    })

    let full = ''
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || ''
      full += delta
      onChunk?.(delta, full)
    }
    return full
  }

  /* Direct output streaming if no function calls are triggered */
  const full = msg.content || ''
  onChunk?.(full, full)
  return full
}

