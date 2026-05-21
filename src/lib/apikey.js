/* ─── Apollo.Trade API Key Management ───────────────────────────────────── */

const USER_KEY_STORAGE  = 'apollo_user_api_key'
const DAILY_USAGE_KEY   = 'apollo_daily_usage'
const FREE_LIMIT        = 10
const DEFAULT_KEY       = import.meta.env.VITE_DEFAULT_API_KEY || ''

/* ─── Daily usage counter ────────────────────────────────────────────────── */

function todayStr() {
  return new Date().toDateString()
}

export function getDailyUsage() {
  try {
    const raw  = localStorage.getItem(DAILY_USAGE_KEY)
    const data = raw ? JSON.parse(raw) : null
    if (!data || data.date !== todayStr()) return { date: todayStr(), count: 0 }
    return data
  } catch { return { date: todayStr(), count: 0 } }
}

export function incrementUsage() {
  const usage = getDailyUsage()
  usage.count++
  localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(usage))
  return usage.count
}

export function getRemainingFree() {
  const usage = getDailyUsage()
  return Math.max(0, FREE_LIMIT - usage.count)
}

export function hasFreeUsage() {
  return getRemainingFree() > 0
}

/* ─── User's own key ─────────────────────────────────────────────────────── */

export function getUserKey() {
  return localStorage.getItem(USER_KEY_STORAGE) || ''
}

export function setUserKey(key) {
  const trimmed = key.trim()
  if (trimmed) localStorage.setItem(USER_KEY_STORAGE, trimmed)
  else         localStorage.removeItem(USER_KEY_STORAGE)
}

export function clearUserKey() {
  localStorage.removeItem(USER_KEY_STORAGE)
}

/* ─── Get the key to use for this request ───────────────────────────────── */

export function getActiveKey() {
  const userKey = getUserKey()
  if (userKey) return { key: userKey, source: 'user' }
  if (hasFreeUsage() && DEFAULT_KEY) return { key: DEFAULT_KEY, source: 'default' }
  return { key: '', source: 'none' }
}

export function canChat() {
  // Allow chat if user has their own key, OR if free uses remain (even without default key,
  // so the input stays enabled on deployments where VITE_DEFAULT_API_KEY isn't set yet)
  return !!getUserKey() || hasFreeUsage()
}

export function hasDefaultKey() {
  return !!DEFAULT_KEY
}

export { FREE_LIMIT }
