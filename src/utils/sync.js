/**
 * 云端同步模块 — Supabase 版本
 */

import { createClient } from '@supabase/supabase-js'
import { storage } from './storage'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export function isSyncEnabled() { return !!supabase }

// ========== 邀请码 ==========

export async function validateInviteCode(code) {
  if (!supabase) return { valid: true }
  try {
    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()
    if (error || !data) return { valid: false, reason: '邀请码无效' }
    if (data.max_uses != null && data.used_count >= data.max_uses) {
      return { valid: false, reason: '邀请码已达使用上限' }
    }
    // 增加使用次数
    await supabase
      .from('invitation_codes')
      .update({ used_count: data.used_count + 1 })
      .eq('code', code)
    return { valid: true, name: data.name }
  } catch (e) {
    console.warn('[sync] validateInviteCode error:', e?.message)
    return { valid: true } // 网络故障时放行
  }
}

// ========== 用户 ==========

export async function syncUserToCloud(user) {
  if (!supabase || !user?.id) return
  try {
    await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      created_at: user.createdAt || new Date().toISOString(),
    }, { onConflict: 'id', ignoreDuplicates: true })
  } catch (e) {
    console.warn('[sync] syncUserToCloud error:', e?.message)
  }
}

export async function findUserByName(name) {
  if (!supabase || !name) return null
  try {
    const { data } = await supabase
      .from('users')
      .select('id, name')
      .ilike('name', name.trim())
      .limit(1)
      .single()
    return data || null
  } catch {
    return null
  }
}

export async function searchUsers(query) {
  if (!supabase || !query) return []
  try {
    const { data } = await supabase
      .from('users')
      .select('id, name')
      .ilike('name', `%${query.trim()}%`)
      .limit(10)
    return data || []
  } catch {
    return []
  }
}

// ========== 统计数据 ==========

export async function pushUserStats(userId) {
  if (!supabase || !userId) return
  const xp = storage.getXP(userId)
  const streak = storage.getStreak(userId)
  try {
    await supabase.from('users').upsert({
      id: userId,
      xp,
      streak_count: streak.count,
      streak_date: streak.lastDate,
    }, { onConflict: 'id' })
  } catch (e) {
    console.warn('[sync] pushUserStats error:', e?.message)
  }
}

export async function pushCompletedPlanetsToCloud(userId) {
  if (!supabase || !userId) return
  const completedMap = storage.getCompletedPlanets(userId)
  if (!Object.keys(completedMap).length) return
  try {
    await supabase.from('users').upsert({
      id: userId,
      completed_planets: completedMap,
    }, { onConflict: 'id' })
  } catch (e) {
    console.warn('[sync] pushCompletedPlanets error:', e?.message)
  }
}

// ========== 答题记录 ==========

export async function pushRecordsToCloud(userId) {
  if (!supabase || !userId) return
  const records = storage.getRecords(userId)
  if (!records.length) return
  try {
    const rows = records.map(r => ({
      user_id: userId,
      card_id: r.card_id,
      subject: r.subject || 'chinese',
      correct: r.correct,
      timestamp: r.timestamp || new Date().toISOString(),
    }))
    const { error } = await supabase
      .from('answer_records')
      .upsert(rows, { onConflict: 'user_id,card_id,timestamp', ignoreDuplicates: true })
    if (!error) console.log(`✅ 答题记录已同步 ${rows.length} 条`)
  } catch (e) {
    console.warn('[sync] pushRecordsToCloud error:', e?.message)
  }
}

// ========== SRS ==========

export async function pushSrsToCloud(userId) {
  if (!supabase || !userId) return
  const srsState = storage.getSrsState(userId)
  if (!Object.keys(srsState).length) return
  try {
    const rows = Object.entries(srsState).map(([cardId, s]) => ({
      user_id: userId,
      card_id: cardId,
      level: s.level || 0,
      due_date: s.dueDate || new Date().toISOString(),
      correct_count: s.correctCount || 0,
      incorrect_count: s.incorrectCount || 0,
      last_reviewed: s.lastReviewed || null,
    }))
    await supabase
      .from('srs_states')
      .upsert(rows, { onConflict: 'user_id,card_id' })
  } catch (e) {
    console.warn('[sync] pushSrsToCloud error:', e?.message)
  }
}

// ========== 学习会话 ==========

