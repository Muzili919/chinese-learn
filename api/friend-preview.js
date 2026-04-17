// ═══════════════════════════════════════════════════════════════
// Vercel Serverless Function — 好友宠物预览查询
// 使用 SERVICE_ROLE_KEY 绕过 RLS，读取任意用户的 mv1_state
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { PET_POOL } from '../src/utils/gamification.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('friend-preview: Missing Supabase service key config')
    return res.status(500).json({ error: 'Server not configured' })
  }

  try {
    const { userIds } = req.body
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' })
    }

    // 用 SERVICE_ROLE_KEY 创建客户端，绕过 RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // 同时查询 mv1_state（宠物数据）和 users（用户名）
    const [stateRes, usersRes] = await Promise.all([
      supabase
        .from('mv1_state')
        .select('user_id, state')
        .in('user_id', userIds.slice(0, 50)),
      supabase
        .from('users')
        .select('id, name')
        .in('id', userIds.slice(0, 50)),
    ])

    if (stateRes.error) {
      console.error('friend-preview DB error:', stateRes.error)
      return res.status(500).json({ error: 'Database query failed', detail: stateRes.error.message })
    }

    // 构建 user_id → name 映射
    const userNameMap = {}
    ;(usersRes.data || []).forEach(u => { userNameMap[u.id] = u.name })

    // 转换为预览格式（和 mv1_cloud.js 的 fetchUserPetPreview 保持一致）
    const previews = (stateRes.data || []).map(row => {
      const s = row.state || {}
      const pet = s.currentPet || {}
      // ★ Fix #2: 使用 PET_POOL 常量而不是不存在的 s.petPool 字段
      const poolItem = PET_POOL.find(p => p.poolId === pet.poolId) || { name: '神秘宠物', emoji: '🥚', rarity: 'N' }
      return {
        userId: row.user_id,
        playerName: userNameMap[row.user_id] || '匿名同学',
        petPoolId: pet.poolId || null,
        petName: poolItem.name,
        petEmoji: poolItem.emoji,
        petRarity: poolItem.rarity,
        petLevel: pet.level || 1,
        petStage: !pet.level || pet.level < 2 ? '蛋' : pet.level < 10 ? '幼年' : pet.level < 20 ? '成长期' : pet.level < 30 ? '成熟体' : '完全体',
        totalLearnQuestions: s.totalLearnQuestions || 0,
        totalCorrectAnswers: s.totalCorrectAnswers || 0,
        daysActive: s.daysActive || 1,
        weeklyQuestions: s.weeklyQuestions || 0,
      }
    })

    return res.status(200).json({ previews })
  } catch (err) {
    console.error('friend-preview exception:', err)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50kb',
    },
  },
}
