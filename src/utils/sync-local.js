/**
 * 本地API同步模块 - 指向自己的阿里云服务器
 * 替代 Supabase 云端同步
 */

import { storage } from './storage'

const API_BASE = import.meta.env.VITE_API_BASE || `${window.location.origin}/api`

// ========== 基础工具 ==========
function apiUrl(path) { return `${API_BASE}${path}` }

async function apiFetch(method, path, body) {
  try {
    const res = await fetch(apiUrl(path), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(errData.error || `HTTP ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      console.warn('⚠️ API连接失败，使用离线模式')
      return null
    }
    throw err
  }
}

// ========== 导出接口（与原 sync.js 保持一致） ==========

export function isSyncEnabled() { return true }

/** 验证邀请码 */
export async function validateInviteCode(code) {
  const result = await apiFetch('POST', '/invite/validate', { code })
  if (result === null) return { valid: true }
  return result
}

/** 创建用户 */
export async function syncUserToCloud(user) {
  await apiFetch('POST', '/user/create', {
    id: user.id, name: user.name, created_at: user.createdAt,
  })
}

/** 按名字查找用户 */
export async function findUserByName(name) {
  const result = await apiFetch('GET', `/user/find?name=${encodeURIComponent(name)}`)
  return result
}

/** 推送答题记录到云端 */
export async function pushRecordsToCloud(userId) {
  const records = storage.getRecords(userId)
  if (!records.length) return
  
  const result = await apiFetch('POST', '/records/bulk-upsert', { records, userId })
  if (result?.ok) console.log(`✅ 答题记录已同步 ${result.count} 条`)
}

/** 从云端拉取数据并恢复到 localStorage */
export async function pullFromCloud(userId) {
  let pulledAny = false

  // 1. 答题记录
  try {
    const cloudRecords = await apiFetch('GET', `/records/${userId}`)
    if (cloudRecords && Array.isArray(cloudRecords) && cloudRecords.length > 0) {
      const localRecords = storage.getRecords(userId)
      const mergedMap = new Map()
      for (const r of localRecords) mergedMap.set(`${r.card_id}|${r.timestamp}`, r)
      for (const r of cloudRecords) {
        const key = `${r.card_id}|${r.timestamp}`
        const existing = mergedMap.get(key)
        if (!existing) mergedMap.set(key, r)
        else if (!existing.subject && r.subject) mergedMap.set(key, r)
      }
      localStorage.setItem(`cl_records_${userId}`, JSON.stringify([...mergedMap.values()]))
      pulledAny = true
    }
  } catch (_) {}

  // 2. SRS状态
  try {
    const srsObj = await apiFetch('GET', `/srs/${userId}`)
    if (srsObj && typeof srsObj === 'object' && Object.keys(srsObj).length > 0) {
      const localSRS = storage.getSrsState(userId)
      for (const [cardId, state] of Object.entries(srsObj)) {
        if (!localSRS[cardId]) localSRS[cardId] = state
      }
      localStorage.setItem(`cl_srs_${userId}`, JSON.stringify(localSRS))
      pulledAny = true
    }
  } catch (_) {}

  // 3. 会话记录
  try {
    const sessions = await apiFetch('GET', `/sessions/${userId}`)
    if (sessions && Array.isArray(sessions) && sessions.length > 0) {
      const localSessions = storage.getSessions(userId)
      const sessionMap = new Map()
      for (const s of localSessions) sessionMap.set(`${s.date}|${s.subject}`, s)
      for (const s of sessions) {
        const key = `${s.date}|${s.subject}`
        if (!sessionMap.has(key)) sessionMap.set(key, s)
      }
      localStorage.setItem(`cl_sessions_${userId}`, JSON.stringify([...sessionMap.values()]))
      pulledAny = true
    }
  } catch (_) {}

  // 4. 用户统计（XP/连续天数/打卡）
  try {
    const stats = await apiFetch('GET', `/user/stats/${userId}`)
    if (stats && stats.xp != null) {
      const localXP = parseInt(localStorage.getItem(`cl_xp_${userId}`) || '0')
      const mergedXP = Math.max(localXP, stats.xp)
      localStorage.setItem(`cl_xp_${userId}`, String(mergedXP))
      
      if (stats.streak_count != null) {
        localStorage.setItem(`cl_streak_${userId}`, JSON.stringify({
          count: stats.streak_count,
          lastDate: stats.streak_date || null,
        }))
      }
      
      // 星球打卡合并
      if (stats.completed_planets && typeof stats.completed_planets === 'object') {
        const localCompleted = storage.getCompletedPlanets(userId)
        const cloudCompleted = stats.completed_planets
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
          localStorage.setItem(`cl_completed_${userId}`, JSON.stringify(localCompleted))
        }
      }
      pulledAny = true
    }
  } catch (_) {}

  // 5. 作文
  try {
    const essays = await apiFetch('GET', `/essays/${userId}`)
    if (essays && Array.isArray(essays) && essays.length > 0) {
      const localEssays = storage.getEssays(userId)
      const essayMap = new Map()
      for (const e of localEssays) essayMap.set(e.id, e)
      for (const e of essays) {
        if (!essayMap.has(e.id)) essayMap.set(e.id, e)
      }
      localStorage.setItem(`cl_essays_${userId}`, JSON.stringify([...essayMap.values()].slice(0, 30)))
      pulledAny = true
    }
  } catch (_) {}

  return pulledAny
}

/** 全量推送（答题完成后调用） */
export async function syncAfterSession(userId) {
  try {
    const promises = [pushRecordsToCloud(userId)]

    const srsState = storage.getSrsState(userId)
    if (Object.keys(srsState).length > 0) {
      promises.push(apiFetch('POST', '/srs/sync', { states: srsState, userId }).catch(() => {}))
    }

    const sessions = storage.getSessions(userId)
    if (sessions.length > 0) {
      promises.push(apiFetch('POST', '/sessions/sync', { sessions, userId }).catch(() => {}))
    }

    const essays = storage.getEssays(userId)
    if (essays.length > 0) {
      promises.push(apiFetch('POST', '/essays/upsert', { essays, userId }).catch(() => {}))
    }

    const xp = storage.getXP(userId)
    const streak = storage.getStreak(userId)
    const completedPlanets = storage.getCompletedPlanets(userId)
    promises.push(
      apiFetch('POST', '/user/update-stats', {
        id: userId, xp, streak_count: streak.count,
        streak_date: streak.lastDate, completed_planets,
      }).catch(() => {})
    )

    await Promise.all(promises)
  } catch (e) {
    console.warn('⚠️ 云端同步失败:', e?.message || e)
  }
}

/** 推送SRS状态 */
export async function pushSrsToCloud(userId) {
  const srsState = storage.getSrsState(userId)
  if (!Object.keys(srsState).length) return
  try {
    await apiFetch('POST', '/srs/sync', { states: srsState, userId })
  } catch (e) { console.warn('⚠️ SRS云同步失败:', e?.message) }
}

/** 推送用户统计 */
export async function pushUserStats(userId) {
  const xp = storage.getXP(userId)
  const streak = storage.getStreak(userId)
  try {
    await apiFetch('POST', '/user/update-stats', {
      id: userId, xp, streak_count: streak.count, streak_date: streak.lastDate,
    })
  } catch (e) { console.warn('⚠️ 统计云同步失败:', e?.message) }
}

/** 推送作文 */
export async function pushEssaysToCloud(userId) {
  const essays = storage.getEssays(userId)
  if (!essays.length) return
  try {
    await apiFetch('POST', '/essays/upsert', { essays, userId })
  } catch (e) { console.warn('⚠️ 作文云同步失败:', e?.message) }
}

/** 推送星球打卡 */
export async function pushCompletedPlanetsToCloud(userId) {
  const completedMap = storage.getCompletedPlanets(userId)
  if (!Object.keys(completedMap).length) return
  try {
    await apiFetch('POST', '/user/update-stats', {
      id: userId, completed_planets: completedMap,
    })
  } catch (e) { console.warn('⚠️ 打卡云同步失败:', e?.message) }
}
