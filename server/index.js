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
      'SELECT card_id, subject, correct, timestamp, user_id FROM answer_records WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 500',
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
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100)
      const values = batch.flatMap((r, idx) => [
        `${userId}_${r.card_id}_${r.timestamp}`,  // 复合唯一标识
        userId,
        r.card_id,
        r.subject || 'chinese',
        r.correct ? 'true' : 'false',
        r.timestamp || new Date().toISOString()
      ])
      
      const placeholders = batch.map((_, idx) =>
        `($${idx * 6 + 1}, $${idx * 6 + 2}, $${idx * 6 + 3}, $${idx * 6 + 4}, $${idx * 6 + 5}::boolean, $${idx * 6 + 6})`
      ).join(', ')
      
      await pool.query(`
        INSERT INTO answer_records (id, user_id, card_id, subject, correct, timestamp)
        VALUES ${placeholders}
        ON CONFLICT (id) DO UPDATE SET correct = EXCLUDED.correct, subject = EXCLUDED.subject
      `, values)
    }
    return json(res, { ok: true, count: records.length })
  } catch (err) {
    console.error('批量插入答题记录失败:', err.message)
    return error(res, '保存失败', 500)
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
      await pool.query(`
        INSERT INTO sessions (user_id, date, total, correct, subject, duration_seconds)
        VALUES ($1, $2::date, $3, $4, $5, $6)
        ON CONFLICT (user_id, date, subject) DO UPDATE SET
          total = EXCLUDED.total,
          correct = EXCLUDED.correct,
          duration_seconds = EXCLUDED.duration_seconds
      `, [userId, s.date, s.total, s.correct, s.subject || 'chinese', s.durationSeconds || 0])
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

// ========== AI 中转路由（DeepSeek API 代理） ==========
// 前端通过 /api/ai 调用，服务端转发到 DeepSeek，保护 API Key
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

app.post('/api/ai', async (req, res) => {
  const { model, messages, response_format, temperature, max_tokens } = req.body
  if (!messages || !Array.isArray(messages)) return error(res, '缺少 messages 参数')

  try {
    const fetchBody = {
      model: model || 'deepseek-chat',
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens || 1024,
    }
    if (response_format) fetchBody.response_format = response_format

    // ★ 支持两种认证方式：Bearer Token（DeepSeek）或自定义 Header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)

    const aiRes = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fetchBody),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error('[AI] DeepSeek 返回错误:', aiRes.status, errText.slice(0, 200))
      if (aiRes.status === 429) return error(res, 'AI服务繁忙，请等待几秒后重试', 429)
      if (aiRes.status === 401) return error(res, 'AI认证失败', 502)
      return error(res, `AI请求失败 (${aiRes.status})`, 502)
    }

    const data = await aiRes.json()
    return json(res, data)
  } catch (err) {
    if (err.name === 'AbortError') return error(res, 'AI响应超时，请稍后重试（建议减少题目数量）', 504)
    console.error('[AI] 请求异常:', err.message)
    return error(res, 'AI请求失败: ' + err.message, 500)
  }
})

// ========== TTS 文字转语音路由（Edge TTS） ==========
let MsEdgeTTS = null
try {
  MsEdgeTTS = require('msedge-tts').MsEdgeTTS
} catch { /* fallback to REST */ }

app.post('/api/tts', async (req, res) => {
  const { text, lang = 'zh-CN', rate = 1.0 } = req.body
  if (!text || text.trim().length === 0) return error(res, '缺少文本内容')
  if (text.length > 500) return error(res, '文本过长（最大500字符）')

  try {
    // ★ 方案1：优先用 msedge-tts 库（更可靠）
    if (MsEdgeTTS) {
      const voiceMap = {
        'zh-CN': 'zh-CN-XiaoxiaoNeural',
        'en-US': 'en-US-AriaNeural',
        'en-GB': 'en-GB-SoniaNeural',
      }
      const voice = voiceMap[lang] || voiceMap['zh-CN']
      const tts = new MsEdgeTTS()
      await tts.setMetadata(voice, require('msedge-tts').OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

      const pct = Math.round((parseFloat(rate) - 1) * 100)
      const rateStr = pct >= 0 ? `+${pct}%` : `${pct}%`
      const prosody = new (require('msedge-tts').ProsodyOptions)({ rate: rateStr })
      const { audioStream } = tts.toStream(text, prosody)

      const chunks = []
      await new Promise((resolve, reject) => {
        audioStream.on('data', chunk => chunks.push(chunk))
        audioStream.on('end', resolve)
        audioStream.on('error', reject)
      })

      const buffer = Buffer.concat(chunks)
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Length', buffer.length)
      res.setHeader('Cache-Control', 'public, max-age=31536000')
      res.status(200).send(buffer)
      return
    }

    // ★ 方案2：降级到 Edge TTS REST API（不需要额外依赖）
    const voiceMap = {
      'zh-CN': 'zh-CN-XiaoxiaoNeural',
      'en-US': 'en-US-AriaNeural',
      'en-GB': 'en-GB-SoniaNeural',
    }
    const voice = voiceMap[lang] || voiceMap['zh-CN']

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">
      <voice name="${voice}"><prosody rate="${rate > 1 ? '+' : ''}${Math.round((rate-1)*100)}%">${text.replace(/["&<>]/g, c => ({'"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;'})[c])}</prosody></voice></speak>`

    const ttsRes = await fetch('https://speech.platform.bing.com/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'Mozilla/5.0',
      },
      body: ssml,
    })

    if (!ttsRes.ok) return error(res, 'TTS生成失败', 500)

    const buffer = Buffer.from(await ttsRes.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', buffer.length)
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
const ADMIN_KEY = process.env.ADMIN_KEY || 'cl_admin_2026'

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
