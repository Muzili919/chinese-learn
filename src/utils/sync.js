/**
 * Supabase cloud sync module.
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable.
 * Falls back gracefully to local-only if not configured.
 */
import { createClient } from '@supabase/supabase-js'
import { storage } from './storage'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null

export function isSyncEnabled() {
  return supabase !== null
}

/**
 * Upsert user profile to cloud.
 * Called once after onboarding or on first sync.
 */
export async function syncUserToCloud(user) {
  if (!supabase) return
  await supabase.from('users').upsert({
    id: user.id,
    name: user.name,
    created_at: user.createdAt,
  }, { onConflict: 'id' })
}

/**
 * Push all local records to cloud.
 */
export async function pushRecordsToCloud(userId) {
  if (!supabase) return
  const records = storage.getRecords(userId)
  if (!records.length) return

  const rows = records.map((r) => ({ ...r, user_id: userId }))
  for (let i = 0; i < rows.length; i += 100) {
    await supabase.from('answer_records').upsert(
      rows.slice(i, i + 100),
      { onConflict: 'user_id,card_id,timestamp' }
    )
  }
}

/**
 * Push SRS states to cloud.
 */
export async function pushSrsToCloud(userId) {
  if (!supabase) return
  const srsState = storage.getSrsState(userId)
  const rows = Object.entries(srsState).map(([cardId, state]) => ({
    user_id: userId,
    card_id: cardId,
    ...state,
  }))
  if (!rows.length) return
  for (let i = 0; i < rows.length; i += 100) {
    await supabase.from('srs_states').upsert(
      rows.slice(i, i + 100),
      { onConflict: 'user_id,card_id' }
    )
  }
}

/**
 * Push XP and streak to users table.
 */
export async function pushUserStats(userId) {
  if (!supabase) return
  const xp = storage.getXP(userId)
  const streak = storage.getStreak(userId)
  await supabase.from('users').upsert({
    id: userId,
    xp,
    streak_count: streak.count,
    streak_date: streak.lastDate,
  }, { onConflict: 'id' })
}

/**
 * Push essay history to cloud.
 */
export async function pushEssaysToCloud(userId) {
  if (!supabase) return
  const essays = storage.getEssays(userId)
  if (!essays.length) return
  const rows = essays.map(e => ({
    id: e.id,
    user_id: userId,
    prompt: e.prompt,
    category: e.category,
    content: e.content,
    score: e.score,
    feedback: e.feedback,
    created_at: e.createdAt,
  }))
  for (let i = 0; i < rows.length; i += 30) {
    await supabase.from('essays').upsert(
      rows.slice(i, i + 30),
      { onConflict: 'id' }
    )
  }
}

/**
 * Push completed planets (check-in data) to cloud.
 * Structure stored in users table JSON column for simplicity.
 */
export async function pushCompletedPlanetsToCloud(userId) {
  if (!supabase) return
  const completedMap = storage.getCompletedPlanets(userId)
  // Only push non-empty data
  const keys = Object.keys(completedMap)
  if (keys.length === 0) return
  await supabase.from('users').upsert({
    id: userId,
    completed_planets: completedMap,
  }, { onConflict: 'id' })
}

/**
 * Pull data from cloud and restore into localStorage.
 * Used when user logs in on a new device.
 */
