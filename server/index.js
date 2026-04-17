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

// ========== 排行榜 ==========
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.xp, u.streak_count, p.state_data->'currentPet' as current_pet
      FROM users u LEFT JOIN pet_states p ON u.id = p.user_id
      WHERE u.xp > 0
      ORDER BY u.xp DESC LIMIT 100
    `)
    return json(res, result.rows.map(row => ({
      id: row.id,
      name: row.name,
      xp: row.xp || 0,
      streakCount: row.streak_count || 0,
      petName: row.current_pet?.poolId || null,
      petLevel: row.current_pet?.level || 1,
    })))
  } catch (err) {
    console.error('排行榜查询失败:', err.message)
    return error(res, '查询失败', 500)
  }
})

// ========== 好友预览 ==========
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
      return {
        playerId: row.id,
        playerName: row.name,
        xp: row.xp || 0,
        streakCount: row.streak_count || 0,
        petPoolId: pet.poolId || 'pet_kitten',
        petLevel: pet.level || 1,
        petExp: pet.exp || 0,
      }
    }))
  } catch (err) {
    console.error('好友预览查询失败:', err.message)
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
