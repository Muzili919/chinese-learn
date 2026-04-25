/**
 * 每日学习报告邮件发送
 * cron: 每晚 22:00 执行
 *
 * 功能：
 * 1. 查询今日用户的答题数据
 * 2. 对比昨日数据，分析成长
 * 3. 调用 AI 生成个性化建议
 * 4. 发送邮件给家长（从 DB 读取 parent_email）
 *
 * 用法: node daily-report.js [userId]
 */

const { Pool } = require('pg')
const nodemailer = require('nodemailer')

// ========== 配置 ==========
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || 5432
const DB_NAME = process.env.DB_NAME || 'chinese_learn'
const DB_USER = process.env.DB_USER || 'admin'
const DB_PASS = process.env.DB_PASS || '132258'

// 邮件配置（SMTP 发件账号）
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.qq.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465')
const SMTP_USER = process.env.SMTP_USER || '386323992@qq.com'
const SMTP_PASS = process.env.SMTP_PASS || 'REDACTED_SMTP_TOKEN'
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER

// AI 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'REDACTED_DEEPSEEK_KEY'
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

const pool = new Pool({
  host: DB_HOST, port: DB_PORT, database: DB_NAME,
  user: DB_USER, password: DB_PASS,
})

// ========== 工具 ==========
function today() { return new Date().toISOString().split('T')[0] }
function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

const SUBJECT_LABELS = {
  chinese: '语文', math: '数学', english: '英语',
  chinese_junior: '初中语文', politics: '道法',
}

const GRADE_LABELS = {
  chinese: '小学', math: '小学', english: '小学',
  chinese_junior: '初中', politics: '初中',
}

// ========== 数据查询 ==========

async function getDayRecords(userId, date) {
  const r = await pool.query(
    `SELECT card_id, subject, correct, timestamp
     FROM answer_records WHERE user_id = $1 AND timestamp::text LIKE $2`,
    [userId, date + '%']
  )
  return r.rows
}

async function getUsersWithEmail() {
  const r = await pool.query('SELECT id, name, parent_email FROM users ORDER BY created_at DESC')
  return r.rows
}

async function getUserWithEmail(userId) {
  const r = await pool.query('SELECT id, name, parent_email FROM users WHERE id = $1', [userId])
  return r.rows
}

// ========== 报告生成 ==========

function buildSubjectStats(records) {
  const bySubject = {}
  for (const r of records) {
    const subj = r.subject || 'unknown'
    if (!bySubject[subj]) bySubject[subj] = { total: 0, correct: 0, tags: {} }
    bySubject[subj].total++
    if (r.correct) bySubject[subj].correct++
    // 从 card_id 提取知识点前缀（如 vocab_056 → 词汇）
    const tagPrefix = (r.card_id || '').split('_')[0]
    const tagLabel = CARD_PREFIX_LABEL[tagPrefix] || tagPrefix || '未分类'
    if (!bySubject[subj].tags[tagLabel]) bySubject[subj].tags[tagLabel] = { total: 0, correct: 0 }
    bySubject[subj].tags[tagLabel].total++
    if (r.correct) bySubject[subj].tags[tagLabel].correct++
  }
  return bySubject
}

const CARD_PREFIX_LABEL = {
  vocab: '词汇', poetry: '古诗词', idiom: '成语', sentence: '句子',
  literature: '文学常识', reading: '阅读', dictation: '听写',
  en: '英语', math: '数学', politics: '道法',
  ch: '语文', j2ch: '初中语文',
}

function calcGrowth(todayStats, yesterdayStats) {
  const growth = []
  for (const subj of Object.keys(todayStats)) {
    const t = todayStats[subj]
    const y = yesterdayStats[subj]
    const tAcc = t.total > 0 ? Math.round(t.correct / t.total * 100) : 0
    const yAcc = y && y.total > 0 ? Math.round(y.correct / y.total * 100) : null
    growth.push({
      subject: subj,
      label: SUBJECT_LABELS[subj] || subj,
      grade: GRADE_LABELS[subj] || '',
      total: t.total,
      correct: t.correct,
      accuracy: tAcc,
      accChange: yAcc !== null ? tAcc - yAcc : null,
      tags: t.tags,
    })
  }
  return growth
}

