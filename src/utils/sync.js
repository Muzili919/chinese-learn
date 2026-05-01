/**
 * 云端同步模块 — 阿里云自托管版本
 * 前端 → Vercel /api/proxy（HTTPS）→ 阿里云 Express → PostgreSQL
 */

import { storage } from './storage'

// Vercel 函数在 /api/proxy/[...path] 转发到阿里云；阿里云 nginx 把 /api/proxy/ 也代理到 Express
// 这样无论在 Vercel 还是阿里云直接访问，路径都一致
const API_BASE = import.meta.env.VITE_API_BASE || `${window.location.origin}/api/proxy`

export const supabase = null

export function isSyncEnabled() { return true }

async function apiFetch(method, path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    // ★ 无论成功失败都尝试读body（服务端错误也可能包含有用信息）
    try {
      const data = await res.json()
      return res.ok ? data : { __status: res.status, ...data }
    } catch {
      return res.ok ? {} : null
    }
  } catch (e) {
    console.warn('[sync] API error:', e?.message)
    return null  // 真正的网络故障
  }
}

// ── 邀请码 ──
export async function validateInviteCode(code, userId) {
  const result = await apiFetch('POST', '/invite/validate', { code, userId })
  // null = 真正的网络故障（服务器不可达），不放行
  if (result === null) return { valid: false, reason: '无法连接服务器，请检查网络后重试' }
  // 服务端明确返回 valid 字段
  if (result.valid === true) return { valid: true }
  if (result.valid === false) return { valid: false, reason: result.reason || '邀请码无效' }
  // 服务端返回 error 字段（旧格式兼容）
  if (result.error) return { valid: false, reason: result.error }
  // 未知格式，拒绝
  return { valid: false, reason: '邀请码验证失败，请重试' }
}

// ── 用户 ──
export async function syncUserToCloud(user) {
  await apiFetch('POST', '/user/create', { id: user.id, name: user.name, created_at: user.createdAt })
}

export async function findUserByName(name) {
  return await apiFetch('GET', `/user/find?name=${encodeURIComponent(name)}`)
}

export async function searchUsers(query) {
  const result = await apiFetch('GET', `/user/find?name=${encodeURIComponent(query)}`)
  return result ? [result] : []
}

// ── 统计 ──
export async function pushUserStats(userId) {
  const xp = storage.getXP(userId)
  const streak = storage.getStreak(userId)
  const completed_planets = storage.getCompletedPlanets(userId)
  await apiFetch('POST', '/user/update-stats', { id: userId, xp, streak_count: streak.count, streak_date: streak.lastDate, completed_planets })
}

export async function pushCompletedPlanetsToCloud(userId) {
  const completedMap = storage.getCompletedPlanets(userId)
  if (!Object.keys(completedMap).length) return
  await apiFetch('POST', '/user/update-stats', { id: userId, completed_planets: completedMap })
}

// ── 答题记录 ──
export async function pushRecordsToCloud(userId) {
  const records = storage.getRecords(userId)
  if (!records.length) return
  const result = await apiFetch('POST', '/records/bulk-upsert', { records, userId })
  if (result?.ok) console.log(`✅ 答题记录已同步 ${result.count} 条`)
}

// ── SRS ──
export async function pushSrsToCloud(userId) {
  const srsState = storage.getSrsState(userId)
  if (!Object.keys(srsState).length) return
  await apiFetch('POST', '/srs/sync', { states: srsState, userId })
}

// ── 学习会话 ──
export async function pushSessionsToCloud(userId) {
  const sessions = storage.getSessions(userId)
  if (!sessions.length) return
  await apiFetch('POST', '/sessions/sync', { sessions, userId })
}

// ── 作文 ──
export async function pushEssaysToCloud(userId) {
  const essays = storage.getEssays(userId)
  if (!essays.length) return
  await apiFetch('POST', '/essays/upsert', { essays, userId })
}

// ── 题目标记（孩子觉得题目有问题）──
export async function pushFlaggedToCloud(userId) {
  const flagged = storage.getFlaggedQuestions(userId)
  if (!Object.keys(flagged).length) return
  await apiFetch('POST', '/user/update-stats', { id: userId, flagged_questions: flagged })
}

