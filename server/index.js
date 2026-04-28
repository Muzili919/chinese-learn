/**
 * 知识星球 - 后端 API 服务
 * 
 * 端口: 3000
 * 数据库: PostgreSQL (chinese_learn)
 * 替代 Supabase 的全部功能
 */

const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

// ========== 配置 ==========
const PORT = process.env.PORT || 3000
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || 5432
const DB_NAME = process.env.DB_NAME || 'chinese_learn'
const DB_USER = process.env.DB_USER || 'admin'
const DB_PASS = process.env.DB_PASS || '132258'

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASS,
})

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ========== 工具函数 ==========
function json(res, data) { res.json(data) }
function error(res, msg, code = 400) { res.status(code).json({ error: msg }) }

// ========== 邀请码验证 ==========
app.post('/api/invite/validate', async (req, res) => {
  const { code } = req.body
  if (!code) return error(res, '缺少邀请码')
  
  try {
    // 检查本地缓存（可选，这里直接查库）
    const result = await pool.query(
      'SELECT * FROM invitation_codes WHERE LOWER(code) = LOWER($1) AND is_active = true',
      [code.trim()]
    )
    
    if (!result.rows.length)
      return error(res, '邀请码无效，请检查后重新输入')
    
    const row = result.rows[0]
    
    if (row.max_uses !== null && row.used_count >= row.max_uses)
      return error(res, '该邀请码使用人数已达上限')
    
    // 增加使用计数
    await pool.query(
      'UPDATE invitation_codes SET used_count = used_count + 1 WHERE id = $1',
      [row.id]
    )
    
    return json(res, { valid: true })
  } catch (err) {
    console.error('邀请码验证错误:', err.message)
    return error(res, '验证服务暂时不可用', 500)
  }
})

// ========== 用户相关 ==========
app.post('/api/user/create', async (req, res) => {
  const { id, name, created_at } = req.body
  if (!id || !name) return error(res, '缺少必要字段')
  
  try {
    await pool.query(
      'INSERT INTO users (id, name, created_at) VALUES ($1, $2, COALESCE($3, now())) ON CONFLICT (id) DO NOTHING',
      [id, name, created_at]
    )
    // 同时创建空宠物状态
    await pool.query(
      'INSERT INTO pet_states (user_id, state_data) VALUES ($1, \'{}\') ON CONFLICT (user_id) DO NOTHING',
      [id]
    )
    return json(res, { ok: true })
  } catch (err) {
    console.error('创建用户失败:', err.message)
    return error(res, '创建用户失败', 500)
  }
})