async function generateAIAdvice(userName, todayData) {
  if (!DEEPSEEK_API_KEY) return '（AI 建议暂时不可用）'

  const todaySummary = todayData.map(s =>
    `${s.grade}${s.label}：${s.total}题，正确率${s.accuracy}%${s.accChange !== null ? (s.accChange >= 0 ? `（↑${s.accChange}%）` : `（↓${Math.abs(s.accChange)}%）`) : ''}`
  ).join('\n')

  const weakTags = []
  for (const s of todayData) {
    for (const [tag, stat] of Object.entries(s.tags)) {
      const acc = stat.total > 0 ? Math.round(stat.correct / stat.total * 100) : 0
      if (acc < 60 && stat.total >= 3) weakTags.push(`${s.label}-${tag}(${acc}%)`)
    }
  }

  const prompt = `你是一位耐心的家教老师，正在给家长写今日学习反馈。

学生：${userName}
今日学习情况：
${todaySummary}

${weakTags.length > 0 ? `薄弱知识点：${weakTags.join('、')}` : '今日各科表现均衡，没有明显薄弱点。'}

请用简洁温暖的语气，写3段反馈：
1. 今日表现总结（2-3句，先夸再点问题）
2. 比昨日的进步（如果有退步也温和指出）
3. 明日学习建议（具体到哪个学科该怎么练）

每段不超过50字，用口语，不要书面化。`

  try {
    const resp = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })
    const data = await resp.json()
    return data.choices?.[0]?.message?.content || '（AI 建议生成失败）'
  } catch (e) {
    console.error('AI 生成失败:', e.message)
    return '（AI 建议暂时不可用）'
  }
}

// ========== 邮件 ==========

