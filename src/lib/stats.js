/* ─── Apollo.Trade Dynamic Stats Tracker ───────────────────────────────── */

const TX_VOL_KEY = 'apollo_stat_tx_volume_v2'
const MSG_COUNT_KEY = 'apollo_stat_msg_count_v2'
const USER_COUNT_KEY = 'apollo_stat_user_count_v2'

// Initial baseline stats
const BASE_TX_VOL = 1291550 // $1,291,550
const BASE_MSG_COUNT = 1500
const BASE_USER_COUNT = 101

export function getTxVolume() {
  const stored = localStorage.getItem(TX_VOL_KEY)
  if (stored === null) {
    localStorage.setItem(TX_VOL_KEY, BASE_TX_VOL.toString())
    return BASE_TX_VOL
  }
  return parseInt(stored, 10)
}

export function addTxVolume(amount) {
  const current = getTxVolume()
  const updated = current + amount
  localStorage.setItem(TX_VOL_KEY, updated.toString())
  return updated
}

export function getMsgCount() {
  const stored = localStorage.getItem(MSG_COUNT_KEY)
  if (stored === null) {
    localStorage.setItem(MSG_COUNT_KEY, BASE_MSG_COUNT.toString())
    return BASE_MSG_COUNT
  }
  return parseInt(stored, 10)
}

export function incrementMsgCount() {
  const current = getMsgCount()
  const updated = current + 1
  localStorage.setItem(MSG_COUNT_KEY, updated.toString())
  return updated
}

export function getUserCount() {
  const stored = localStorage.getItem(USER_COUNT_KEY)
  if (stored === null) {
    localStorage.setItem(USER_COUNT_KEY, BASE_USER_COUNT.toString())
    return BASE_USER_COUNT
  }
  return parseInt(stored, 10)
}

export function incrementUserCount() {
  const current = getUserCount()
  const updated = current + 1
  localStorage.setItem(USER_COUNT_KEY, updated.toString())
  return updated
}

// Automatically increment Active User count on every website visit (page load)
try {
  incrementUserCount()
} catch (e) {
  console.warn('Failed to increment visitor count:', e)
}

