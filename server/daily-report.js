/**
 * 每日学习报告邮件发送（升级版）
 * cron: 每晚 22:00 执行
 *
 * 功能：
 * 1. 查询今日用户的答题数据（含 knowledge_tag, topic, time_spent, score）
 * 2. 按学科×星球分组，展示完成情况
 * 3. 计算认真度指标
 * 4. 错题类型分析
 * 5. 调用 AI 生成个性化建议
 * 6. 发送邮件给家长（从 DB 读取 parent_email）
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

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.qq.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465')
const SMTP_USER = process.env.SMTP_USER || '386323992@qq.com'
const SMTP_PASS = process.env.SMTP_PASS || 'REDACTED_SMTP_TOKEN'
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER

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

// ========== 学科星球映射 ==========
const SUBJECT_CONFIG = {
  chinese: {
    label: '小学语文',
    planets: {
      '字词': '字词星球', '词汇': '字词星球',
      '古诗词': '诗词星球', '古诗': '诗词星球', '诗词': '诗词星球',
      '成语': '成语星球',
      '句子': '句子星球', '仿写': '句子星球',
      '文学常识': '文学星球', '文学': '文学星球',
      '阅读理解': '阅读星球', '阅读': '阅读星球',
      '听写': '听写星球', '默写': '听写星球',
      '写作': '作文星球', '作文': '作文星球', '写作表达': '作文星球',
    },
  },
  chinese_junior: {
    label: '初中语文',
    planets: {
      '字音辨析': '基础星球', '字词': '基础星球',
      '古诗文默写': '古诗文星球', '古诗': '古诗文星球', '古诗词': '古诗文星球',
      '实词解释': '文言文星球', '文言文': '文言文星球',
      '名著阅读': '名著星球',
      '仿写句子': '表达星球', '句子': '表达星球',
      '现代文阅读': '阅读星球', '阅读理解': '阅读星球', '阅读': '阅读星球',
      '写作': '作文星球', '写作表达': '作文星球',
      '综合理解': '综合星球', '综合填空': '综合星球',
    },
  },
  math: {
    label: '数学',
    planets: {
      '数与运算': '运算星球', '计算': '运算星球', '简便运算': '运算星球',
      '图形与空间': '图形星球', '图形': '图形星球', '几何': '图形星球',
      '奥数专题': '奥数星球', '奥数': '奥数星球',
      '方程与不等式': '方程星球', '方程': '方程星球', '解方程': '方程星球',
      '函数与图像': '函数星球', '函数': '函数星球',
      '整式运算': '整式星球', '整式': '整式星球',
      '几何证明': '几何星球', '证明': '几何星球',
      '综合理解': '应用星球',
    },
  },
  english: {
    label: '英语',
    planets: {
      '英语词汇': '词汇星球', '词汇': '词汇星球', '词汇语法': '词汇星球',
      '英语听力': '听力星球', '听力理解': '听力星球',
      '英语语法': '语法星球', '语法': '语法星球', '语法词汇': '语法星球',
      '英语阅读': '阅读星球', '阅读理解': '阅读星球',
      '英语写作': '写作星球', '英语写作': '写作星球',
      '完形填空': '完形星球',
      '英语选择': '选择题',
      '英语填空': '填空题',
    },
  },
  politics: {
    label: '政治',
    planets: {
      '道法': '政治星球', '正误判断': '判断题', '综合': '综合题',
    },
  },
}

// 卡片ID前缀 → 星球
const CARD_PREFIX_MAP = {
  vocab: '字词', poetry: '古诗词', idiom: '成语', sentence: '句子',
  literature: '文学常识', lit: '文学常识', reading: '阅读', dictation: '听写',
  en: '英语词汇', math: '数与运算', politics: '道法', pol: '道法',
  ch: '字词', j2ch: '初中语文', selftest: '自测',
  essay: '写作', q: '综合理解',
  en_vocab: '英语词汇', en_grammar: '英语语法', en_writing: '英语写作',
  en_listen: '英语听力', en_reading: '英语阅读', en_cloze: '完形填空',
  math_jf: '方程', math_calc: '运算', math_geom: '图形', math_olympiad: '奥数',
}

// 从 card_id 推断真正的学科
function inferSubject(subject, cardId) {
  if (subject && subject !== 'chinese') return subject
  if (!cardId) return subject || 'chinese'
  if (/^(en_|en-vocab|en-grammar|english|enlisten)/.test(cardId)) return 'english'
  if (/^(math_|math-|calc|geometry|algebra)/.test(cardId)) return 'math'
  if (/^(politics|pol_)/.test(cardId)) return 'politics'
  if (/^(j2ch|junior)/.test(cardId)) return 'chinese_junior'
  return subject || 'chinese'
}

function getPlanetTag(subject, knowledgeTag, cardId, topic) {
  const realSubject = inferSubject(subject, cardId)
  const config = SUBJECT_CONFIG[realSubject]
  if (!config) return '其他'

  // 1. 优先用 knowledge_tag 匹配
  if (knowledgeTag) {
    for (const [key, planet] of Object.entries(config.planets)) {
      if (knowledgeTag.includes(key) || key.includes(knowledgeTag)) return planet
    }
  }

  // 2. 用 topic 匹配
  if (topic) {
    for (const [key, planet] of Object.entries(config.planets)) {
      if (topic.includes(key) || key.includes(topic)) return planet
    }
  }

  // 3. 用 card_id 匹配（优先长前缀）
  if (cardId) {
    const underscorePrefix = cardId.replace(/_.*/, '')
    let mapped = CARD_PREFIX_MAP[underscorePrefix]
    if (!mapped) {
      const barePrefix = underscorePrefix.replace(/\d.*/, '')
      mapped = CARD_PREFIX_MAP[barePrefix]
    }
    if (mapped) {
      for (const [key, planet] of Object.entries(config.planets)) {
        if (mapped.includes(key) || key.includes(mapped)) return planet
      }
    }
    // 自测题
    if (cardId.startsWith('selftest_')) return '自测'
  }

  return '其他练习'
}