// ── 全量拉取 ──
export async function pullFromCloud(userId) {
  let pulledAny = false

  // 答题记录
  try {
    const cloudRecords = await apiFetch('GET', `/records/${userId}`)
    if (cloudRecords?.length) {
      const localRecords = storage.getRecords(userId)
      // 以云端为基准：云端有的用云端，本地独有的保留（可能是还没上传的）
      const cloudKeys = new Set(cloudRecords.map(r => `${r.card_id}|${r.timestamp}`))
      const localOnly = localRecords.filter(r => !cloudKeys.has(`${r.card_id}|${r.timestamp}`))
      const merged = [...cloudRecords, ...localOnly]
      localStorage.setItem(`cl_records_${userId}`, JSON.stringify(merged))
      pulledAny = true
    }
  } catch (_) {}

  // SRS
  try {
    const srsObj = await apiFetch('GET', `/srs/${userId}`)
    if (srsObj && Object.keys(srsObj).length) {
      const localSRS = storage.getSrsState(userId)
      for (const [cardId, state] of Object.entries(srsObj)) {
        if (!localSRS[cardId]) localSRS[cardId] = state
      }
      localStorage.setItem(`cl_srs_${userId}`, JSON.stringify(localSRS))
      pulledAny = true
    }
  } catch (_) {}

  // 学习会话
  try {
    const cloudSessions = await apiFetch('GET', `/sessions/${userId}`)
    if (cloudSessions?.length) {
      const localSessions = storage.getSessions(userId)
      const sessionMap = new Map()
      for (const s of localSessions) sessionMap.set(s.date, s)
      for (const s of cloudSessions) {
        if (!sessionMap.has(s.date)) sessionMap.set(s.date, s)
      }
      localStorage.setItem(`cl_sessions_${userId}`, JSON.stringify([...sessionMap.values()]))
      pulledAny = true
    }
  } catch (_) {}

  // 用户统计
  try {
    const stats = await apiFetch('GET', `/user/stats/${userId}`)
    if (stats?.xp != null) {
      const localXP = parseInt(localStorage.getItem(`cl_xp_${userId}`) || '0')
      localStorage.setItem(`cl_xp_${userId}`, String(Math.max(localXP, stats.xp)))
      if (stats.streak_count != null) {
        const localStreak = JSON.parse(localStorage.getItem(`cl_streak_${userId}`) || '{}')
        // 只在云端数据更新时覆盖本地（比较日期，避免刚做完题被旧数据覆盖）
        const cloudDate = stats.streak_date || ''
        const localDate = localStreak.lastDate || ''
        if (cloudDate > localDate || (cloudDate === localDate && (stats.streak_count || 0) > (localStreak.count || 0))) {
          localStorage.setItem(`cl_streak_${userId}`, JSON.stringify({ count: stats.streak_count, lastDate: cloudDate }))
        }
      }
      if (stats.completed_planets) {
        const localCompleted = storage.getCompletedPlanets(userId)
        let merged = false
        for (const [date, tags] of Object.entries(stats.completed_planets)) {
          if (!localCompleted[date]) { localCompleted[date] = [...tags]; merged = true }
          else for (const tag of tags) {
            if (!localCompleted[date].includes(tag)) { localCompleted[date].push(tag); merged = true }
          }
        }
        if (merged) localStorage.setItem(`cl_completed_${userId}`, JSON.stringify(localCompleted))
      }
      pulledAny = true
    }
  } catch (_) {}

  // 作文
  try {
    const essays = await apiFetch('GET', `/essays/${userId}`)
    if (essays?.length) {
      const localEssays = storage.getEssays(userId)
      const essayMap = new Map()
      for (const e of localEssays) essayMap.set(e.id, e)
      for (const e of essays) { if (!essayMap.has(e.id)) essayMap.set(e.id, e) }
      localStorage.setItem(`cl_essays_${userId}`, JSON.stringify([...essayMap.values()].slice(0, 30)))
      pulledAny = true
    }
  } catch (_) {}

  // 题目标记
  try {
    const stats = await apiFetch('GET', `/user/stats/${userId}`)
    if (stats?.flagged_questions && Object.keys(stats.flagged_questions).length) {
      const localFlagged = storage.getFlaggedQuestions(userId)
      let merged = false
      for (const [cardId, info] of Object.entries(stats.flagged_questions)) {
        if (!localFlagged[cardId]) { localFlagged[cardId] = info; merged = true }
      }
      if (merged) localStorage.setItem(`cl_flagged_${userId}`, JSON.stringify(localFlagged))
      pulledAny = true
    }
  } catch (_) {}

  return pulledAny
}

// ── 全量推送 ──
export async function syncAfterSession(userId) {
  try {
    await Promise.all([
      pushRecordsToCloud(userId),
      pushSrsToCloud(userId),
      pushSessionsToCloud(userId),
      pushEssaysToCloud(userId),
      pushCompletedPlanetsToCloud(userId),
      pushUserStats(userId),
      pushFlaggedToCloud(userId),
    ])
    clearPendingSync(userId)
  } catch (e) {
    console.warn('[sync] syncAfterSession error:', e?.message)
    markPendingSync(userId)
  }
}

// ── 兜底同步：失败时标记，定时重试 ──
const SYNC_INTERVAL = 5 * 60 * 1000  // 5 分钟
const PENDING_KEY = 'cl_pending_sync'

function markPendingSync(userId) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}')
    pending[userId] = Date.now()
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch (_) {}
}

function clearPendingSync(userId) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}')
    delete pending[userId]
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch (_) {}
}

function getPendingUsers() {
  try {
    return Object.keys(JSON.parse(localStorage.getItem(PENDING_KEY) || '{}'))
  } catch (_) { return [] }
}

let _timer = null

export function startBackgroundSync(getCurrentUserId) {
  if (_timer) return
  // 立即检查一次是否有待同步数据
  for (const uid of getPendingUsers()) {
    syncAfterSession(uid).catch(() => {})
  }
  // 定时检查
  _timer = setInterval(() => {
    const uid = getCurrentUserId?.()
    if (uid) syncAfterSession(uid).catch(() => {})
    for (const pendingUid of getPendingUsers()) {
      if (pendingUid !== uid) syncAfterSession(pendingUid).catch(() => {})
    }
  }, SYNC_INTERVAL)

  // 页面退出时同步
  window.addEventListener('beforeunload', () => {
    const uid = getCurrentUserId?.()
    if (uid) {
      // beforeunload 里不能用 async，用 sendBeacon 思路：直接同步推
      const records = storage.getRecords(uid)
      if (records.length) {
        navigator.sendBeacon?.(
          `${API_BASE}/records/bulk-upsert`,
          JSON.stringify({ records, userId: uid })
        )
      }
    }
  })
}
