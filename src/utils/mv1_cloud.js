/**
 * 宠物状态云端持久化 — 阿里云自托管版本
 */

import { PET_POOL } from './gamification'

const API_BASE = import.meta.env.VITE_API_BASE || `${window.location.origin}/api`

async function apiFetch(method, path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.warn('[mv1_cloud] API error:', e?.message)
    return null
  }
}

export async function fetchMV1State(userId) {
  if (!userId) return null
  return await apiFetch('GET', `/pet-state/${userId}`)
}

export async function upsertMV1State(userId, state) {
  if (!userId) return
  await apiFetch('POST', '/pet-state/upsert', { userId, stateData: state })
}

export async function fetchUserPetPreview(userId) {
  if (!userId) return null
  try {
    const [petData, leaderboard] = await Promise.all([
      apiFetch('GET', `/pet-state/${userId}`),
      apiFetch('GET', '/leaderboard'),
    ])
    const pet = petData?.currentPet || {}
    const poolItem = PET_POOL.find(p => p.poolId === pet.poolId) || { name: '神秘宠物', emoji: '🥚', rarity: 'N' }
    const entry = leaderboard?.find(u => u.id === userId)
    return {
      userId,
      playerName: entry?.name || '匿名同学',
      petPoolId: pet.poolId || null,
      petName: poolItem.name,
      petEmoji: poolItem.emoji,
      petRarity: poolItem.rarity,
      petLevel: pet.level || 1,
      petStage: !pet.level || pet.level < 2 ? '蛋' : pet.level < 10 ? '幼年' : pet.level < 20 ? '成长期' : pet.level < 30 ? '成熟体' : '完全体',
      totalLearnQuestions: petData?.totalLearnQuestions || 0,
      totalCorrectAnswers: petData?.totalCorrectAnswers || 0,
      daysActive: entry?.streakCount || 1,
      weeklyQuestions: petData?.weeklyQuestions || 0,
      wordCannonHighScore: petData?.gameState?.wordCannonHighScore || 0,
    }
  } catch (e) {
    return null
  }
}

export async function sendEncouragement(fromUserId, fromName, toUserId) {
  if (!fromUserId || !toUserId) return false
  try {
    const petData = await apiFetch('GET', `/pet-state/${toUserId}`)
    if (!petData) return false
    if (!petData.pendingEncouragements) petData.pendingEncouragements = []
    const today = new Date().toISOString().slice(0, 10)
    if (petData.pendingEncouragements.some(e => e.from === fromUserId && e.date === today)) return false
    petData.pendingEncouragements.push({ from: fromUserId, name: fromName || '匿名好友', date: today, time: new Date().toISOString() })
    await apiFetch('POST', '/pet-state/upsert', { userId: toUserId, stateData: petData })
    return true
  } catch (e) {
    return false
  }
}

export async function fetchAllPreviews() {
  try {
    const data = await apiFetch('GET', '/leaderboard')
    if (!data || !Array.isArray(data)) return []
    return data.map(row => ({
      userId: row.id,
      playerName: row.name || '匿名同学',
      petPoolId: null,
      petName: row.petName || '神秘宠物',
      petEmoji: '🥚',
      petRarity: 'N',
      petLevel: row.petLevel || 1,
      petStage: !row.petLevel || row.petLevel < 2 ? '蛋' : row.petLevel < 10 ? '幼年' : '成长期',
      totalLearnQuestions: 0,
      daysActive: row.streakCount || 1,
      weeklyQuestions: 0,
      wordCannonHighScore: row.wordCannonHighScore || 0,
    }))
  } catch (e) {
    return []
  }
}
