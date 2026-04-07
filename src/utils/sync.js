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
 * Pull data from cloud and restore into localStorage.
 * Used when user logs in on a new device.
 */
export async function pullFromCloud(userId) {
  if (!supabase) return false

  // Fetch answer records
  const { data: records } = await supabase
    .from('answer_records')
    .select('*')
    .eq('user_id', userId)
  if (records?.length) {
    localStorage.setItem('cl_records_' + userId, JSON.stringify(records))
  }

  // Fetch SRS states
  const { data: srsRows } = await supabase
    .from('srs_states')
    .select('*')
    .eq('user_id', userId)
  if (srsRows?.length) {
    const srsState = {}
    srsRows.forEach((r) => {
      const { user_id, card_id, ...state } = r
      srsState[card_id] = state
    })
    localStorage.setItem('cl_srs_' + userId, JSON.stringify(srsState))
  }

  // Fetch sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
  if (sessions?.length) {
    localStorage.setItem('cl_sessions_' + userId, JSON.stringify(sessions))
  }

  // Fetch XP and streak from users table
  const { data: userData } = await supabase
    .from('users')
    .select('xp, streak_count, streak_date')
    .eq('id', userId)
    .single()
  if (userData) {
    if (userData.xp != null) {
      localStorage.setItem('cl_xp_' + userId, String(userData.xp))
    }
    if (userData.streak_count != null) {
      localStorage.setItem('cl_streak_' + userId, JSON.stringify({
        count: userData.streak_count,
        lastDate: userData.streak_date || null,
      }))
    }
  }

  // Fetch essay history
  const { data: essayRows } = await supabase
    .from('essays')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (essayRows?.length) {
    const essays = essayRows.map(e => ({
      id: e.id,
      prompt: e.prompt,
      category: e.category,
      content: e.content,
      score: e.score,
      feedback: e.feedback,
      createdAt: e.created_at,
    }))
    localStorage.setItem('cl_essays_' + userId, JSON.stringify(essays))
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