export async function pushSessionsToCloud(userId) {
  if (!supabase || !userId) return
  const sessions = storage.getSessions(userId)
  if (!sessions.length) return
  try {
    const rows = sessions.map(s => ({
      user_id: userId,
      date: s.date,
      total: s.total || 0,
      correct: s.correct || 0,
      subject: s.subject || 'chinese',
      duration_seconds: s.durationSeconds || 0,
    }))
    await supabase
      .from('sessions')
      .upsert(rows, { onConflict: 'user_id,date,subject' })
  } catch (e) {
    console.warn('[sync] pushSessionsToCloud error:', e?.message)
  }
}

// ========== 作文 ==========

export async function pushEssaysToCloud(userId) {
  if (!supabase || !userId) return
  const essays = storage.getEssays(userId)
  if (!essays.length) return
  try {
    const rows = essays.map(e => ({
      id: e.id,
      user_id: userId,
      prompt: e.prompt || '',
      category: e.category || 'composition',
      content: e.content || '',
      score: e.score || null,
      feedback: e.feedback || '',
      created_at: e.createdAt || new Date().toISOString(),
    }))
    await supabase
      .from('essays')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  } catch (e) {
    console.warn('[sync] pushEssaysToCloud error:', e?.message)
  }
}

// ========== 全量拉取 ==========

export async function pullFromCloud(userId) {
  if (!supabase || !userId) return false
  let pulledAny = false

  // 1. 答题记录
  try {
    const { data } = await supabase
      .from('answer_records')
      .select('card_id, subject, correct, timestamp')
      .eq('user_id', userId)
    if (data?.length) {
      const localRecords = storage.getRecords(userId)
      const mergedMap = new Map()
      for (const r of localRecords) mergedMap.set(`${r.card_id}|${r.timestamp}`, r)
      for (const r of data) {
        const key = `${r.card_id}|${r.timestamp}`
        if (!mergedMap.has(key)) mergedMap.set(key, r)
      }
      localStorage.setItem(`cl_records_${userId}`, JSON.stringify([...mergedMap.values()]))
      pulledAny = true
    }
  } catch (_) {}

  // 2. SRS
  try {
    const { data } = await supabase
      .from('srs_states')
      .select('card_id, level, due_date, correct_count, incorrect_count, last_reviewed')
      .eq('user_id', userId)
    if (data?.length) {
      const localSRS = storage.getSrsState(userId)
      for (const s of data) {
        if (!localSRS[s.card_id]) {
          localSRS[s.card_id] = {
            level: s.level, dueDate: s.due_date,
            correctCount: s.correct_count, incorrectCount: s.incorrect_count,
            lastReviewed: s.last_reviewed,
          }
        }
      }
      localStorage.setItem(`cl_srs_${userId}`, JSON.stringify(localSRS))
      pulledAny = true
    }
  } catch (_) {}

  // 3. 用户统计（XP/连续天数）
  try {
    const { data } = await supabase
      .from('users')
      .select('xp, streak_count, streak_date, completed_planets')
      .eq('id', userId)
      .single()
    if (data) {
      if (data.xp != null) {
        const localXP = parseInt(localStorage.getItem(`cl_xp_${userId}`) || '0')
        localStorage.setItem(`cl_xp_${userId}`, String(Math.max(localXP, data.xp)))
      }
      if (data.streak_count != null) {
        localStorage.setItem(`cl_streak_${userId}`, JSON.stringify({
          count: data.streak_count, lastDate: data.streak_date || null,
        }))
      }
      if (data.completed_planets && typeof data.completed_planets === 'object') {
        const localCompleted = storage.getCompletedPlanets(userId)
        let merged = false
        for (const [date, tags] of Object.entries(data.completed_planets)) {
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

  // 4. 作文
  try {
    const { data } = await supabase
      .from('essays')
      .select('id, prompt, category, content, score, feedback, created_at')
      .eq('user_id', userId)
    if (data?.length) {
      const localEssays = storage.getEssays(userId)
      const essayMap = new Map()
      for (const e of localEssays) essayMap.set(e.id, e)
      for (const e of data) {
        if (!essayMap.has(e.id)) essayMap.set(e.id, { ...e, createdAt: e.created_at })
      }
      localStorage.setItem(`cl_essays_${userId}`, JSON.stringify([...essayMap.values()].slice(0, 30)))
      pulledAny = true
    }
  } catch (_) {}

  return pulledAny
}

// ========== 全量推送（答题完成后调用）==========

export async function syncAfterSession(userId) {
  if (!supabase || !userId) return
  try {
    await Promise.all([
      pushRecordsToCloud(userId),
      pushSrsToCloud(userId),
      pushSessionsToCloud(userId),
      pushEssaysToCloud(userId),
      pushUserStats(userId),
    ])
  } catch (e) {
    console.warn('[sync] syncAfterSession error:', e?.message)
  }
}
