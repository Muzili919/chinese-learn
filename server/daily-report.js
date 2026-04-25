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
    label: '语文',
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
  if (/^(essay|ch_)/.test(cardId)) return 'chinese'
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
      subjects[subj].planets[planet] = { total: 0, correct: 0, totalTime: 0, scores: [], wrongRecords: [] }
    }
    const p = subjects[subj].planets[planet]
    p.total++
    if (r.correct) p.correct++
    else p.wrongRecords.push(r)
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

    // 星球列表（含错误归因分析）
    const planets = Object.entries(data.planets).map(([name, p]) => {
      const pAcc = p.total > 0 ? Math.round(p.correct / p.total * 100) : 0
      const pAvgTime = p.total > 0 ? (p.totalTime / p.total).toFixed(1) : 0

      // 错误归因分析
      let errorType = null
      let errorDesc = ''
      const wrongCount = p.total - p.correct
      if (wrongCount > 0) {
        const fastWrongs = p.wrongRecords.filter(r => (r.time_spent || 0) < 3).length
        const slowWrongs = p.wrongRecords.filter(r => (r.time_spent || 0) > 20).length
        if (pAcc < 40) {
          errorType = 'concept'
          errorDesc = `正确率仅${pAcc}%，基础知识掌握不牢，建议重新学习相关概念`
        } else if (fastWrongs >= wrongCount * 0.6) {
          errorType = 'careless'
          errorDesc = `${fastWrongs}/${wrongCount}题答题过快（<3秒），可能未认真审题就选了答案`
        } else if (slowWrongs >= wrongCount * 0.5) {
          errorType = 'overthink'
          errorDesc = `部分题答题超过20秒仍出错，可能在多个选项间犹豫不决，概念模糊`
        } else {
          errorType = 'partial'
          errorDesc = `有${wrongCount}题答错，部分知识点还不够熟练，需要针对性强化`
        }
      }

      // 速度评估
      let speedLabel = ''
      if (parseFloat(pAvgTime) < 3) speedLabel = '过快'
      else if (parseFloat(pAvgTime) > 30) speedLabel = '偏慢'

      return {
        name,
        total: p.total,
        correct: p.correct,
        accuracy: pAcc,
        avgTime: pAvgTime,
        wrongCount,
        errorType,
        errorDesc,
        speedLabel,
      }
    })

    // 学科整体诊断
    const weakPlanets = planets.filter(p => p.accuracy < 60 && p.total >= 2)
    const fastPlanets = planets.filter(p => parseFloat(p.avgTime) < 3 && p.total >= 2)
    let diagnosis = ''
    if (accuracy >= 90) diagnosis = '表现优秀，继续保持！'
    else if (accuracy >= 70) diagnosis = `整体不错，${weakPlanets.length > 0 ? weakPlanets.map(p => p.name).join('、') + '还需加强' : '各星球均衡'}`
    else if (accuracy >= 50) diagnosis = `正确率偏低，${weakPlanets.length > 0 ? '主要薄弱在' + weakPlanets.map(p => `${p.name}(${p.accuracy}%)`).join('、') : '需要多加练习'}`
    else diagnosis = `正确率仅${accuracy}%，${weakPlanets.length > 0 ? '重点需要攻克' + weakPlanets.map(p => p.name).join('、') : '建议从基础题目开始重新学习'}`
    if (fastPlanets.length > 0) diagnosis += `。注意：${fastPlanets.map(p => p.name).join('、')}答题过快，可能敷衍`

    report[subjKey] = {
      label: config?.label || subjKey,
      total, correct, accuracy, accChange,
      totalTime: Math.round(totalTime),
      avgTime,
      effort, effortColor,
      planets,
      diagnosis,
    }
  }
  return report
}