function buildEmailHTML(userName, todayData, aiAdvice, todayDate) {
  const totalQ = todayData.reduce((s, d) => s + d.total, 0)
  const totalCorrect = todayData.reduce((s, d) => s + d.correct, 0)
  const totalAcc = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0

  const subjectRows = todayData.map(s => {
    const accColor = s.accuracy >= 80 ? '#16a34a' : s.accuracy >= 60 ? '#2563eb' : '#dc2626'
    const change = s.accChange !== null
      ? (s.accChange >= 0
          ? `<span style="color:#16a34a;font-size:12px">↑${s.accChange}%</span>`
          : `<span style="color:#dc2626;font-size:12px">↓${Math.abs(s.accChange)}%</span>`)
      : ''
    const tagRows = Object.entries(s.tags).map(([tag, stat]) => {
      const tagAcc = stat.total > 0 ? Math.round(stat.correct / stat.total * 100) : 0
      return `<span style="display:inline-block;background:#f3f4f6;border-radius:4px;padding:2px 6px;margin:2px;font-size:11px;color:#374151">${tag} ${stat.correct}/${stat.total} (${tagAcc}%)</span>`
    }).join('')

    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:600">${s.grade} ${s.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center">${s.total}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:${accColor};font-weight:700">${s.accuracy}% ${change}</td>
      </tr>
      <tr><td colspan="3" style="padding:4px 12px 8px;border-bottom:1px solid #f3f4f6">${tagRows}</td></tr>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,sans-serif">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;margin-top:20px">

  <div style="background:linear-gradient(135deg,#1e40af,#6d28d9);padding:24px;color:white">
    <div style="font-size:20px;font-weight:800;margin-bottom:4px">📊 ${userName} 的学习日报</div>
    <div style="opacity:0.8;font-size:13px">${todayDate}</div>
    <div style="display:flex;gap:16px;margin-top:16px">
      <div style="flex:1;text-align:center"><div style="font-size:22px;font-weight:800">${totalQ}</div><div style="opacity:0.7;font-size:11px">总题数</div></div>
      <div style="flex:1;text-align:center"><div style="font-size:22px;font-weight:800">${totalAcc}%</div><div style="opacity:0.7;font-size:11px">正确率</div></div>
    </div>
  </div>

  <div style="padding:16px">
    <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:8px">学科明细</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151">
      <tr style="background:#f9fafb">
        <th style="padding:6px 12px;text-align:left;font-size:11px;color:#6b7280">学科</th>
        <th style="padding:6px 12px;text-align:center;font-size:11px;color:#6b7280">题数</th>
        <th style="padding:6px 12px;text-align:center;font-size:11px;color:#6b7280">正确率</th>
      </tr>
      ${subjectRows}
    </table>
  </div>

  <div style="padding:0 16px 16px">
    <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:8px">🤖 老师点评</div>
    <div style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:12px;padding:14px;font-size:13px;line-height:1.8;color:#374151;white-space:pre-line">${aiAdvice}</div>
  </div>

  <div style="padding:12px 16px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #f3f4f6">
    知识星球 · 每日学习报告 · 自动发送
  </div>
</div>
</body></html>`
}

async function sendMail(to, subject, html) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('⚠️  邮件未配置 SMTP_USER/SMTP_PASS，跳过发送')
    return false
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

  await transporter.sendMail({
    from: `"知识星球" <${MAIL_FROM}>`,
    to,
    subject,
    html,
  })
  return true
}

// ========== 主流程 ==========

async function generateAndSendForUser(user) {
  const todayDate = today()
  const yesterdayDate = yesterday()

  const todayRecords = await getDayRecords(user.id, todayDate)
  if (todayRecords.length === 0) {
    console.log(`  ${user.name}: 今日无答题记录，跳过`)
    return null
  }

  const yesterdayRecords = await getDayRecords(user.id, yesterdayDate)
  const todayStats = buildSubjectStats(todayRecords)
  const yesterdayStats = buildSubjectStats(yesterdayRecords)
  const growth = calcGrowth(todayStats, yesterdayStats)

  const aiAdvice = await generateAIAdvice(user.name, growth)
  const html = buildEmailHTML(user.name, growth, aiAdvice, todayDate)

  // 收件人：优先用 DB 里的 parent_email，其次用环境变量 MAIL_TO
  const recipients = []
  if (user.parent_email) {
    recipients.push(...user.parent_email.split(',').map(s => s.trim()).filter(Boolean))
  }

  if (!recipients.length) {
    console.log(`  ${user.name}: 未设置家长邮箱，跳过发送`)
    return { html, totalQ: todayRecords.length, growth, sent: false }
  }

  const subject = `📊 ${user.name}的学习日报 | ${todayDate} | ${todayRecords.length}题`
  console.log(`  总题数: ${todayRecords.length}`)
  growth.forEach(g => console.log(`  ${g.grade}${g.label}: ${g.total}题 ${g.accuracy}% ${g.accChange !== null ? (g.accChange >= 0 ? '↑' : '↓') : ''}`))

  for (const email of recipients) {
    try {
      await sendMail(email, subject, html)
      console.log(`  ✅ 已发送到 ${email}`)
    } catch (e) {
      console.error(`  ❌ 发送失败 ${email}: ${e.message}`)
    }
  }
  return { html, totalQ: todayRecords.length, growth, sent: true }
}

async function main() {
  const specificUserId = process.argv[2]
  console.log(`📅 每日学习报告 - ${today()}`)

  // 查询用户（含 parent_email）
  let users
  if (specificUserId) {
    users = await getUserWithEmail(specificUserId)
  } else {
    users = await getUsersWithEmail()
  }

  if (!users.length) {
    console.log('没有找到用户')
    return
  }

  for (const user of users) {
    console.log(`\n处理: ${user.name} (${user.id})`)
    await generateAndSendForUser(user)
  }

  await pool.end()
}

main().catch(e => {
  console.error('❌ 报告生成失败:', e)
  process.exit(1)
})