export async function pullFromCloud(userId) {
  if (!supabase) return false

  // Fetch answer records — ★ 合并策略：本地和云端取并集（以 card_id+timestamp 去重）
  // 防止云端旧数据覆盖本地新记录（尤其是 subject 字段等新增字段）
  const { data: cloudRecords } = await supabase
    .from('answer_records')
    .select('*')
    .eq('user_id', userId)
  if (cloudRecords?.length) {
    // 清除云端元数据字段，只保留业务字段
    const cleaned = cloudRecords.map(({ user_id, ...r }) => r)
    const localRecords = storage.getRecords(userId)

    // 以 card_id + timestamp 为键去重合并
    // ★ 同一 key 冲突时，优先保留有 subject 字段的记录（数据更完整）
    const mergedMap = new Map()

    // 先加本地记录
    for (const r of localRecords) {
      const key = `${r.card_id}|${r.timestamp}`
      mergedMap.set(key, r)
    }
    // 再加云端记录（只在本地没有时补充；如果都有则跳过，因为本地更新）
    for (const r of cleaned) {
      const key = `${r.card_id}|${r.timestamp}`
      const existing = mergedMap.get(key)
      if (!existing) {
        mergedMap.set(key, r)
      } else if (!existing.subject && r.subject) {
        // 本地这条没有subject但云端有 → 用云端的（更完整）
        mergedMap.set(key, r)
      }
      // 否则保留本地的（本地数据优先级更高）
    }
    localStorage.setItem('cl_records_' + userId, JSON.stringify([...mergedMap.values()]))
  }

  // Fetch SRS states — ★ 合并策略：本地和云端取并集（本地优先保留最新状态）
  const { data: srsRows } = await supabase
    .from('srs_states')
    .select('*')
    .eq('user_id', userId)
  if (srsRows?.length) {
    const localSRS = storage.getSrsState(userId)
    // 本地优先
    for (const r of srsRows) {
      const { user_id, card_id, ...state } = r
      if (!localSRS[card_id]) {
        localSRS[card_id] = state
      }
    }
    localStorage.setItem('cl_srs_' + userId, JSON.stringify(localSRS))
  }

  // Fetch sessions — ★ 合并策略：本地和云端取并集（以 date 去重）
  const { data: cloudSessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
  if (cloudSessions?.length) {
    const cleaned = cloudSessions.map(({ user_id, ...r }) => r)
    const localSessions = storage.getSessions(userId)
    const sessionMap = new Map()
    // 本地优先（保留最新）
    for (const s of localSessions) sessionMap.set(s.date, s)
    for (const s of cleaned) {
      if (!sessionMap.has(s.date)) sessionMap.set(s.date, s)
    }
    localStorage.setItem('cl_sessions_' + userId, JSON.stringify([...sessionMap.values()]))
  }

  // Fetch XP and streak from users table
  const { data: userData } = await supabase
    .from('users')
    .select('xp, streak_count, streak_date, completed_planets')
    .eq('id', userId)
    .single()
  if (userData) {
    if (userData.xp != null) {
      // ★ 取本地和云端的最大值，防止同设备切换账号时用旧云端数据覆盖更新的本地 XP
      const localXP = parseInt(localStorage.getItem('cl_xp_' + userId) || '0')
      const mergedXP = Math.max(localXP, userData.xp)
      localStorage.setItem('cl_xp_' + userId, String(mergedXP))
    }
    if (userData.streak_count != null) {
      localStorage.setItem('cl_streak_' + userId, JSON.stringify({
        count: userData.streak_count,
        lastDate: userData.streak_date || null,
      }))
    }
  }

  // ★ 拉取星球打卡数据（completedPlanets）并与本地合并（取并集）
  // 这是"刷新后打卡消失"的根因修复：之前完全不同步打卡数据
  if (userData?.completed_planets) {
    const localCompleted = storage.getCompletedPlanets(userId)
    const cloudCompleted = userData.completed_planets
    let merged = false
    for (const [date, tags] of Object.entries(cloudCompleted)) {
      if (!localCompleted[date]) {
        localCompleted[date] = [...tags]
        merged = true
      } else {
        for (const tag of tags) {
          if (!localCompleted[date].includes(tag)) {
            localCompleted[date].push(tag)
            merged = true
          }
        }
      }
    }
    if (merged) {
      localStorage.setItem('cl_completed_' + userId, JSON.stringify(localCompleted))
    }
  }

  // Fetch essay history — ★ 合并策略：本地和云端取并集（以 id 去重）
  const { data: essayRows } = await supabase
    .from('essays')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (essayRows?.length) {
    const cloudEssays = essayRows.map(e => ({
      id: e.id,
      prompt: e.prompt,
      category: e.category,
      content: e.content,
      score: e.score,
      feedback: e.feedback,
      createdAt: e.created_at,
    }))
    const localEssays = storage.getEssays(userId)
    const essayMap = new Map()
    for (const e of localEssays) essayMap.set(e.id, e)
    for (const e of cloudEssays) {
      if (!essayMap.has(e.id)) essayMap.set(e.id, e)
    }
    localStorage.setItem('cl_essays_' + userId, JSON.stringify([...essayMap.values()].slice(0, 30)))
  }

  return true
}

/**
 * Full sync: push all local data → cloud.
 * Call after quiz sessions, essay submissions, sentence sessions.
 */
export async function syncAfterSession(userId) {
  if (!supabase) return
  try {
    await Promise.all([
      pushRecordsToCloud(userId),
      pushSrsToCloud(userId),
      pushUserStats(userId),
      pushEssaysToCloud(userId),
      pushCompletedPlanetsToCloud(userId),  // ★ 同步星球打卡数据
    ])
  } catch (e) {
    console.warn('Sync failed (will retry next time):', e)
  }
}

/**
 * Lookup user ID by name — for device restore.
 * Returns the user object if found, null otherwise.
 */
export async function findUserByName(name) {
  if (!supabase) return null
  const { data } = await supabase
    .from('users')
    .select('id, name, created_at')
    .eq('name', name)
    .order('created_at', { ascending: false })
    .limit(1)
  return data?.[0] || null
}