app.get('/api/user/find', async (req, res) => {
  const { name } = req.query
  if (!name) return error(res, '缺少name参数')
  
  try {
    const result = await pool.query(
      "SELECT id, name, created_at FROM users WHERE name = $1 ORDER BY created_at DESC LIMIT 1",
      [name.trim()]
    )
    return json(res, result.rows[0] || null)
  } catch (err) {
    console.error('查找用户失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

app.get('/api/user/stats/:userId', async (req, res) => {
  const userId = req.params.userId
  
  try {
    const result = await pool.query(
      'SELECT xp, streak_count, streak_date, completed_planets FROM users WHERE id = $1',
      [userId]
    )
    return json(res, result.rows[0] || {})
  } catch (err) {
    console.error('获取用户统计失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

app.post('/api/user/update-stats', async (req, res) => {
  const { id, xp, streak_count, streak_date, completed_planets } = req.body
  if (!id) return error(res, '缺少用户ID')
  
  try {
    await pool.query(
      `UPDATE users SET 
        xp = COALESCE($2, xp), 
        streak_count = COALESCE($3, streak_count),
        streak_date = COALESCE($4, streak_date),
        completed_planets = COALESCE($5::jsonb, completed_planets)
       WHERE id = $1`,
      [id, xp, streak_count, streak_date, JSON.stringify(completed_planets || {})]
    )
    return json(res, { ok: true })
  } catch (err) {
    console.error('更新用户统计失败:', err.message)
    return error(res, '更新失败', 500)
  }
})

// ========== 宠物状态（mv1_state） ==========
app.get('/api/pet-state/:userId', async (req, res) => {
  const userId = req.params.userId
  
  try {
    const result = await pool.query(
      'SELECT state_data FROM pet_states WHERE user_id = $1',
      [userId]
    )
    return json(res, result.rows[0]?.state_data || {})
  } catch (err) {
    console.error('获取宠物状态失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

app.post('/api/pet-state/upsert', async (req, res) => {
  const { userId, stateData } = req.body
  if (!userId) return error(res, '缺少用户ID')
  
  try {
    await pool.query(`
      INSERT INTO pet_states (user_id, state_data, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE SET state_data = $2::jsonb, updated_at = now()
    `, [userId, typeof stateData === 'string' ? stateData : JSON.stringify(stateData || {})])
    return json(res, { ok: true })
  } catch (err) {
    console.error('保存宠物状态失败:', err.message)
    return error(res, '保存失败', 500)
  }
})

// ========== 答题记录 ==========
app.get('/api/records/:userId', async (req, res) => {
  const userId = req.params.userId
  
  try {
    const result = await pool.query(
      'SELECT card_id, subject, correct, timestamp, knowledge_tag, ability_tag, topic, time_spent, score, selected_answer FROM answer_records WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    )
    // 去掉user_id返回
    return json(res, result.rows.map(({ user_id, ...r }) => r))
  } catch (err) {
    console.error('获取答题记录失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

app.post('/api/records/bulk-upsert', async (req, res) => {
  const { records, userId } = req.body
  if (!Array.isArray(records) || !userId) return error(res, '参数无效')

  try {
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50)
      const values = batch.flatMap(r => [
        `${userId}_${r.card_id}_${r.timestamp}`,
        userId,
        r.card_id,
        r.subject || 'chinese',
        r.correct ? 'true' : 'false',
        r.timestamp || new Date().toISOString(),
        r.knowledge_tag || null,
        r.ability_tag || null,
        r.topic || null,
        r.time_spent || null,
        r.score != null ? r.score : null,
        r.selected_answer || null,
      ])

      const placeholders = batch.map((_, idx) => {
        const b = idx * 12
        return `($${b+1}, $${b+2}, $${b+3}, $${b+4}, $${b+5}::boolean, $${b+6}, $${b+7}, $${b+8}, $${b+9}, $${b+10}, $${b+11}, $${b+12})`
      }).join(', ')

      await pool.query(`
        INSERT INTO answer_records (id, user_id, card_id, subject, correct, timestamp, knowledge_tag, ability_tag, topic, time_spent, score, selected_answer)
        VALUES ${placeholders}
        ON CONFLICT (id) DO UPDATE SET
          correct = EXCLUDED.correct,
          subject = EXCLUDED.subject,
          knowledge_tag = COALESCE(EXCLUDED.knowledge_tag, answer_records.knowledge_tag),
          ability_tag = COALESCE(EXCLUDED.ability_tag, answer_records.ability_tag),
          topic = COALESCE(EXCLUDED.topic, answer_records.topic),
          time_spent = COALESCE(EXCLUDED.time_spent, answer_records.time_spent),
          score = COALESCE(EXCLUDED.score, answer_records.score),
          selected_answer = COALESCE(EXCLUDED.selected_answer, answer_records.selected_answer)
      `, values)
    }
    return json(res, { ok: true, count: records.length })
  } catch (err) {
    console.error('批量插入答题记录失败:', err.message)
    return error(res, '保存失败', 500)
  }
})

// 删除指定 card_id 的答题记录（家长后台删错题用）
app.post('/api/records/delete', async (req, res) => {
  const { userId, cardIds } = req.body
  if (!userId || !Array.isArray(cardIds) || !cardIds.length) return error(res, '参数无效')
  try {
    await pool.query('DELETE FROM answer_records WHERE user_id = $1 AND card_id = ANY($2)', [userId, cardIds])
    return json(res, { ok: true, deleted: cardIds.length })
  } catch (e) {
    console.error('delete records error:', e.message)
    return error(res, '删除失败')
  }
})

// ========== SRS 状态 ==========
app.get('/api/srs/:userId', async (req, res) => {
  const userId = req.params.userId
  
  try {
    const result = await pool.query(
      'SELECT card_id, level, due_date, correct_count, incorrect_count, last_reviewed FROM srs_states WHERE user_id = $1',
      [userId]
    )
    // 转为对象格式，与前端 localStorage 格式一致
    const obj = {}
    for (const row of result.rows) {
      obj[row.card_id] = {
        level: row.level,
        dueDate: row.due_date,
        correctCount: row.correct_count,
        incorrectCount: row.incorrect_count,
        lastReviewed: row.last_reviewed,
      }
    }
    return json(res, obj)
  } catch (err) {
    console.error('获取SRS状态失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

app.post('/api/srs/sync', async (req, res) => {
  const { states, userId } = req.body
  if (!states || !userId || typeof states !== 'object') return error(res, '参数无效')
  
  try {
    const entries = Object.entries(states)
    for (let i = 0; i < entries.length; i += 100) {
      const batch = entries.slice(i, i + 100)
      const values = batch.flatMap(([cardId, s]) => [
        userId, cardId,
        s.level || 0,
        s.dueDate || new Date().toISOString(),
        s.correctCount || 0,
        s.incorrectCount || 0,
        s.lastReviewed || null,
      ])
      const placeholders = batch.map((_, idx) =>
        `($${idx * 7 + 1}, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}::timestamptz, $${idx * 7 + 5}, $${idx * 7 + 6}, $${idx * 7 + 7})`
      ).join(', ')
      
      await pool.query(`
        INSERT INTO srs_states (user_id, card_id, level, due_date, correct_count, incorrect_count, last_reviewed)
        VALUES ${placeholders}
        ON CONFLICT (user_id, card_id) DO UPDATE SET
          level = EXCLUDED.level,
          due_date = EXCLUDED.due_date,
          correct_count = EXCLUDED.correct_count,
          incorrect_count = EXCLUDED.incorrect_count,
          last_reviewed = EXCLUDED.last_reviewed
      `, values)
    }
    return json(res, { ok: true, count: entries.length })
  } catch (err) {
    console.error('同步SRS失败:', err.message)
    return error(res, '同步失败', 500)
  }
})

// ========== 学习会话 ==========
app.get('/api/sessions/:userId', async (req, res) => {
  const userId = req.params.userId
  
  try {
    const result = await pool.query(
      'SELECT date, total, correct, subject, duration_seconds FROM sessions WHERE user_id = $1 ORDER BY date ASC',
      [userId]
    )
    return json(res, result.rows.map(r => ({
      date: r.date.toISOString().split('T')[0],
      total: r.total,
      correct: r.correct,
      subject: r.subject,
      durationSeconds: r.duration_seconds,
    })))
  } catch (err) {
    console.error('获取会话记录失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

app.post('/api/sessions/sync', async (req, res) => {
  const { sessions, userId } = req.body
  if (!Array.isArray(sessions) || !userId) return error(res, '参数无效')
  
  try {
    for (const s of sessions) {
      // 兜底：date 为空时用今天
      const sessionDate = s.date || new Date().toISOString().slice(0, 10)
      await pool.query(`
        INSERT INTO sessions (user_id, date, total, correct, subject, duration_seconds)
        VALUES ($1, $2::date, $3, $4, $5, $6)
        ON CONFLICT (user_id, date, subject) DO UPDATE SET
          total = EXCLUDED.total,
          correct = EXCLUDED.correct,
          duration_seconds = EXCLUDED.duration_seconds
      `, [userId, sessionDate, s.total, s.correct, s.subject || 'chinese', s.durationSeconds || 0])
    }
    return json(res, { ok: true, count: sessions.length })
  } catch (err) {
    console.error('同步会话失败:', err.message)
    return error(res, '同步失败', 500)
  }
})

// ========== 作文 ==========
app.get('/api/essays/:userId', async (req, res) => {
  const userId = req.params.userId
  
  try {
    const result = await pool.query(
      "SELECT id, prompt, category, content, score, feedback, created_at FROM essays WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30",
      [userId]
    )
    return json(res, result.rows.map(e => ({
      id: e.id,
      prompt: e.prompt,
      category: e.category,
      content: e.content,
      score: e.score,
      feedback: e.feedback,
      createdAt: e.created_at,
    })))
  } catch (err) {
    console.error('获取作文失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

app.post('/api/essays/upsert', async (req, res) => {
  const { essays, userId } = req.body
  if (!Array.isArray(essays) || !userId) return error(res, '参数无效')
  
  try {
    for (const e of essays) {
      await pool.query(`
        INSERT INTO essays (id, user_id, prompt, category, content, score, feedback, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, now()))
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          score = EXCLUDED.score,
          feedback = EXCLUDED.feedback
      `, [e.id, userId, e.prompt, e.category, e.content, e.score, e.feedback, e.createdAt])
    }
    return json(res, { ok: true, count: essays.length })
  } catch (err) {
    console.error('保存作文失败:', err.message)
    return error(res, '保存失败', 500)
  }
})

// ========== 排行榜（增强版：含答题数、炮台高分）==========
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.xp, u.streak_count, p.state_data as pet_state
      FROM users u LEFT JOIN pet_states p ON u.id = p.user_id
      ORDER BY COALESCE(u.xp, 0) DESC LIMIT 100
    `)
    return json(res, result.rows.map(row => {
      const ps = row.pet_state || {}
      const pet = ps.currentPet || {}
      const gs = ps.gameState || {}
      return {
        id: row.id,
        name: row.name,
        xp: row.xp || 0,
        streakCount: row.streak_count || 0,
        petName: pet.poolId || null,
        petLevel: pet.level || 1,
        // ★ 新增：答题统计
        totalLearnQuestions: ps.totalLearnQuestions || 0,
        totalCorrectAnswers: ps.totalCorrectAnswers || 0,
        weeklyQuestions: ps.weeklyQuestions || 0,
        daysActive: ps.daysActive || row.streak_count || 1,
        wordCannonHighScore: gs.wordCannonHighScore || 0,
      }
    }))
  } catch (err) {
    console.error('排行榜查询失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

// ========== 好友预览（增强版：含答题数、炮台高分）==========
app.post('/api/friends/preview', async (req, res) => {
  const { friendIds } = req.body
  if (!Array.isArray(friendIds)) return error(res, '缺少好友列表')
  
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.xp, u.streak_count, p.state_data as pet_state
      FROM users u LEFT JOIN pet_states p ON u.id = p.user_id
      WHERE u.id = ANY($1)
    `, [friendIds])
    return json(res, result.rows.map(row => {
      const ps = row.pet_state || {}
      const pet = ps.currentPet || {}
      const gs = ps.gameState || {}
      return {
        playerId: row.id,
        playerName: row.name,
        xp: row.xp || 0,
        streakCount: row.streak_count || 0,
        petPoolId: pet.poolId || 'pet_kitten',
        petLevel: pet.level || 1,
        petExp: pet.exp || 0,
        // ★ 新增字段，与 Vercel api/friend-preview 对齐
        totalLearnQuestions: ps.totalLearnQuestions || 0,
        totalCorrectAnswers: ps.totalCorrectAnswers || 0,
        weeklyQuestions: ps.weeklyQuestions || 0,
        daysActive: ps.daysActive || row.streak_count || 1,
        wordCannonHighScore: gs.wordCannonHighScore || 0,
      }
    }))
  } catch (err) {
    console.error('好友预览查询失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

// ★ 路由别名：前端 LeaderboardPage 请求 /api/friend-preview（兼容 Vercel 路径）
app.post('/api/friend-preview', async (req, res) => {
  // 前端传 { userIds: [...] }，转成统一格式
  const friendIds = req.body.userIds
  if (!Array.isArray(friendIds)) return error(res, '缺少 userIds 列表')
  
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, p.state_data as pet_state
      FROM users u LEFT JOIN pet_states p ON u.id = p.user_id
      WHERE u.id = ANY($1)
    `, [friendIds])
    // 返回格式与 Vercel api/friend-preview 完全一致（previews 数组）
    return json(res, { previews: result.rows.map(row => {
      const ps = row.pet_state || {}
      const pet = ps.currentPet || {}
      const gs = ps.gameState || {}
      const poolItem = null // PET_POOL 不在 Node 端，前端会补全
      return {
        userId: row.id,
        playerName: row.name || row.id.slice(0, 8),
        petPoolId: pet.poolId || null,
        petName: row.name || row.id.slice(0, 8),
        petEmoji: '🥚',
        petRarity: pet.rarity || 'N',
        petLevel: pet.level || 1,
        petStage: pet.level >= 20 ? '成熟体' : pet.level >= 10 ? '成长期' : '幼年',
        totalLearnQuestions: ps.totalLearnQuestions || 0,
        totalCorrectAnswers: ps.totalCorrectAnswers || 0,
        daysActive: ps.daysActive || 1,
        weeklyQuestions: ps.weeklyQuestions || 0,
        wordCannonHighScore: gs.wordCannonHighScore || 0,
      }
    })})
  } catch (err) {
    console.error('friend-preview 查询失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

// ========== AI 中转路由（多模型 API 代理） ==========
// 前端通过 /api/ai 调用，服务端转发到不同AI服务，保护 API Key
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

// 千问API配置
const QWEN_API_KEY = process.env.QWEN_API_KEY || ''
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-max'

// 智谱GLM API配置（国际版）
const GLM_API_KEY = process.env.GLM_API_KEY || ''
const GLM_BASE_URL = process.env.GLM_BASE_URL || 'https://api.z.ai/api/paas/v4'
const GLM_MODEL = process.env.GLM_MODEL || 'glm-5.1'

// 默认模型配置
const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'deepseek-chat'

// 判断是否为千问模型
function isQwenModel(modelName) {
  return modelName && (modelName.toLowerCase().includes('qwen') || modelName.toLowerCase().includes('tongyi'))
}

// 判断是否为GLM模型
function isGlmModel(modelName) {
  return modelName && modelName.toLowerCase().includes('glm')
}

// 获取模型配置
function getModelConfig(modelName) {
  const model = modelName || DEFAULT_MODEL
  
  if (isGlmModel(model)) {
    return {
      baseUrl: GLM_BASE_URL,
      apiKey: GLM_API_KEY,
      endpoint: '/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      modelName: GLM_MODEL,
      provider: 'glm'
    }
  } else if (isQwenModel(model)) {
    return {
      baseUrl: QWEN_BASE_URL,
      apiKey: QWEN_API_KEY,
      endpoint: '/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      modelName: QWEN_MODEL,
      provider: 'qwen'
    }
  } else {
    // 默认使用DeepSeek
    return {
      baseUrl: DEEPSEEK_BASE_URL,
      apiKey: DEEPSEEK_API_KEY,
      endpoint: '/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      modelName: model || 'deepseek-chat',
      provider: 'deepseek'
    }
  }
}

app.post('/api/ai', async (req, res) => {
  const { model, messages, response_format, temperature, max_tokens } = req.body
  if (!messages || !Array.isArray(messages)) return error(res, '缺少 messages 参数')

  try {
    const modelConfig = getModelConfig(model)
    
    // 检查API密钥
    if (!modelConfig.apiKey) {
      console.error(`[AI] ${modelConfig.provider} API密钥未配置`)
      return error(res, `AI服务配置错误: ${modelConfig.provider} API密钥缺失`, 500)
    }

    // 构建请求体（适配不同API格式）
    const fetchBody = {
      model: modelConfig.modelName,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens || 1024,
    }
    
    // 千问API可能需要不同的参数格式
    if (modelConfig.provider === 'qwen') {
      // 千问API可能需要stream参数
      if (req.body.stream) {
        fetchBody.stream = true
      }
    }
    
    if (response_format) fetchBody.response_format = response_format

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)

    console.log(`[AI] 使用模型: ${modelConfig.provider} - ${modelConfig.modelName}`)
    
    const aiRes = await fetch(`${modelConfig.baseUrl}${modelConfig.endpoint}`, {
      method: 'POST',
      headers: modelConfig.headers,
      body: JSON.stringify(fetchBody),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error(`[AI] ${modelConfig.provider} 返回错误:`, aiRes.status, errText.slice(0, 200))
      if (aiRes.status === 429) return error(res, 'AI服务繁忙，请等待几秒后重试', 429)
      if (aiRes.status === 401) return error(res, 'AI认证失败', 502)
      return error(res, `${modelConfig.provider}请求失败 (${aiRes.status})`, 502)
    }

    const data = await aiRes.json()
    return json(res, data)
  } catch (err) {
    if (err.name === 'AbortError') return error(res, 'AI响应超时，请稍后重试（建议减少题目数量）', 504)
    console.error('[AI] 请求异常:', err.message)
    return error(res, 'AI请求失败: ' + err.message, 500)
  }
})

// ========== AI SSE 流式响应（多模型支持） ==========
app.post('/api/ai/stream', async (req, res) => {
  const { model, messages, response_format, temperature, max_tokens } = req.body
  if (!messages || !Array.isArray(messages)) return error(res, '缺少 messages 参数')

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // 禁止 Nginx 缓冲
  })

  try {
    const modelConfig = getModelConfig(model)
    
    // 检查API密钥
    if (!modelConfig.apiKey) {
      console.error(`[AI-STREAM] ${modelConfig.provider} API密钥未配置`)
      res.write(`data: ${JSON.stringify({ error: `AI服务配置错误: ${modelConfig.provider} API密钥缺失` })}\\n\\n`)
      res.end()
      return
    }

    const fetchBody = {
      model: modelConfig.modelName,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens || 1024,
      stream: true,
    }
    if (response_format) fetchBody.response_format = response_format

    console.log(`[AI-STREAM] 使用模型: ${modelConfig.provider} - ${modelConfig.modelName}`)
    
    const aiRes = await fetch(`${modelConfig.baseUrl}${modelConfig.endpoint}`, {
      method: 'POST',
      headers: modelConfig.headers,
      body: JSON.stringify(fetchBody),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error(`[AI-STREAM] ${modelConfig.provider} 返回错误:`, aiRes.status, errText.slice(0, 200))
      res.write(`data: ${JSON.stringify({ error: `${modelConfig.provider}请求失败 (${aiRes.status})` })}\\n\\n`)
      res.end()
      return
    }

    // 流式转发 AI 服务的 SSE 数据
    const reader = aiRes.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\\n')
      buffer = lines.pop() || '' // 保留未完成的行

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n')
          res.end()
          return
        }
        try {
          const parsed = JSON.parse(data)
          // 转发给前端，保持格式一致
          res.write(`data: ${JSON.stringify(parsed)}\n\n`)
        } catch (e) {
          // 忽略解析失败的行
        }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('[AI-STREAM] 请求异常:', err.message)
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

// ========== TTS 文字转语音路由（豆包 TTS / 火山引擎） ==========
const VOLCENGINE_TTS_URL = 'https://openspeech.bytedance.com/api/v1/tts'
const VOLCENGINE_TTS_APPID = process.env.VOLCENGINE_TTS_APPID || ''
const VOLCENGINE_TTS_TOKEN = process.env.VOLCENGINE_TTS_TOKEN || ''
const VOLCENGINE_TTS_CLUSTER = process.env.VOLCENGINE_TTS_CLUSTER || 'volcano_tts'

const VOICE_MAP = {
  'zh-CN': 'BV700_streaming',    // 灿灿（中文）
  'en-US': 'BV700_streaming',    // 灿灿（也支持英文）
  'en-GB': 'BV700_streaming',
}

app.post('/api/tts', async (req, res) => {
  const { text, lang = 'zh-CN', rate = 1.0 } = req.body
  if (!text || text.trim().length === 0) return error(res, '缺少文本内容')
  if (text.length > 500) return error(res, '文本过长（最大500字符）')

  try {
    if (!VOLCENGINE_TTS_APPID || !VOLCENGINE_TTS_TOKEN) {
      return error(res, 'TTS 未配置', 500)
    }

    const voice = VOICE_MAP[lang] || VOICE_MAP['zh-CN']
    const payload = {
      app: { appid: VOLCENGINE_TTS_APPID, token: VOLCENGINE_TTS_TOKEN, cluster: VOLCENGINE_TTS_CLUSTER },
      user: { uid: 'chinese-learn' },
      audio: { voice_type: voice, encoding: 'mp3', speed_ratio: parseFloat(rate) },
      request: { reqid: crypto.randomUUID(), text: text.slice(0, 500), text_type: 'plain', operation: 'query' },
    }

    const ttsRes = await fetch(VOLCENGINE_TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer;${VOLCENGINE_TTS_TOKEN}` },
      body: JSON.stringify(payload),
    })

    const data = await ttsRes.json()
    if (data.code !== 3000 || !data.data) {
      console.error('[TTS] 豆包错误:', data.code, data.message)
      return error(res, 'TTS生成失败: ' + (data.message || 'unknown'), 500)
    }

    const buffer = Buffer.from(data.data, 'base64')
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    res.status(200).send(buffer)
  } catch (err) {
    console.error('[TTS] 异常:', err.message)
    return error(res, 'TTS生成失败: ' + err.message, 500)
  }
})


// ========== Plan / 付费功能开关 ==========

// 每日 AI 使用限额配置（free 用户）
const FREE_DAILY_LIMITS = {
  ai_variant:  3,   // 举一反三
  ai_analysis: 2,   // 错题AI分析
  ai_selftest: 2,   // AI自测出题
}

/** 获取用户 plan */
app.get('/api/user/plan/:userId', async (req, res) => {
  const { userId } = req.params
  try {
    const r = await pool.query('SELECT plan FROM users WHERE id = $1', [userId])
    return json(res, { plan: r.rows[0]?.plan || 'free' })
  } catch (err) {
    return json(res, { plan: 'free' })
  }
})

/**
 * 检查并消费一次 AI 使用次数
 * POST /api/ai/usage/check
 * body: { userId, feature }
 * returns: { ok, used, limit, remaining, plan }
 * 429 if over limit
 */
app.post('/api/ai/usage/check', async (req, res) => {
  const { userId, feature } = req.body
  if (!userId || !feature) return error(res, '缺少参数')

  try {
    const planR = await pool.query('SELECT plan FROM users WHERE id = $1', [userId])
    const plan  = planR.rows[0]?.plan || 'free'

    // Premium 无限制
    if (plan === 'premium') {
      return json(res, { ok: true, used: 0, limit: 9999, remaining: 9999, plan })
    }

    const limit = FREE_DAILY_LIMITS[feature] ?? 3
    const today = new Date().toISOString().slice(0, 10)

    // 读当日用量
    const usageR = await pool.query(
      'SELECT count FROM ai_daily_usage WHERE user_id=$1 AND feature=$2 AND date=$3',
      [userId, feature, today]
    )
    const used = usageR.rows[0]?.count || 0

    if (used >= limit) {
      return res.status(429).json({
        error: 'PLAN_LIMIT',
        used, limit, remaining: 0, plan,
        upgradeHint: `今日 ${feature} 已用 ${used}/${limit} 次，升级 Premium 可无限使用`,
      })
    }

    // 消费一次
    await pool.query(`
      INSERT INTO ai_daily_usage (user_id, feature, date, count)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (user_id, feature, date)
      DO UPDATE SET count = ai_daily_usage.count + 1
    `, [userId, feature, today])

    return json(res, { ok: true, used: used + 1, limit, remaining: limit - used - 1, plan })
  } catch (err) {
    console.error('[AI usage check]', err.message)
    // 服务出错时放行（不影响体验）
    return json(res, { ok: true, used: 0, limit: 99, remaining: 99, plan: 'free' })
  }
})

/**
 * 查询今日某功能已用次数（不消费）
 * GET /api/ai/usage?userId=xxx&feature=yyy
 */
app.get('/api/ai/usage', async (req, res) => {
  const { userId, feature } = req.query
  if (!userId || !feature) return error(res, '缺少参数')

  try {
    const planR = await pool.query('SELECT plan FROM users WHERE id = $1', [userId])
    const plan  = planR.rows[0]?.plan || 'free'
    if (plan === 'premium') return json(res, { used: 0, limit: 9999, remaining: 9999, plan })

    const limit = FREE_DAILY_LIMITS[feature] ?? 3
    const today = new Date().toISOString().slice(0, 10)
    const r = await pool.query(
      'SELECT count FROM ai_daily_usage WHERE user_id=$1 AND feature=$2 AND date=$3',
      [userId, feature, today]
    )
    const used = r.rows[0]?.count || 0
    return json(res, { used, limit, remaining: Math.max(0, limit - used), plan })
  } catch (err) {
    return json(res, { used: 0, limit: 3, remaining: 3, plan: 'free' })
  }
})

/**
 * 管理员：修改用户 plan
 * POST /api/admin/set-plan
 * body: { userId, plan, adminKey }
 */
const ADMIN_KEY = process.env.ADMIN_KEY
if (!ADMIN_KEY) {
  console.error('❌ 缺少 ADMIN_KEY 环境变量，管理接口不可用')
}

app.post('/api/admin/set-plan', async (req, res) => {
  const { userId, plan, adminKey } = req.body
  if (adminKey !== ADMIN_KEY) return error(res, '无权限', 403)
  if (!userId || !plan) return error(res, '缺少参数')
  if (!['free', 'premium'].includes(plan)) return error(res, '无效的 plan 值')

  try {
    await pool.query('UPDATE users SET plan=$1 WHERE id=$2', [plan, userId])
    return json(res, { ok: true, userId, plan })
  } catch (err) {
    return error(res, '更新失败', 500)
  }
})

/** 管理员：列出所有用户+plan（便于查看） */
// ========== 清理版本bug导致的假错题 ==========
app.post('/api/admin/cleanup-buggy-records', async (req, res) => {
  const { adminKey } = req.body
  if (adminKey !== ADMIN_KEY) return error(res, '无权限', 403)
  try {
    let total = 0
    // 1. 李雨: 4/18 00:11 道法临时题 q1-q11
    const r1 = await pool.query(
      `DELETE FROM answer_records WHERE user_id = '李雨_mo2t5zxm'
       AND card_id IN ('q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11')
       AND timestamp LIKE '2026-04-18T00:11%'`
    )
    total += r1.rowCount

    // 2. 小松鼠: subject=chinese 但 card_id 以 math_ 开头的错题
    const r2 = await pool.query(
      `DELETE FROM answer_records WHERE user_id = '小松鼠_mo2smtx6'
       AND subject = 'chinese' AND card_id LIKE 'math_%' AND correct = 'false'`
    )
    total += r2.rowCount

    // 3. 小松鼠: 临时题ID q1-q19
    const qIds = Array.from({length: 19}, (_, i) => `q${i + 1}`)
    const r3 = await pool.query(
      `DELETE FROM answer_records WHERE user_id = '小松鼠_mo2smtx6'
       AND card_id = ANY($1) AND correct = 'false'`, [qIds]
    )
    total += r3.rowCount

    // 4. 小松鼠: 4/18 凌晨 00:00-00:59 的错题
    const r4 = await pool.query(
      `DELETE FROM answer_records WHERE user_id = '小松鼠_mo2smtx6'
       AND timestamp LIKE '2026-04-18T00:%' AND correct = 'false'`
    )
    total += r4.rowCount

    return json(res, { ok: true, deleted: total, details: { liyu_q: r1.rowCount, sqs_math_subject: r2.rowCount, sqs_q: r3.rowCount, sqs_overnight: r4.rowCount } })
  } catch (err) {
    console.error('cleanup error:', err)
    return error(res, '清理失败: ' + err.message, 500)
  }
})

app.get('/api/admin/users', async (req, res) => {
  const { adminKey } = req.query
  if (adminKey !== ADMIN_KEY) return error(res, '无权限', 403)
  try {
    const r = await pool.query(
      'SELECT id, name, plan, xp, streak_count, created_at FROM users ORDER BY created_at DESC'
    )
    return json(res, r.rows)
  } catch (err) {
    return error(res, '查询失败', 500)
  }
})

// ========== 家长邮箱设置 ==========
app.get('/api/user/email/:userId', async (req, res) => {
  const { userId } = req.params
  try {
    const r = await pool.query('SELECT parent_email FROM users WHERE id = $1', [userId])
    return json(res, { email: r.rows[0]?.parent_email || '' })
  } catch (err) {
    return error(res, '查询失败', 500)
  }
})

app.post('/api/user/email', async (req, res) => {
  const { userId, email } = req.body
  if (!userId) return error(res, '缺少用户ID')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error(res, '邮箱格式不正确')
  try {
    await pool.query('UPDATE users SET parent_email = $1 WHERE id = $2', [email || null, userId])
    return json(res, { ok: true })
  } catch (err) {
    return error(res, '保存失败', 500)
  }
})

// ========== 每日报告触发 ==========
app.post('/api/report/trigger', async (req, res) => {
  const { userId } = req.body
  if (!userId) return error(res, '缺少用户ID')
  try {
    const { execFile } = require('child_process')
    const scriptPath = require('path').join(__dirname, 'daily-report.js')
    execFile('node', [scriptPath, userId], {
      env: { ...process.env },
      timeout: 120000,
    }, (err, stdout, stderr) => {
      if (err) console.error('[report/trigger]', err.message)
      if (stdout) console.log('[report/trigger]', stdout)
      if (stderr) console.error('[report/trigger stderr]', stderr)
    })
    return json(res, { ok: true, message: '报告发送中' })
  } catch (err) {
    return error(res, '触发失败', 500)
  }
})

// ========== 健康检查 ==========
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT now() as time')
    return json(res, {
      status: 'ok',
      time: dbResult.rows[0].time,
      uptime: process.uptime(),
    })
  } catch (err) {
    return error(res, '数据库连接失败', 503)
  }
})

// ========== 启动 ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 知识星球API服务启动成功！`)
  console.log(`   地址: http://47.108.174.249:${PORT}`)
  console.log(`   数据库: postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`)
})