// ========== 数据查询 ==========

async function getDayRecords(userId, date) {
  const r = await pool.query(
    `SELECT card_id, subject, correct, timestamp, knowledge_tag, topic, time_spent, score, selected_answer
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

function buildReport(todayRecords, yesterdayRecords) {
  // 按学科分组（用 inferSubject 修正老数据）
  const subjects = {}
  for (const r of todayRecords) {
    const subj = inferSubject(r.subject, r.card_id)
    if (!subjects[subj]) subjects[subj] = { records: [], planets: {} }
    subjects[subj].records.push(r)

    const planet = getPlanetTag(subj, r.knowledge_tag, r.card_id, r.topic)
    if (!subjects[subj].planets[planet]) {
      subjects[subj].planets[planet] = { total: 0, correct: 0, totalTime: 0, scores: [] }
    }
    const p = subjects[subj].planets[planet]
    p.total++
    if (r.correct) p.correct++
    if (r.time_spent) p.totalTime += r.time_spent
    if (r.score != null) p.scores.push(r.score)
  }

  // 计算每个学科维度
  const report = {}
  for (const [subjKey, data] of Object.entries(subjects)) {
    const config = SUBJECT_CONFIG[subjKey]
    const total = data.records.length
    const correct = data.records.filter(r => r.correct).length
    const accuracy = total > 0 ? Math.round(correct / total * 100) : 0
    const totalTime = data.records.reduce((s, r) => s + (r.time_spent || 0), 0)
    const avgTime = total > 0 ? (totalTime / total).toFixed(1) : 0

    // 认真度评估
    let effort = '正常'
    let effortColor = '#2563eb'
    if (avgTime < 3 && accuracy < 50) { effort = '敷衍'; effortColor = '#dc2626' }
    else if (avgTime < 3 && accuracy >= 50) { effort = '过快'; effortColor = '#f59e0b' }
    else if (accuracy >= 80 && avgTime >= 5) { effort = '认真'; effortColor = '#16a34a' }
    else if (accuracy < 40) { effort = '需关注'; effortColor = '#f59e0b' }

    // 昨日对比
    const ySubjRecords = yesterdayRecords.filter(r => inferSubject(r.subject, r.card_id) === subjKey)
    const yTotal = ySubjRecords.length
    const yCorrect = ySubjRecords.filter(r => r.correct).length
    const yAccuracy = yTotal > 0 ? Math.round(yCorrect / yTotal * 100) : null
    const accChange = yAccuracy !== null ? accuracy - yAccuracy : null

    // 星球列表
    const planets = Object.entries(data.planets).map(([name, p]) => ({
      name,
      total: p.total,
      correct: p.correct,
      accuracy: p.total > 0 ? Math.round(p.correct / p.total * 100) : 0,
      avgTime: p.total > 0 ? (p.totalTime / p.total).toFixed(1) : 0,
    }))

    report[subjKey] = {
      label: config?.label || subjKey,
      total, correct, accuracy, accChange,
      totalTime: Math.round(totalTime),
      avgTime,
      effort, effortColor,
      planets,
    }
  }
  return report
}

async function generateAIAdvice(userName, report) {
  if (!DEEPSEEK_API_KEY) return '（AI 建议暂时不可用）'

  const subjectLines = Object.entries(report).map(([, s]) =>
    `${s.label}：${s.total}题，正确率${s.accuracy}%（${s.effort}），${s.planets.map(p => `${p.name}${p.accuracy}%`).join('、')}`
  ).join('\n')

  const weakPlanets = []
  for (const [, s] of Object.entries(report)) {
    for (const p of s.planets) {
      if (p.accuracy < 60 && p.total >= 3) weakPlanets.push(`${s.label}-${p.name}(${p.accuracy}%)`)
    }
  }

  const rushPlanets = []
  for (const [, s] of Object.entries(report)) {
    for (const p of s.planets) {
      if (parseFloat(p.avgTime) < 3 && p.total >= 3) rushPlanets.push(`${s.label}-${p.name}(${p.avgTime}秒/题)`)
    }
  }

  const prompt = `你是一位耐心的家教老师，正在给家长写今日学习反馈。

学生：${userName}
今日学习情况：
${subjectLines}

${weakPlanets.length > 0 ? `薄弱星球：${weakPlanets.join('、')}` : '今日各星球表现均衡。'}
${rushPlanets.length > 0 ? `⚠️ 答题过快的星球：${rushPlanets.join('、')}（可能没有认真思考）` : ''}

请用简洁温暖的语气，写3段反馈：
1. 今日表现总结（2-3句，先夸再点问题，提到具体星球名）
2. 比昨日的进步（如果有退步也温和指出）
3. 明日学习建议（具体到哪个星球该怎么练）

每段不超过60字，用口语，不要书面化。`

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

function buildEmailHTML(userName, report, aiAdvice, todayDate) {
  const totalQ = Object.values(report).reduce((s, d) => s + d.total, 0)
  const totalCorrect = Object.values(report).reduce((s, d) => s + d.correct, 0)
  const totalAcc = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0
  const totalTimeMin = Math.round(Object.values(report).reduce((s, d) => s + d.totalTime, 0) / 60)
  const subjectCount = Object.keys(report).length

  // 每个学科的 HTML
  const subjectBlocks = Object.entries(report).map(([, s]) => {
    const effortBg = s.effort === '认真' ? '#f0fdf4' : s.effort === '敷衍' ? '#fef2f2' : s.effort === '过快' ? '#fff7ed' : s.effort === '需关注' ? '#fff7ed' : '#eff6ff'
    const accColor = s.accuracy >= 80 ? '#16a34a' : s.accuracy >= 60 ? '#2563eb' : '#dc2626'
    const change = s.accChange !== null
      ? (s.accChange >= 0
          ? `<span style="color:#16a34a;font-size:11px"> ↑${s.accChange}%</span>`
          : `<span style="color:#dc2626;font-size:11px"> ↓${Math.abs(s.accChange)}%</span>`)
      : ''

    const planetRows = s.planets.map(p => {
      const pAccColor = p.accuracy >= 80 ? '#16a34a' : p.accuracy >= 60 ? '#2563eb' : '#dc2626'
      const barW = Math.max(p.accuracy, 5)
      const barColor = p.accuracy >= 80 ? '#22c55e' : p.accuracy >= 60 ? '#3b82f6' : '#ef4444'
      const timeWarning = parseFloat(p.avgTime) < 3 ? '<span style="color:#f59e0b;font-size:10px">⚡过快</span>' : ''
      return `<tr>
        <td style="padding:4px 8px;font-size:11px;color:#374151">${p.name}</td>
        <td style="padding:4px 8px;font-size:11px;text-align:center">${p.total}题</td>
        <td style="padding:4px 8px;text-align:center">
          <div style="display:flex;align-items:center;gap:4px;justify-content:center">
            <div style="flex:1;max-width:60px;background:#f3f4f6;border-radius:4px;height:6px;overflow:hidden">
              <div style="width:${barW}%;height:100%;background:${barColor};border-radius:4px"></div>
            </div>
            <span style="font-size:11px;font-weight:600;color:${pAccColor}">${p.accuracy}%</span>
            ${timeWarning}
          </div>
        </td>
      </tr>`
    }).join('')

    return `
    <div style="background:white;border-radius:12px;border:1px solid #f3f4f6;margin-bottom:12px;overflow:hidden">
      <div style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;font-weight:700;color:#374151">${s.label}</span>
          <span style="font-size:11px;color:#6b7280">${s.total}题</span>
          <span style="font-size:13px;font-weight:700;color:${accColor}">${s.accuracy}%${change}</span>
        </div>
        <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${effortBg};color:${s.effortColor};font-weight:600">${s.effort}</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${planetRows}
      </table>
    </div>`
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
      <div style="flex:1;text-align:center"><div style="font-size:22px;font-weight:800">${subjectCount}</div><div style="opacity:0.7;font-size:11px">学科</div></div>
      <div style="flex:1;text-align:center"><div style="font-size:22px;font-weight:800">${totalTimeMin}分</div><div style="opacity:0.7;font-size:11px">总用时</div></div>
    </div>
  </div>

  <div style="padding:14px">
    <!-- 各学科星球报告 -->
    ${subjectBlocks}

    <!-- AI 点评 -->
    <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:8px">🤖 老师点评</div>
    <div style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:12px;padding:14px;font-size:12px;line-height:1.8;color:#374151;white-space:pre-line">${aiAdvice}</div>
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
  const report = buildReport(todayRecords, yesterdayRecords)

  // 输出报告概要
  for (const [, s] of Object.entries(report)) {
    console.log(`  ${s.label}: ${s.total}题 ${s.accuracy}% ${s.effort} | 星球: ${s.planets.map(p => `${p.name}(${p.accuracy}%)`).join(', ')}`)
  }

  const aiAdvice = await generateAIAdvice(user.name, report)
  const html = buildEmailHTML(user.name, report, aiAdvice, todayDate)

  const recipients = []
  if (user.parent_email) {
    recipients.push(...user.parent_email.split(',').map(s => s.trim()).filter(Boolean))
  }

  if (!recipients.length) {
    console.log(`  ${user.name}: 未设置家长邮箱，跳过发送`)
    return { html, totalQ: todayRecords.length, report, sent: false }
  }

  const subject = `📊 ${user.name}的学习日报 | ${todayDate} | ${todayRecords.length}题`

  for (const email of recipients) {
    try {
      await sendMail(email, subject, html)
      console.log(`  ✅ 已发送到 ${email}`)
    } catch (e) {
      console.error(`  ❌ 发送失败 ${email}: ${e.message}`)
    }
  }
  return { html, totalQ: todayRecords.length, report, sent: true }
}

async function main() {
  const specificUserId = process.argv[2]
  console.log(`📅 每日学习报告（升级版） - ${today()}`)

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