async function generateAIAdvice(userName, report) {
  if (!DEEPSEEK_API_KEY) return '（AI 建议暂时不可用）'

  // 构建详细的各科诊断数据
  const subjectDetails = Object.entries(report).map(([, s]) => {
    const planetDetails = s.planets.map(p => {
      let line = `${p.name}：${p.total}题，对${p.correct}题(${p.accuracy}%)，均耗时${p.avgTime}s`
      if (p.errorType) line += ` | 归因：${p.errorDesc}`
      if (p.speedLabel) line += ` | ⚡${p.speedLabel}`
      return line
    }).join('\n')

    return `【${s.label}】${s.total}题 正确率${s.accuracy}% ${s.effort}
${planetDetails}
诊断：${s.diagnosis}`
  }).join('\n\n')

  const prompt = `你是一位经验丰富的家教老师，正在给家长写今日学习反馈。要求简短、口语化、说人话。

学生：${userName}
今日学习详情：
${subjectDetails}

请写4段反馈（每段不超过50字，用短句，像跟家长面对面聊天）：
1. 总体评价：今天做了什么，整体如何
2. 哪些星球表现好，哪些需要加油（带具体正确率）
3. 错误归因：分析错误主要是概念不懂、粗心马虎还是不够熟练
4. 明天建议：具体到哪个星球该怎么练、练多久

不要用"继续保持"、"再接再厉"之类的套话，要有具体内容。`

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
        max_tokens: 600,
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

  // 错误归因图标
  const ERROR_ICONS = {
    concept: { icon: '🔴', label: '概念薄弱' },
    careless: { icon: '🟡', label: '粗心马虎' },
    overthink: { icon: '🟠', label: '概念模糊' },
    partial: { icon: '🔵', label: '部分不熟' },
  }

  // 每个学科的 HTML（手机友好版，含详细错误归因）
  const subjectBlocks = Object.entries(report).map(([, s]) => {
    const effortBg = s.effort === '认真' ? '#f0fdf4' : s.effort === '敷衍' ? '#fef2f2' : s.effort === '过快' ? '#fff7ed' : s.effort === '需关注' ? '#fff7ed' : '#eff6ff'
    const accColor = s.accuracy >= 80 ? '#16a34a' : s.accuracy >= 60 ? '#2563eb' : '#dc2626'
    const change = s.accChange !== null
      ? (s.accChange >= 0
          ? `<span style="color:#16a34a;font-size:13px"> ↑${s.accChange}%</span>`
          : `<span style="color:#dc2626;font-size:13px"> ↓${Math.abs(s.accChange)}%</span>`)
      : ''

    // 星球详情行（含错误归因标签）
    const planetRows = s.planets.map(p => {
      const pAccColor = p.accuracy >= 80 ? '#16a34a' : p.accuracy >= 60 ? '#2563eb' : '#dc2626'
      const barW = Math.max(p.accuracy, 5)
      const barColor = p.accuracy >= 80 ? '#22c55e' : p.accuracy >= 60 ? '#3b82f6' : '#ef4444'
      const timeWarning = parseFloat(p.avgTime) < 3 ? ' <span style="color:#f59e0b;font-size:11px">⚡过快</span>' : ''

      // 错误归因标签
      let errorTag = ''
      if (p.errorType) {
        const ei = ERROR_ICONS[p.errorType]
        errorTag = `<div style="margin-top:4px;padding:3px 8px;border-radius:6px;background:#fef3c7;font-size:11px;color:#92400e;line-height:1.4">
          ${ei.icon} ${ei.label}：${p.errorDesc}
        </div>`
      }

      return `<tr>
        <td style="padding:8px 10px;font-size:14px;color:#374151;white-space:nowrap">${p.name}</td>
        <td style="padding:8px 6px;font-size:14px;text-align:center;color:#6b7280">${p.total}</td>
        <td style="padding:8px 10px;text-align:right">
          <span style="font-size:15px;font-weight:700;color:${pAccColor}">${p.accuracy}%</span>${timeWarning}
        </td>
      </tr>
      <tr><td colspan="3" style="padding:0 10px 6px">
        <div style="background:#f3f4f6;border-radius:3px;height:5px;overflow:hidden">
          <div style="width:${barW}%;height:100%;background:${barColor};border-radius:3px"></div>
        </div>
        ${errorTag}
      </td></tr>`
    }).join('')

    // 学科诊断文字
    const diagHtml = s.diagnosis ? `
      <div style="padding:10px 16px;background:#f8fafc;border-top:1px solid #f3f4f6;font-size:13px;color:#475569;line-height:1.6">
        <span style="font-weight:700;color:#334155">📋 诊断：</span>${s.diagnosis}
      </div>` : ''

    return `
    <div style="background:white;border-radius:14px;border:1px solid #e5e7eb;margin-bottom:14px;overflow:hidden">
      <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:16px;font-weight:700;color:#1f2937">${s.label}</span>
          <span style="font-size:13px;color:#9ca3af">${s.total}题</span>
          <span style="font-size:16px;font-weight:800;color:${accColor}">${s.accuracy}%${change}</span>
        </div>
        <span style="font-size:12px;padding:3px 10px;border-radius:12px;background:${effortBg};color:${s.effortColor};font-weight:700">${s.effort}</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tr style="background:#f9fafb"><td style="padding:6px 10px;font-size:11px;color:#9ca3af">星球</td><td style="padding:6px;font-size:11px;color:#9ca3af;text-align:center">题数</td><td style="padding:6px 10px;font-size:11px;color:#9ca3af;text-align:right">正确率</td></tr>
        ${planetRows}
      </table>
      ${diagHtml}
    </div>`
  }).join('')

  // 汇总错误归因统计
  const errorSummary = []
  for (const [, s] of Object.entries(report)) {
    for (const p of s.planets) {
      if (p.errorType) {
        errorSummary.push({ subject: s.label, planet: p.name, type: p.errorType, desc: p.errorDesc })
      }
    }
  }
  const errorSummaryHtml = errorSummary.length > 0 ? `
    <div style="background:white;border-radius:14px;border:1px solid #e5e7eb;margin-bottom:14px;padding:16px">
      <div style="font-size:15px;font-weight:700;color:#1f2937;margin-bottom:10px">🔍 错误归因总结</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${errorSummary.map(e => {
          const ei = ERROR_ICONS[e.type]
          return `<div style="padding:8px 12px;border-radius:10px;background:#fefce8;border:1px solid #fde68a">
            <div style="font-size:13px;font-weight:600;color:#1f2937">${ei.icon} ${e.subject} · ${e.planet}</div>
            <div style="font-size:12px;color:#92400e;margin-top:2px">${e.desc}</div>
          </div>`
        }).join('')}
      </div>
    </div>` : ''

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:100%;margin:0 auto;overflow:hidden">

  <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:28px 20px 20px;color:white">
    <div style="font-size:22px;font-weight:800;margin-bottom:4px">📊 ${userName} 的学习日报</div>
    <div style="opacity:0.75;font-size:14px;margin-bottom:16px">${todayDate}</div>
    <div style="display:flex;gap:0;background:rgba(255,255,255,0.12);border-radius:14px;overflow:hidden">
      <div style="flex:1;text-align:center;padding:14px 0"><div style="font-size:26px;font-weight:800">${totalQ}</div><div style="opacity:0.7;font-size:12px;margin-top:2px">总题数</div></div>
      <div style="flex:1;text-align:center;padding:14px 0;border-left:1px solid rgba(255,255,255,0.15)"><div style="font-size:26px;font-weight:800">${totalAcc}%</div><div style="opacity:0.7;font-size:12px;margin-top:2px">正确率</div></div>
      <div style="flex:1;text-align:center;padding:14px 0;border-left:1px solid rgba(255,255,255,0.15)"><div style="font-size:26px;font-weight:800">${subjectCount}</div><div style="opacity:0.7;font-size:12px;margin-top:2px">学科</div></div>
      <div style="flex:1;text-align:center;padding:14px 0;border-left:1px solid rgba(255,255,255,0.15)"><div style="font-size:26px;font-weight:800">${totalTimeMin || '<1'}分</div><div style="opacity:0.7;font-size:12px;margin-top:2px">总用时</div></div>
    </div>
  </div>

  <div style="padding:16px">
    ${subjectBlocks}
    ${errorSummaryHtml}

    <div style="font-size:15px;font-weight:700;color:#1f2937;margin-bottom:10px">🤖 老师点评</div>
    <div style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:14px;padding:16px;font-size:14px;line-height:2;color:#374151;white-space:pre-line">${aiAdvice}</div>
  </div>

  <div style="padding:14px 20px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb">
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
