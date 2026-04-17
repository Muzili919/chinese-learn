/**
 * 宠物状态云端持久化 — Supabase 版本
 * 使用 pet_states 表存储完整的 MV1 状态 JSON
 */

import { createClient } from '@supabase/supabase-js'
import { PET_POOL } from './gamification'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export async function fetchMV1State(userId) {
  if (!supabase || !userId) return null
  try {
    const { data, error } = await supabase
      .from('pet_states')
      .select('state_data')
      .eq('user_id', userId)
      .single()
    if (error || !data) return null
    return data.state_data || null
  } catch (e) {
    console.warn('[mv1_cloud] fetchMV1State error:', e?.message)
    return null
  }
}

export async function upsertMV1State(userId, state) {
  if (!supabase || !userId || !state) return
  try {
    await supabase.from('pet_states').upsert({
      user_id: userId,
      state_data: state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  } catch (e) {
    console.warn('[mv1_cloud] upsertMV1State error:', e?.message)
  }
}

export async function fetchUserPetPreview(userId) {
  if (!supabase || !userId) return null
  try {
    const [petRes, userRes] = await Promise.all([
      supabase.from('pet_states').select('state_data').eq('user_id', userId).single(),
      supabase.from('users').select('name, xp, streak_count').eq('id', userId).single(),
    ])
    const petState = petRes.data?.state_data || {}
    const user = userRes.data || {}
    const pet = petState.currentPet || {}
    const poolItem = PET_POOL.find(p => p.poolId === pet.poolId) || { name: '神秘宠物', emoji: '🥚', rarity: 'N' }

    return {
      userId,
      playerName: user.name || '匿名同学',
      petPoolId: pet.poolId || null,
      petName: poolItem.name,
      petEmoji: poolItem.emoji,
      petRarity: poolItem.rarity,
      petLevel: pet.level || 1,
      petStage: !pet.level || pet.level < 2 ? '蛋' : pet.level < 10 ? '幼年' : pet.level < 20 ? '成长期' : pet.level < 30 ? '成熟体' : '完全体',
      totalLearnQuestions: petState.totalLearnQuestions || 0,
      totalCorrectAnswers: petState.totalCorrectAnswers || 0,
      daysActive: user.streak_count || 1,
      weeklyQuestions: petState.weeklyQuestions || 0,
      wordCannonHighScore: petState.gameState?.wordCannonHighScore || 0,
    }
  } catch (e) {
    console.warn('[mv1_cloud] fetchUserPetPreview error:', e?.message)
    return null
  }
}

export async function sendEncouragement(fromUserId, fromName, toUserId) {
  if (!supabase || !fromUserId || !toUserId) return false
  try {
    const { data } = await supabase
      .from('pet_states')
      .select('state_data')
      .eq('user_id', toUserId)
      .single()
    if (!data) return false

    const petState = data.state_data || {}
    if (!petState.pendingEncouragements) petState.pendingEncouragements = []

    const today = new Date().toISOString().slice(0, 10)
    const alreadySent = petState.pendingEncouragements.some(
      e => e.from === fromUserId && e.date === today
    )
    if (alreadySent) return false

    petState.pendingEncouragements.push({
      from: fromUserId, name: fromName || '匿名好友',
      date: today, time: new Date().toISOString(),
    })

    await supabase.from('pet_states').upsert({
      user_id: toUserId,
      state_data: petState,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    return true
  } catch (e) {
    console.warn('[mv1_cloud] sendEncouragement error:', e?.message)
    return false
  }
}

export async function fetchAllPreviews() {
  if (!supabase) return []
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, xp, streak_count')
      .order('xp', { ascending: false })
      .limit(50)
    if (!users?.length) return []

    const userIds = users.map(u => u.id)
    const { data: pets } = await supabase
      .from('pet_states')
      .select('user_id, state_data')
      .in('user_id', userIds)

    const petMap = {}
    for (const p of (pets || [])) petMap[p.user_id] = p.state_data || {}

    return users.map(u => {
      const petState = petMap[u.id] || {}
      const pet = petState.currentPet || {}
      const poolItem = PET_POOL.find(p => p.poolId === pet.poolId) || { name: '神秘宠物', emoji: '🥚', rarity: 'N' }
      return {
        userId: u.id,
        playerName: u.name || '匿名同学',
        petPoolId: pet.poolId || null,
        petName: poolItem.name,
        petEmoji: poolItem.emoji,
        petRarity: poolItem.rarity,
        petLevel: pet.level || 1,
        petStage: !pet.level || pet.level < 2 ? '蛋' : pet.level < 10 ? '幼年' : pet.level < 20 ? '成长期' : pet.level < 30 ? '成熟体' : '完全体',
        totalLearnQuestions: petState.totalLearnQuestions || 0,
        totalCorrectAnswers: petState.totalCorrectAnswers || 0,
        daysActive: u.streak_count || 1,
        weeklyQuestions: petState.weeklyQuestions || 0,
        wordCannonHighScore: petState.gameState?.wordCannonHighScore || 0,
      }
    })
  } catch (e) {
    console.warn('[mv1_cloud] fetchAllPreviews error:', e?.message)
    return []
  }
}
