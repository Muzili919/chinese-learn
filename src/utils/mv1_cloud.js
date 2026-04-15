// Cloud-based MV1 persistence using Supabase (client-side)
import { createClient } from '@supabase/supabase-js'

let supabase = null

function getClient() {
  if (!supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.warn('MV1 cloud: Supabase env vars not found, falling back to local storage')
      return null
    }
    supabase = createClient(url, key)
  }
  return supabase
}

export async function fetchMV1State(userId) {
  if (!userId) return null
  const client = getClient()
  if (!client) return null
  try {
    const { data, error } = await client
      .from('mv1_state')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.error('MV1 fetch error', error)
      return null
    }
    return data?.state ?? null
  } catch (e) {
    console.error('MV1 fetch exception', e)
    return null
  }
}

export async function upsertMV1State(userId, state) {
  if (!userId) return
  const client = getClient()
  if (!client) return
  try {
    await client.from('mv1_state').upsert(
      { user_id: userId, state },
      { onConflict: 'user_id' }
    )
  } catch (e) {
    console.error('MV1 upsert error', e)
  }
  // 同步宠物预览到 users 表（无 RLS 限制，好友列表 + 排行榜共用）
  try {
    const pet = state.currentPet || {}
    const poolItem = (state.petPool || []).find(p => p.poolId === pet.poolId) || {}
    const preview = {
      petPoolId: pet.poolId || null,
      petName: poolItem.name || '神秘宠物',
      petEmoji: poolItem.emoji || '🥚',
      petRarity: poolItem.rarity || 'N',
      petLevel: pet.level || 1,
      petStage: !pet.level || pet.level < 2 ? '蛋' : pet.level < 10 ? '幼年' : pet.level < 20 ? '成长期' : pet.level < 30 ? '成熟体' : '完全体',
      totalLearnQuestions: state.totalLearnQuestions || 0,
      totalCorrectAnswers: state.totalCorrectAnswers || 0,
      daysActive: state.daysActive || 1,
      weeklyQuestions: state.weeklyQuestions || 0,
      updatedAt: new Date().toISOString(),
    }
    await client.from('users').upsert({ id: userId, pet_preview: preview }, { onConflict: 'id' })
  } catch (e) {
    // 忽略：users 表可能暂未添加 pet_preview 列
  }
}

/**
 * 获取用户宠物预览信息（好友列表用）
 * 优先读 users.pet_preview（匿名密钥可跨用户访问），
 * 降级读 mv1_state（可能被 RLS 拦截）
 */
export async function fetchUserPetPreview(userId) {
  if (!userId) return null
  const client = getClient()
  if (!client) return null

  // 策略1：读 users.pet_preview（无 RLS 限制），同时取用户名
  try {
    const { data } = await client
      .from('users')
      .select('name, pet_preview')
      .eq('id', userId)
      .maybeSingle()
    if (data?.pet_preview?.petEmoji) {
      return { userId, playerName: data.name || '匿名同学', ...data.pet_preview }
    }
  } catch (_) {}

  // 策略2：直接读 mv1_state（可能被 RLS 拦截，静默失败）
  try {
    const { data, error } = await client
      .from('mv1_state')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()
    if (error || !data?.state) return null
    const s = data.state
    const pet = s.currentPet || {}
    const poolItem = (s.petPool || []).find(p => p.poolId === pet.poolId) || { name: '神秘宠物', emoji: '🥚', rarity: 'N' }
    return {
      userId,
      petPoolId: pet.poolId || null,
      petName: poolItem.name,
      petEmoji: poolItem.emoji,
      petRarity: poolItem.rarity,
      petLevel: pet.level || 1,
      petStage: !pet.level || pet.level < 2 ? '蛋' : pet.level < 10 ? '幼年' : pet.level < 20 ? '成长期' : pet.level < 30 ? '成熟体' : '完全体',
      totalLearnQuestions: s.totalLearnQuestions || 0,
      daysActive: s.daysActive || 1,
      weeklyQuestions: s.weeklyQuestions || 0,
    }
  } catch (e) {
    return null
  }
}

/**
 * 向好友发送鼓励（写入好友state的pendingEncouragements）
 */
export async function sendEncouragement(fromUserId, fromName, toUserId) {
  if (!fromUserId || !toUserId) return false
  const client = getClient()
  if (!client) return false
  try {
    const { data } = await client
      .from('mv1_state')
      .select('state')
      .eq('user_id', toUserId)
      .maybeSingle()
    if (!data?.state) return false
    const state = data.state
    if (!state.pendingEncouragements) state.pendingEncouragements = []
    // 检查今天是否已发过
    const today = new Date().toISOString().slice(0, 10)
    const alreadySent = state.pendingEncouragements.some(
      e => e.from === fromUserId && e.date === today
    )
    if (alreadySent) return false
    state.pendingEncouragements.push({
      from: fromUserId,
      name: fromName || '匿名好友',
      date: today,
      time: new Date().toISOString(),
    })
    await client.from('mv1_state').upsert({ user_id: toUserId, state }).eq('user_id', toUserId)
    return true
  } catch (e) {
    console.error('MV1 send encouragement error', e)
    return false
  }
}

/**
 * 获取所有用户的宠物预览（排行榜用）
 * 读 users.pet_preview —— anon key 无 RLS 限制，可跨用户访问
 */
export async function fetchAllPreviews() {
  const client = getClient()
  if (!client) return []
  try {
    const { data, error } = await client
      .from('users')
      .select('id, name, pet_preview')
      .not('pet_preview', 'is', null)
      .limit(100)
    if (error || !data) return []

    return data
      .filter(row => row.pet_preview?.petEmoji)   // 过滤掉空预览
      .map(row => ({
        userId: row.id,
        playerName: row.name || '匿名同学',
        ...row.pet_preview,
      }))
  } catch (e) {
    console.error('MV1 fetch all previews error', e)
    return []
  }
}
